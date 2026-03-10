/**
 * 경영실적 대시보드 데이터 모델
 * - 사업부별 월별 P&L 데이터를 관리하는 타입 정의
 */

// 사업부 코드
export type DivisionCode = 'changwon' | 'thailand' | 'vietnam' | 'mexico' | 'total';

// 서브 디비전 (생산실, 사업 분류)
export interface SubDivision {
    key: string;        // 고유 키 (예: 'prod1', 'homeAppliance')
    name: string;       // 표시 이름 (예: '생산1실', '가전')
}

// 사업부 정보
export interface DivisionInfo {
    code: DivisionCode;
    name: string;
    nameEn: string;
    flag: string;
    currency: string;
    subDivisions?: SubDivision[];          // 서브 디비전 목록
    subDivisionMode?: 'tabs' | 'columns';  // 표시 방식: 탭 전환 or 컬럼 나란히
}

// 사업부 목록
export const DIVISIONS: DivisionInfo[] = [
    { code: 'changwon', name: '창원사업부', nameEn: 'Changwon', flag: '🇰🇷', currency: 'KRW' },
    { code: 'thailand', name: '태국사업부', nameEn: 'Thailand (DJETR)', flag: '🇹🇭', currency: 'THB' },
    {
        code: 'vietnam', name: '베트남사업부', nameEn: 'Vietnam', flag: '🇻🇳', currency: 'VND',
        subDivisions: [
            { key: 'all', name: '전체' },
            { key: 'prod1', name: '생산1실' },
            { key: 'prod2', name: '생산2실' },
            { key: 'prod3', name: '생산3실' },
        ],
        subDivisionMode: 'tabs',
    },
    {
        code: 'mexico', name: '멕시코사업부', nameEn: 'Mexico (MM)', flag: '🇲🇽', currency: 'MXN',
        subDivisions: [
            { key: 'homeAppliance', name: '가전' },
            { key: 'automotive', name: '자동차' },
        ],
        subDivisionMode: 'columns',
    },
];

// 합계 포함 전체 목록 (탭 표시용)
export const TOTAL_DIVISION: DivisionInfo = { code: 'total', name: '합계', nameEn: 'Total', flag: '📊', currency: 'KRW' };
export const DIVISIONS_WITH_TOTAL: DivisionInfo[] = [...DIVISIONS, TOTAL_DIVISION];

// P&L 항목 정의
export interface PLItem {
    key: string;       // 고유 키
    label: string;     // 표시 이름
    isHeader: boolean; // 대분류 여부 (합계/소계 행)
    indent: number;    // 들여쓰기 레벨
    isCalculated: boolean; // 자동 계산 항목 여부
    section?: string;  // 섹션 그룹
    type?: 'amount' | 'ratio' | 'count' | 'unit'; // 값 유형
}

