const fs = require('fs');
const content = fs.readFileSync('public/game.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('drawNameplate') || line.includes('lvl') && idx > 1800) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
