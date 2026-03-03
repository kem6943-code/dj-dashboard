/**
 * localStorage를 사용한 데이터 저장/로드 유틸리티
 */
import type { DataStore, DivisionYearData, DivisionCode } from './dataModel';
import { calculateDerivedFields, createEmptyPLData } from './dataModel';
import { syncToCloud, fetchFromCloud } from './supabaseClient';

const STORAGE_KEY = 'management_dashboard_data_v2'; // Changed

// 데이터 저장
export async function saveData(store: DataStore): Promise<void> { // Changed to async
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        // Cloud Sync (Supabase 설정 시 작동)
        await syncToCloud(store); // Added
    } catch (e) {
        console.error('Failed to save data:', e);
    }
}

// 데이터 로드
export async function loadData(): Promise<DataStore> {
    // 1. Cloud 데이터 우선 확인
    const cloudData = await fetchFromCloud();
    if (cloudData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
        return cloudData;
    }

    // 2. Cloud 데이터 없으면 로컬 확인
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        const defaultStore = createDefaultStore();
        await saveData(defaultStore);
        return defaultStore;
    }

    try {
        const parsedStore = JSON.parse(raw) as DataStore;

        // 데이터 마이그레이션: 기존에 저장된 데이터 중 yearlyTarget이 누락된 항목에 채워넣기
        const yearlyTargets: Record<DivisionCode, { revenue: number, operatingProfit: number }> = {
            changwon: { revenue: 110500000000, operatingProfit: 2500000000 },
            thailand: { revenue: 4517400000, operatingProfit: 110500000 },
            vietnam: { revenue: 923808000000, operatingProfit: 97608000000 },
            mexico: { revenue: 800000000, operatingProfit: 40000000 },
            total: { revenue: 0, operatingProfit: 0 },
        };

        parsedStore.divisions.forEach(div => {
            // 2026년 데이터이고 yearlyTarget이 없을 때 주입
            if (div.year === 2026 && !div.yearlyTarget && yearlyTargets[div.divisionCode]) {
                div.yearlyTarget = yearlyTargets[div.divisionCode];
            }

            // 태국사업부 1월 데이터 보정... (이하 기존 로직 유지)
            if (div.year === 2026 && div.divisionCode === 'thailand') {
                if (!div.targetMonthly) div.targetMonthly = {};
                if (!div.targetMonthly[1] || div.targetMonthly[1].revenue === 0) {
                    const thTarget = {
                        revenue: 461200000,
                        operatingProfit: 16300000,
                        materialRatio: 88.85,
                        laborCost: 17100000,
                        overhead: 19700000,
                    };
                    div.targetMonthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...thTarget });
                }
                // 실적 데이터도 최신 이미지 기준으로 보정 (이미 데이터가 있을 수 있으므로)
                if (div.monthly[1] && (div.monthly[1].revenue === 452900000 || div.monthly[1].revenue === 0)) {
                    const thActual = {
                        revenue: 452500000,
                        salesCoverTop: 388900000,
                        salesTubOuter: 18600000,
                        salesBaseCab: 0,
                        salesAir: 3200000,
                        salesDryer: 20900000,
                        salesOther: 20900000,
                        bomMaterialRatio: 86.70,
                        materialRatio: 87.11,
                        lossRate: 0.41,
                        materialLoss: 1800000,
                        lgImpact: 10100000,
                        djVI: 11600000,
                        viGap: -1500000,
                        headcount: 462,
                        laborCost: 18200000,
                        overhead: 19100000,
                        financeCost: 1300000,
                        forexGainLoss: 0.8,
                        nonOpOther: 1.7,
                    };
                    div.monthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...thActual });
                }
            }
            // 베트남사업부 1월 데이터 강제 주입 (이미지 기반)
            if (div.year === 2026 && div.divisionCode === 'vietnam') {
                if (!div.targetMonthly) div.targetMonthly = {};
                const vnTarget = {
                    revenue: 76984000000,
                    salesWM: 53808000000,
                    salesAIO: 3635000000,
                    salesREF: 14430000000,
                    salesSMAC: 1108000000,
                    salesSF: 667000000,
                    salesKEFICO: 2654000000,
                    salesBallCoat: 682000000,
                    rawMaterialCost: 46840000000,
                    materialRatio: 60.8438, // 46,840 / 76,984 * 100 (OP 8,134 맞춤)
                    bomMaterialRatio: 58.8,
                    materialDiff: 2.0438,
                    vvci: 2310000000,
                    materialLoss: 102000000,
                    headcount: 752,
                    laborCost: 10909000000,
                    overhead: 11101000000,
                    depreciation: 4275000000,
                    techFee: 2136000000,
                    taxDues: 299000000,
                    welfare: 1748000000,
                    electricity: 1399000000,
                    rent: 566000000,
                    repair: 145000000,
                    commission: 32000000,
                    transportation: 17000000,
                    officeSupplies: 122000000,
                    overheadOther: 362000000,
                    interestIncome: 3000000,
                    forexGain: 0,
                    interestExpense: 419000000,
                    forexLoss: 0,
                };
                div.targetMonthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...vnTarget });

                const vnActual = {
                    revenue: 89817000000,
                    salesWM: 56748000000,
                    salesAIO: 9613000000,
                    salesREF: 20182000000,
                    salesSMAC: 1108000000,
                    salesSF: 971000000,
                    salesKEFICO: 0,
                    salesBallCoat: 676000000,
                    rawMaterialCost: 53470000000,
                    bomMaterialRatio: 58.4,
                    materialDiff: 1.6,
                    vvci: 1920000000,
                    materialLoss: 1200000000,
                    headcount: 542,
                    laborCost: 12492000000,
                    overhead: 12017000000,
                    depreciation: 4162000000,
                    techFee: 2512000000,
                    taxDues: 0,
                    welfare: 1694000000,
                    electricity: 1845000000,
                    rent: 762000000,
                    repair: 131000000,
                    commission: 34000000,
                    transportation: 69000000,
                    officeSupplies: 98000000,
                    overheadOther: 711000000,
                    interestIncome: 4000000,
                    forexGain: 76000000,
                    interestExpense: 391000000,
                    forexLoss: 14000000,
                };
                div.monthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...vnActual });

                // 서브 디비전 '전체' 탭 데이터도 동기화
                if (!div.subDivMonthly) div.subDivMonthly = {};
                if (!div.subDivTargetMonthly) div.subDivTargetMonthly = {};

                div.subDivMonthly.all = { 1: { ...div.monthly[1] } };

                // 생산 1실 데이터 (이미지 기반)
                const prod1Target = {
                    revenue: 18065000000,
                    salesAIO: 3635000000,
                    salesREF: 14430000000,
                    rawMaterialCost: 11921000000,
                    materialRatio: 66.0,
                    materialDiff: 2.6,
                    materialLoss: 325000000,
                    headcount: 210,
                    laborCost: 3017000000,
                    overhead: 4077000000,
                    depreciation: 2218000000,
                    techFee: 534000000,
                    taxDues: 61000000,
                    welfare: 383000000,
                    electricity: 414000000,
                    rent: 212000000,
                    repair: 44000000,
                    commission: 27000000,
                    transportation: 4000000,
                    officeSupplies: 42000000,
                    overheadOther: 139000000,
                    interestIncome: 1000000,
                    forexGain: 0,
                    interestExpense: 157000000,
                    forexLoss: 0,
                };
                const prod1Actual = {
                    revenue: 29795000000,
                    salesAIO: 9613000000,
                    salesREF: 20182000000,
                    rawMaterialCost: 19164000000,
                    materialRatio: 64.3,
                    materialDiff: 1.1,
                    materialLoss: 394000000,
                    headcount: 234,
                    laborCost: 4389000000,
                    overhead: 5008000000,
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
                    interestIncome: 1000000,
                    forexGain: 24000000,
                    interestExpense: 129000000,
                    forexLoss: 0,
                };

                div.subDivMonthly.prod1 = { 1: calculateDerivedFields({ ...createEmptyPLData(), ...prod1Actual }) };
                div.subDivTargetMonthly.prod1 = { 1: calculateDerivedFields({ ...createEmptyPLData(), ...prod1Target }) };

                // 생산 2실 데이터 (이미지 기반)
                const prod2Target = {
                    revenue: 53808000000,
                    salesWM: 53808000000,
                    rawMaterialCost: 32619000000,
                    materialRatio: 60.6,
                    materialDiff: 2.5,
                    materialLoss: 2152000000,
                    headcount: 260,
                    laborCost: 6424000000,
                    overhead: 5463000000,
                    depreciation: 1243000000,
                    techFee: 1449000000,
                    taxDues: 220000000,
                    welfare: 1065000000,
                    electricity: 854000000,
                    rent: 292000000,
                    repair: 88000000,
                    commission: 1000000,
                    transportation: 5000000,
                    officeSupplies: 76000000,
                    overheadOther: 170000000,
                    interestIncome: 1000000,
                    forexGain: 0,
                    interestExpense: 250000000,
                    forexLoss: 0,
                };
                const prod2Actual = {
                    revenue: 56748000000,
                    salesWM: 56748000000,
                    rawMaterialCost: 33391000000,
                    materialRatio: 58.8,
                    materialDiff: 1.3,
                    materialLoss: 793000000,
                    headcount: 260,
                    laborCost: 6837000000,
                    overhead: 5975000000,
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
                    interestIncome: 1000000,
                    forexGain: 45000000,
                    interestExpense: 248000000,
                    forexLoss: 1000000,
                };

                div.subDivMonthly.prod2 = { 1: calculateDerivedFields({ ...createEmptyPLData(), ...prod2Actual }) };
                div.subDivTargetMonthly.prod2 = { 1: calculateDerivedFields({ ...createEmptyPLData(), ...prod2Target }) };

                // 생산 3실 데이터 (이미지 기반)
                const prod3Target = {
                    revenue: 5111000000,
                    salesSMAC: 1108000000,
                    salesSF: 667000000,
                    salesKEFICO: 2654000000,
                    salesBallCoat: 682000000,
                    rawMaterialCost: 2299000000,
                    materialRatio: 51.9,
                    materialDiff: 2.5,
                    materialLoss: 102000000,
                    headcount: 75,
                    laborCost: 1467000000,
                    overhead: 1562000000,
                    depreciation: 814000000,
                    techFee: 153000000,
                    taxDues: 18000000,
                    welfare: 300000000,
                    electricity: 132000000,
                    rent: 62000000,
                    repair: 13000000,
                    commission: 5000000,
                    transportation: 8000000,
                    officeSupplies: 7000000,
                    overheadOther: 53000000,
                    interestIncome: 0,
                    forexGain: 0,
                    interestExpense: 12000000,
                    forexLoss: 0,
                };
                const prod3Actual = {
                    revenue: 3274000000,
                    salesSMAC: 1627000000,
                    salesSF: 971000000,
                    salesKEFICO: 0,
                    salesBallCoat: 676000000,
                    rawMaterialCost: 914000000,
                    materialRatio: 35.2,
                    materialDiff: 0.5,
                    materialLoss: 12000000,
                    headcount: 48,
                    laborCost: 1266000000,
                    overhead: 1035000000,
                    depreciation: 581000000,
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
                    interestIncome: 0,
                    forexGain: 7000000,
                    interestExpense: 14000000,
                    forexLoss: 12000000,
                };

                div.subDivMonthly.prod3 = { 1: calculateDerivedFields({ ...createEmptyPLData(), ...prod3Actual }) };
                div.subDivTargetMonthly.prod3 = { 1: calculateDerivedFields({ ...createEmptyPLData(), ...prod3Target }) };
            }
        });

        // 마이그레이션된 데이터 저장
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedStore));
        return parsedStore;
    } catch {
        return createDefaultStore();
    }
}

