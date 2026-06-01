const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('powerupGrid') || line.includes('renderPowerups') || line.includes('buildPowerupGrid') || line.includes('openPowerupModal')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
  }
});
