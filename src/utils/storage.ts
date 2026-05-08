/**
 * localStorage를 사용한 데이터 저장/로드 유틸리티
 */
import type { DataStore, DivisionYearData, DivisionCode } from './dataModel';
import { calculateDerivedFields, createEmptyPLData, DIVISIONS_WITH_TOTAL } from './dataModel';
import { syncToCloud, fetchFromCloud } from './supabaseClient';



// (중복 loadData 삭제됨)

// 데이터 저장 (Supabase 전용)
export async function saveData(store: DataStore): Promise<boolean> {
    try {
        // 기존 localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); 완전 삭제!
        return await syncToCloud(store);
    } catch (e) {
        console.error('Failed to save data to Supabase:', e);
        return false;
    }
}

// 🔧 데이터 마이그레이션 — 어떤 소스(클라우드/로컬/기본)든 플래그가 없으면 1회만 적용
function applyMigrations(store: DataStore): DataStore {
    // [긴급 에러 방어망]: 클라우드 DB 등에서 로드된 날것(raw)의 데이터에 필수 구조가 누락되었을 경우 초기화 보장
    if (!store.divisions) store.divisions = [];
    store.divisions.forEach(div => {
        if (!div.monthly) div.monthly = {};
        if (!div.targetMonthly) div.targetMonthly = {};
        if (!div.exchangeRates) div.exchangeRates = {};
        if (!div.subDivMonthly) div.subDivMonthly = {};
        if (!div.subDivTargetMonthly) div.subDivTargetMonthly = {};

        // 레거시 'exchangeRate'(단일 숫자) 속성이 남아있는 경우, 신형 다중 월 'exchangeRates' 구조로 안전 보장(Migrate)
        if ('exchangeRate' in div && typeof (div as any).exchangeRate === 'number') {
            const rate = (div as any).exchangeRate;
            div.exchangeRates[1] = { actual: rate, target: rate, prev: rate };
            delete (div as any).exchangeRate;
        }

        // [긴급 수치 보정]: 베트남 898억 등 환율 1.0 오독 방지 및 '25년 환율 누락 방지
        if (div.year === 2025 || div.year === 2026) {
            for (let m = 1; m <= 12; m++) {

            }
        }

        // 🚨 [데이터 파싱 전처리]: 멕시코 사업부 EBT(세전이익) 결측치 절대값 직접 계산
        // (멕시코는 % 수치만 있고 절대값이 없어 환율이 비율에 곱해지는 오류의 근본 원인을 스토어 적재 단계에서 차단)
        if (div.divisionCode === 'mexico') {
            const fixEbt = (m: any) => {
                if (m) {
                    m.ebt = Number(m.operatingProfit || 0) + Number(m.nonOpBalance || 0);
                }
            };
            Object.values(div.monthly).forEach(fixEbt);
            Object.values(div.targetMonthly).forEach(fixEbt);
            Object.values(div.subDivMonthly).forEach(sub => Object.values(sub as any).forEach(fixEbt));
            Object.values(div.subDivTargetMonthly).forEach(sub => Object.values(sub as any).forEach(fixEbt));
        }
    });
    store.divisions.forEach(div => {
        if (!store._migrated_v10) {
            if (div.divisionCode === 'thailand') {
                if (div.year === 2026) {
                    // 🎯 1월 실적('26실적) PPT 이미지 100% 셀 싱크
                    const thActual = {
                        revenue: 452500000,
                        salesCoverTop: 388900000,
                        salesTubOuter: 18600000,
                        salesBaseCab: 0,
                        salesAir: 3200000,
                        salesDryer: 20900000,
                        salesOther: 20900000,
                        materialRatio: 87.11,
                        lossReflected: 87.11,
                        bomMaterialRatio: 86.70,
                        lossRate: 0.41,
                        materialLoss: 1800000,
                        lgImpact: 10100000,
                        djVI: 11600000,
                        viGap: -1500000,
                        viRatio: -0.3,
                        headcount: 462,
                        laborCost: 18200000,
                        laborCostRatio: 4.0,
                        revenuePerHead: 24.8,
                        overhead: 19100000,
                        overheadRatio: 4.2,
                        techFee: 5500000,
                        techFeeRatio: 1.2,
                        electricity: 2500000,
                        electricityRatio: 0.5,
                        transportation: 2500000,
                        transportationRatio: 0.5,
                        importCost: 1200000,
                        importCostRatio: 0.3,
                        consumables: 1900000,
                        consumablesRatio: 0.4,
                        depreciation: 2100000,
                        depreciationRatio: 0.5,
                        overheadOther: 3200000,
                        overheadOtherRatio: 0.7,
                        operatingProfit: 17800000,
                        operatingProfitRatio: 3.9,
                        nonOpBalance: 1200000,
                        financeCost: -300000,
                        forexGainLoss: 800000,
                        nonOpOther: 800000,
                        ebt: 19000000,
                        ebtRatio: 4.2,
                    };
                    div.monthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...thActual } as any, true);

                    // 🎯 1월 TD 목표('26목표) PPT 이미지 100% 셀 싱크
                    const thTarget = {};
                    if (!div.targetMonthly) div.targetMonthly = {};
                    div.targetMonthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...thTarget } as any, true);
                }

                if (div.year === 2025) {
                    // 🎯 전년('25실적) PPT 이미지 100% 셀 싱크
                    const thPrev = {
                        revenue: 523500000,
                        salesCoverTop: 439100000,
                        salesTubOuter: 11300000,
                        salesBaseCab: 300000,
                        salesAir: 5000000,
                        salesDryer: 9100000,
                        salesOther: 58700000,
                        materialRatio: 89.97,
                        lossReflected: 89.97,
                        bomMaterialRatio: 89.32,
                        lossRate: 0.65,
                        materialLoss: 3400000,
                        viPerformance: 0,
                        viGap: 400000,
                        viRatio: 0.1,
                        headcount: 540,
                        laborCost: 18800000,
                        laborCostRatio: 3.6,
                        revenuePerHead: 27.8,
                        overhead: 24600000,
                        overheadRatio: 4.7,
                        techFee: 6200000,
                        techFeeRatio: 1.2,
                        electricity: 3300000,
                        electricityRatio: 0.6,
                        transportation: 2800000,
                        transportationRatio: 0.5,
                        importCost: 3100000,
                        importCostRatio: 0.6,
                        consumables: 2400000,
                        consumablesRatio: 0.5,
                        depreciation: 2100000,
                        depreciationRatio: 0.4,
                        overheadOther: 5100000,
                        overheadOtherRatio: 1.0,
                        operatingProfit: 7600000,
                        operatingProfitRatio: 1.5,
                        nonOpBalance: -900000,
                        financeCost: -300000,
                        forexGainLoss: 500000,
                        nonOpOther: -1100000,
                        ebt: 6700000,
                        ebtRatio: 1.3,
                    };
                    div.monthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...thPrev } as any, true);
                }
            }

            // ===== 🇻🇳 베트남 사업부 — 생산1실(prod1) 데이터 마이그레이션 =====
            if (div.divisionCode === 'vietnam') {
                if (div.year === 2026) {
                    // 🎯 생산1실 2026년 1월 실적 ('26실적) — 이미지 100% 셀 싱크
                    const vnProd1Actual = {
                        revenue: 29795000000,
                        salesAIO: 9613000000,
                        salesREF: 20182000000,
                        rawMaterialCost: 19165000000,
                        materialRatio: 64.3,
                        bomMaterialRatio: 63.2,
                        materialDiff: 1.1,
                        vvci: 1920000000,
                        materialLoss: 283000000,
                        headcount: 234,
                        laborCost: 4389000000,
                        laborRatio: 14.7,
                        revenuePerHead: 6.8,
                        overhead: 5008000000,
                        overheadRatio: 16.8,
                        depreciation: 2216000000,
                        techFee: 828000000,
                        taxDues: 0,
                        welfare: 573000000,
                        electricity: 697000000,
                        rent: 290000000,
                        repair: 45000000,
                        commission: 26000000,
                        transportation: 7000000,
                        officeSupplies: 47000000,
                        overheadOther: 279000000,
                        operatingProfit: 1234000000,
                        operatingProfitRatio: 4.1,
                        interestIncome: 1000000,
                        forexGain: 24000000,
                        interestExpense: 129000000,
                        forexLoss: 1000000,
                        ebt: 1129000000,
                        ebtRatio: 3.8,
                    };
                    if (!div.subDivMonthly) div.subDivMonthly = {};
                    if (!div.subDivMonthly['prod1']) div.subDivMonthly['prod1'] = {};
                    div.subDivMonthly['prod1'][1] = calculateDerivedFields({ ...createEmptyPLData(), ...vnProd1Actual } as any, true);

                    // 🎯 생산1실 2026년 1월 TD목표 — 이미지 100% 셀 싱크
                    const vnProd1Target = {};
                    if (!div.subDivTargetMonthly) div.subDivTargetMonthly = {};
                    if (!div.subDivTargetMonthly['prod1']) div.subDivTargetMonthly['prod1'] = {};
                    div.subDivTargetMonthly['prod1'][1] = calculateDerivedFields({ ...createEmptyPLData(), ...vnProd1Target } as any, true);
                }

                if (div.year === 2025) {
                    // 🎯 생산1실 전년 — 당월(26.01월) '전년' 컬럼 100% 셀 싱크
                    const vnProd1Prev = {
                        revenue: 24945000000,        // 24,945
                        salesAIO: 3225000000,         // 3,225
                        salesREF: 21720000000,        // 21,720
                        rawMaterialCost: 17061000000, // 17,061
                        materialRatio: 68.4,
                        bomMaterialRatio: 66.8,
                        materialDiff: 1.6,
                        vvci: 435000000,              // 435
                        materialLoss: 0,
                        headcount: 228,               // 228
                        laborCost: 3752000000,         // 3,752
                        laborRatio: 15.0,
                        revenuePerHead: 6.6,
                        overhead: 4633000000,          // 4,633
                        overheadRatio: 18.6,
                        depreciation: 1980000000,      // 1,980
                        techFee: 683000000,            // 683
                        taxDues: 213000000,            // 213
                        welfare: 500000000,            // 500
                        electricity: 534000000,        // 534
                        rent: 304000000,               // 304
                        repair: 61000000,              // 61
                        commission: 38000000,          // 38
                        transportation: 5000000,       // 5
                        officeSupplies: 59000000,      // 59
                        overheadOther: 195000000,      // 195
                        operatingProfit: -501000000,   // -501
                        operatingProfitRatio: -2.0,
                        interestIncome: 1000000,       // 1
                        forexGain: 51000000,           // 51
                        interestExpense: 121000000,    // 121
                        forexLoss: 0,                  // 0
                        ebt: -571000000,               // -571
                        ebtRatio: -2.3,
                    };
                    if (!div.subDivMonthly) div.subDivMonthly = {};
                    if (!div.subDivMonthly['prod1']) div.subDivMonthly['prod1'] = {};
                    div.subDivMonthly['prod1'][1] = calculateDerivedFields({ ...createEmptyPLData(), ...vnProd1Prev } as any, true);
                }

                // ===== 생산2실(prod2) =====
                if (div.year === 2026) {
                    // 🎯 생산2실 2026년 1월 실적 — 이미지 100% 셀 싱크
                    const vnProd2Actual = {
                        revenue: 56748000000,
                        salesWM: 56748000000,
                        rawMaterialCost: 33391000000,
                        materialRatio: 58.8,
                        bomMaterialRatio: 57.6,
                        materialDiff: 1.2,
                        materialLoss: 793000000,
                        headcount: 260,
                        laborCost: 6837000000,
                        laborRatio: 12.0,
                        revenuePerHead: 8.3,
                        overhead: 5975000000,
                        overheadRatio: 10.5,
                        depreciation: 1399000000,
                        techFee: 1592000000,
                        taxDues: 0,
                        welfare: 927000000,
                        electricity: 1071000000,
                        rent: 455000000,
                        repair: 77000000,
                        commission: 5000000,
                        transportation: 50000000,
                        officeSupplies: 45000000,
                        overheadOther: 355000000,
                        operatingProfit: 10546000000,
                        operatingProfitRatio: 18.6,
                        interestIncome: 3000000,
                        forexGain: 45000000,
                        interestExpense: 248000000,
                        forexLoss: 1000000,
                        ebt: 10345000000,
                        ebtRatio: 18.2,
                    };
                    if (!div.subDivMonthly) div.subDivMonthly = {};
                    if (!div.subDivMonthly['prod2']) div.subDivMonthly['prod2'] = {};
                    div.subDivMonthly['prod2'][1] = calculateDerivedFields({ ...createEmptyPLData(), ...vnProd2Actual } as any, true);

                    // 🎯 생산2실 2026년 1월 TD목표 — 이미지 100% 셀 싱크
                    const vnProd2Target = {};
                    if (!div.subDivTargetMonthly) div.subDivTargetMonthly = {};
                    if (!div.subDivTargetMonthly['prod2']) div.subDivTargetMonthly['prod2'] = {};
                    div.subDivTargetMonthly['prod2'][1] = calculateDerivedFields({ ...createEmptyPLData(), ...vnProd2Target } as any, true);
                }

                if (div.year === 2025) {
                    // 🎯 생산2실 전년 — 당월(26.01월) '전년' 컬럼 100% 셀 싱크
                    const vnProd2Prev = {
                        revenue: 48398000000,
                        salesWM: 48398000000,
                        rawMaterialCost: 27616000000,
                        materialRatio: 57.1,
                        bomMaterialRatio: 55.7,
                        materialDiff: 1.4,
                        materialLoss: 1097000000,
                        headcount: 303,
                        laborCost: 6160000000,
                        laborRatio: 12.7,
                        revenuePerHead: 7.9,
                        overhead: 5526000000,
                        overheadRatio: 11.4,
                        depreciation: 1230000000,
                        techFee: 1325000000,
                        taxDues: 853000000,
                        welfare: 969000000,
                        electricity: 669000000,
                        rent: 388000000,
                        repair: 89000000,
                        commission: 1000000,
                        transportation: 3000000,
                        officeSupplies: 76000000,
                        overheadOther: 171000000,
                        operatingProfit: 9097000000,
                        operatingProfitRatio: 18.8,
                        interestIncome: 2000000,
                        forexGain: 105000000,
                        interestExpense: 235000000,
                        forexLoss: 0,
                        ebt: 8968000000,
                        ebtRatio: 18.5,
                    };
                    if (!div.subDivMonthly) div.subDivMonthly = {};
                    if (!div.subDivMonthly['prod2']) div.subDivMonthly['prod2'] = {};
                    div.subDivMonthly['prod2'][1] = calculateDerivedFields({ ...createEmptyPLData(), ...vnProd2Prev } as any, true);
                }

                // ===== 생산3실(prod3) =====
                if (div.year === 2026) {
                    // 🎯 생산3실 2026년 1월 실적 — 이미지 100% 셀 싱크
                    const vnProd3Actual = {
                        revenue: 3274000000,
                        salesSMAC: 1627000000,
                        salesSF: 971000000,
                        salesKEFICO: 0,
                        salesBallCoat: 676000000,
                        rawMaterialCost: 914000000,
                        materialRatio: 35.2,
                        bomMaterialRatio: 34.6,
                        materialLoss: 124000000,
                        headcount: 48,
                        laborCost: 1266000000,
                        laborRatio: 38.7,
                        revenuePerHead: 2.6,
                        overhead: 1035000000,
                        overheadRatio: 31.6,
                        depreciation: 547000000,
                        techFee: 92000000,
                        taxDues: 0,
                        welfare: 194000000,
                        electricity: 77000000,
                        rent: 17000000,
                        repair: 9000000,
                        commission: 3000000,
                        transportation: 12000000,
                        officeSupplies: 7000000,
                        overheadOther: 77000000,
                        operatingProfit: 58000000,
                        operatingProfitRatio: 1.8,
                        interestIncome: 0,
                        forexGain: 7000000,
                        interestExpense: 14000000,
                        forexLoss: 12000000,
                        ebt: 39000000,
                        ebtRatio: 1.2,
                    };
                    if (!div.subDivMonthly) div.subDivMonthly = {};
                    if (!div.subDivMonthly['prod3']) div.subDivMonthly['prod3'] = {};
                    div.subDivMonthly['prod3'][1] = calculateDerivedFields({ ...createEmptyPLData(), ...vnProd3Actual } as any, true);

                    // 🎯 생산3실 2026년 1월 TD목표 — 이미지 100% 셀 싱크
                    const vnProd3Target = {};
                    if (!div.subDivTargetMonthly) div.subDivTargetMonthly = {};
                    if (!div.subDivTargetMonthly['prod3']) div.subDivTargetMonthly['prod3'] = {};
                    div.subDivTargetMonthly['prod3'][1] = calculateDerivedFields({ ...createEmptyPLData(), ...vnProd3Target } as any, true);
                }

                if (div.year === 2025) {
                    // 🎯 생산3실 전년 — 당월(26.01월) '전년' 컬럼 100% 셀 싱크
                    const vnProd3Prev = {
                        revenue: 4217000000,
                        salesSMAC: 1881000000,
                        salesSF: 1385000000,
                        salesKEFICO: 0,
                        salesBallCoat: 951000000,
                        rawMaterialCost: 1317000000,
                        materialRatio: 31.2,
                        bomMaterialRatio: 39.3,
                        materialLoss: 30000000,
                        headcount: 55,
                        laborCost: 1540000000,
                        laborRatio: 36.5,
                        revenuePerHead: 3.4,
                        overhead: 1392000000,
                        overheadRatio: 33.0,
                        depreciation: 704000000,
                        techFee: 116000000,
                        taxDues: 31000000,
                        welfare: 316000000,
                        electricity: 101000000,
                        rent: 52000000,
                        repair: 10000000,
                        commission: 4000000,
                        transportation: 6000000,
                        officeSupplies: 4000000,
                        overheadOther: 48000000,
                        operatingProfit: 32000000,
                        operatingProfitRatio: -0.8,
                        interestIncome: 0,
                        forexGain: 7000000,
                        interestExpense: 21000000,
                        forexLoss: 48000000,
                        ebt: -94000000,
                        ebtRatio: -2.2,
                    };
                    if (!div.subDivMonthly) div.subDivMonthly = {};
                    if (!div.subDivMonthly['prod3']) div.subDivMonthly['prod3'] = {};
                    div.subDivMonthly['prod3'][1] = calculateDerivedFields({ ...createEmptyPLData(), ...vnProd3Prev } as any, true);
                }

                // ===== 전체(all) = prod1 + prod2 + prod3 자동 합산 =====
                const subKeys = ['prod1', 'prod2', 'prod3'];
                // 실적 합산
                if (div.subDivMonthly) {
                    const totalActual = createEmptyPLData();
                    let hasData = false;
                    subKeys.forEach(key => {
                        const subData = div.subDivMonthly?.[key]?.[1];
                        if (subData) {
                            hasData = true;
                            Object.entries(subData).forEach(([k, val]) => {
                                if (typeof val === 'number' && !k.toLowerCase().includes('ratio') && k !== 'materialDiff' && k !== 'revenuePerHead') {
                                    totalActual[k] = (totalActual[k] || 0) + val;
                                }
                            });
                        }
                    });
                    if (hasData) div.monthly[1] = calculateDerivedFields(totalActual, true);
                }
                // 목표 합산
                if (div.subDivTargetMonthly) {
                    const totalTarget = createEmptyPLData();
                    let hasData = false;
                    subKeys.forEach(key => {
                        const subData = div.subDivTargetMonthly?.[key]?.[1];
                        if (subData) {
                            hasData = true;
                            Object.entries(subData).forEach(([k, val]) => {
                                if (typeof val === 'number' && !k.toLowerCase().includes('ratio') && k !== 'materialDiff' && k !== 'revenuePerHead') {
                                    totalTarget[k] = (totalTarget[k] || 0) + val;
                                }
                            });
                        }
                    });
                    if (hasData) {
                        if (!div.targetMonthly) div.targetMonthly = {};
                        div.targetMonthly[1] = calculateDerivedFields(totalTarget, true);
                    }
                }
            } // closes if (div.divisionCode === 'vietnam')
        } // closes if (!store._migrated_v10)




    });

    if (!store._migrated_v18) {
        store._migrated_v18 = true;
    }


    // ===== 연간 TD 목표값(KRW) — 항상 강제 적용 (클라우드 데이터 오염 방지) =====
    store.divisions.forEach(div => {
        if (div.year === 2026) {
            if (!div.yearlyTarget) {
                div.yearlyTarget = { revenue: 0, operatingProfit: 0 };
            }

            if (div.divisionCode === 'changwon') {
                div.yearlyTarget.revenue = 110500000000;
                div.yearlyTarget.operatingProfit = 2500000000;
            } else if (div.divisionCode === 'vietnam') {
                div.yearlyTarget.revenue = 55000000000;
                div.yearlyTarget.operatingProfit = 7500000000;
            } else if (div.divisionCode === 'thailand') {
                // 태국: 2,200억 / 60억
                div.yearlyTarget.revenue = 220000000000;
                div.yearlyTarget.operatingProfit = 6000000000;
            } else if (div.divisionCode === 'mexico') {
                // 멕시코: 369억 / 18.5억
                div.yearlyTarget.revenue = 36900000000;
                div.yearlyTarget.operatingProfit = 1850000000;
            }
        }
    });
    store._migrated_v16 = true;

    // 마이그레이션 완료 플래그 설정
    store._migrated_v10 = true;
    store._migrated_v11 = true;
    store._migrated_v12 = true;
    store._migrated_v13 = true;
    store._migrated_v14 = true;
    store._migrated_v15 = true;
    store._migrated_v16 = true;
    return store;
}

