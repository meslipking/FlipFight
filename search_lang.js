const fs = require('fs');
const files = ['public/pve.js', 'public/game.js', 'public/index.html', 'public/pve.html'];
files.forEach(f => {
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/lang|tieng|language|dịch|switch|version|en|vi/i.test(line)) {
      if (line.includes('lang') || line.includes('language') || line.includes('switchLanguage') || line.includes('translate')) {
        console.log(`${f} : line ${idx + 1} : ${line.trim()}`);
      }
    }
  });
});
