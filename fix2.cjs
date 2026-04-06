const fs = require('fs');
const file = 'c:/Users/김윤주/.gemini/antigravity/scratch/notebooklm/dashboard/src/components/Dashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const target1 = `                        );
                    }
                    })()}
                </div>
            )}
        </main>`;

const replacement1 = `                        );
                    })()}
                </div>
            )}
        </main>`;

code = code.replace(target1, replacement1);
fs.writeFileSync(file, code);
console.log('Fixed IIFE brace');