// 🔧 자동 복원 로직: 과거 버그로 인해 잘못 합산된 채 클라우드에 영구 저장된 '전체' 탭의 합계 데이터를
// 서브디비전(가전, 자동차 등) 실데이터를 긁어모아 로드 시점에 즉시 완벽하게 수학적 재계산하여 덮어씌움
function autoRepairAggregations(store: DataStore): DataStore {
    const repaired = { ...store };
    repaired.divisions.forEach(div => {
        const divInfo = DIVISIONS_WITH_TOTAL.find(d => d.code === div.divisionCode);
        if (divInfo && divInfo.subDivisions && divInfo.subDivisionMode === 'tabs') {
            for (let month = 1; month <= 12; month++) {
                // 실적 자동 복구
                if (div.subDivMonthly) {
                    const totalActual = createEmptyPLData();
                    let hasData = false;
                    let manualOverrides = new Set<string>();
                    divInfo.subDivisions.forEach(sub => {
                        if (sub.key === 'all') return;
                        const subData = div.subDivMonthly?.[sub.key]?.[month];
                        if (subData && Object.keys(subData).length > 0) {
                            hasData = true;
                            
                            // 🚑 강제 힐링: 하위 서브데이터 자체에 대해서도 역산 공식(calculateDerivedFields) 적용
                            Object.assign(subData, calculateDerivedFields(subData, true));

                            if (subData.manualOverrides) subData.manualOverrides.forEach(m => manualOverrides.add(m));
                            Object.entries(subData).forEach(([k, val]) => {
                                if (typeof val === 'number' && !k.toLowerCase().includes('ratio') && k !== 'materialDiff' && k !== 'revenuePerHead') {
                                    totalActual[k] = (totalActual[k] || 0) + val;
                                }
                            });
                        }
                    });
                    if (hasData) {
                        totalActual.manualOverrides = Array.from(manualOverrides);
                        div.monthly[month] = calculateDerivedFields(totalActual, true);
                    }
                }
                // 목표 자동 복구
                if (div.subDivTargetMonthly) {
                    const totalTarget = createEmptyPLData();
                    let hasData = false;
                    let manualOverridesTarget = new Set<string>();
                    divInfo.subDivisions.forEach(sub => {
                        if (sub.key === 'all') return;
                        const subData = div.subDivTargetMonthly?.[sub.key]?.[month];
                        if (subData && Object.keys(subData).length > 0) {
                            hasData = true;

                            // 🚑 강제 힐링: 하위 서브데이터 자체에 대해서도 역산 공식 적용
                            Object.assign(subData, calculateDerivedFields(subData, true));

                            if (subData.manualOverrides) subData.manualOverrides.forEach(m => manualOverridesTarget.add(m));
                            Object.entries(subData).forEach(([k, val]) => {
                                if (typeof val === 'number' && !k.toLowerCase().includes('ratio') && k !== 'materialDiff' && k !== 'revenuePerHead') {
                                    totalTarget[k] = (totalTarget[k] || 0) + val;
                                }
                            });
                        }
                    });
                    if (hasData) {
                        totalTarget.manualOverrides = Array.from(manualOverridesTarget);
                        div.targetMonthly[month] = calculateDerivedFields(totalTarget, true);
                    }
                }
            }
        }
    });
    return repaired;
}

