const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('I18N') || line.includes('currentLang') || line.includes('setLang') || line.includes('langBtn')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
  }
});
