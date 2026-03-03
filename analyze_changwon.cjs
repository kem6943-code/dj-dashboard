// 창원사업부 PPT에서 숫자 데이터 추출
const JSZip = require('jszip');
const fs = require('fs');

async function run() {
    const filePath = 'C:/Users/김윤주/Desktop/실적보고 대시보드 만들기/0 경영실적 보고 2026년 1월 창원사업부_260224_final.pptx';
    const zip = await JSZip.loadAsync(fs.readFileSync(filePath));

    const slideFiles = Object.keys(zip.files)
        .filter(f => f.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort();

    console.log('Total slides:', slideFiles.length);

    for (const sf of slideFiles) {
        const xml = await zip.files[sf].async('text');
        const tables = xml.match(/<a:tbl[\s\S]*?<\/a:tbl>/g);
        const hasTable = tables ? tables.length : 0;
        const textValues = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
            .map(m => m[1])
            .filter(t => t.trim());

        // 숫자가 포함된 텍스트만 필터
        const nums = textValues.filter(t => /[\d,]+/.test(t) && t.length > 1);

        console.log(`\n=== ${sf} ===`);
        console.log(`  Tables: ${hasTable}, Total texts: ${textValues.length}`);

        // 9559 관련 숫자 찾기
        const matchRevenue = textValues.filter(t => t.includes('9559') || t.includes('9,559'));
        if (matchRevenue.length > 0) {
            console.log('  *** FOUND 9559:', matchRevenue.join(' | '));
        }

        // 매출 관련 키워드 + 주변 숫자 찾기
        const salesRelated = textValues.filter(t =>
            t.includes('매출') || t.includes('실적') || t.includes('영업이익') ||
            t.includes('원가') || t.includes('재료') || t.includes('노무') ||
            t.includes('경비') || t.includes('판관') || t.includes('세전')
        );
        if (salesRelated.length > 0) {
            console.log('  Keywords:', salesRelated.join(' | '));
        }

        if (nums.length > 0) {
            console.log('  Numbers:', nums.slice(0, 30).join(' | '));
        }
    }
}

run().catch(console.error);
