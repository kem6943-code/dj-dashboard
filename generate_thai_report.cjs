const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

function generateThaiReport() {
    console.log("🚀 본부장님 지시사항 실행 중: 태국사업부 비용분석 보고서 자동화");

    const baseDir = 'C:\\Users\\김윤주\\Desktop\\비용분석_태국';
    const inputFile = path.join(baseDir, '비용전체_2월_태국.xlsx');
    const outputFile = path.join(baseDir, '비용분석_태국_본부장님보고서_최종.xlsx');

    let workbook;
    try {
        workbook = xlsx.readFile(inputFile);
    } catch (e) {
        console.error("🚨 파일 읽기 실패:", e.message);
        return;
    }

    const costSheetName = '전체비용_2월';
    const revSheetName = '매출';

    if (!workbook.SheetNames.includes(costSheetName) || !workbook.SheetNames.includes(revSheetName)) {
        console.error("🚨 엑셀 파일 안에 필요한 시트가 없습니다.");
        return;
    }

    // 1. 매출 데이터 구조화
    console.log("📊 매출 데이터 분석 중...");
    const revSheet = workbook.Sheets[revSheetName];
    // Read raw, skipping header row (index 0) if needed, but let's just get it as 2D array
    const revData = xlsx.utils.sheet_to_json(revSheet, { header: 1, defval: "" });

    const safeFloat = (val) => {
        if (!val) return 0.0;
        const num = parseFloat(String(val).replace(/,/g, '').trim());
        return isNaN(num) ? 0.0 : num / 1000.0; // 천 바트 변환!
    };

    const revDict = { '2024_total': 0.0, '2025_total': 0.0, '2026_total': 0.0 };
    const revMonthly = { '2025': {}, '2026': {} };

    for (const row of revData) {
        if (!row || !row.length) continue;
        const gubun = String(row[0]).trim();
        if (gubun.includes('2024년')) {
            revDict['2024_total'] = safeFloat(row[13] || row[12] || row[row.length - 1]); // '합계' is usually at the end
        } else if (gubun.includes('2025년')) {
            revDict['2025_total'] = safeFloat(row[13] || row[12] || row[row.length - 1]);
            for (let m = 1; m <= 12; m++) {
                if (row.length > m) revMonthly['2025'][m] = safeFloat(row[m]);
            }
        } else if (gubun.includes('2026년')) {
            // For 2026, there might be no 합계 column populated yet, or it's at the end.
            // row: ['2026년', 452573243.99, 460995476] -> length 3
            revDict['2026_total'] = safeFloat(row[13] || row[12]) || (safeFloat(row[1]) + safeFloat(row[2]));
            for (let m = 1; m <= 12; m++) {
                if (row.length > m) revMonthly['2026'][m] = safeFloat(row[m]);
            }
        }
    }

    console.log("매출(천 바트 환산):", revDict);

    // 2. 비용 데이터 매핑 및 계산
    console.log("⚙️ 비용 데이터와 비율 연산 중...");
    const costSheet = workbook.Sheets[costSheetName];
    const costData = xlsx.utils.sheet_to_json(costSheet, { header: 1, defval: "" });

    // Output columns header
    const outHeaders = [
        "구분", "계정명",
        "2024년 합계", "24년 비율(%)",
        "2024년 평균", "24평 비율(%)",
        "25년 1월", "25년 1월(%)", "25년 2월", "25년 2월(%)",
        "25년 3월", "25년 3월(%)", "25년 4월", "25년 4월(%)",
        "25년 5월", "25년 5월(%)", "25년 6월", "25년 6월(%)",
        "25년 7월", "25년 7월(%)", "25년 8월", "25년 8월(%)",
        "25년 9월", "25년 9월(%)", "25년 10월", "25년 10월(%)",
        "25년 11월", "25년 11월(%)", "25년 12월", "25년 12월(%)",
        "2025년 합계", "25년 합계 비율(%)",
        "26년 1월", "26년 1월(%)", "26년 2월", "26년 2월(%)",
        "2026년 합계", "26년 합계 비율(%)"
    ];

    const resultData = [];
    resultData.push(outHeaders);

    const safeNum = (val) => {
        if (val === "" || val === null || val === undefined) return 0.0;
        const num = parseFloat(String(val).replace(/,/g, '').trim());
        return isNaN(num) ? 0.0 : num;
    };

    let inDataSection = false;
    for (let i = 0; i < costData.length; i++) {
        const row = costData[i];
        const gubun = String(row[0]).trim();
        const accName = String(row[1]).trim();

        if (accName === "계정명") {
            inDataSection = true;
            continue;
        }

        if (!inDataSection) continue;
        if (!gubun && !accName) continue; // empty row

        const c24Tot = safeNum(row[2]);
        const c24Avg = safeNum(row[4]);

        const outRow = new Array(outHeaders.length).fill(0.0);

        // 원본 데이터(raw-data)에는 '급여'로 적혀있지만 '전체비용_2월' 시트에는 '일반경비' 또는 공란으로 꼬여있음 -> 강제 고정
        if (accName === '외주가공비') {
            outRow[0] = '급여';
        } else {
            outRow[0] = gubun ? gubun : ""; // 구분
        }

        outRow[1] = accName;         // 계정명
        outRow[2] = c24Tot;          // 24합
        outRow[3] = revDict['2024_total'] ? c24Tot / revDict['2024_total'] : 0.0;
        outRow[4] = c24Avg;
        outRow[5] = revDict['2024_total'] ? c24Avg / (revDict['2024_total'] / 12) : 0.0;

        let c25Tot = 0;
        for (let m = 1; m <= 12; m++) {
            const colIdx = 5 + (m - 1) * 2;
            const val = row.length > colIdx ? safeNum(row[colIdx]) : 0.0;
            c25Tot += val;

            const outIdx = 6 + (m - 1) * 2;
            outRow[outIdx] = val;

            const rev = revMonthly['2025'][m] || 0.0;
            outRow[outIdx + 1] = rev ? val / rev : 0.0;
        }

        outRow[30] = c25Tot;
        outRow[31] = revDict['2025_total'] ? c25Tot / revDict['2025_total'] : 0.0;

        // Note: The raw data for Dec 2025 and 2026 might be in raw Baht instead of 천바트. 
        // We will detect large numbers and scale them by 1/1000 to match 천바트.
        const c26JanRaw = row.length > 31 ? safeNum(row[31]) : 0.0;
        const c26Jan = c26JanRaw > 100000 ? c26JanRaw / 1000 : c26JanRaw; // Auto-detect scale anomaly

        const c26FebRaw = row.length > 33 ? safeNum(row[33]) : 0.0;
        const c26Feb = c26FebRaw > 100000 ? c26FebRaw / 1000 : c26FebRaw;

        outRow[32] = c26Jan;
        const rev26Jan = revMonthly['2026'][1] || 0.0;
        outRow[33] = rev26Jan ? c26Jan / rev26Jan : 0.0;

        outRow[34] = c26Feb;
        const rev26Feb = revMonthly['2026'][2] || 0.0;
        outRow[35] = rev26Feb ? c26Feb / rev26Feb : 0.0;

        const c26Tot = c26Jan + c26Feb;
        outRow[36] = c26Tot;
        const rev26Tot = revMonthly['2026'][1] + revMonthly['2026'][2] || 0.0;
        outRow[37] = rev26Tot ? c26Tot / rev26Tot : 0.0;

        // Also fix Dec 2025 if it's crazy high!
        if (outRow[28] > 100000) { // 25년 12월
            outRow[28] = outRow[28] / 1000;
            const revDec = revMonthly['2025'][12] || 0.0;
            outRow[29] = revDec ? outRow[28] / revDec : 0.0;
            // update total
            c25Tot = c25Tot - (outRow[28] * 1000) + outRow[28];
            outRow[30] = c25Tot;
            outRow[31] = revDict['2025_total'] ? c25Tot / revDict['2025_total'] : 0.0;
        }

        const existingIdx = resultData.findIndex(r => r[1] === accName); if (existingIdx > 0 && accName === '외주가공비') { for(let k=2; k<outRow.length; k+=2) { resultData[existingIdx][k] += outRow[k]; } /* Re-calc ratios */ resultData[existingIdx][3] = revDict['2024_total'] ? resultData[existingIdx][2] / revDict['2024_total'] : 0; resultData[existingIdx][5] = revDict['2024_total'] ? resultData[existingIdx][4] / (revDict['2024_total']/12) : 0; for(let m=1; m<=12; m++) { const idx = 6 + (m - 1) * 2; const rev = revMonthly['2025'][m] || 0; resultData[existingIdx][idx+1] = rev ? resultData[existingIdx][idx]/rev : 0; } resultData[existingIdx][31] = revDict['2025_total'] ? resultData[existingIdx][30]/revDict['2025_total'] : 0; resultData[existingIdx][33] = revMonthly['2026'][1] ? resultData[existingIdx][32]/revMonthly['2026'][1] : 0; resultData[existingIdx][35] = revMonthly['2026'][2] ? resultData[existingIdx][34]/revMonthly['2026'][2] : 0; const rev26Tot = (revMonthly['2026'][1]||0) + (revMonthly['2026'][2]||0); resultData[existingIdx][37] = rev26Tot ? resultData[existingIdx][36]/rev26Tot : 0; } else { resultData.push(outRow); }
    }

    // 3. 엑셀 파일 생성
    console.log("💾 엑셀 보고서 생성 중...");
    const newWb = xlsx.utils.book_new();
    const newWs = xlsx.utils.aoa_to_sheet(resultData);

    // Apply Formatting (Number Formats)
    const range = xlsx.utils.decode_range(newWs['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        for (let C = range.s.c + 2; C <= range.e.c; ++C) {
            const cellAddress = xlsx.utils.encode_cell({ r: R, c: C });
            if (!newWs[cellAddress]) continue;

            // Apply percentage format for alternate columns
            const headerCell = newWs[xlsx.utils.encode_cell({ r: 0, c: C })];
            if (headerCell && headerCell.v.includes('%')) {
                newWs[cellAddress].z = '0.0%';
            } else {
                newWs[cellAddress].z = '#,##0.0';
            }
        }
    }

    // Set Column Widths
    const wscols = [
        { wch: 15 }, // 구분
        { wch: 25 }, // 계정명
    ];
    for (let i = 2; i < outHeaders.length; i++) {
        wscols.push({ wch: 15 });
    }
    newWs['!cols'] = wscols;

    xlsx.utils.book_append_sheet(newWb, newWs, "비용분석_최종");

    try {
        xlsx.writeFile(newWb, outputFile);
        console.log(`✅ 본부장님 보고용 파일 세팅 완료! 파일 위치: ${outputFile}`);
    } catch (e) {
        console.error("🚨 엑셀 파일 저장 실패! 엑셀이 켜져있다면 끄고 다시 시도해주세요:", e.message);
    }
}

generateThaiReport();
