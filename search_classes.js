const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
const lines = content.split('\n');

console.log('--- Search for CLASSES ---');
lines.forEach((line, idx) => {
  if (line.includes('const CLASSES') || line.includes('let CLASSES') || line.includes('CLASSES =')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
    // Print next 20 lines
    for(let i=1; i<=30; i++) {
      console.log(`  +${i}: ${lines[idx+i].trim()}`);
    }
  }
});

console.log('--- Search for SKILL_DEFS ---');
lines.forEach((line, idx) => {
  if (line.includes('const SKILL_DEFS') || line.includes('let SKILL_DEFS') || line.includes('SKILL_DEFS =')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
    // Print next 20 lines
    for(let i=1; i<=30; i++) {
      console.log(`  +${i}: ${lines[idx+i].trim()}`);
    }
  }
});
