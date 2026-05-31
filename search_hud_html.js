const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('id="hud"') || line.includes('class="hud-') || line.includes('hotbar') || line.includes('hp-bar')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
