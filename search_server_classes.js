const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('const CLASSES') || line.includes('let CLASSES') || line.includes('CLASSES =') || line.includes('SKILL_DEFS')) {
    console.log(`line ${idx+1}: ${line.trim()}`);
  }
});
