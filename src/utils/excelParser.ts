import * as XLSX from 'xlsx';
import type { MonthlyPLData } from './dataModel';

// 항목명과 dataModel 키 매핑 (창원사업부 기준)
const LABEL_KEY_MAPPING: Record<string, keyof MonthlyPLData> = {
    '매출액': 'revenue',
    '- FL': 'salesFL',
    '- fl': 'salesFL',
    '- TL': 'salesTL',
    '- tl': 'salesTL',
    '- 냉장고': 'salesFridge',
    '- 기타(매출)': 'salesOther', // 이름이 중복되는 기타는 별도 처리

    '실적재료비율': 'materialRatio',
    'BOM재료비율': 'bomMaterialRatio',
    '차이': 'materialDiff',
    '구매 VI': 'purchaseVI',
    'BFP VI': 'bfpVI',
    '재료Loss 금액': 'materialLoss',

    '인원(평균)': 'headcount',
    '인건비': 'laborCost',
    '인건비율': 'laborRatio',
    '원당매출액': 'revenuePerHead', // 원당매출액

    '경비': 'overhead',
    '경비율': 'overheadRatio',
    '- 전력료': 'electricity',
    '- 전력비': 'electricity', // 태국 등
    '- 감가상각비': 'depreciation',
    '- 수선비': 'repair',
    '- 소모품비': 'consumables',
    '- 운반비': 'transportation',
    '- 지급수수료': 'commission',
    '- 수입제비용': 'importCost', // 태국
    '- 지급임차료': 'rent',
    '- 기타(경비)': 'overheadOther',

    '영업이익': 'operatingProfit',
    '영업이익 (%)': 'operatingProfitRatio',
    '영외수지차': 'nonOpBalance',
    '- 금융비용': 'financeCost',
    '외환차손익': 'forexGainLoss', // 태국
    '기타(영외)': 'nonOpOther', // 태국
    '세전이익': 'ebt',
    '세전이익 (%)': 'ebt'
};

// 숫자 클리닝
const parseNumber = (value: any): number => {
    if (value === undefined || value === null || value === '' || value === '-') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

// 엑셀 파싱 함수
export const parseMonthlyExcel = async (file: File, _targetMonth: number, _divisionCode: string): Promise<{ actual: Partial<MonthlyPLData>, target: Partial<MonthlyPLData> }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // 첫번째 시트 혹은 실적이 포함된 시트 가져오기
                const targetSheetName = workbook.SheetNames.find(s => s.includes('월별') || s.includes('실적') || s.includes('경영')) || workbook.SheetNames[0];
                const sheet = workbook.Sheets[targetSheetName];

                // 2D 배열로 변환
                const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, blankrows: false });

                const actualData: Partial<MonthlyPLData> = {};
                const targetData: Partial<MonthlyPLData> = {};

                // 인덱스 기준: "당월"의 실적은 보통 열 인덱스 6, "당월"의 TD목표는 열 인덱스 7 (데이터 구조에 따라 다름)
                // 현재 분석된 당월 양식 기준: 
                // Col 0: 대분류, Col 1: 중분류/항목명, Col 6: 당월 실적, Col 7: 당월 TD목표
                const COL_ACTUAL = 6;
                const COL_TARGET = 7;

                let currentSection = '';

                rows.forEach((row, _rowIndex) => {
                    // 항목명 추출 (0열 또는 1열에 있음)
                    let label = row[1] ? String(row[1]).trim() : '';
                    if (!label && row[0]) label = String(row[0]).trim();
                    if (!label) return;

                    // 큰 섹션 추적 (중복된 '기타' 이름 구분 용도)
                    if (label.includes('매출')) currentSection = '매출';
                    else if (label.includes('경비')) currentSection = '경비';
                    else if (label.includes('영외') || label.includes('영업외')) currentSection = '영외';

                    let mappedKey = label;
                    if (label === '- 기타' || label === '기타') {
                        if (currentSection === '매출') mappedKey = '- 기타(매출)';
                        else if (currentSection === '경비') mappedKey = '- 기타(경비)';
                        else if (currentSection === '영외') mappedKey = '기타(영외)';
                    }

                    const dataKey = LABEL_KEY_MAPPING[mappedKey] || LABEL_KEY_MAPPING[label];

                    if (dataKey) {
                        let actualVal = parseNumber(row[COL_ACTUAL]);
                        let targetVal = parseNumber(row[COL_TARGET]);

                        // 단위 변환: 금액 항목(매출, 비용 등)은 백만원 단위이므로 * 1000000
                        // 비율 항목(이율, 비율 등)은 0.77 형식의 소수점이므로 * 100
                        // 인원 등 단일 카운트는 그대로 (단, 인원수 등 구분이 필요하나 일괄 처리 후 특정 보정 필요)

                        // 비율 판단 (비율이라는 글자가 있거나, 소수점 단위이면서 매출보다 현저히 작을 때)
                        const isRatio = label.includes('비율') || label.includes('(%)') || label.includes('차이') || label.includes('율');
                        const isCount = label.includes('인원') || label.includes('단위');

                        if (isRatio) {
                            // 엑셀에서 넘어오는 값: 0.7744 -> 77.44% 로 변환
                            actualData[dataKey] = Number((actualVal * 100).toFixed(2));
                            targetData[dataKey] = Number((targetVal * 100).toFixed(2));
                        } else if (isCount) {
                            // 인원은 그대로 (소수점은 반올림)
                            actualData[dataKey] = Math.round(actualVal);
                            targetData[dataKey] = Math.round(targetVal);
                        } else {
                            // 기본 금액 백만원 -> 원 단위 변환 (단, 환율/단가 등 특수 속성은 예외처리 필요할 수 있음)
                            // "원당매출액" 같은 항목은 예외적으로 수정
                            if (dataKey === 'revenuePerHead') {
                                actualData[dataKey] = actualVal; // 원당매출액은 그대로
                                targetData[dataKey] = targetVal;
                            } else {
                                actualData[dataKey] = actualVal * 1000000;
                                targetData[dataKey] = targetVal * 1000000;
                            }
                        }
                    }
                });

                resolve({ actual: actualData, target: targetData });

            } catch (error) {
                console.error("Excel parse error:", error);
                reject(error);
            }
        };
        reader.readAsArrayBuffer(file);
    });
};
