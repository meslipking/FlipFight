const fs = require('fs');
const content = fs.readFileSync('public/game.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('showEvolutionChoiceModal') || line.includes('showPerkChoiceModal') || line.includes('perkChoiceModal')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
