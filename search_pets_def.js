const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('const PETS_DEFS') || line.includes('let PETS_DEFS') || line.includes('PETS_DEFS =')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
    for(let i=1; i<=25; i++) {
      console.log(`  +${i}: ${lines[idx+i].trim()}`);
    }
  }
});
