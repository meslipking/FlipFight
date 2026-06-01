const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('SKILL_DEFS[') || line.includes('PASSIVE_ITEMS_DEFS[')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
  }
});
