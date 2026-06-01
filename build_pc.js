const packager = require('electron-packager');

async function build() {
  console.log('🔨 Starting Angel Arena PC build...');
  
  const paths = await packager({
    dir: '.',
    name: 'Angel Arena',
    platform: 'win32',
    arch: 'x64',
    out: 'dist',
    overwrite: true,
    appVersion: '1.0.0',
    win32metadata: {
      ProductName: 'Angel Arena',
      CompanyName: 'Angel Studio',
      FileDescription: 'Angel Arena PVE Survival Game',
      OriginalFilename: 'AngelArena.exe'
    },
    ignore: [
      /^\/dist/,
      /^\/\.git/,
      /^\/logs/,
      /^\/chat-history/,
      /^\/scratch/,
      /^\/release\.tar\.gz/,
      /^\/node_modules\/electron\//,
      /^\/node_modules\/electron-packager\//,
      /^\/node_modules\/ssh2\//,
      /qa_.*\.js$/,
      /search_.*\.js$/,
      /^\/update_pve\.js/,
      /^\/ssh_command\.js/,
      /^\/fast-deploy\.js/,
      /^\/deploy\.js/,
      /^\/build_manually\.js/,
      /^\/extract_.*\.js/,
      /^\/get_logs\.js/,
      /^\/remote_diagnostic\.js/,
      /^\/check_server\.js/,
      /^\/test_ws\.js/,
      /^\/test-client\.js/,
      /^\/\.env/,
      /^\/build_pc\.js/,
    ]
  });
  
  console.log('✅ Build complete!');
  console.log('📁 Output:', paths);
  
  // Show exe size
  const fs = require('fs');
  const exePath = require('path').join(paths[0], 'Angel Arena.exe');
  const stat = fs.statSync(exePath);
  console.log('🎮 Angel Arena.exe size:', (stat.size / 1024 / 1024).toFixed(1), 'MB');
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