// 데이터 로드 (Supabase 전용 비동기 로드)
export async function loadData(): Promise<DataStore> {
    const cloudData = await fetchFromCloud();

    let targetData = cloudData ? (cloudData as DataStore) : createEmptyStore();

    // 누락된 신규 데이터 뼈대(마이그레이션) 보완
    const migrated = applyMigrations(targetData);

    // 손상된 하위-상위 합계 불일치 데이터 런타임 자동 복구
    const fullyRepaired = autoRepairAggregations(migrated);

    return fullyRepaired;
}

// 기본 데이터 스토어 생성
export function createEmptyStore(): DataStore {
    return {
        lastUpdated: new Date().toISOString(),
        divisions: DIVISIONS_WITH_TOTAL.map(div => ({
            divisionCode: div.code,
            year: 2026,
            exchangeRates: {},
            monthly: {},
            targetMonthly: {},
            subDivMonthly: {},
            subDivTargetMonthly: {},
        })),
        _migrated_v10: false,
        _migrated_v11: false,
        _migrated_v12: false,
        _migrated_v13: false,
        _migrated_v16: false
    };
}

// 삭제된 샘플 데이터 영역

export function getDivisionData(store: DataStore, code: DivisionCode, year: number): DivisionYearData | undefined {
    return store.divisions.find(d => d.divisionCode === code && d.year === year);
}

export function updateMonthlyData(
    store: DataStore,
    code: DivisionCode,
    year: number,
    month: number,
    data: Record<string, number>,
    exchangeRate: number
): DataStore {
    let divData = getDivisionData(store, code, year);
    if (!divData) {
        divData = { divisionCode: code, year, exchangeRates: {}, monthly: {}, targetMonthly: {} };
        store.divisions.push(divData);
    }
    divData.monthly[month] = calculateDerivedFields({ ...createEmptyPLData(), ...data }, true);
    if (typeof exchangeRate === 'number') {
        if (!divData.exchangeRates[month]) divData.exchangeRates[month] = { actual: exchangeRate, target: exchangeRate, prev: exchangeRate };
        else divData.exchangeRates[month].actual = exchangeRate;
    }
    store.lastUpdated = new Date().toISOString();
    return { ...store };
}