// 회사 보고서 형식 P&L 항목 목록 — 창원 사업부
export const CHANGWON_ITEMS: PLItem[] = [
    // ===== 매출/판가 =====
    { key: 'revenue', label: '매출액', isHeader: true, indent: 0, isCalculated: true, section: '매출/판가' },
    { key: 'salesFL', label: 'FL', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesTL', label: 'TL', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesFridge', label: '냉장고', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesOther', label: '기타', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },

    // ===== 재료비 =====
    { key: 'materialRatio', label: '실적재료비율', isHeader: false, indent: 0, isCalculated: false, section: '재료비', type: 'ratio' },
    { key: 'bomMaterialRatio', label: 'BOM재료비율', isHeader: false, indent: 0, isCalculated: false, section: '재료비', type: 'ratio' },
    { key: 'materialDiff', label: '차이', isHeader: false, indent: 0, isCalculated: true, section: '재료비', type: 'ratio' },
    { key: 'purchaseVI', label: '구매 VI', isHeader: false, indent: 0, isCalculated: false, section: '재료비' },
    { key: 'bfpVI', label: 'BFP VI', isHeader: false, indent: 0, isCalculated: false, section: '재료비' },
    { key: 'materialLoss', label: '재료Loss 금액', isHeader: false, indent: 0, isCalculated: false, section: '재료비' },

    // ===== 노무비 =====
    { key: 'headcount', label: '인원(평균)', isHeader: false, indent: 0, isCalculated: false, section: '노무비', type: 'count' },
    { key: 'laborCost', label: '인건비', isHeader: true, indent: 0, isCalculated: false, section: '노무비' },
    { key: 'laborRatio', label: '인건비율', isHeader: false, indent: 0, isCalculated: true, section: '노무비', type: 'ratio' },
    { key: 'revenuePerHead', label: '원당매출액', isHeader: false, indent: 0, isCalculated: false, section: '노무비', type: 'unit' },

    // ===== 경비 =====
    { key: 'overhead', label: '경비', isHeader: true, indent: 0, isCalculated: false, section: '경비' },
    { key: 'overheadRatio', label: '경비율', isHeader: false, indent: 0, isCalculated: true, section: '경비', type: 'ratio' },
    { key: 'electricity', label: '전력료', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'depreciation', label: '감가상각비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'repair', label: '수선비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'consumables', label: '소모품비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'transportation', label: '운반비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'commission', label: '지급수수료', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'rent', label: '지급임차료', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'overheadOther', label: '기타', isHeader: false, indent: 1, isCalculated: false, section: '경비' },

    // ===== 영업이익 =====
    { key: 'operatingProfit', label: '영업이익', isHeader: true, indent: 0, isCalculated: true, section: '영업이익' },
    { key: 'operatingProfitRatio', label: '(%)', isHeader: false, indent: 0, isCalculated: true, section: '영업이익', type: 'ratio' },

    // ===== 영업외 수지차 =====
    { key: 'nonOpBalance', label: '영외수지', isHeader: false, indent: 0, isCalculated: true, section: '영업외수지차' },
    { key: 'financeCost', label: '금융비용', isHeader: false, indent: 0, isCalculated: false, section: '영업외수지차' },

    // ===== 세전이익 =====
    { key: 'ebt', label: '세전이익', isHeader: true, indent: 0, isCalculated: true, section: '세전이익' },
    { key: 'ebtRatio', label: '(%)', isHeader: false, indent: 0, isCalculated: true, section: '세전이익', type: 'ratio' },
];

// 회사 보고서 형식 P&L 항목 목록 — 태국(DJETR) 사업부
export const THAILAND_ITEMS: PLItem[] = [
    // ===== 매출/판가 =====
    { key: 'revenue', label: '매출액 (순매출액)', isHeader: true, indent: 0, isCalculated: true, section: '매출/판가' },
    { key: 'salesCoverTop', label: 'Cover Assy, Top', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesTubOuter', label: 'Tub Assy, Outer', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesBaseCab', label: 'Base Cabinet 25', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesAir', label: 'Air', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesDryer', label: 'Dryer', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesOther', label: '기타 (CKD 외)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },

    // ===== 재료비 =====
    { key: 'materialRatio', label: '실적재료비율(%)', isHeader: false, indent: 0, isCalculated: false, section: '재료비', type: 'ratio' },
    { key: 'bomMaterialRatio', label: 'BOM재료비율(%)', isHeader: false, indent: 0, isCalculated: false, section: '재료비', type: 'ratio' },
    { key: 'lossRate', label: 'Loss율(%)', isHeader: false, indent: 0, isCalculated: false, section: '재료비', type: 'ratio' },
    { key: 'materialLoss', label: '재료Loss 금액', isHeader: false, indent: 0, isCalculated: false, section: '재료비' },
    { key: 'lgImpact', label: 'LG Impact', isHeader: false, indent: 1, isCalculated: false, section: '재료비' },
    { key: 'djVI', label: 'DJ VI', isHeader: false, indent: 1, isCalculated: false, section: '재료비' },
    { key: 'viGap', label: 'Gap', isHeader: false, indent: 1, isCalculated: false, section: '재료비' },

    // ===== 노무비 =====
    { key: 'headcount', label: '인원 (평균인원)', isHeader: false, indent: 0, isCalculated: false, section: '노무비', type: 'count' },
    { key: 'laborCost', label: '인건비', isHeader: true, indent: 0, isCalculated: false, section: '노무비' },
    { key: 'laborRatio', label: '인건비율(%)', isHeader: false, indent: 0, isCalculated: true, section: '노무비', type: 'ratio' },
    { key: 'revenuePerHead', label: '원당매출액', isHeader: false, indent: 0, isCalculated: false, section: '노무비', type: 'unit' },

    // ===== 경비 =====
    { key: 'overhead', label: '경비', isHeader: true, indent: 0, isCalculated: false, section: '경비' },
    { key: 'overheadRatio', label: '경비율(%)', isHeader: false, indent: 0, isCalculated: true, section: '경비', type: 'ratio' },
    { key: 'techFee', label: '기술료', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'electricity', label: '전력비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'transportation', label: '운반비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'importCost', label: '수입제비용', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'consumables', label: '소모품비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'depreciation', label: '감가상각비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'overheadOther', label: '기타', isHeader: false, indent: 1, isCalculated: false, section: '경비' },

    // ===== 영업이익 =====
    { key: 'operatingProfit', label: '영업이익', isHeader: true, indent: 0, isCalculated: true, section: '영업이익' },
    { key: 'operatingProfitRatio', label: '%', isHeader: false, indent: 0, isCalculated: true, section: '영업이익', type: 'ratio' },

    // ===== 영업외 수지 =====
    { key: 'financeCost', label: '금융비용', isHeader: false, indent: 1, isCalculated: false, section: '영업외수지' },
    { key: 'forexGainLoss', label: '외환차손익', isHeader: false, indent: 1, isCalculated: false, section: '영업외수지' },
    { key: 'nonOpOther', label: '기타', isHeader: false, indent: 1, isCalculated: false, section: '영업외수지' },

    // ===== 세전이익 =====
    { key: 'ebt', label: '세전이익 (%)', isHeader: true, indent: 0, isCalculated: true, section: '세전이익', type: 'ratio' },
];

// 회사 보고서 형식 P&L 항목 목록 — 베트남 사업부
export const VIETNAM_ITEMS: PLItem[] = [
    // ===== 매출/판가 =====
    { key: 'revenue', label: '매출액', isHeader: true, indent: 0, isCalculated: true, section: '매출/판가' },
    { key: 'salesWM', label: 'W/M', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesAIO', label: 'AIO', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesREF', label: 'REF', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesSMAC', label: 'SMAC', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesSF', label: 'SF', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesKEFICO', label: 'KEFICO', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesBallCoat', label: 'Ball coating', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },

    // ===== 재료비 =====
    { key: 'rawMaterialCost', label: '원재료비', isHeader: true, indent: 0, isCalculated: false, section: '재료비' },
    { key: 'materialRatio', label: '실적재료비율', isHeader: false, indent: 0, isCalculated: false, section: '재료비', type: 'ratio' },
    { key: 'bomMaterialRatio', label: 'BOM재료비율', isHeader: false, indent: 0, isCalculated: false, section: '재료비', type: 'ratio' },
    { key: 'materialDiff', label: '차이', isHeader: false, indent: 0, isCalculated: true, section: '재료비', type: 'ratio' },
    { key: 'vvci', label: 'VV/CI', isHeader: false, indent: 0, isCalculated: false, section: '재료비' },
    { key: 'materialLoss', label: '재료Loss 금액', isHeader: false, indent: 0, isCalculated: false, section: '재료비' },

    // ===== 노무비 =====
    { key: 'headcount', label: '인원', isHeader: false, indent: 0, isCalculated: false, section: '노무비', type: 'count' },
    { key: 'laborCost', label: '인건비', isHeader: true, indent: 0, isCalculated: false, section: '노무비' },
    { key: 'laborRatio', label: '인건비율', isHeader: false, indent: 0, isCalculated: true, section: '노무비', type: 'ratio' },
    { key: 'revenuePerHead', label: '원당매출액', isHeader: false, indent: 0, isCalculated: false, section: '노무비', type: 'unit' },

    // ===== 경비 =====
    { key: 'overhead', label: '경비', isHeader: true, indent: 0, isCalculated: false, section: '경비' },
    { key: 'overheadRatio', label: '경비율', isHeader: false, indent: 0, isCalculated: true, section: '경비', type: 'ratio' },
    { key: 'depreciation', label: '감가상각비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'techFee', label: '기술료', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'taxDues', label: '세금과공과', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'welfare', label: '복리후생비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'electricity', label: '전력비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'rent', label: '지급임차료', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'repair', label: '수선비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'commission', label: '지급수수료', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'transportation', label: '운반비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'officeSupplies', label: '사무용품비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'overheadOther', label: '기타', isHeader: false, indent: 1, isCalculated: false, section: '경비' },

    // ===== 영업이익 =====
    { key: 'operatingProfit', label: '영업이익', isHeader: true, indent: 0, isCalculated: true, section: '영업이익' },
    { key: 'operatingProfitRatio', label: '(%)', isHeader: false, indent: 0, isCalculated: true, section: '영업이익', type: 'ratio' },

    // ===== 영업외 수지차 =====
    { key: 'interestIncome', label: '이자수입', isHeader: false, indent: 1, isCalculated: false, section: '영업외\n수지차' },
    { key: 'forexGain', label: '외환차익', isHeader: false, indent: 1, isCalculated: false, section: '영업외\n수지차' },
    { key: 'interestExpense', label: '이자비용', isHeader: false, indent: 1, isCalculated: false, section: '영업외\n수지차' },
    { key: 'forexLoss', label: '외환차손', isHeader: false, indent: 1, isCalculated: false, section: '영업외\n수지차' },

    // ===== 세전이익 =====
    { key: 'ebt', label: '세전이익', isHeader: true, indent: 0, isCalculated: true, section: '세전이익' },
    { key: 'ebtRatio', label: '(%)', isHeader: false, indent: 0, isCalculated: true, section: '세전이익', type: 'ratio' },
];

// 멕시코 사업부 P&L 항목 — 가전/자동차 공통 사용
export const MEXICO_ITEMS: PLItem[] = [
    // ===== 매출/판가 =====
    { key: 'revenue', label: '매출액', isHeader: true, indent: 0, isCalculated: true, section: '매출/판가' },
    { key: 'salesFL', label: 'FL', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesTL', label: 'TL', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesOther', label: '기타', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },

    // ===== 재료비 =====
    { key: 'materialRatio', label: '실적재료비율', isHeader: false, indent: 0, isCalculated: false, section: '재료비', type: 'ratio' },
    { key: 'bomMaterialRatio', label: 'BOM재료비율', isHeader: false, indent: 0, isCalculated: false, section: '재료비', type: 'ratio' },
    { key: 'materialDiff', label: '차이', isHeader: false, indent: 0, isCalculated: true, section: '재료비', type: 'ratio' },
    { key: 'materialLoss', label: '재료Loss 금액', isHeader: false, indent: 0, isCalculated: false, section: '재료비' },

    // ===== 노무비 =====
    { key: 'headcount', label: '인원(평균)', isHeader: false, indent: 0, isCalculated: false, section: '노무비', type: 'count' },
    { key: 'laborCost', label: '인건비', isHeader: true, indent: 0, isCalculated: false, section: '노무비' },
    { key: 'laborRatio', label: '인건비율', isHeader: false, indent: 0, isCalculated: true, section: '노무비', type: 'ratio' },

    // ===== 경비 =====
    { key: 'overhead', label: '경비', isHeader: true, indent: 0, isCalculated: false, section: '경비' },
    { key: 'overheadRatio', label: '경비율', isHeader: false, indent: 0, isCalculated: true, section: '경비', type: 'ratio' },
    { key: 'depreciation', label: '감가상각비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'electricity', label: '전력비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'consumables', label: '소모품비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'transportation', label: '운반비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'overheadOther', label: '기타', isHeader: false, indent: 1, isCalculated: false, section: '경비' },

    // ===== 영업이익 =====
    { key: 'operatingProfit', label: '영업이익', isHeader: true, indent: 0, isCalculated: true, section: '영업이익' },
    { key: 'operatingProfitRatio', label: '(%)', isHeader: false, indent: 0, isCalculated: true, section: '영업이익', type: 'ratio' },

    // ===== 영업외수지 =====
    { key: 'financeCost', label: '금융비용', isHeader: false, indent: 1, isCalculated: false, section: '영업외수지' },
    { key: 'forexGainLoss', label: '외환차손익', isHeader: false, indent: 1, isCalculated: false, section: '영업외수지' },

    // ===== 세전이익 =====
    { key: 'ebt', label: '세전이익 (%)', isHeader: true, indent: 0, isCalculated: true, section: '세전이익', type: 'ratio' },
];

// 사업부별 P&L 항목 반환
export function getPLItemsForDivision(code: DivisionCode): PLItem[] {
    switch (code) {
        case 'thailand': return THAILAND_ITEMS;
        case 'vietnam': return VIETNAM_ITEMS;
        case 'mexico': return MEXICO_ITEMS;
        case 'changwon':
        default: return CHANGWON_ITEMS;
    }
}

// 하위 호환용 alias (통합 테이블 등에서 사용)
export const PL_ITEMS = CHANGWON_ITEMS;

// 모든 사업부의 아이템 맵 (동적 합산/판별용)
export const ALL_ITEMS_MAP: Record<string, PLItem> = {};
[...CHANGWON_ITEMS, ...THAILAND_ITEMS, ...VIETNAM_ITEMS, ...MEXICO_ITEMS].forEach(item => {
    if (!ALL_ITEMS_MAP[item.key]) {
        ALL_ITEMS_MAP[item.key] = item;
    }
});

// 월별 P&L 데이터
export interface MonthlyPLData {
    [key: string]: number; // PLItem.key -> 금액
}

// 사업부의 연간 데이터
export interface DivisionYearData {
    divisionCode: DivisionCode;
    year: number;
    exchangeRate: { [month: number]: number }; // 월별 환율
    monthly: { [month: number]: MonthlyPLData }; // 1~12월 실적 (해당 사업부 통합 데이터)
    targetMonthly: { [month: number]: MonthlyPLData }; // 1~12월 목표 (TD목표)
    yearlyTarget?: { // 연간 전체 TD목표 (대시보드 요약 표시용)
        revenue: number;
        operatingProfit: number;
    };
    subDivMonthly?: { [subKey: string]: { [month: number]: MonthlyPLData } }; // 서브디비전 개별 실적
    subDivTargetMonthly?: { [subKey: string]: { [month: number]: MonthlyPLData } }; // 서브디비전 개별 목표
}

// 전체 데이터 스토어
export interface DataStore {
    divisions: DivisionYearData[];
    updatedAt: string;
}

// ===== 유틸 함수들 =====

// 월 이름
export const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
export const QUARTER_NAMES = ['Q1 (1~3월)', 'Q2 (4~6월)', 'Q3 (7~9월)', 'Q4 (10~12월)'];
export const HALF_NAMES = ['상반기 (1~6월)', '하반기 (7~12월)'];

// 빈 월별 데이터 생성
export function createEmptyPLData(): MonthlyPLData {
    const data: MonthlyPLData = {};
    Object.keys(ALL_ITEMS_MAP).forEach(key => { data[key] = 0; });
    return data;
}

// 계산 항목 자동 산출
export function calculateDerivedFields(data: MonthlyPLData, preserveAmounts: boolean = false): MonthlyPLData {
    const result = { ...data };

    // 매출액 자동 산출 (하위 항목 - sales로 시작하는 모든 key의 합)
    let totalRevenue = 0;
    Object.keys(result).forEach(key => {
        if (key.startsWith('sales') && typeof result[key] === 'number') {
            totalRevenue += result[key] as number;
        }
    });
    // 하위 항목 합계가 실제로 0보다 클 때만 매출액을 덮어씀
    // (createEmptyPLData가 모든 sales* 키를 0으로 초기화하므로, 존재여부가 아닌 합계값으로 판단)
    if (totalRevenue > 0) {
        result.revenue = totalRevenue;
    }

    const revenue = result.revenue || 0;

    // 실적재료비율 및 재료비 산출
    let materialCost = result.rawMaterialCost || 0;

    if (preserveAmounts && result.operatingProfit !== undefined) {
        // 병합/집계된 데이터의 경우 (수동 입력 OP 등 보존), 재료비와 재료비율을 역산
        materialCost = revenue - (result.laborCost || 0) - (result.overhead || 0) - result.operatingProfit;
        result.materialRatio = revenue > 0 ? (materialCost / revenue) * 100 : 0;
    } else {
        // 재료비가 없고 비율이 있는 경우 재료비 계산
        if (materialCost === 0 && revenue > 0) {
            const ratio = result.materialRatio || (result.bomMaterialRatio || 0) + (result.materialDiff || 0);
            materialCost = (revenue * ratio) / 100;
            result.materialRatio = ratio;
        }
        // 재료비가 있고 비율이 없는 경우 비율 계산
        else if (materialCost > 0 && revenue > 0 && (!result.materialRatio || result.materialRatio === 0)) {
            result.materialRatio = (materialCost / revenue) * 100;
        }
    }

    // 계산된 재료비를 명시적으로 저장 (KPICards 등에서 직접 읽을 수 있게 함)
    result.materialCost = materialCost;

    // 차이 = 실적 - BOM
    if (result.bomMaterialRatio && result.materialRatio && (result.materialDiff === undefined || result.materialDiff === 0)) {
        result.materialDiff = result.materialRatio - result.bomMaterialRatio;
    }

    // 인건비율 = 인건비 / 매출액 * 100
    result.laborRatio = revenue > 0 ? ((result.laborCost || 0) / revenue) * 100 : 0;

    // 원당매출액 = 수동 입력값이 있으면 유지, 없으면 자동계산(매출액 / 인원)
    if (result.revenuePerHead === undefined || result.revenuePerHead === 0) {
        result.revenuePerHead = (result.headcount || 0) > 0
            ? revenue / (result.headcount || 1) : 0;
    }

    // 경비율 = 경비 / 매출액 * 100
    result.overheadRatio = revenue > 0 ? ((result.overhead || 0) / revenue) * 100 : 0;

    // 영업이익 = 매출액 - 재료비 - 노무비 - 경비
    // preserveAmounts일 때 기존 값이 있으면 유지, 없으면 계산
    if (preserveAmounts && result.operatingProfit) {
        // 직접 입력/보존된 영업이익 유지
    } else {
        result.operatingProfit = revenue - materialCost - (result.laborCost || 0) - (result.overhead || 0);
    }

    // 영업이익률
    result.operatingProfitRatio = revenue > 0 ? (result.operatingProfit / revenue) * 100 : 0;

    // 영업외수지 — 사업부별 항목 통합 계산
    // 창원: nonOpBalance = nonOpIncome - financeCost
    // 태국: forexGainLoss, nonOpOther, financeCost
    // 베트남: interestIncome, forexGain, interestExpense, forexLoss
    const nonOpIncome = (result.nonOpIncome || 0) + (result.interestIncome || 0) + (result.forexGain || 0);
    const nonOpExpense = (result.financeCost || 0) + (result.interestExpense || 0) + (result.forexLoss || 0);
    // 영업외수지는 항상 하위 항목에서 재계산 (정확한 합산을 위해)
    result.nonOpBalance = nonOpIncome - nonOpExpense + (result.forexGainLoss || 0) + (result.nonOpOther || 0);

    // 세전이익 = 영업이익 + 영외수지 (항상 재계산)
    result.ebt = (result.operatingProfit || 0) + (result.nonOpBalance || 0);

    // 세전이익률
    result.ebtRatio = revenue > 0 ? ((result.ebt || 0) / revenue) * 100 : 0;

    return result;
}

// 비율 계산 (매출 대비 %)
export function calcRatio(value: number, revenue: number): number {
    if (revenue === 0) return 0;
    return (value / revenue) * 100;
}

// 금액 포맷
export function formatAmount(value: number, unit: '백만' | '천' | '원' = '백만'): string {
    if (value === 0) return '-';
    const divider = unit === '백만' ? 1000000 : unit === '천' ? 1000 : 1;
    const formatted = (value / divider).toFixed(0);
    return Number(formatted).toLocaleString();
}

// 증감 포맷
export function formatChange(current: number, previous: number): { text: string; isPositive: boolean; percent: string } {
    const diff = current - previous;
    const percent = previous !== 0 ? ((diff / Math.abs(previous)) * 100).toFixed(1) : '-';
    return {
        text: diff >= 0 ? `+${formatAmount(diff)}` : formatAmount(diff),
        isPositive: diff >= 0,
        percent: percent === '-' ? '-' : `${diff >= 0 ? '+' : ''}${percent}%`,
    };
}

// 분기 데이터 집계
export function aggregateQuarter(monthly: { [month: number]: MonthlyPLData }, quarter: number): MonthlyPLData {
    const startMonth = (quarter - 1) * 3 + 1;
    const months = [startMonth, startMonth + 1, startMonth + 2];
    const result = createEmptyPLData();

    months.forEach(m => {
        const mData = monthly[m];
        if (mData) {
            Object.values(ALL_ITEMS_MAP).forEach(item => {
                if (!item.isCalculated) {
                    result[item.key] = (result[item.key] || 0) + (mData[item.key] || 0);
                }
            });
        }
    });

    return calculateDerivedFields(result, true);
}

// 반기 데이터 집계
export function aggregateHalf(monthly: { [month: number]: MonthlyPLData }, half: number): MonthlyPLData {
    const startMonth = (half - 1) * 6 + 1;
    const months = Array.from({ length: 6 }, (_, i) => startMonth + i);
    const result = createEmptyPLData();

    months.forEach(m => {
        const mData = monthly[m];
        if (mData) {
            Object.values(ALL_ITEMS_MAP).forEach(item => {
                if (!item.isCalculated) {
                    result[item.key] = (result[item.key] || 0) + (mData[item.key] || 0);
                }
            });
        }
    });

    return calculateDerivedFields(result, true);
}

// 연간 데이터 집계
export function aggregateYear(monthly: { [month: number]: MonthlyPLData }): MonthlyPLData {
    const result = createEmptyPLData();
    for (let m = 1; m <= 12; m++) {
        const mData = monthly[m];
        if (mData) {
            Object.values(ALL_ITEMS_MAP).forEach(item => {
                if (!item.isCalculated) {
                    result[item.key] = (result[item.key] || 0) + (mData[item.key] || 0);
                }
            });
        }
    }
    return calculateDerivedFields(result, true);
}

// P&L 데이터를 환율로 원화 환산
// exchangeRate: 현지통화 1단위 = X원 (예: 1바트 = 38.5원)
export function convertToKRW(data: MonthlyPLData, exchangeRate: number): MonthlyPLData {
    if (exchangeRate === 1 || exchangeRate === 0) return data; // KRW이거나 환율 없으면 그대로
    const result = createEmptyPLData();
    Object.values(ALL_ITEMS_MAP).forEach(item => {
        if (!item.isCalculated) {
            if (!item.type || item.type === 'amount') {
                result[item.key] = (data[item.key] || 0) * exchangeRate;
            } else {
                result[item.key] = data[item.key] || 0;
            }
        }
    });
    return calculateDerivedFields(result, true);
}

// 전 사업부 합산 (원화 환산 후 합산)
export function consolidateAllDivisions(store: { divisions: DivisionYearData[] }, year: number): DivisionYearData {
    const consolidated: DivisionYearData = {
        divisionCode: 'total',
        year,
        exchangeRate: {},
        monthly: {},
        targetMonthly: {},
    };

    for (let m = 1; m <= 12; m++) {
        const result = createEmptyPLData();
        const targetResult = createEmptyPLData();
        let hasData = false;
        let hasTargetData = false;

        store.divisions
            .filter(d => d.year === year && d.divisionCode !== 'total')
            .forEach(divData => {
                const rate = divData.exchangeRate[m] || 1;

                // 실적 합산
                const mData = divData.monthly[m];
                if (mData && (mData.revenue !== 0 || mData.laborCost !== 0)) {
                    hasData = true;
                    Object.values(ALL_ITEMS_MAP).forEach(item => {
                        if (!item.isCalculated) {
                            if (!item.type || item.type === 'amount') {
                                result[item.key] = (result[item.key] || 0) + ((mData[item.key] || 0) * rate);
                            } else if (item.type === 'count') {
                                result[item.key] = (result[item.key] || 0) + (mData[item.key] || 0);
                            }
                        }
                    });
                }

                // 목표 합산
                const tData = divData.targetMonthly?.[m];
                if (tData && (tData.revenue !== 0 || tData.laborCost !== 0)) {
                    hasTargetData = true;
                    Object.values(ALL_ITEMS_MAP).forEach(item => {
                        if (!item.isCalculated) {
                            if (!item.type || item.type === 'amount') {
                                targetResult[item.key] = (targetResult[item.key] || 0) + ((tData[item.key] || 0) * rate);
                            } else if (item.type === 'count') {
                                targetResult[item.key] = (targetResult[item.key] || 0) + (tData[item.key] || 0);
                            }
                        }
                    });
                }
            });

        if (hasData) {
            consolidated.monthly[m] = calculateDerivedFields(result, true);
        }
        if (hasTargetData) {
            consolidated.targetMonthly[m] = calculateDerivedFields(targetResult, true);
        }
    }

    return consolidated;
}

