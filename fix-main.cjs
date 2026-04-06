const fs = require('fs');
const file = 'c:/Users/김윤주/.gemini/antigravity/scratch/notebooklm/dashboard/src/components/Dashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /\}\s*\)\(\)\}\s*<\/div>\s*\)\}\s*\{\/\* 클라우드 동기화 실패 에러 토스트 \*\/\}/;
code = code.replace(regex, '}\\n                    })()}\\n                </div>\\n            )}\\n        </main>\\n\\n            {/* 클라우드 동기화 실패 에러 토스트 */}');

fs.writeFileSync(file, code);
console.log('Fixed unmatched <main> element');
