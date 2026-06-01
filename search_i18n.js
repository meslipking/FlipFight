const fs = require('fs');
const content = fs.readFileSync('public/game.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('const I18N') || line.includes('let I18N') || line.includes('I18N =')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
    for(let i=1; i<=100; i++) {
      console.log(`  +${i}: ${lines[idx+i].trim()}`);
    }
  }
});
