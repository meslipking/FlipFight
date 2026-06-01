/**
 * Manual PC Build Script — copy Electron dist + game files thủ công
 * Thay thế electron-packager khi nó bị stuck
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const ELECTRON_DIST = path.join(ROOT, 'node_modules', 'electron', 'dist');
const OUT_DIR = path.join(ROOT, 'dist', 'Angel Arena-win32-x64');

console.log('🔨 Building Angel Arena PC (manual)...');

// 1. Xoá output cũ
if (fs.existsSync(OUT_DIR)) {
  fs.rmSync(OUT_DIR, { recursive: true });
  console.log('  🗑️  Cleaned old build');
}
fs.mkdirSync(OUT_DIR, { recursive: true });

// 2. Copy toàn bộ Electron dist
console.log('  📦 Copying Electron runtime...');
copyDir(ELECTRON_DIST, OUT_DIR);

// 3. Rename electron.exe -> Angel Arena.exe
const electronExe = path.join(OUT_DIR, 'electron.exe');
const gameExe = path.join(OUT_DIR, 'Angel Arena.exe');
if (fs.existsSync(electronExe)) {
  fs.renameSync(electronExe, gameExe);
  console.log('  ✅ Renamed electron.exe -> Angel Arena.exe');
}

// 4. Tạo resources/app folder với game files
const appDir = path.join(OUT_DIR, 'resources', 'app');
fs.mkdirSync(appDir, { recursive: true });

const FILES_TO_COPY = [
  { src: 'main.js', dst: 'main.js' },
  { src: 'package.json', dst: 'package.json' },
  { src: 'server.js', dst: 'server.js' },
  { src: 'README.md', dst: 'README.md' },
];

FILES_TO_COPY.forEach(({ src, dst }) => {
  const s = path.join(ROOT, src);
  const d = path.join(appDir, dst);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
    console.log('  ✅ Copied', src);
  } else {
    console.log('  ⚠️  Missing:', src);
  }
});

// 5. Copy public folder
console.log('  📁 Copying public/ game assets...');
copyDir(path.join(ROOT, 'public'), path.join(appDir, 'public'));

// 6. Copy minimal node_modules (express, ws)
console.log('  📦 Copying runtime node_modules...');
const nmSrc = path.join(ROOT, 'node_modules');
const nmDst = path.join(appDir, 'node_modules');
const RUNTIME_DEPS = ['express', 'ws', 'accepts', 'array-flatten', 'body-parser',
  'bytes', 'content-disposition', 'content-type', 'cookie', 'cookie-signature',
  'debug', 'depd', 'destroy', 'ee-first', 'encodeurl', 'escape-html', 'etag',
  'finalhandler', 'forwarded', 'fresh', 'function-bind', 'get-intrinsic',
  'hasown', 'http-errors', 'iconv-lite', 'inherits', 'ipaddr.js', 'media-typer',
  'merge-descriptors', 'methods', 'mime', 'mime-db', 'mime-types', 'ms',
  'negotiator', 'on-finished', 'on-headers', 'parseurl', 'path-to-regexp',
  'proxy-addr', 'qs', 'range-parser', 'raw-body', 'safe-buffer', 'send',
  'serve-static', 'setprototypeof', 'side-channel', 'statuses', 'toidentifier',
  'type-is', 'unpipe', 'utils-merge', 'vary'];

fs.mkdirSync(nmDst, { recursive: true });
let copied = 0;
RUNTIME_DEPS.forEach(dep => {
  const s = path.join(nmSrc, dep);
  const d = path.join(nmDst, dep);
  if (fs.existsSync(s)) {
    copyDir(s, d);
    copied++;
  }
});
console.log(`  ✅ Copied ${copied} runtime packages`);

// 7. Tạo package.json minimal cho app
const appPkg = {
  name: 'angel-arena',
  version: '1.0.0',
  main: 'main.js',
  description: 'Angel Arena PVE Game'
};
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(appPkg, null, 2));

// Kết quả
const totalSize = getDirSize(OUT_DIR);
console.log('\n✅ Build complete!');
console.log('📁 Output:', OUT_DIR);
console.log('📦 Total size:', (totalSize / 1024 / 1024).toFixed(0), 'MB');
console.log('🎮 Executable: dist/Angel Arena-win32-x64/Angel Arena.exe');

// Helper functions
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function getDirSize(dir) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) total += getDirSize(fp);
    else total += fs.statSync(fp).size;
  }
  return total;
}
