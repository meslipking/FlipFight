const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// GPU acceleration cho Canvas 2D performance
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: !isDev,          // Fullscreen trong bản release
    autoHideMenuBar: true,
    title: 'Angel Arena',
    backgroundColor: '#07080f',  // Tránh chớp trắng khi load
    icon: path.join(__dirname, 'public', 'favicon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev             // DevTools chỉ bật khi dev
    }
  });

  // Ẩn menu bar hoàn toàn
  Menu.setApplicationMenu(null);

  // Load game PVE
  mainWindow.loadFile(path.join(__dirname, 'public', 'pve.html'));

  // Chỉ mở DevTools khi đang dev
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Phím nóng: F11 = toggle fullscreen, Escape thoát fullscreen
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
    if (input.key === 'Escape' && input.type === 'keyDown') {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
        event.preventDefault();
      }
    }
    // F12 chỉ mở DevTools khi dev mode
    if (input.key === 'F12' && input.type === 'keyDown' && isDev) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
