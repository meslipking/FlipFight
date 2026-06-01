const fs = require('fs');
const content = fs.readFileSync('public/pve.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (/lang|i18n/i.test(line)) {
    console.log(`line ${idx+1}: ${line.trim()}`);
  }
});
