const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('petGrid') || line.includes('selectPet') || line.includes('petList') || line.includes('PET_LIST') || line.includes('PET_DEFS')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
  }
});
