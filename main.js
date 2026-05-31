const { app, BrowserWindow } = require('electron');
const path = require('path');

// Cài đặt cấu hình phần cứng tiêu chuẩn và ổn định của Chromium cho Canvas 2D
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true, // Chạy chế độ toàn màn hình cho game PC
    autoHideMenuBar: true, // Ẩn thanh công cụ menu
    backgroundColor: '#07080f', // Nền tối tránh chớp màn hình trắng lúc load
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true // Mở devTools phục vụ debug khi cần thiết
    }
  });



  // Tải trang PVE chính từ thư mục public
  mainWindow.loadFile(path.join(__dirname, 'public', 'pve.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Xử lý các phím nóng: F11 để bật/tắt toàn màn hình, Escape để thoát
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
    if (input.key === 'Escape' && input.type === 'keyDown') {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
      }
      // Không tự ý đóng cửa sổ khi nhấn Esc để tránh ngắt trận đấu dở dang (người chơi sẽ dùng Pause Menu để thoát)
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
