const XLSX = require('xlsx');

const filePath = 'C:\\Users\\김윤주\\Desktop\\실적보고 대시보드 만들기\\1. 경영 현황_창원사업부.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    console.log("Sheets:", workbook.SheetNames);

    // 첫번째 시트나 실적/월별 단어가 들어간 시트 찾기
    const targetSheetName = workbook.SheetNames.find(s => s.includes('월별') || s.includes('실적')) || workbook.SheetNames[0];
    const sheet = workbook.Sheets[targetSheetName];

    // 처음 30행만 읽어서 구조 파악 (배열의 배열 형태)
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
    console.log("\n--- Sheet Data Preview (Top 20 rows) ---");
    data.slice(0, 25).forEach((row, idx) => {
        console.log(`[R${idx + 1}]`, row.slice(0, 15).join(' | ')); // 첫 15개 열만 표시
    });

} catch (e) {
    console.error("Error reading file:", e);
}
