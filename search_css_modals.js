const fs = require('fs');
const content = fs.readFileSync('public/style.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('perkChoiceModal') || line.includes('evolutionChoiceModal') || line.includes('perk-card') || line.includes('card-container')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
