const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('const LENH_BAI_POOL') || line.includes('let LENH_BAI_POOL') || line.includes('LENH_BAI_POOL =')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
    for(let i=1; i<=25; i++) {
      console.log(`  +${i}: ${lines[idx+i].trim()}`);
    }
  }
});
