// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  // Crear la ventana del navegador.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Maximizar por defecto
  win.maximize();

  // Cargar la URL del servidor local
  // En desarrollo usamos el puerto 3000, en producción también (o el que se configure)
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : 'http://localhost:3000'; // El servidor Next.js debe estar corriendo localmente

  win.loadURL(startUrl);

  // Abrir las herramientas de desarrollo si estamos en modo dev
  if (isDev) {
    win.webContents.openDevTools();
  }

  // Manejar errores de carga (por ejemplo, si el servidor aún no inicia)
  win.webContents.on('did-fail-load', () => {
    console.log('Fallo la carga, reintentando en 5 segundos...');
    setTimeout(() => {
      win.loadURL(startUrl);
    }, 5000);
  });
}

// Este método se llamará cuando Electron haya finalizado
// la inicialización y esté listo para crear ventanas del navegador.
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas estén cerradas, excepto en macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
