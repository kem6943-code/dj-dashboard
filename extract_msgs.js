const fs = require('fs');
const path = require('path');

const baseDir = "C:\\Users\\김윤주\\.gemini\\antigravity\\brain";
const targets = [
    "c43c6d91-9223-4297-ada0-3fc81f960bbd",
    "776b6de1-f5a5-4a76-81af-d62a94afd24c",
    "b7bf04f6-ba4d-45bc-83c3-74dcbee347e4",
    "edd2fc73-d33d-484d-a36b-43a1a3de0fb1",
    "f478ec4a-12e6-4e40-aaa1-a0e23ff6c7dc"
];

let output = '';

targets.forEach(t => {
    const agentDir = path.join(baseDir, t, ".system_generated", "logs");
    if (fs.existsSync(agentDir)) {
        output += `--- Conversation ${t} ---\n`;
        fs.readdirSync(agentDir).forEach(f => {
            if (f.endsWith(".txt")) {
                const filePath = path.join(agentDir, f);
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    if (content.includes("TD") || content.includes("목표") || content.includes("입력")) {
                        const lines = content.split('\n');
                        lines.forEach(line => {
                            if (line.includes("USER:") || line.includes("USER REQUEST") || line.includes("TD목표")) {
                                output += `[${f}] ${line.trim().substring(0, 150)}\n`;
                            }
                        });
                    }
                } catch (e) {
                    output += `Error reading ${filePath}: ${e.message}\n`;
                }
            }
        });
    }
});

fs.writeFileSync('output_msgs.txt', output, 'utf-8');
console.log('Extraction complete. Check output_msgs.txt');
