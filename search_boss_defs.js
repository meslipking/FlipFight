const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('const BOSS_') || line.includes('BOSS_DEFS') || line.includes('triggerBossEncounter')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
    for(let i=1; i<=15; i++) {
      console.log(`  +${i}: ${lines[idx+i].trim()}`);
    }
  }
});
