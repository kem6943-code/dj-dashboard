// 멕시코 가전 PPT에서 데이터 추출
const JSZip = require('jszip');
const fs = require('fs');

async function run() {
    const filePath = 'C:/Users/김윤주/Desktop/실적보고 대시보드 만들기/★MM법인1월경영실적보고-가전_v1.pptx';
    const zip = await JSZip.loadAsync(fs.readFileSync(filePath));

    const slideFiles = Object.keys(zip.files)
        .filter(f => f.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort();

    console.log('Total slides:', slideFiles.length);

    for (const sf of slideFiles) {
        const xml = await zip.files[sf].async('text');
        const textValues = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
            .map(m => m[1]).filter(t => t.trim());

        // P&L 관련 키워드 검색
        const keywords = textValues.filter(t =>
            t.includes('매출') || t.includes('영업이익') || t.includes('재료') ||
            t.includes('노무') || t.includes('경비') || t.includes('세전') ||
            t.includes('인건') || t.includes('원가')
        );

        if (keywords.length > 0) {
            console.log(`\n=== ${sf} ===`);
            console.log('  Keywords:', keywords.join(' | '));
            const nums = textValues.filter(t => /[\d,]+/.test(t) && t.length > 1).slice(0, 20);
            if (nums.length > 0) console.log('  Numbers:', nums.join(' | '));
        }

        // 테이블 확인
        const tables = xml.match(/<a:tbl[\s\S]*?<\/a:tbl>/g);
        if (tables && tables.length > 0) {
            console.log(`\n=== ${sf} has ${tables.length} table(s) ===`);
            tables.forEach((table, tIdx) => {
                const rows = table.match(/<a:tr[\s\S]*?<\/a:tr>/g) || [];
                console.log(`  Table ${tIdx + 1}: ${rows.length} rows`);
                rows.slice(0, 10).forEach((row, rIdx) => {
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
