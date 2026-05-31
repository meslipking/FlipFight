const fs = require('fs');
const content = fs.readFileSync('public/style.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('z-index')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
