const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('const MASTERY_DEFS') || line.includes('let MASTERY_DEFS') || line.includes('MASTERY_DEFS =')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
    for(let i=1; i<=25; i++) {
      console.log(`  +${i}: ${lines[idx+i].trim()}`);
    }
  }
});
