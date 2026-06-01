const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('const PASSIVE') || line.includes('let PASSIVE') || line.includes('PASSIVE_ITEM') || line.includes('PASSIVE_ITEMS')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
    for(let i=1; i<=30; i++) {
      console.log(`  +${i}: ${lines[idx+i].trim()}`);
    }
  }
});
