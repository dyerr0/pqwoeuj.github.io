let totalRecords = 0;
let pendingRecords = [];

// Mostrar la hora actual en tiempo real
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-MX', { hour12: false });
    document.getElementById('time').textContent = timeString;
}
setInterval(updateTime, 1000);
updateTime();

// Mostrar la fecha actual en el header
function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('es-MX', options);
    document.getElementById('currentDate').textContent = dateString;
}
updateDate();

// Función para actualizar el estado del LED
function updateInternetStatus() {
    const led = document.getElementById('internetStatus');
    if (navigator.onLine) {
        // Conexión disponible
        led.style.backgroundColor = 'green';
        led.style.boxShadow = '0 0 5px green';
    } else {
        // Sin conexión
        led.style.backgroundColor = 'red';
        led.style.boxShadow = '0 0 5px red';
    }
}
updateInternetStatus();

// Actualizar el estado del LED cada cierto tiempo
setInterval(updateInternetStatus, 2000);

// Función para enviar datos a Google Sheets
function sendToGoogleSheets(barcode, timestamp) {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbw2rNv5s8ZYAuzhqaOmfup1p3pxb723O2Y-vbuUE66xI-5Ggni3amME-RvRGMVVcCpw/exec';
    const formData = new FormData();
    formData.append('barcode', barcode);
    formData.append('timestamp', timestamp);

    // Mostrar el loader
    document.getElementById('loader').style.display = 'block';
    // Ocultar el mensaje de registro exitoso
    document.getElementById('status').textContent = '';
    document.getElementById('status').style.animation = 'none';

    fetch(scriptURL, { method: 'POST', body: formData })
        .then(response => response.text())
        .then(result => {
            // Ocultar el loader
            document.getElementById('loader').style.display = 'none';
            
            // Incrementar el contador de registros
            totalRecords++;
            updateCounter();
            // Actualizar el contador en localStorage
            localStorage.setItem('totalRecords', totalRecords);

            // Mostrar mensaje de registro exitoso
            document.getElementById('status').textContent = 'Registro exitoso';
            // Reiniciar la animación de brillo
            void document.getElementById('status').offsetWidth;
            document.getElementById('status').style.animation = 'glow 1s ease-in-out infinite alternate';
        })
        .catch(error => {
            // Ocultar el loader
            document.getElementById('loader').style.display = 'none';
            
            // Almacenar el registro pendiente
            savePendingRecord(barcode, timestamp);
            // Mostrar mensaje de datos pendientes
            updatePendingDataMessage();
            console.error('Error al guardar el registro:', error);
        });
}

// Manejar el ingreso del código de barras
document.getElementById('barcodeInput').addEventListener('change', (event) => {
    const barcode = event.target.value.trim();
    if (barcode) {
        const timestamp = new Date().toLocaleString('es-MX');
        sendToGoogleSheets(barcode, timestamp);
        event.target.value = ''; // Limpiar el campo después de enviar
    }
});

// Mantener el foco en el campo de entrada
document.getElementById('barcodeInput').addEventListener('blur', () => {
    document.getElementById('barcodeInput').focus();
});

// Inicializar el contador de registros
function initializeCounter() {
    totalRecords = parseInt(localStorage.getItem('totalRecords')) || 0;
    document.getElementById('totalRecords').textContent = totalRecords;
}
initializeCounter();

// Actualizar el contador y agregar animación
function updateCounter() {
    const counterSpan = document.getElementById('totalRecords');
    counterSpan.textContent = totalRecords;
    counterSpan.classList.add('animate');
    setTimeout(() => {
        counterSpan.classList.remove('animate');
    }, 300);
}

// Guardar registro pendiente
function savePendingRecord(barcode, timestamp) {
    // Obtener registros pendientes desde localStorage
    pendingRecords = JSON.parse(localStorage.getItem('pendingRecords')) || [];
    // Agregar nuevo registro
    pendingRecords.push({ barcode, timestamp });
    // Guardar en localStorage
    localStorage.setItem('pendingRecords', JSON.stringify(pendingRecords));
}

// Enviar registros pendientes
function sendPendingRecords() {
    if (pendingRecords.length > 0) {
        const record = pendingRecords[0];
        sendToGoogleSheets(record.barcode, record.timestamp);
        // Remover el registro enviado
        pendingRecords.shift();
        localStorage.setItem('pendingRecords', JSON.stringify(pendingRecords));
    }
}

// Actualizar mensaje de datos pendientes
function updatePendingDataMessage() {
    const pendingDataDiv = document.getElementById('pendingData');
    pendingRecords = JSON.parse(localStorage.getItem('pendingRecords')) || [];
    if (pendingRecords.length > 0) {
        pendingDataDiv.textContent = 'Datos pendientes: Conéctate a Internet';
    } else {
        pendingDataDiv.textContent = '';
    }
}

// Verificar conexión a Internet y enviar registros pendientes
function checkInternetConnection() {
    updateInternetStatus();
    if (navigator.onLine) {
        updatePendingDataMessage();
        // Intentar enviar registros pendientes
        pendingRecords = JSON.parse(localStorage.getItem('pendingRecords')) || [];
        if (pendingRecords.length > 0) {
            sendPendingRecords();
        }
    } else {
        updatePendingDataMessage();
    }
}

// Escuchar eventos de conexión/desconexión
window.addEventListener('online', checkInternetConnection);
window.addEventListener('offline', () => {
    updateInternetStatus();
    updatePendingDataMessage();
});

// Verificar conexión cada cierto tiempo
setInterval(checkInternetConnection, 5000);

// Al cargar la página, verificar si hay datos pendientes
updatePendingDataMessage();
