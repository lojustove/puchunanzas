/* ========================================
   PUCHUNANZAS - Application Logic
   Budget Calculator & Journal
   ======================================== */

// Configuration
const CONFIG = {
    // URL del Apps Script desplegado
    SCRIPT_URL: localStorage.getItem('puchunanzas_script_url') || 'https://script.google.com/macros/s/AKfycbx9WQCRB2IKU9gJpfQA7wto1caSLg5YBzgqwLcZsh5_wkosNoJhXmqp8CdQnKFK_Qkv/exec',

    // Usar API real por defecto
    USE_MOCK: false,

    // Categorías disponibles
    CATEGORIES: ['Salidas/Entretenimiento', 'Ropa/Personales']
};

// Datos mock basados en tu Google Sheet
const MOCK_DATA = {
    ingresos: {
        sueldoNeto: 200,
        ingresosExtras: 5,
        otrosIngresos: 20,
        total: 225
    },
    gastosFijos: {
        internetTelefono: 10,
        transporte: 20,
        deudas: 46.44,
        ahorroProgramado: 40,
        total: 116.44
    },
    gastosVariables: [
        { nombre: 'Salidas/Entretenimiento', presupuesto: 20, gastado: 0 },
        { nombre: 'Ropa/Personales', presupuesto: 45, gastado: 0 }
    ],
    resumen: {
        ingresosTotales: 225,
        gastosTotales: 181.44,
        balanceMensual: 43.56
    },
    gastosRegistrados: []
};

// Estado de la aplicación
let appState = {
    data: null,
    selectedCategory: '',
    currentAmount: 0
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    displayCurrentDate();
    setupEventListeners();

    // Verificar si hay configuración
    if (CONFIG.USE_MOCK) {
        showSetupModal();
    }

    await loadBudgetData();
}

function displayCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString('es-ES', options);
}

function setupEventListeners() {
    // Refresh button
    document.getElementById('btnRefresh').addEventListener('click', loadBudgetData);

    // Calculator inputs
    document.getElementById('montoInput').addEventListener('input', handleAmountChange);
    document.getElementById('categoriaSelect').addEventListener('change', handleCategoryChange);

    // Action buttons
    document.getElementById('btnClear').addEventListener('click', clearCalculator);
    document.getElementById('btnRegister').addEventListener('click', registerExpense);

    // Modal buttons
    document.getElementById('btnUseMock').addEventListener('click', useMockData);
    document.getElementById('btnSaveConfig').addEventListener('click', saveConfiguration);
}

// ========================================
// DATA LOADING
// ========================================
async function loadBudgetData() {
    showLoading(true);

    try {
        let data;

        if (CONFIG.USE_MOCK) {
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));
            data = { ...MOCK_DATA };

            // Cargar gastos guardados localmente
            const localExpenses = JSON.parse(localStorage.getItem('puchunanzas_expenses') || '[]');
            data.gastosRegistrados = localExpenses;

            // Recalcular gastos por categoría
            data.gastosVariables.forEach(cat => {
                cat.gastado = localExpenses
                    .filter(e => e.categoria === cat.nombre)
                    .reduce((sum, e) => sum + e.monto, 0);
            });
        } else {
            const response = await fetch(`${CONFIG.SCRIPT_URL}?action=getBudget`);
            data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }
        }

        appState.data = data;
        renderDashboard(data);
        populateCategories(data.gastosVariables);
        renderJournal(data.gastosRegistrados);

        showToast('Datos actualizados', 'success');
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error al cargar datos: ' + error.message, 'error');

        // Usar mock como fallback
        appState.data = { ...MOCK_DATA };
        renderDashboard(MOCK_DATA);
        populateCategories(MOCK_DATA.gastosVariables);
    }

    showLoading(false);
}

