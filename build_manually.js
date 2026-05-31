const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const name = 'FlipFight';
const zipPath = 'C:\\Users\\PC\\AppData\\Local\\electron\\Cache\\bc80a13ebe4734629db853b3fc870b18ba9e388b795710fdbbd075694e548d03\\electron-v42.3.0-win32-x64.zip';
const outDir = path.join(__dirname, 'dist', `${name}-win32-x64`);
const appDir = path.join(outDir, 'resources', 'app');

console.log('--- CUSTOM ELECTRON PC BUILD PIPELINE ---');

try {
  // 1. Xóa và tạo mới thư mục đầu ra
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });
  console.log('Đã tạo thư mục đầu ra:', outDir);

  // 2. Giải nén phôi Electron bằng PowerShell (tránh lỗi giải nén không đồng bộ trên Node 24)
  console.log('Đang giải nén bộ nhớ đệm Electron (Expand-Archive)...');
  const psCmd = `powershell -ExecutionPolicy Bypass -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });
  console.log('Giải nén hoàn tất thành công.');

  // 3. Đổi tên tệp thực thi từ electron.exe thành FlipFight.exe
  console.log('Đang đổi tên electron.exe sang ' + name + '.exe...');
  fs.renameSync(path.join(outDir, 'electron.exe'), path.join(outDir, `${name}.exe`));

  // 4. Tạo cấu trúc thư mục resources/app
  console.log('Đang tạo cấu trúc tài nguyên app...');
  fs.mkdirSync(path.join(appDir, 'public'), { recursive: true });

  // 5. Sao chép các tệp mã nguồn cần thiết cho bản offline PVE
  const copyFile = (src, dest) => {
    fs.copyFileSync(path.join(__dirname, src), path.join(appDir, dest));
  };

  console.log('Đang sao chép các tệp cấu hình và mã nguồn...');
  copyFile('package.json', 'package.json');
  copyFile('main.js', 'main.js');

  const publicFiles = fs.readdirSync(path.join(__dirname, 'public'));
  publicFiles.forEach(file => {
    const srcPath = path.join('public', file);
    const destPath = path.join('public', file);
    if (fs.statSync(path.join(__dirname, srcPath)).isFile()) {
      copyFile(srcPath, destPath);
    }
  });
  console.log('Đã sao chép toàn bộ mã nguồn game.');

  console.log('=========================================');
  console.log('✅ ĐÓNG GÓI GAME PC THÀNH CÔNG!');
  console.log('Đường dẫn thư mục:', outDir);
  console.log(`Tệp thực thi: ${path.join(outDir, name + '.exe')}`);
  console.log('=========================================');
} catch (error) {
  console.error('❌ Quá trình đóng gói thất bại:', error);
  process.exit(1);
}
