const fs = require('fs');
const content = fs.readFileSync('public/style.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('evolutionChoiceModal') || line.includes('perkChoiceModal') || line.includes('.screen')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
