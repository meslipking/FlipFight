const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('in-game') || line.includes('body.class') || line.includes('document.body.className') || line.includes('document.body.classList')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
  }
});