// ========================================
// RENDERING
// ========================================
function renderDashboard(data) {
    // Summary cards
    document.getElementById('totalIngresos').textContent = formatCurrency(data.resumen.ingresosTotales);
    document.getElementById('totalGastos').textContent = formatCurrency(data.resumen.gastosTotales);
    document.getElementById('balanceMensual').textContent = formatCurrency(data.resumen.balanceMensual);

    // Budget cards
    const budgetGrid = document.getElementById('budgetGrid');
    budgetGrid.innerHTML = data.gastosVariables.map(cat => {
        const percentage = (cat.gastado / cat.presupuesto) * 100;
        const remaining = cat.presupuesto - cat.gastado;
        const statusClass = percentage > 100 ? 'danger' : percentage > 75 ? 'warning' : 'safe';
        const remainingClass = remaining >= 0 ? 'positive' : 'negative';

        return `
            <div class="budget-card">
                <div class="budget-header">
                    <span class="budget-name">${getCategoryIcon(cat.nombre)} ${cat.nombre}</span>
                    <div class="budget-amounts">
                        <span class="budget-spent">${formatCurrency(cat.gastado)}</span>
                        <span class="budget-total">/ ${formatCurrency(cat.presupuesto)}</span>
                    </div>
                </div>
                <div class="budget-progress">
                    <div class="budget-progress-bar ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <span class="budget-remaining ${remainingClass}">
                    ${remaining >= 0 ? `Quedan ${formatCurrency(remaining)}` : `Excedido por ${formatCurrency(Math.abs(remaining))}`}
                </span>
            </div>
        `;
    }).join('');
}

function populateCategories(categories) {
    const select = document.getElementById('categoriaSelect');
    select.innerHTML = '<option value="">Selecciona una categoría</option>';

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.nombre;
        option.textContent = `${getCategoryIcon(cat.nombre)} ${cat.nombre}`;
        select.appendChild(option);
    });
}

function renderJournal(expenses) {
    const journalList = document.getElementById('journalList');

    if (!expenses || expenses.length === 0) {
        journalList.innerHTML = `
            <div class="journal-empty">
                <span class="empty-icon">📝</span>
                <p>No hay gastos registrados este mes</p>
            </div>
        `;
        return;
    }

    // Ordenar por fecha más reciente
    const sortedExpenses = [...expenses].sort((a, b) =>
        new Date(b.fecha) - new Date(a.fecha)
    );

    journalList.innerHTML = sortedExpenses.map(expense => `
        <div class="journal-item">
            <div class="journal-info">
                <span class="journal-category">${getCategoryIcon(expense.categoria)} ${expense.categoria}</span>
                <span class="journal-description">${expense.descripcion || 'Sin descripción'}</span>
            </div>
            <div class="journal-meta">
                <span class="journal-amount">-${formatCurrency(expense.monto)}</span>
                <span class="journal-date">${formatDate(expense.fecha)}</span>
            </div>
        </div>
    `).join('');
}

// ========================================
// CALCULATOR LOGIC
// ========================================
function handleAmountChange(e) {
    appState.currentAmount = parseFloat(e.target.value) || 0;
    updateBudgetStatus();
}

function handleCategoryChange(e) {
    appState.selectedCategory = e.target.value;
    updateBudgetStatus();
}

