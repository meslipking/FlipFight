/**
 * Build script: Tạo ZIP release package (không cần Electron đầy đủ)
 * Đóng gói source code + README để user chạy `npm run electron`
 * Đồng thời tạo thư mục Angel Arena-win32-x64 giả nếu build Electron đang chạy
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC = __dirname;
const OUT = path.join(SRC, 'dist', 'release');

// Files/folders cần đưa vào release
const INCLUDE = [
  'public',
  'main.js',
  'server.js',
  'package.json',
  'README.md',
  '.gitignore',
];

// Xoá và tạo lại thư mục release
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

console.log('📦 Copying files...');
INCLUDE.forEach(item => {
  const src = path.join(SRC, item);
  const dst = path.join(OUT, item);
  if (!fs.existsSync(src)) { console.log('  SKIP:', item); return; }
  if (fs.statSync(src).isDirectory()) {
    copyDir(src, dst);
  } else {
    fs.copyFileSync(src, dst);
  }
  console.log('  ✅', item);
});

// Tạo launcher batch file
const launcher = `@echo off
echo Starting Angel Arena...
cd /d "%~dp0"
node_modules\\.bin\\electron .
if errorlevel 1 (
  echo.
  echo ERROR: Please run "npm install" first!
  pause
)
`;
fs.writeFileSync(path.join(OUT, 'Launch Angel Arena.bat'), launcher);

// Tạo INSTALL.txt
const install = `=== Angel Arena ===

CÁCH CHẠY:
1. Đảm bảo đã cài Node.js (https://nodejs.org)
2. Mở Command Prompt trong thư mục này
3. Chạy: npm install
4. Chạy: npm run electron

HOẶC double-click: "Launch Angel Arena.bat"

Phím tắt trong game:
- F11: Toggle fullscreen
- Escape: Thoát fullscreen
`;
fs.writeFileSync(path.join(OUT, 'INSTALL.txt'), install);

console.log('\n✅ Release package ready at: dist/release/');
console.log('📁 Contents:');
fs.readdirSync(OUT).forEach(f => console.log('  -', f));

// Kích thước
const totalSize = getDirSize(OUT);
console.log('\n📦 Total size:', (totalSize / 1024 / 1024).toFixed(1), 'MB');

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  fs.readdirSync(src).forEach(file => {
    const s = path.join(src, file);
    const d = path.join(dst, file);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  });
}

function getDirSize(dir) {
  let total = 0;
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    total += stat.isDirectory() ? getDirSize(fp) : stat.size;
  });
  return total;
}
