const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('class="screen') || line.includes('id="connectingOverlay"') || line.includes('class="connecting-overlay"')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
