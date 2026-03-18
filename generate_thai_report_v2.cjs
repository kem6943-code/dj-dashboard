const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

function generateThaiReport() {
    console.log("🚀 본부장님(주인님) 지시사항 실행: '피벗테이블은 무시하고 raw-data(비용)에서 차변만 끌어와서 계산!'");

    const baseDir = 'C:\\Users\\김윤주\\Desktop\\비용분석_태국';
    const inputFile = path.join(baseDir, '비용전체_2월_태국.xlsx');
    const outputFile = path.join(baseDir, '비용분석_태국_본부장님보고서_최종_v2.xlsx');

    let workbook;
    try {
        workbook = xlsx.read(fs.readFileSync(inputFile));
    } catch (e) {
        console.error("🚨 파일 읽기 실패:", e.message);
        return;
    }

    // 1. 매출 데이터 파싱 (기존 로직 유지)
    console.log("📊 매출 데이터 분석 중...");
    const revSheet = workbook.Sheets['매출'];
    const revData = xlsx.utils.sheet_to_json(revSheet, { header: 1, defval: "" });
    const safeFloat = (val) => {
        if (!val) return 0.0;
        const num = parseFloat(String(val).replace(/,/g, '').trim());
        return isNaN(num) ? 0.0 : num / 1000.0;
    };
    const revDict = { '2024_total': 0.0, '2025_total': 0.0, '2026_total': 0.0 };
    const revMonthly = { '2025': {}, '2026': {} };

    for (const row of revData) {
        if (!row || !row.length) continue;
        const gubun = String(row[0]).trim();
        if (gubun.includes('2024년')) {
            revDict['2024_total'] = safeFloat(row[13] || row[12] || row[row.length - 1]);
        } else if (gubun.includes('2025년')) {
            revDict['2025_total'] = safeFloat(row[13] || row[12] || row[row.length - 1]);
            for (let m = 1; m <= 12; m++) if (row.length > m) revMonthly['2025'][m] = safeFloat(row[m]);
        } else if (gubun.includes('2026년')) {
            revDict['2026_total'] = safeFloat(row[13] || row[12]) || (safeFloat(row[1]) + safeFloat(row[2]));
            for (let m = 1; m <= 12; m++) if (row.length > m) revMonthly['2026'][m] = safeFloat(row[m]);
        }
    }

    // 2. raw-data (비용) 직접 집계
    console.log("⚙️ raw-data (비용) 차변 금액 집계 중...");
    const rawSheet = workbook.Sheets['raw-data (비용)'];
    const rawData = xlsx.utils.sheet_to_json(rawSheet, { defval: "" });

    // 구조: costs[계정명] = { 구분: "...", 2024_total: 0, 2025: {1:0, ...}, 2026: {1:0, 2:0} }
    const costs = {};

    for (const row of rawData) {
        const accName = String(row['계정명'] || "").trim();
        const gubun = String(row['구분'] || "").trim();
        const year = parseInt(row['연도']);
        const month = parseInt(row['월']);
        // 차변은 원래 Baht 단위이므로 천 바트로 환산하기 위해 1000으로 나눔
        const amount = parseFloat(row['차변']) / 1000.0;

        if (!accName || isNaN(year) || isNaN(month) || isNaN(amount)) continue;

        if (!costs[accName]) {
            costs[accName] = { gubun: gubun, '2024_total': 0, '2025': {}, '2026': {} };
            for (let m = 1; m <= 12; m++) costs[accName]['2025'][m] = 0;
            for (let m = 1; m <= 12; m++) costs[accName]['2026'][m] = 0;
        }

        if (year === 2024) {
            costs[accName]['2024_total'] += amount;
        } else if (year === 2025) {
            costs[accName]['2025'][month] += amount;
        } else if (year === 2026) {
            costs[accName]['2026'][month] += amount;
        }
    }

    // 3. 전체비용_2월(피벗테이블)에서 '계정명 순서'만 추출
    const pivotSheet = workbook.Sheets['전체비용_2월'];
    const pivotData = xlsx.utils.sheet_to_json(pivotSheet, { header: 1, defval: "" });
    const orderedAccounts = [];

    for (let i = 4; i < pivotData.length; i++) {
        const row = pivotData[i];
        if (!row) continue;
        const accName = String(row[1]).trim();
        if (accName && accName !== "계정명" && !accName.includes("요약") && !accName.includes("합계")) {
            if (!orderedAccounts.includes(accName)) {
                orderedAccounts.push(accName);
            }
        }
    }

    // 만약 raw-data에는 있는데 pivot에 누락된 계정이 있다면 끝에 추가
    for (const accName of Object.keys(costs)) {
        if (!orderedAccounts.includes(accName)) {
            orderedAccounts.push(accName);
        }
    }

    // 4. 리포트 생성
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

    // 매출액 행 최상단 추가
    const revRow = new Array(outHeaders.length).fill("");
    revRow[0] = "매출";
    revRow[1] = "총 매출액";
    revRow[2] = revDict['2024_total'];
    revRow[3] = 1.0; // 100%
    revRow[4] = revDict['2024_total'] / 12.0;
    revRow[5] = 1.0;

    for (let m = 1; m <= 12; m++) {
        revRow[6 + (m - 1) * 2] = revMonthly['2025'][m] || 0.0;
        revRow[6 + (m - 1) * 2 + 1] = (revMonthly['2025'][m]) ? 1.0 : 0.0;
    }
    revRow[30] = revDict['2025_total'];
    revRow[31] = 1.0;

    revRow[32] = revMonthly['2026'][1] || 0.0;
    revRow[33] = revMonthly['2026'][1] ? 1.0 : 0.0;
    revRow[34] = revMonthly['2026'][2] || 0.0;
    revRow[35] = revMonthly['2026'][2] ? 1.0 : 0.0;
    const rev26TotRevRow = (revMonthly['2026'][1] || 0) + (revMonthly['2026'][2] || 0);
    revRow[36] = rev26TotRevRow;
    revRow[37] = rev26TotRevRow ? 1.0 : 0.0;

    resultData.push(revRow);

    // 빈 줄 하나 추가해서 구분
    resultData.push(new Array(outHeaders.length).fill(""));

    // 구분별(Gubun) 출력을 위해 그룹화 (순서 유지를 위해 orderedAccounts 기반으로 그룹 생성)
    const groupedData = {};
    const gubunOrder = [];

    for (const accName of orderedAccounts) {
        if (!costs[accName]) continue; // 데이터 없는 계정은 스킵
        const gubun = costs[accName].gubun || "미분류";
        if (!groupedData[gubun]) {
            groupedData[gubun] = [];
            gubunOrder.push(gubun);
        }
        groupedData[gubun].push(accName);
    }

    for (const gubun of gubunOrder) {
        let isFirstInGubun = true;
        let gubun24Tot = 0, gubun25Tot = 0, gubun26Tot = 0;

        for (const accName of groupedData[gubun]) {
            const rowData = costs[accName];
            const outRow = new Array(outHeaders.length).fill(0.0);

            outRow[0] = isFirstInGubun ? gubun : ""; // 병합 효과(?)를 위해 첫 줄만 노출
            outRow[1] = accName;

            // 2024
            const c24Tot = rowData['2024_total'];
            gubun24Tot += c24Tot;
            outRow[2] = c24Tot;
            outRow[3] = revDict['2024_total'] ? c24Tot / revDict['2024_total'] : 0.0;
            const c24Avg = c24Tot / 12.0;
            outRow[4] = c24Avg;
            outRow[5] = revDict['2024_total'] ? c24Avg / (revDict['2024_total'] / 12) : 0.0;

            // 2025
            let c25Tot = 0;
            for (let m = 1; m <= 12; m++) {
                const val = rowData['2025'][m];
                c25Tot += val;

                const outIdx = 6 + (m - 1) * 2;
                outRow[outIdx] = val;
                const rev = revMonthly['2025'][m] || 0.0;
                outRow[outIdx + 1] = rev ? val / rev : 0.0;
            }
            gubun25Tot += c25Tot;
            outRow[30] = c25Tot;
            outRow[31] = revDict['2025_total'] ? c25Tot / revDict['2025_total'] : 0.0;

            // 2026
            const c26Jan = rowData['2026'][1];
            const c26Feb = rowData['2026'][2];
            outRow[32] = c26Jan;
            outRow[33] = revMonthly['2026'][1] ? c26Jan / revMonthly['2026'][1] : 0.0;
            outRow[34] = c26Feb;
            outRow[35] = revMonthly['2026'][2] ? c26Feb / revMonthly['2026'][2] : 0.0;

            const c26Tot = c26Jan + c26Feb;
            gubun26Tot += c26Tot;
            outRow[36] = c26Tot;
            const rev26Tot = (revMonthly['2026'][1] + revMonthly['2026'][2]) || 0.0;
            outRow[37] = rev26Tot ? c26Tot / rev26Tot : 0.0;

            resultData.push(outRow);
            isFirstInGubun = false;
        }

        // 그룹 합계 줄 추가
        const subRow = new Array(outHeaders.length).fill(0.0);
        subRow[0] = gubun + " 소계";
        subRow[2] = gubun24Tot;
        subRow[3] = revDict['2024_total'] ? gubun24Tot / revDict['2024_total'] : 0.0;
        subRow[4] = gubun24Tot / 12.0;
        subRow[5] = revDict['2024_total'] ? subRow[4] / (revDict['2024_total'] / 12) : 0.0;

        let s25 = 0;
        for (let m = 1; m <= 12; m++) {
            let sm = 0;
            groupedData[gubun].forEach(acc => { if (costs[acc]) sm += costs[acc]['2025'][m]; });
            const outIdx = 6 + (m - 1) * 2;
            subRow[outIdx] = sm;
            s25 += sm;
            const rev = revMonthly['2025'][m] || 0.0;
            subRow[outIdx + 1] = rev ? sm / rev : 0.0;
        }
        subRow[30] = s25;
        subRow[31] = revDict['2025_total'] ? s25 / revDict['2025_total'] : 0.0;

        let s26_1 = 0, s26_2 = 0;
        groupedData[gubun].forEach(acc => {
            if (costs[acc]) {
                s26_1 += costs[acc]['2026'][1];
                s26_2 += costs[acc]['2026'][2];
            }
        });
        subRow[32] = s26_1;
        subRow[33] = revMonthly['2026'][1] ? s26_1 / revMonthly['2026'][1] : 0.0;
        subRow[34] = s26_2;
        subRow[35] = revMonthly['2026'][2] ? s26_2 / revMonthly['2026'][2] : 0.0;

        const c26TotLocal = s26_1 + s26_2;
        subRow[36] = c26TotLocal;
        const rev26TotLocal = (revMonthly['2026'][1] || 0) + (revMonthly['2026'][2] || 0);
        subRow[37] = rev26TotLocal ? c26TotLocal / rev26TotLocal : 0.0;

        resultData.push(subRow);
        // Add an empty row for separation
        resultData.push(new Array(outHeaders.length).fill(""));
    }

    // Grand Total
    const gtRow = new Array(outHeaders.length).fill(0.0);
    gtRow[0] = "총 비용 합계(Grand Total)";

    // Summing up only the "소계" rows
    let grand24Tot = 0, grand25Tot = 0, grand26Tot = 0;

    // We sum up by traversing resultData for rows where index 0 includes '소계'
    for (const r of resultData) {
        if (String(r[0]).includes("소계")) {
            gtRow[2] += r[2]; // 2024년 합계
            gtRow[4] += r[4]; // 2024 평균
            for (let m = 1; m <= 12; m++) gtRow[6 + (m - 1) * 2] += r[6 + (m - 1) * 2]; // 2025 월별
            gtRow[30] += r[30]; // 2025 합계
            gtRow[32] += r[32]; // 26년 1월
            gtRow[34] += r[34]; // 26년 2월
            gtRow[36] += r[36]; // 2026년 합계
        }
    }

    // Ratios for Grand Total
    gtRow[3] = revDict['2024_total'] ? gtRow[2] / revDict['2024_total'] : 0.0;
    gtRow[5] = revDict['2024_total'] ? gtRow[4] / (revDict['2024_total'] / 12) : 0.0;
    for (let m = 1; m <= 12; m++) {
        const rev = revMonthly['2025'][m] || 0.0;
        gtRow[6 + (m - 1) * 2 + 1] = rev ? gtRow[6 + (m - 1) * 2] / rev : 0.0;
    }
    gtRow[31] = revDict['2025_total'] ? gtRow[30] / revDict['2025_total'] : 0.0;
    gtRow[33] = revMonthly['2026'][1] ? gtRow[32] / revMonthly['2026'][1] : 0.0;
    gtRow[35] = revMonthly['2026'][2] ? gtRow[34] / revMonthly['2026'][2] : 0.0;
    const rev26TotGT = (revMonthly['2026'][1] || 0) + (revMonthly['2026'][2] || 0);
    gtRow[37] = rev26TotGT ? gtRow[36] / rev26TotGT : 0.0;

    resultData.push(gtRow);

    // 5. 엑셀 생성
    console.log("💾 엑셀 포맷팅 및 저장 중...");
    const newWb = xlsx.utils.book_new();
    const newWs = xlsx.utils.aoa_to_sheet(resultData);

    // 서식 적용
    const range = xlsx.utils.decode_range(newWs['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        for (let C = range.s.c + 2; C <= range.e.c; ++C) {
            const cellAddress = xlsx.utils.encode_cell({ r: R, c: C });
            if (!newWs[cellAddress]) continue;

            const headerCell = newWs[xlsx.utils.encode_cell({ r: 0, c: C })];
            if (headerCell && headerCell.v.includes('%')) {
                newWs[cellAddress].z = '0.0%';
            } else {
                newWs[cellAddress].z = '#,##0'; // 소수점 제거 (정수 포맷)
            }
        }
    }

    const wscols = [{ wch: 15 }, { wch: 25 }];
    for (let i = 2; i < outHeaders.length; i++) wscols.push({ wch: 15 });
    newWs['!cols'] = wscols;

    xlsx.utils.book_append_sheet(newWb, newWs, "비용분석_최종");

    try {
        xlsx.writeFile(newWb, outputFile);
        console.log(`✅ 본부장님 보고용 파일 재창조 완료! 파일 위치: ${outputFile}`);
    } catch (e) {
        console.error("🚨 엑셀 파일 저장 실패! 파일이 열려있는지 확인해주세요.", e.message);
    }
}

generateThaiReport();
