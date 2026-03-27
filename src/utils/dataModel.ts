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
            { key: 'all', name: '전체' },
            { key: 'homeAppliance', name: '가전' },
            { key: 'automotive', name: '자동차' },
        ],
        subDivisionMode: 'tabs',
    },
];

// 합계 포함 전체 목록 (탭 표시용)
export const TOTAL_DIVISION: DivisionInfo = { code: 'total', name: '합계', nameEn: 'Total', flag: '📊', currency: 'KRW' };
export const DIVISIONS_WITH_TOTAL: DivisionInfo[] = [...DIVISIONS, TOTAL_DIVISION];

// 🇲🇽 멕시코 원화 환산용 직접 환율 (1 MXN = X 원, 환율 변동 시 이 값만 수정)
export const MXN_KRW_RATE = 82;

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
    // ===== 매출액 =====
    { key: 'revenue', label: '매출액 (순매출액)', isHeader: true, indent: 0, isCalculated: false, section: '매출/판가' },
    { key: 'salesCoverTop', label: 'Cover Assy, Top', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesTubOuter', label: 'Tub Assy, Outer', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesBaseCab', label: 'Base Cabinet 25', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesAir', label: 'Air', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesDryer', label: 'Dryer', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesOther', label: '기타 (CKD 외)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },

    // ===== 재료비 =====
    { key: 'materialRatio', label: '실적재료비율 (%)', isHeader: true, indent: 0, isCalculated: true, section: '재료비', type: 'ratio' },
    { key: 'bomMaterialRatio', label: 'BOM재료비율 (%)', isHeader: false, indent: 1, isCalculated: true, section: '재료비', type: 'ratio' },
    { key: 'lossRate', label: 'Loss율 (%)', isHeader: false, indent: 1, isCalculated: false, section: '재료비', type: 'ratio' },
    { key: 'materialLoss', label: '재료Loss 금액', isHeader: false, indent: 1, isCalculated: false, section: '재료비' },
    { key: 'viPerformance', label: 'VI실적', isHeader: true, indent: 1, isCalculated: false, section: '재료비' },
    { key: 'lgImpact', label: 'LG Impact', isHeader: false, indent: 2, isCalculated: false, section: '재료비' },
    { key: 'djVI', label: 'DJ VI', isHeader: false, indent: 2, isCalculated: false, section: '재료비' },
    { key: 'viGap', label: 'Gap', isHeader: false, indent: 2, isCalculated: false, section: '재료비' },
    { key: 'viRatio', label: '%', isHeader: false, indent: 2, isCalculated: true, section: '재료비', type: 'ratio' },

    // ===== 노무비 =====
    { key: 'headcount', label: '인원 (평균인원)', isHeader: true, indent: 0, isCalculated: false, section: '노무비', type: 'count' },
    { key: 'laborCost', label: '인건비', isHeader: false, indent: 1, isCalculated: false, section: '노무비' },
    { key: 'laborCostRatio', label: '인건비율 (%)', isHeader: false, indent: 1, isCalculated: true, section: '노무비', type: 'ratio' },
    { key: 'revenuePerHead', label: '원당생산액 (원)', isHeader: false, indent: 1, isCalculated: false, section: '노무비' },

    // ===== 경비 =====
    { key: 'overhead', label: '경비', isHeader: true, indent: 0, isCalculated: false, section: '경비' },
    { key: 'overheadRatio', label: '경비율 (%)', isHeader: false, indent: 0, isCalculated: true, section: '경비', type: 'ratio' },
    { key: 'techFee', label: '1) 기술료', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'techFeeRatio', label: '%', isHeader: false, indent: 2, isCalculated: true, section: '경비', type: 'ratio' },
    { key: 'electricity', label: '2) 전력비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'electricityRatio', label: '%', isHeader: false, indent: 2, isCalculated: true, section: '경비', type: 'ratio' },
    { key: 'transportation', label: '3) 운반비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'transportationRatio', label: '%', isHeader: false, indent: 2, isCalculated: true, section: '경비', type: 'ratio' },
    { key: 'importCost', label: '4) 수입제비용', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'importCostRatio', label: '%', isHeader: false, indent: 2, isCalculated: true, section: '경비', type: 'ratio' },
    { key: 'consumables', label: '5) 소모품비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'consumablesRatio', label: '%', isHeader: false, indent: 2, isCalculated: true, section: '경비', type: 'ratio' },
    { key: 'depreciation', label: '6) 감가상각비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'depreciationRatio', label: '%', isHeader: false, indent: 2, isCalculated: true, section: '경비', type: 'ratio' },
    { key: 'overheadOther', label: '7) 기타', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'overheadOtherRatio', label: '%', isHeader: false, indent: 2, isCalculated: true, section: '경비', type: 'ratio' },

    // ===== 영업이익 =====
    { key: 'operatingProfit', label: '영업이익', isHeader: true, indent: 0, isCalculated: false, section: '영업이익' },
    { key: 'operatingProfitRatio', label: '%', isHeader: false, indent: 0, isCalculated: true, section: '영업이익', type: 'ratio' },

    // ===== 영업외 수지 =====
    { key: 'nonOpBalance', label: '영업외수지', isHeader: true, indent: 0, isCalculated: false, section: '영업외수지' },
    { key: 'financeCost', label: '1) 금융비용', isHeader: false, indent: 1, isCalculated: false, section: '영업외수지' },
    { key: 'forexGainLoss', label: '2) 외환차손익', isHeader: false, indent: 1, isCalculated: false, section: '영업외수지' },
    { key: 'nonOpOther', label: '3) 기타', isHeader: false, indent: 1, isCalculated: false, section: '영업외수지' },

    // ===== 세전이익 =====
    { key: 'ebt', label: '세전이익', isHeader: true, indent: 0, isCalculated: false, section: '세전이익' },
    { key: 'ebtRatio', label: '%', isHeader: false, indent: 0, isCalculated: true, section: '세전이익', type: 'ratio' },
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

// 멕시코 사업부 공통 경비/이익 항목
const MEXICO_COMMON_COSTS: PLItem[] = [
    // ===== 재료비 =====
    { key: 'materialRatio', label: '실적재료비율', isHeader: false, indent: 0, isCalculated: false, section: '재료비', type: 'ratio' },
    { key: 'bomMaterialRatio', label: 'BOM재료비율', isHeader: false, indent: 0, isCalculated: false, section: '재료비', type: 'ratio' },
    { key: 'materialDiff', label: '차이', isHeader: false, indent: 0, isCalculated: true, section: '재료비', type: 'ratio' },
    { key: 'purchaseVI', label: '구매 VI', isHeader: false, indent: 0, isCalculated: false, section: '재료비' },
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
    { key: 'electricity', label: '전력비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'techFee', label: '기술료', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'importCost', label: '수입통관비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'repair', label: '수선비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'welfare', label: '복리후생비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'transportation', label: '운반비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'consumables', label: '소모품비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'commission', label: '지급수수료', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'rent', label: '지급임차료', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'packaging', label: '포장비', isHeader: false, indent: 1, isCalculated: false, section: '경비' },
    { key: 'overheadOther', label: '기타', isHeader: false, indent: 1, isCalculated: false, section: '경비' },

    // ===== 영업이익 =====
    { key: 'operatingProfit', label: '영업이익', isHeader: true, indent: 0, isCalculated: true, section: '영업이익' },
    { key: 'operatingProfitRatio', label: '영업이익율(%)', isHeader: false, indent: 0, isCalculated: true, section: '영업이익', type: 'ratio' },

    // ===== 영업외수지차 =====
    { key: 'nonOpBalance', label: '영외수지', isHeader: false, indent: 1, isCalculated: false, section: '영외수지차' },
    { key: 'financeCost', label: '-금융비용', isHeader: false, indent: 1, isCalculated: false, section: '영외수지차' },

    // ===== 세전이익 =====
    { key: 'ebtRatio', label: '세전이익(%)', isHeader: true, indent: 0, isCalculated: true, section: '세전이익', type: 'ratio' },
];

const MEXICO_COMMON_SALES_HEADER: PLItem[] = [
    { key: 'revenue', label: '매출액(MXN)', isHeader: true, indent: 0, isCalculated: true, section: '매출/판가' },
    { key: 'revenueUSD', label: '매출액(USD)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
];

export const MEXICO_HA_ITEMS: PLItem[] = [
    ...MEXICO_COMMON_SALES_HEADER,
    { key: 'salesFridge', label: '냉장고', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesOven', label: '오븐', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesOther', label: '기타', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    ...MEXICO_COMMON_COSTS,
];

export const MEXICO_AUTO_ITEMS: PLItem[] = [
    ...MEXICO_COMMON_SALES_HEADER,
    { key: 'salesHanon', label: '한온', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesSeoyeon', label: '서연이화', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesKefico', label: '현대 케피코', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesDonggwang', label: '동광 라모스', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesAmotech', label: '엠오토텍', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesKyungrim', label: '경림', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesMobis', label: '현대 모비스', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesYoungshin', label: '영신', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesOther', label: '기타수익', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    ...MEXICO_COMMON_COSTS,
];

export const MEXICO_ALL_ITEMS: PLItem[] = [
    ...MEXICO_COMMON_SALES_HEADER,
    { key: 'salesFridge', label: '냉장고(가전)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesOven', label: '오븐(가전)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesHanon', label: '한온(차)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesSeoyeon', label: '서연이화(차)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesKefico', label: '현대 케피코(차)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesDonggwang', label: '동광 라모스(차)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesAmotech', label: '엠오토텍(차)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesKyungrim', label: '경림(차)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesMobis', label: '현대 모비스(차)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesYoungshin', label: '영신(차)', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    { key: 'salesOther', label: '기타/기타수익', isHeader: false, indent: 1, isCalculated: false, section: '매출/판가' },
    ...MEXICO_COMMON_COSTS,
];

export const MEXICO_ITEMS = MEXICO_ALL_ITEMS;

// 사업부별 P&L 항목 반환
export function getPLItemsForDivision(code: DivisionCode, subCode?: string): PLItem[] {
    if (code === 'mexico') {
        if (subCode === 'homeAppliance') return MEXICO_HA_ITEMS;
        if (subCode === 'automotive') return MEXICO_AUTO_ITEMS;
        return MEXICO_ALL_ITEMS;
    }
    switch (code) {
        case 'thailand': return THAILAND_ITEMS;
        case 'vietnam': return VIETNAM_ITEMS;
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

// 상세 경비 내역 (태국사업부 등 상세 분석용)
export interface ExpenseDetail {
    account: string;  // 계정명 (예: 전력비)
    amount: number;   // 당월/누계 금액
    diff: number;     // 전년 대비 증감액
    reason: string;   // 증감 사유 (상세 내역)
}

// 월별 P&L 데이터
export interface MonthlyPLData {
    // 공통 숫자 필드 (TypeScript 연산 오류 방지용)
    revenue?: number;
    laborCost?: number;
    overhead?: number;
    operatingProfit?: number;
    ebt?: number;
    operatingProfitRatio?: number;
    ebtRatio?: number;
    materialCost?: number;
    rawMaterialCost?: number;
    materialRatio?: number;
    bomMaterialRatio?: number;
    headcount?: number;
    laborRatio?: number;
    overheadRatio?: number;
    nonOpBalance?: number;
    nonOpIncome?: number;
    nonOpExpense?: number;
    interestIncome?: number;
    forexGain?: number;
    interestExpense?: number;
    forexLoss?: number;
    lossRate?: number;
    materialLoss?: number;
    viPerformance?: number;
    lgImpact?: number;
    djVI?: number;
    viGap?: number;
    viRatio?: number;
    laborCostRatio?: number;
    revenuePerHead?: number;

    [key: string]: any; // PLItem.key -> 금액 또는 상세 내역
    expenseDetails?: ExpenseDetail[]; // 상세 경비 분석 결과 데이터
    manualOverrides?: string[]; // 수동으로 직접 입력한 필드 키 목록 (재계산 방지용)
}

// 월별 환율 세트 (실적, 목표, 전년)
export interface ExchangeRateSet {
    actual: number;
    target: number;
    prev: number;
}

// 사업부의 연간 데이터
export interface DivisionYearData {
    divisionCode: DivisionCode;
    year: number;
    exchangeRates: { [month: number]: ExchangeRateSet }; // 월별 환율 (다중 환율 대응)
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
    lastUpdated: string;   // ISO date string
    divisions: DivisionYearData[];
    _migrated_v10?: boolean; // v10 하드코딩 데이터 1회 마이그레이션 적용 여부 플래그
    _migrated_v11?: boolean; // v11 멕시코 데이터 1회 마이그레이션 적용 여부 플래그
    _migrated_v12?: boolean; // v12 멕시코 금액 수정 마이그레이션 플래그
    _migrated_v13?: boolean; // v13 멕시코 누락 데이터 항목 갱신 마이그레이션 플래그
    _migrated_v14?: boolean;
    _migrated_v15?: boolean;
    _migrated_v16?: boolean;
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
// manualOverrides: 사용자가 직접 수정한 필드 키 집합 (이 필드들은 절대 재계산하지 않음)
export function calculateDerivedFields(data: MonthlyPLData, preserveAmounts: boolean = false, manualOverrides?: Set<string>): MonthlyPLData {
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
    // [V10 Fix] 전사 합산 등에서 materialCost가 이미 합산되어 들어온 경우 최우선 사용
    let materialCost = result.materialCost || result.rawMaterialCost || 0;

    if (preserveAmounts && result.materialRatio !== undefined && result.materialRatio !== 0) {
        // [V9] 수동 입력된 재료비율을 절대적으로 신뢰 (공식 무시)
        materialCost = (revenue * result.materialRatio) / 100;
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

    // 계산된 재료비를 명시적으로 저장
    result.materialCost = materialCost;

    // 차이 = 실적 - BOM
    if (result.bomMaterialRatio && result.materialRatio && (result.materialDiff === undefined || result.materialDiff === 0)) {
        result.materialDiff = result.materialRatio - result.bomMaterialRatio;
    }

    // 인건비율 = 인건비 / 매출액 * 100
    if (preserveAmounts && result.laborCostRatio !== undefined && result.laborCostRatio !== 0) {
        // 수동 입력 보존
    } else {
        result.laborRatio = revenue > 0 ? ((result.laborCost || 0) / revenue) * 100 : 0;
        result.laborCostRatio = result.laborRatio; // 필드명 혼용 대응
    }

    // 원당매출액 = 수동 입력값이 있으면 유지, 없으면 자동계산(매출액 / 인원)
    if (result.revenuePerHead === undefined || result.revenuePerHead === 0) {
        result.revenuePerHead = (result.headcount || 0) > 0
            ? revenue / (result.headcount || 1) : 0;
    }

    // 경비율 = 경비 / 매출액 * 100
    if (preserveAmounts && result.overheadRatio !== undefined && result.overheadRatio !== 0) {
        // 수동 입력 보존
    } else {
        result.overheadRatio = revenue > 0 ? ((result.overhead || 0) / revenue) * 100 : 0;
    }

    // [V10] 경비 세부 비율 자동 계산
    const overheadKeys = ['techFee', 'electricity', 'transportation', 'importCost', 'consumables', 'depreciation', 'overheadOther'];
    overheadKeys.forEach(key => {
        const val = result[key] as number;
        if (typeof val === 'number') {
            result[`${key}Ratio`] = revenue > 0 ? (val / revenue) * 100 : 0;
        }
    });

    // === 수동 오버라이드 검사 함수: manualOverrides 또는 데이터 내의 manualOverrides 배열 체크 ===
    const isManual = (key: string) =>
        manualOverrides?.has(key) === true ||
        result.manualOverrides?.includes(key) === true;

    // 영업이익 = 매출액 - 재료비 - 노무비 - 경비
    if (isManual('operatingProfit') || (preserveAmounts && result.operatingProfit !== undefined && result.operatingProfit !== 0)) {
        // 수동 입력값 무조건 유지
    } else {
        result.operatingProfit = revenue - materialCost - (result.laborCost || 0) - (result.overhead || 0);
    }

    // 영업이익률
    if (isManual('operatingProfitRatio') || (preserveAmounts && result.operatingProfitRatio !== undefined && result.operatingProfitRatio !== 0)) {
        // 수동 입력 보존
    } else {
        result.operatingProfitRatio = revenue > 0 ? ((result.operatingProfit || 0) / revenue) * 100 : 0;
    }

    // 영업외수지
    if (isManual('nonOpBalance') || (preserveAmounts && result.nonOpBalance !== undefined && result.nonOpBalance !== 0)) {
        // 수동 입력값 보존
    } else {
        const nonOpIncome = (result.nonOpIncome || 0) + (result.interestIncome || 0) + (result.forexGain || 0);
        const nonOpExpense = (result.financeCost || 0) + (result.interestExpense || 0) + (result.forexLoss || 0);
        result.nonOpBalance = nonOpIncome - nonOpExpense + (result.forexGainLoss || 0) + (result.nonOpOther || 0);
    }

    // 세전이익 = 영업이익 + 영외수지
    if (isManual('ebt') || (preserveAmounts && result.ebt !== undefined && result.ebt !== 0)) {
        // 수동 입력값 보존
    } else {
        result.ebt = (result.operatingProfit || 0) + (result.nonOpBalance || 0);
    }

    // 세전이익률
    if (isManual('ebtRatio') || (preserveAmounts && result.ebtRatio !== undefined && result.ebtRatio !== 0)) {
        // 수동 입력 보존
    } else {
        result.ebtRatio = revenue > 0 ? ((result.ebt || 0) / revenue) * 100 : 0;
    }

    return result;
}

// 비율 계산 (매출 대비 %)
export function calcRatio(value: number, revenue: number): number {
    if (revenue === 0) return 0;
    return (value / revenue) * 100;
}

// 금액 포맷 (currency에 따라 소수점 처리 다름)
export function formatAmount(value: number, unit: '백만' | '천' | '원' = '백만', currency: string = 'KRW'): string {
    if (value === 0) return '-';
    const divider = unit === '백만' ? 1000000 : unit === '천' ? 1000 : 1;
    const val = value / divider;

    // 외화(THB 등)는 백만 단위일 때 소수점 1자리 표시 (이미지 싱크: 452.5)
    // KRW은 소수점 없이 정수로 표시
    const decimals = (currency !== 'KRW' && unit === '백만') ? 1 : 0;

    return val.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
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
        exchangeRates: {},
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
                const rates = divData.exchangeRates[m] || { actual: 1, target: 1, prev: 1 };
                const isMexico = divData.divisionCode === 'mexico';

                // 🇲🇽 멕시코: 직접 MXN→KRW 환율 적용
                const actualRate = isMexico ? MXN_KRW_RATE : (rates.actual || 1);
                const targetRate = isMexico ? MXN_KRW_RATE : (rates.target || 1);

                // 실적 합산
                const mData = divData.monthly[m];
                if (mData && (mData.revenue !== 0 || mData.laborCost !== 0)) {
                    hasData = true;
                    Object.values(ALL_ITEMS_MAP).forEach(item => {
                        if (!item.isCalculated) {
                            if (!item.type || item.type === 'amount') {
                                result[item.key] = (result[item.key] || 0) + ((mData[item.key] || 0) * actualRate);
                            } else if (item.type === 'count') {
                                result[item.key] = (result[item.key] || 0) + (mData[item.key] || 0);
                            }
                        }
                    });

                    // 파생 금액 수동 합산 (비율 기반 일괄 계산 시 다른 항목 누락에 따른 오차/왜곡 방지)
                    result.materialCost = (result.materialCost || 0) + ((mData.materialCost || 0) * actualRate);
                    result.operatingProfit = (result.operatingProfit || 0) + ((mData.operatingProfit || 0) * actualRate);
                    result.ebt = (result.ebt || 0) + ((mData.ebt || 0) * actualRate);
                    result.nonOpBalance = (result.nonOpBalance || 0) + ((mData.nonOpBalance || 0) * actualRate);
                    result.revenue = (result.revenue || 0) + ((mData.revenue || 0) * actualRate);
                }

                // 목표 합산
                const tData = divData.targetMonthly?.[m];
                if (tData && (tData.revenue !== 0 || tData.laborCost !== 0)) {
                    hasTargetData = true;
                    Object.values(ALL_ITEMS_MAP).forEach(item => {
                        if (!item.isCalculated) {
                            if (!item.type || item.type === 'amount') {
                                targetResult[item.key] = (targetResult[item.key] || 0) + ((tData[item.key] || 0) * targetRate);
                            } else if (item.type === 'count') {
                                targetResult[item.key] = (targetResult[item.key] || 0) + (tData[item.key] || 0);
                            }
                        }
                    });

                    // 목표 파생 금액 수동 합산
                    targetResult.materialCost = (targetResult.materialCost || 0) + ((tData.materialCost || 0) * targetRate);
                    targetResult.operatingProfit = (targetResult.operatingProfit || 0) + ((tData.operatingProfit || 0) * targetRate);
                    targetResult.ebt = (targetResult.ebt || 0) + ((tData.ebt || 0) * targetRate);
                    targetResult.nonOpBalance = (targetResult.nonOpBalance || 0) + ((tData.nonOpBalance || 0) * targetRate);
                    targetResult.revenue = (targetResult.revenue || 0) + ((tData.revenue || 0) * targetRate);
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