function updateBudgetStatus() {
    const statusElement = document.getElementById('budgetStatus');
    const registerBtn = document.getElementById('btnRegister');
    const amount = appState.currentAmount;
    const category = appState.selectedCategory;

    if (!amount || !category) {
        statusElement.className = 'budget-status';
        statusElement.innerHTML = `
            <div class="status-icon">🤔</div>
            <div class="status-message">Ingresa un monto y categoría para verificar</div>
        `;
        registerBtn.disabled = true;
        return;
    }

    // Buscar la categoría
    const categoryData = appState.data.gastosVariables.find(c => c.nombre === category);
    if (!categoryData) return;

    const remaining = categoryData.presupuesto - categoryData.gastado;
    const fitsInBudget = amount <= remaining;

    if (fitsInBudget) {
        statusElement.className = 'budget-status fits';
        statusElement.innerHTML = `
            <div class="status-icon">✅</div>
            <div class="status-message">
                ¡Perfecto! El gasto cabe en tu presupuesto.<br>
                <small>Te quedarían ${formatCurrency(remaining - amount)} en ${category}</small>
            </div>
        `;
    } else {
        statusElement.className = 'budget-status exceeds';
        statusElement.innerHTML = `
            <div class="status-icon">⚠️</div>
            <div class="status-message">
                Este gasto excede tu presupuesto.<br>
                <small>Solo tienes ${formatCurrency(remaining)} disponibles en ${category}</small>
            </div>
        `;
    }

    registerBtn.disabled = false;
}

function clearCalculator() {
    document.getElementById('montoInput').value = '';
    document.getElementById('categoriaSelect').value = '';
    document.getElementById('descripcionInput').value = '';
    appState.currentAmount = 0;
    appState.selectedCategory = '';
    updateBudgetStatus();
}

// ========================================
// EXPENSE REGISTRATION
// ========================================
async function registerExpense() {
    const amount = appState.currentAmount;
    const category = appState.selectedCategory;
    const description = document.getElementById('descripcionInput').value;

    if (!amount || !category) {
        showToast('Por favor completa el monto y categoría', 'error');
        return;
    }

    showLoading(true);

    try {
        const expense = {
            fecha: new Date().toISOString(),
            categoria: category,
            monto: amount,
            descripcion: description
        };

        if (CONFIG.USE_MOCK) {
            // Guardar localmente
            const expenses = JSON.parse(localStorage.getItem('puchunanzas_expenses') || '[]');
            expenses.push(expense);
            localStorage.setItem('puchunanzas_expenses', JSON.stringify(expenses));

            await new Promise(resolve => setTimeout(resolve, 500));
        } else {
            // Enviar al Apps Script usando GET (evita problemas de CORS)
            const params = new URLSearchParams({
                action: 'addExpense',
                categoria: category,
                monto: amount.toString(),
                descripcion: description || ''
            });

            const response = await fetch(`${CONFIG.SCRIPT_URL}?${params.toString()}`);
            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }
        }

        showToast(`¡Gasto de ${formatCurrency(amount)} registrado!`, 'success');
        clearCalculator();
        await loadBudgetData();

    } catch (error) {
        console.error('Error registering expense:', error);
        showToast('Error al registrar gasto: ' + error.message, 'error');
    }

    showLoading(false);
}

// ========================================
// CONFIGURATION / SETUP
// ========================================
function showSetupModal() {
    document.getElementById('setupModal').classList.add('active');
}

function hideSetupModal() {
    document.getElementById('setupModal').classList.remove('active');
}

function useMockData() {
    CONFIG.USE_MOCK = true;
    hideSetupModal();
    showToast('Usando datos de prueba. Configura el Apps Script para conectar con tu Sheet.', 'info');
}

function saveConfiguration() {
    const url = document.getElementById('scriptUrl').value.trim();

    if (!url) {
        showToast('Por favor ingresa la URL del Apps Script', 'error');
        return;
    }

    localStorage.setItem('puchunanzas_script_url', url);
    CONFIG.SCRIPT_URL = url;
    CONFIG.USE_MOCK = false;

    hideSetupModal();
    showToast('Configuración guardada', 'success');
    loadBudgetData();
}

// ========================================
// UTILITIES
// ========================================
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCategoryIcon(category) {
    const icons = {
        'Salidas/Entretenimiento': '🎉',
        'Ropa/Personales': '👕',
        'Internet/Teléfono': '📱',
        'Transporte': '🚌',
        'Deudas': '💳',
        'Ahorro programado': '💰'
    };
    return icons[category] || '📦';
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span>${icons[type]}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remover después de 4 segundos
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
