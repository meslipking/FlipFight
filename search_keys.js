const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'logs') return;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (stat.isFile() && /\.(js|html|css|json|md)$/.test(file) && file !== 'search_keys.js') {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const hasVampire = /vampire/i.test(line);
        const hasSurvivor = /survivor/i.test(line);
        const hasGemini = /gemini/i.test(line);
        const hasAIWord = /\b(AI|A\.I|a\.i)\b/.test(line);
        
        if (hasVampire || hasSurvivor || hasGemini || hasAIWord) {
          console.log(`${fullPath} : line ${idx + 1} : ${line.trim()}`);
        }
      });
    }
  });
}

scanDir('.');
