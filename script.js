let totalRecords = 0;
let storedRecords = []; // Lista para almacenar los registros escaneados
let busNumber = 1;
let shiftNumber = 1;

// Variable para el nombre del proyecto (prefijo del archivo CSV)
let projectName = 'CLK'; // Puedes cambiar 'CLK' por el nombre que desees

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { hour12: false });
    document.getElementById('time').textContent = timeString;
}
setInterval(updateTime, 1000);
updateTime();

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-GB', options);
    document.getElementById('currentDate').textContent = dateString;
}
updateDate();

// Actualizar la fecha cada hora
setInterval(updateDate, 3600000);

function updateInternetStatus() {
    const led = document.getElementById('internetStatus');
    if (navigator.onLine) {
        // Conexion disponible
        led.style.backgroundColor = 'green';
        led.style.boxShadow = '0 0 5vw green';
    } else {
        // Sin conexion
        led.style.backgroundColor = 'red';
        led.style.boxShadow = '0 0 5vw red';
    }
}
updateInternetStatus();

// Actualizar el estado del LED cada cierto tiempo
setInterval(updateInternetStatus, 2000);

document.getElementById('barcodeInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        processBarcodeInput();
    }
});

function processBarcodeInput() {
    const barcodeInput = document.getElementById('barcodeInput');
    const barcode = barcodeInput.value.trim();
    const status = document.getElementById('status');

    // Verificar si el codigo escaneado es el comando para descargar datos
    if (barcode === '000000') { // Reemplaza '000000' por el numero especial que desees
        downloadDataAsCSV();
        barcodeInput.value = '';
        status.textContent = 'Datos descargados y registros reiniciados';
        status.classList.remove('error');
        void status.offsetWidth;
        status.style.animation = 'glow 1s ease-in-out infinite alternate';
        return;
    }

    // Verificar que solo haya numeros y que la longitud sea de 6 caracteres
    if (/^\d{6}$/.test(barcode)) {
        const now = new Date();
        const date = now.toLocaleDateString('en-GB');
        const time = now.toLocaleTimeString('en-GB', { hour12: false });

        // Restablecer el estado normal del mensaje
        status.classList.remove('error');  // Quitar la clase de error
        status.style.color = '';           // Restablecer el color predeterminado

        saveRecord(barcode, date, time, busNumber, shiftNumber);
        barcodeInput.value = ''; // Limpiar el campo después de guardar

        // Mostrar mensaje de registro exitoso
        status.textContent = 'Registro exitoso';
        void status.offsetWidth;
        status.style.animation = 'glow 1s ease-in-out infinite alternate';
    } else {
        // Mostrar mensaje de error en rojo
        status.textContent = 'ID no reconocido';
        status.classList.add('error');     // Aplicar la clase de error
    }

    // Reenfocar el campo de entrada
    barcodeInput.focus();
}

function saveRecord(barcode, date, time, busNumber, shiftNumber) {
    storedRecords.push({ barcode, date, time, busNumber, shiftNumber });
    localStorage.setItem('storedRecords', JSON.stringify(storedRecords));

    totalRecords++;
    updateCounter();
    localStorage.setItem('totalRecords', totalRecords);
}

function initializeCounter() {
    totalRecords = parseInt(localStorage.getItem('totalRecords')) || 0;
    document.getElementById('totalRecords').textContent = totalRecords;
}
initializeCounter();

function updateCounter() {
    const counterSpan = document.getElementById('totalRecords');
    counterSpan.textContent = totalRecords;
    counterSpan.classList.add('animate');
    setTimeout(() => {
        counterSpan.classList.remove('animate');
    }, 300);
}

// Al cargar la página, inicializar storedRecords desde localStorage
storedRecords = JSON.parse(localStorage.getItem('storedRecords')) || [];

// Función para descargar los datos en formato CSV
function downloadDataAsCSV() {
    if (storedRecords.length === 0) {
        alert('No hay datos para descargar.');
        return;
    }

    // Construir el CSV
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Fecha,Hora,Codigo de Barras,Autobus,Turno\n';

    storedRecords.forEach(record => {
        const row = `${record.date},${record.time},${record.barcode},${record.busNumber},${record.shiftNumber}`;
        csvContent += row + '\n';
    });

    // Crear el nombre del archivo
    const now = new Date();
    const dateString = now.toLocaleDateString('en-GB').replace(/\//g, "'");
    const timeString = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, ".");
    const fileName = `${projectName}-${dateString}-${timeString}.csv`;

    // Descargar el archivo
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Resetear los registros y el contador
    storedRecords = [];
    localStorage.removeItem('storedRecords');

    totalRecords = 0;
    updateCounter();
    localStorage.removeItem('totalRecords');
}

function initializeSelections() {
    busNumber = parseInt(localStorage.getItem('busNumber')) || 1;
    shiftNumber = parseInt(localStorage.getItem('shiftNumber')) || 1;
    document.getElementById('busSelect').value = busNumber;
    document.getElementById('shiftSelect').value = shiftNumber;
}
initializeSelections();

document.getElementById('busSelect').addEventListener('change', (event) => {
    busNumber = parseInt(event.target.value);
    localStorage.setItem('busNumber', busNumber);
    document.getElementById('barcodeInput').focus();
});

document.getElementById('shiftSelect').addEventListener('change', (event) => {
    shiftNumber = parseInt(event.target.value);
    localStorage.setItem('shiftNumber', shiftNumber);
    document.getElementById('barcodeInput').focus();
});
