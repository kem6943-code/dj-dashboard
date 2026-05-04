const fs = require('fs');
const content = fs.readFileSync('src/hooks/usePeriodData.ts', 'utf16le');
// replace the corrupted trigger comment
const cleaned = content.replace(/\/\/\s*Trigger CI deploy[\s\S]*$/, '');
fs.writeFileSync('src/hooks/usePeriodData.ts', cleaned.trim() + '\n', 'utf8');
