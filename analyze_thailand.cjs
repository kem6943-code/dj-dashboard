// 태국사업부 PPT에서 테이블 데이터 추출
const JSZip = require('jszip');
const fs = require('fs');

async function run() {
    const filePath = 'C:/Users/김윤주/Desktop/실적보고 대시보드 만들기/0. 26년1월 DJETR 경영회의보고 V2 _260220.pptx';
    const zip = await JSZip.loadAsync(fs.readFileSync(filePath));

    const slideFiles = Object.keys(zip.files)
        .filter(f => f.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort();

    console.log('Total slides:', slideFiles.length);

    for (const sf of slideFiles) {
        const xml = await zip.files[sf].async('text');
        const tables = xml.match(/<a:tbl[\s\S]*?<\/a:tbl>/g);

        if (tables && tables.length > 0) {
            console.log(`\n===== ${sf} has ${tables.length} table(s) =====`);

            tables.forEach((table, tIdx) => {
                // 행별로 데이터 추출
                const rows = table.match(/<a:tr[\s\S]*?<\/a:tr>/g) || [];
                console.log(`\n  Table ${tIdx + 1}: ${rows.length} rows`);

                rows.forEach((row, rIdx) => {
                    const cells = row.match(/<a:tc[\s\S]*?<\/a:tc>/g) || [];
                    const cellTexts = cells.map(cell => {
                        const texts = [...cell.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1]).join('');
                        return texts.trim();
                    });

                    // 숫자가 포함된 행만 출력 (핵심 데이터)
                    const hasNumber = cellTexts.some(t => /\d/.test(t));
                    if (hasNumber && cellTexts.length > 2) {
                        console.log(`  Row ${rIdx}: ${cellTexts.join(' | ')}`);
                    }
                });
            });
        }
    }
}

run().catch(console.error);
