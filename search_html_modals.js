const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('perkChoiceModal') || line.includes('evolutionChoiceModal') || line.includes('perkCardContainer')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
