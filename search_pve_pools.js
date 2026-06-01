const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
const lines = content.split('\n');

console.log('--- PETS ---');
lines.forEach((line, idx) => {
  if (line.includes('const PET_DEFS') || line.includes('let PET_DEFS') || line.includes('PET_DEFS =')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
    for(let i=1; i<=20; i++) console.log(`  +${i}: ${lines[idx+i].trim()}`);
  }
});

console.log('--- POWERUPS ---');
lines.forEach((line, idx) => {
  if (line.includes('const POWERUP_DEFS') || line.includes('let POWERUP_DEFS') || line.includes('POWERUP_DEFS =') || line.includes('const MASTERY_TREE')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
    for(let i=1; i<=20; i++) console.log(`  +${i}: ${lines[idx+i].trim()}`);
  }
});

console.log('--- DEMONIC ---');
lines.forEach((line, idx) => {
  if (line.includes('demonicChoices') || line.includes('openDemonicAltar') || line.includes('DEMONIC_DEALS')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
  }
});
