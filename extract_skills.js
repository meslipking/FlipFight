const fs = require('fs');
const content = fs.readFileSync('public/pve.js', 'utf8');
// Parse/find the SKILL_DEFS block in code
// It starts with const SKILL_DEFS = {
// We can use a regex to extract the object, or just parse line by line.
// Let's list the skills by scanning for lines with icon and branch inside SKILL_DEFS.
const lines = content.split('\n');
let inside = false;
lines.forEach((line, idx) => {
  if (line.includes('const SKILL_DEFS =')) {
    inside = true;
    console.log(`Starts at line ${idx+1}`);
  }
  if (inside) {
    if (line.trim().startsWith('};')) {
      inside = false;
      console.log(`Ends at line ${idx+1}`);
    } else if (line.includes(':') && line.includes('name:') && line.includes('desc:')) {
      console.log(`line ${idx+1}: ${line.trim()}`);
    }
  }
});
