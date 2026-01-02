// Google Apps Script para Puchunanzas
// INSTRUCCIONES: Copia este código en tu Google Sheet:
// 1. Abre tu Sheet -> Extensiones -> Apps Script
// 2. Pega este código
// 3. Guarda y despliega como webapp

const SHEET_ID = '1iv8ac9dbMAnWBw_-QDVOeJW2WhHqki3WYIv8YLKpGa0';

// Configuración de las hojas
const MAIN_SHEET = 'GASTOS Y PRESUPUESTOS';
const EXPENSES_SHEET = 'Enero Gastos';

// Habilitar CORS - Usar GET para todo (evita problemas de CORS)
function doGet(e) {
    const action = e.parameter.action;
    let result;

    try {
        if (action === 'getBudget') {
            result = getBudgetData();
        } else if (action === 'addExpense') {
            // Recibir datos via GET para evitar CORS
            const categoria = decodeURIComponent(e.parameter.categoria || '');
            const monto = parseFloat(e.parameter.monto) || 0;
            const descripcion = decodeURIComponent(e.parameter.descripcion || '');
            result = addExpense(categoria, monto, descripcion);
        } else {
            result = { error: 'Acción no reconocida' };
        }
    } catch (error) {
        result = { error: error.toString() };
    }

    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    let result;

    try {
        const data = JSON.parse(e.postData.contents);

        if (data.action === 'addExpense') {
            result = addExpense(data.categoria, data.monto, data.descripcion);
        } else {
            result = { error: 'Acción no reconocida' };
        }
    } catch (error) {
        result = { error: error.toString() };
    }

    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

// Obtener datos del presupuesto
function getBudgetData() {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const mainSheet = ss.getSheetByName(MAIN_SHEET);
    const expensesSheet = ss.getSheetByName(EXPENSES_SHEET);

    // Leer ingresos
    const ingresos = {
        sueldoNeto: mainSheet.getRange('B4').getValue(),
        ingresosExtras: mainSheet.getRange('B5').getValue(),
        otrosIngresos: mainSheet.getRange('B6').getValue(),
        total: mainSheet.getRange('B8').getValue()
    };

    // Leer gastos fijos
    const gastosFijos = {
        internetTelefono: mainSheet.getRange('D4').getValue(),
        transporte: mainSheet.getRange('D5').getValue(),
        deudas: mainSheet.getRange('D6').getValue(),
        ahorroProgramado: mainSheet.getRange('D7').getValue(),
        total: mainSheet.getRange('D8').getValue()
    };

    // Leer gastos variables (presupuesto y gastado)
    const gastosVariables = [
        {
            nombre: 'Salidas/Entretenimiento',
            presupuesto: mainSheet.getRange('F4').getValue(),
            gastado: parseGastado(mainSheet.getRange('E4').getValue())
        },
        {
            nombre: 'Ropa/Personales',
            presupuesto: mainSheet.getRange('F5').getValue(),
            gastado: parseGastado(mainSheet.getRange('E5').getValue())
        }
    ];

    // Leer resumen
    const resumen = {
        ingresosTotales: mainSheet.getRange('D13').getValue(),
        gastosTotales: mainSheet.getRange('D14').getValue(),
        balanceMensual: mainSheet.getRange('D15').getValue()
    };

    // Leer gastos registrados del mes
    const gastosRegistrados = getExpensesFromSheet(expensesSheet);

    return {
        ingresos,
        gastosFijos,
        gastosVariables,
        resumen,
        gastosRegistrados,
        fechaConsulta: new Date().toISOString()
    };
}

// Parsear el valor gastado del formato "Categoria: $X"
function parseGastado(value) {
    if (!value) return 0;
    const match = String(value).match(/\$?([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
}

// Obtener gastos registrados
function getExpensesFromSheet(sheet) {
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    return data.map(row => ({
        fecha: row[0],
        categoria: row[1],
        monto: row[2],
        descripcion: row[3]
    })).filter(item => item.fecha);
}

// Agregar un gasto
function addExpense(categoria, monto, descripcion) {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const expensesSheet = ss.getSheetByName(EXPENSES_SHEET);

    // Verificar que la hoja tenga encabezados
    if (expensesSheet.getLastRow() === 0) {
        expensesSheet.appendRow(['Fecha', 'Categoría', 'Monto', 'Descripción']);
    }

    // Agregar el gasto
    const fecha = new Date();
    expensesSheet.appendRow([fecha, categoria, monto, descripcion || '']);

    // Actualizar el gasto en la hoja principal
    updateMainSheet(categoria, monto);

    return {
        success: true,
        message: 'Gasto registrado correctamente',
        gasto: {
            fecha: fecha.toISOString(),
            categoria,
            monto,
            descripcion
        }
    };
}

// Actualizar la hoja principal con el nuevo gasto
function updateMainSheet(categoria, monto) {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const mainSheet = ss.getSheetByName(MAIN_SHEET);
    const expensesSheet = ss.getSheetByName(EXPENSES_SHEET);

    // Calcular el total gastado por categoría
    const lastRow = expensesSheet.getLastRow();
    if (lastRow < 2) return;

    const data = expensesSheet.getRange(2, 1, lastRow - 1, 3).getValues();

    let totalSalidas = 0;
    let totalRopa = 0;

    data.forEach(row => {
        if (row[1] === 'Salidas/Entretenimiento') {
            totalSalidas += Number(row[2]) || 0;
        } else if (row[1] === 'Ropa/Personales') {
            totalRopa += Number(row[2]) || 0;
        }
    });

    // Actualizar las celdas con el formato correcto
    mainSheet.getRange('E4').setValue('Salidas/Entretenimiento: $' + totalSalidas.toFixed(2));
    mainSheet.getRange('E5').setValue('Ropa/Personales: $' + totalRopa.toFixed(2));
}

// Para pruebas locales
function testGetBudget() {
    Logger.log(getBudgetData());
}

function testAddExpense() {
    Logger.log(addExpense('Salidas/Entretenimiento', 15, 'Cena con amigos'));
}
