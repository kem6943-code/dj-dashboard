// 베트남 PPT에서 생산실 관련 데이터 추출
const JSZip = require('jszip');
const fs = require('fs');

async function run() {
    const filePath = 'C:/Users/김윤주/Desktop/실적보고 대시보드 만들기/26년 01월 베트남 경영실적 자료 1.pptx';
    const zip = await JSZip.loadAsync(fs.readFileSync(filePath));

    const slideFiles = Object.keys(zip.files)
        .filter(f => f.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort();

    console.log('Total slides:', slideFiles.length);

    for (const sf of slideFiles) {
        const xml = await zip.files[sf].async('text');
        const textValues = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
            .map(m => m[1]).filter(t => t.trim());

        // 생산실 관련 키워드 검색
        const prodLine = textValues.filter(t =>
            t.includes('생산') || t.includes('1실') || t.includes('2실') || t.includes('3실') ||
            t.includes('가전') || t.includes('자동차')
        );

        if (prodLine.length > 0) {
            console.log(`\n=== ${sf} ===`);
            console.log('  Production keywords:', prodLine.join(' | '));
            // 주변 텍스트도 표시
            const allNums = textValues.filter(t => /[\d,]+/.test(t) && t.length > 1).slice(0, 15);
            console.log('  Numbers:', allNums.join(' | '));
        }

        // 테이블 확인
        const tables = xml.match(/<a:tbl[\s\S]*?<\/a:tbl>/g);
        if (tables && tables.length > 0) {
            console.log(`\n=== ${sf} has ${tables.length} table(s) ===`);
            tables.forEach((table, tIdx) => {
                const rows = table.match(/<a:tr[\s\S]*?<\/a:tr>/g) || [];
                console.log(`  Table ${tIdx + 1}: ${rows.length} rows`);
                // 첫 5행 출력
                rows.slice(0, 8).forEach((row, rIdx) => {
                    const cells = row.match(/<a:tc[\s\S]*?<\/a:tc>/g) || [];
                    const cellTexts = cells.map(cell => {
                        const texts = [...cell.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1]).join('');
                        return texts.trim();
                    });
                    if (cellTexts.some(t => t.length > 0)) {
                        console.log(`  Row ${rIdx}: ${cellTexts.join(' | ')}`);
                    }
                });
            });
        }
    }
}

run().catch(console.error);