// 기본 데이터 스토어 생성 (샘플 데이터 포함)
function createDefaultStore(): DataStore {
    const store: DataStore = {
        divisions: [],
        updatedAt: new Date().toISOString(),
    };

    const divisions: DivisionCode[] = ['changwon', 'thailand', 'vietnam', 'mexico'];
    divisions.forEach(code => {
        const yearData = createSampleData(code, 2026);
        store.divisions.push(yearData);
    });

    return store;
}

// 사업부별 샘플 데이터 (보고서 기반)
function createSampleData(code: DivisionCode, year: number): DivisionYearData {
    const data: DivisionYearData = {
        divisionCode: code,
        year,
        exchangeRate: {},
        monthly: {},
        targetMonthly: {},
    };

    // 1월 샘플 데이터 (보고서 기준)
    const sampleByDivision: Partial<Record<DivisionCode, Record<string, number>>> = {
        changwon: {
            revenue: 9559000000,
            salesFL: 6133000000,
            salesFridge: 684000000,
            salesOther: 2742000000,
            bomMaterialRatio: 76.7,
            materialRatio: 77.4,
            materialDiff: 0.8,
            purchaseVI: 25000000,
            materialLoss: 73000000,
            headcount: 241,
            revenuePerHead: 8710000,
            laborCost: 1097000000,
            overhead: 793000000,
            electricity: 118300000,
            depreciation: 174800000,
            repair: 25600000,
            consumables: 24800000,
            transportation: 59500000,
            commission: 16100000,
            rent: 13900000,
            overheadOther: 360100000,
            operatingProfit: 266000000,
            financeCost: 70000000,
            nonOpIncome: 37000000,
            ebt: 233000000,
        },
        thailand: {
            revenue: 452500000,
            salesCoverTop: 388900000,
            salesTubOuter: 18600000,
            salesBaseCab: 0,
            salesAir: 3200000,
            salesDryer: 20900000,
            salesOther: 20900000,
            bomMaterialRatio: 86.70,
            materialRatio: 87.11,
            lossRate: 0.41,
            materialLoss: 1800000,
            lgImpact: 10100000,
            djVI: 11600000,
            viGap: -1500000,
            headcount: 462,
            laborCost: 18200000,
            overhead: 19100000,
            techFee: 5500000,
            electricity: 2500000,
            transportation: 1200000,
            importCost: 900000,
            consumables: 1900000,
            depreciation: 2600000,
            overheadOther: 4500000,
            financeCost: 1300000,
            forexGainLoss: 0.8,
            nonOpOther: 1.7,
        },
        vietnam: {
            revenue: 89817000000,
            salesWM: 56748000000,
            salesAIO: 9613000000,
            salesREF: 20182000000,
            salesSMAC: 1108000000,
            salesSF: 971000000,
            salesKEFICO: 0,
            salesBallCoat: 676000000,
            rawMaterialCost: 53470000000,
            bomMaterialRatio: 58.4,
            materialDiff: 1.6,
            vvci: 1920000000,
            materialLoss: 1200000000,
            headcount: 542,
            laborCost: 12492000000,
            overhead: 12017000000,
            depreciation: 4162000000,
            techFee: 2512000000,
            taxDues: 0,
            welfare: 1694000000,
            electricity: 1845000000,
            rent: 762000000,
            repair: 131000000,
            commission: 34000000,
            transportation: 69000000,
            officeSupplies: 98000000,
            overheadOther: 711000000,
            interestIncome: 4000000,
            forexGain: 76000000,
            interestExpense: 391000000,
            forexLoss: 14000000,
        },
        mexico: {
            revenue: 68656277,
            salesFL: 45000000,
            salesTL: 15000000,
            salesFridge: 8654853,
            salesOther: 1424,
            bomMaterialRatio: 71.5,
            headcount: 120,
            laborCost: 8200000,
            overhead: 12500000,
            financeCost: 1200000,
        },
    };

    // 1월 목표 데이터 (TD목표)
    const sampleTargetByDivision: Partial<Record<DivisionCode, Record<string, number>>> = {
        changwon: {
            revenue: 8853000000,
            materialRatio: 78.5,
            headcount: 247,
            laborCost: 988000000,
            revenuePerHead: 8960000,
            overhead: 749000000,
            electricity: 112200000,
            depreciation: 162600000,
            repair: 19200000,
            consumables: 41900000,
            transportation: 57400000,
            commission: 17900000,
            rent: 13200000,
            overheadOther: 324400000,
            operatingProfit: 167000000,
            ebt: 167000000,
        },
        thailand: {
            revenue: 461200000,
            operatingProfit: 16300000,
            materialRatio: 88.85,
            laborCost: 17100000,
            overhead: 19700000,
        },
        vietnam: {
            revenue: 89817000000,
            salesWM: 56748000000,
            salesAIO: 9613000000,
            salesREF: 20182000000,
            salesSMAC: 1627000000,
            salesSF: 971000000,
            salesKEFICO: 0,
            salesBallCoat: 676000000,
            rawMaterialCost: 53659000000,
            bomMaterialRatio: 58.8,
            materialDiff: 1.0,
            materialLoss: 1200000000,
            headcount: 752,
            laborCost: 12492000000,
            overhead: 15532000000,
            depreciation: 4275000000,
            techFee: 2136000000,
            taxDues: 299000000,
            welfare: 1748000000,
            electricity: 1399000000,
            rent: 566000000,
            repair: 145000000,
            commission: 32000000,
            transportation: 17000000,
            officeSupplies: 122000000,
            overheadOther: 362000000,
            interestIncome: 3000000,
            forexGain: 0,
            interestExpense: 419000000,
            forexLoss: 0,
            operatingProfit: 8134000000,
            ebt: 7718000000,
        },
    };

    const sample = sampleByDivision[code];
    const plData = { ...createEmptyPLData(), ...sample };
    data.monthly[1] = calculateDerivedFields(plData);

    const targetSample = sampleTargetByDivision[code] || {};
    const plTargetData = { ...createEmptyPLData(), ...targetSample };
    data.targetMonthly[1] = calculateDerivedFields(plTargetData);

    if (code === 'vietnam') {
        const prod1Target = {
            revenue: 18065000000,
            salesAIO: 3635000000,
            salesREF: 14430000000,
            rawMaterialCost: 11921000000,
            materialRatio: 66.0,
            materialDiff: 2.6,
            materialLoss: 325000000,
            headcount: 210,
            laborCost: 3017000000,
            overhead: 4077000000,
            depreciation: 2218000000,
            techFee: 534000000,
            taxDues: 61000000,
            welfare: 383000000,
            electricity: 414000000,
            rent: 212000000,
            repair: 44000000,
            commission: 27000000,
            transportation: 4000000,
            officeSupplies: 42000000,
            overheadOther: 139000000,
            interestIncome: 1000000,
            forexGain: 0,
            interestExpense: 157000000,
            forexLoss: 0,
        };
        const prod1Actual = {
            revenue: 29795000000,
            salesAIO: 9613000000,
            salesREF: 20182000000,
            rawMaterialCost: 19164000000,
            materialRatio: 64.3,
            materialDiff: 1.1,
            materialLoss: 394000000,
            headcount: 234,
            laborCost: 4389000000,
            overhead: 5008000000,
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
            interestIncome: 1000000,
            forexGain: 24000000,
            interestExpense: 129000000,
            forexLoss: 0,
        };
        // Prod 1 Operating Profit 확인: 29795 - 19164 - 4389 - 5008 = 1234 (이미지와 일치)
        const prod2Target = {
            revenue: 53808000000,
            salesWM: 53808000000,
            rawMaterialCost: 32619000000,
            materialRatio: 60.6,
            materialDiff: 2.5,
            materialLoss: 2152000000,
            headcount: 260,
            laborCost: 6424000000,
            overhead: 5463000000,
            depreciation: 1243000000,
            techFee: 1449000000,
            taxDues: 220000000,
            welfare: 1065000000,
            electricity: 854000000,
            rent: 292000000,
            repair: 88000000,
            commission: 1000000,
            transportation: 5000000,
            officeSupplies: 76000000,
            overheadOther: 170000000,
            interestIncome: 1000000,
            forexGain: 0,
            interestExpense: 250000000,
            forexLoss: 0,
        };
        const prod2Actual = {
            revenue: 56748000000,
            salesWM: 56748000000,
            rawMaterialCost: 33391000000,
            materialRatio: 58.8,
            materialDiff: 1.3,
            materialLoss: 793000000,
            headcount: 260,
            laborCost: 6837000000,
            overhead: 5975000000,
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
            interestIncome: 1000000,
            forexGain: 45000000,
            interestExpense: 248000000,
            forexLoss: 1000000,
        };
        // Prod 2 Operating Profit 확인: 56748 - 33391 - 6837 - 5975 = 10545 (이미지와 일치)

        const prod3Target = {
            revenue: 5111000000,
            salesSMAC: 1108000000,
            salesSF: 667000000,
            salesKEFICO: 2654000000,
            salesBallCoat: 682000000,
            rawMaterialCost: 2299000000,
            materialRatio: 51.9,
            materialDiff: 2.5,
            materialLoss: 102000000,
            headcount: 75,
            laborCost: 1467000000,
            overhead: 1562000000,
            depreciation: 814000000,
            techFee: 153000000,
            taxDues: 18000000,
            welfare: 300000000,
            electricity: 132000000,
            rent: 62000000,
            repair: 13000000,
            commission: 5000000,
            transportation: 8000000,
            officeSupplies: 7000000,
            overheadOther: 53000000,
            interestIncome: 0,
            forexGain: 0,
            interestExpense: 12000000,
            forexLoss: 0,
        };
        const prod3Actual = {
            revenue: 3274000000,
            salesSMAC: 1627000000,
            salesSF: 971000000,
            salesKEFICO: 0,
            salesBallCoat: 676000000,
            rawMaterialCost: 914000000,
            materialRatio: 27.9,
            materialDiff: 0.5,
            materialLoss: 12000000,
            headcount: 48,
            laborCost: 1266000000,
            overhead: 1035000000,
            depreciation: 581000000,
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
            interestIncome: 0,
            forexGain: 7000000,
            interestExpense: 14000000,
            forexLoss: 12000000,
        };
        // Prod 3 Operating Profit 확인: 3274 - 914 - 1266 - 1035 = 59 (이미지와 일치)

        data.subDivMonthly = {
            all: { 1: { ...data.monthly[1] } },
            prod1: { 1: calculateDerivedFields({ ...createEmptyPLData(), ...prod1Actual }) },
            prod2: { 1: calculateDerivedFields({ ...createEmptyPLData(), ...prod2Actual }) },
            prod3: { 1: calculateDerivedFields({ ...createEmptyPLData(), ...prod3Actual }) },
        };
        data.subDivTargetMonthly = {
            prod1: { 1: calculateDerivedFields({ ...createEmptyPLData(), ...prod1Target }) },
            prod2: { 1: calculateDerivedFields({ ...createEmptyPLData(), ...prod2Target }) },
            prod3: { 1: calculateDerivedFields({ ...createEmptyPLData(), ...prod3Target }) },
        };
    } else if (code === 'mexico') {
        data.subDivMonthly = {
            homeAppliance: { 1: { ...data.monthly[1] } },
            automotive: { 1: createEmptyPLData() },
        };
    }

    const exchangeRates: Partial<Record<DivisionCode, number>> = {
        changwon: 1,
        thailand: 38.5,
        vietnam: 0.058,
        mexico: 80.5,
    };
    data.exchangeRate[1] = exchangeRates[code] || 1;

    const yearlyTargets: Partial<Record<DivisionCode, { revenue: number, operatingProfit: number }>> = {
        changwon: { revenue: 110500000000, operatingProfit: 2500000000 },
        thailand: { revenue: 4517400000, operatingProfit: 110500000 },
        vietnam: { revenue: 923808000000, operatingProfit: 97608000000 },
        mexico: { revenue: 800000000, operatingProfit: 40000000 },
    };

    if (yearlyTargets[code]) {
        data.yearlyTarget = yearlyTargets[code];
    }

    return data;
}

// 특정 사업부/연도 데이터 조회
export function getDivisionData(store: DataStore, code: DivisionCode, year: number): DivisionYearData | undefined {
    return store.divisions.find(d => d.divisionCode === code && d.year === year);
}

// 특정 사업부/연도/월 데이터 업데이트
export function updateMonthlyData(
    store: DataStore,
    code: DivisionCode,
    year: number,
    month: number,
    data: Record<string, number>
): DataStore {
    let divData = getDivisionData(store, code, year);
    if (!divData) {
        divData = {
            divisionCode: code,
            year,
            exchangeRate: {},
            monthly: {},
            targetMonthly: {},
        };
        store.divisions.push(divData);
    }

    const plData = { ...createEmptyPLData(), ...data };
    divData.monthly[month] = calculateDerivedFields(plData);
    store.updatedAt = new Date().toISOString();

    return { ...store };
}
