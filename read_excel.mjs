import * as xlsx from 'xlsx';

try {
    const filePath = 'C:\\Users\\김윤주\\Desktop\\비용분석_태국\\비용전체_2월_태국.xlsx';
    console.log("Reading file:", filePath);
    const workbook = xlsx.readFile(filePath);

    console.log("Sheet names:", workbook.SheetNames);

    for (const name of workbook.SheetNames) {
        console.log(`\n--- Sheet: ${name} ---`);
        const sheet = workbook.Sheets[name];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        // Print first 8 rows
        for (let i = 0; i < Math.min(8, rows.length); i++) {
            console.log(rows[i].join(" | "));
        }
    }
} catch (e) {
    console.error("Error reading excel:", e.message);
}
