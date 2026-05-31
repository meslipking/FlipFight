const fs = require('fs');
const content = fs.readFileSync('public/game.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('function syncMyHUD')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
