# 🐷 Puchunanzas

Calculadora y Journal de gastos personales conectada a Google Sheets.

## 🚀 Inicio Rápido

### 1. Abrir la App
Simplemente abre `index.html` en tu navegador.

### 2. Modo de Prueba
La app funciona en modo de prueba con datos locales. Puedes usarla así para probar las funcionalidades.

---

## 📊 Conectar con Google Sheets

Para sincronizar con tu Sheet "FINANZAS 2026", sigue estos pasos:

### Paso 1: Abrir Apps Script
1. Ve a tu Google Sheet: https://docs.google.com/spreadsheets/d/1iv8ac9dbMAnWBw_-QDVOeJW2WhHqki3WYIv8YLKpGa0
2. Menú → **Extensiones** → **Apps Script**

### Paso 2: Agregar el Código
1. Borra el contenido del archivo `Código.gs`
2. Copia TODO el contenido de `google-apps-script.js`
3. Pégalo en el editor de Apps Script
4. Guarda (Ctrl+S)

### Paso 3: Desplegar como Webapp
1. Click en **Implementar** → **Nueva implementación**
2. Tipo: **Aplicación web**
3. Ejecutar como: **Yo mismo**
4. Acceso: **Cualquier persona**
5. Click **Implementar**
6. Autoriza los permisos cuando te lo pida
7. **Copia la URL** que te da

### Paso 4: Configurar la App
1. Abre Puchunanzas (index.html)
2. En el modal de configuración, pega la URL del Apps Script
3. Click "Guardar Configuración"

¡Listo! Ahora tus gastos se sincronizarán con Google Sheets.

---

## ✨ Funcionalidades

- 📈 Ver resumen de ingresos, gastos y balance
- 💰 Ver presupuesto por categoría con barra de progreso
- 🧮 Calcular si un gasto cabe en el presupuesto
- ✅ Registrar gastos (se guardan en "Enero Gastos")
- 📔 Journal con historial de gastos

---

## 📁 Archivos

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Estructura de la app |
| `styles.css` | Estilos modernos con tema oscuro |
| `app.js` | Lógica de la aplicación |
| `google-apps-script.js` | Código para tu Google Sheet |

---

## 🛠️ Solución de Problemas

**Error de CORS**: Asegúrate de que el Apps Script esté desplegado con acceso "Cualquier persona".

**No carga datos**: Verifica que la URL del Apps Script sea correcta y que hayas autorizado los permisos.

**Gastos no se guardan**: En modo de prueba, los gastos se guardan en localStorage. Para guardarlos en el Sheet, configura la conexión.
