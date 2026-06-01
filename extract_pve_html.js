const fs = require('fs');
const content = fs.readFileSync('public/pve.html', 'utf8');
const lines = content.split('\n');

console.log('=== Texts and Headings in pve.html ===');
lines.forEach((line, idx) => {
  if (/<(h1|h2|h3|h4|button|span|div|a|p)\b[^>]*>[^<]+/i.test(line)) {
    console.log(`line ${idx+1}: ${line.trim()}`);
  }
});
