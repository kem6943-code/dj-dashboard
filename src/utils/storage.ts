/**
 * localStorage를 사용한 데이터 저장/로드 유틸리티
 */
import type { DataStore, DivisionYearData, DivisionCode } from './dataModel';
import { calculateDerivedFields, createEmptyPLData } from './dataModel';
import { syncToCloud, fetchFromCloud } from './supabaseClient';

const STORAGE_KEY = 'management_dashboard_data_v9'; // v8→v9: 태국 P&L 모든 셀(25년/26년) 100% 수동 싱크 및 자동 계산 억제

// 데이터 저장
export async function saveData(store: DataStore): Promise<void> {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        await syncToCloud(store);
    } catch (e) {
        console.error('Failed to save data:', e);
    }
}

// 데이터 로드
export async function loadData(): Promise<DataStore> {
    const cloudData = await fetchFromCloud();
    if (cloudData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
        return cloudData;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        const defaultStore = createDefaultStore();
        await saveData(defaultStore);
        return defaultStore;
    }

    try {
        const parsedStore = JSON.parse(raw) as DataStore;

        // 마이그레이션 및 정밀 데이터 동기화
        parsedStore.divisions.forEach(div => {
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
                        materialRatio: 87.11,    // 이미지 87.11
                        bomMaterialRatio: 86.70, // 이미지 86.70
                        lossRate: 0.41,          // 이미지 0.41
                        materialLoss: 1800000,   // 이미지 1.8
                        lgImpact: 10100000,      // 이미지 10.1
                        djVI: 11600000,          // 이미지 11.6
                        viGap: -1500000,         // 이미지 -1.5
                        viRatio: -0.3,           // 이미지 -0.3
                        headcount: 462,
                        laborCost: 18200000,     // 이미지 18.2
                        laborCostRatio: 4.0,     // 이미지 4.0
                        laborPerHead: 24.8,      // 이미지 24.8
                        overhead: 19100000,      // 이미지 19.1
                        overheadRatio: 4.2,      // 이미지 4.2
                        techFee: 5500000,        // 이미지 5.5
                        electricity: 2500000,    // 이미지 2.5
                        transportation: 2500000, // 이미지 2.5
                        importCost: 1200000,     // 이미지 1.2
                        consumables: 1900000,    // 이미지 1.9
                        depreciation: 2100000,   // 이미지 2.1
                        overheadOther: 3200000,  // 이미지 3.2
                        operatingProfit: 17800000, // 이미지 17.8
                        operatingProfitRatio: 3.9, // 이미지 3.9
                        nonOpBalance: 1200000,   // 이미지 1.2
                        financeCost: -300000,    // 이미지 -0.3
                        forexGainLoss: 800000,   // 이미지 0.8
                        nonOpOther: 800000,      // 이미지 0.8
                        ebt: 19000000,           // 이미지 19.0
                        ebtRatio: 4.2,           // 이미지 4.2
                    };
                    div.monthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...thActual }, true);

                    // 🎯 1월 TD 목표('26목표) PPT 이미지 100% 셀 싱크
                    const thTarget = {
                        revenue: 461200000,
                        salesCoverTop: 364700000,
                        salesTubOuter: 18600000,
                        salesBaseCab: 0,
                        salesAir: 0,
                        salesDryer: 50800000,
                        salesOther: 27000000,
                        materialRatio: 88.85,
                        bomMaterialRatio: 88.45,
                        lossRate: 0.40,
                        materialLoss: 1800000,
                        headcount: 464,
                        laborCost: 17100000,
                        laborCostRatio: 3.7,
                        laborPerHead: 27.0,
                        overhead: 19700000,
                        overheadRatio: 4.3,
                        techFee: 5500000,
                        electricity: 2500000,
                        transportation: 2500000,
                        importCost: 1200000,
                        consumables: 1900000,
                        depreciation: 2100000,
                        overheadOther: 3200000,
                        operatingProfit: 16300000,
                        operatingProfitRatio: 3.5,
                        nonOpBalance: -600000,
                        ebt: 15700000,
                        ebtRatio: 3.4,
                    };
                    if (!div.targetMonthly) div.targetMonthly = {};
                    div.targetMonthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...thTarget }, true);
                }

                if (div.year === 2025) {
                    // 🎯 전년('25실적) PPT 이미지 100% 셀 싱크 (슬라이드 3번 '전년' 컬럼)
                    const thPrev = {
                        revenue: 523500000,         // 이미지 523.5
                        salesCoverTop: 439100000,   // 이미지 439.1
                        salesTubOuter: 11300000,    // 이미지 11.3
                        salesBaseCab: 300000,       // 이미지 0.3
                        salesAir: 5000000,          // 이미지 5.0
                        salesDryer: 9100000,        // 이미지 9.1
                        salesOther: 58700000,       // 이미지 58.7
                        materialRatio: 89.97,       // 이미지 89.97
                        bomMaterialRatio: 89.32,    // 이미지 89.32
                        lossRate: 0.65,             // 이미지 0.65
                        materialLoss: 3400000,      // 이미지 3.4
                        viPerformance: 0.4,         // 이미지 0.4 (Gap)
                        viRatio: 0.1,               // 이미지 0.1
                        headcount: 540,             // 이미지 540
                        laborCost: 18800000,        // 이미지 18.8
                        laborCostRatio: 3.6,        // 이미지 3.6
                        laborPerHead: 27.8,         // 이미지 27.8
                        overhead: 24600000,         // 이미지 24.6
                        overheadRatio: 4.7,         // 이미지 4.7
                        techFee: 6200000,           // 이미지 6.2
                        electricity: 3300000,       // 이미지 3.3
                        transportation: 2800000,    // 이미지 2.8
                        importCost: 3100000,        // 이미지 3.1
                        consumables: 2400000,       // 이미지 2.4
                        depreciation: 2100000,      // 이미지 2.1
                        overheadOther: 5100000,     // 이미지 5.1
                        operatingProfit: 7600000,   // 이미지 7.6
                        operatingProfitRatio: 1.5,  // 이미지 1.5
                        nonOpBalance: -900000,      // 이미지 -0.9
                        financeCost: -0.3 * 1000000, // 이미지 -0.3
                        forexGainLoss: 0.5 * 1000000, // 이미지 0.5
                        nonOpOther: -1.1 * 1000000,   // 이미지 -1.1
                        ebt: 6700000,               // 이미지 6.7
                        ebtRatio: 1.3,               // 이미지 1.3
                    };
                    div.monthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...thPrev }, true);
                }
            }
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedStore));
        return parsedStore;
    } catch {
        return createDefaultStore();
    }
}

// 기본 데이터 스토어 생성
function createDefaultStore(): DataStore {
    const store: DataStore = {
        divisions: [],
        updatedAt: new Date().toISOString(),
    };
    const divisions: DivisionCode[] = ['changwon', 'thailand', 'vietnam', 'mexico'];
    divisions.forEach(code => {
        store.divisions.push(createSampleData(code, 2026));
        store.divisions.push(createSampleData(code, 2025));
    });
    return store;
}

// 사업부별 샘플 데이터 (초기 로드용)
function createSampleData(code: DivisionCode, year: number): DivisionYearData {
    const data: DivisionYearData = {
        divisionCode: code,
        year,
        exchangeRates: {},
        monthly: {},
        targetMonthly: {},
    };

    const is2026 = year === 2026;

    if (code === 'changwon') {
        const cwData = is2026 ? {
            revenue: 9559000000,
            salesFL: 6133000000,
            salesFridge: 684000000,
            salesOther: 2742000000,
            bomMaterialRatio: 76.7,
            materialRatio: 77.4,
            headcount: 241,
            laborCost: 1097000000,
            overhead: 793000000,
            operatingProfit: 266000000,
            ebt: 233000000,
        } : {
            revenue: 9457000000,
            operatingProfit: 212000000,
            ebt: 156000000,
        };
        data.monthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...cwData } as any, true);
        if (is2026) {
            data.targetMonthly[1] = calculateDerivedFields({ ...createEmptyPLData(), revenue: 8853000000, operatingProfit: 167000000, ebt: 167000000 } as any, true);
        }
    }

    if (code === 'thailand') {
        const thData = is2026 ? { revenue: 452500000, operatingProfit: 17800000, ebt: 19000000 } : { revenue: 523500000, operatingProfit: 7600000, ebt: 6700000 };
        data.monthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...thData } as any, true);
    }

    // 환율 설정
    for (let m = 1; m <= 12; m++) {
        if (code === 'thailand') {
            data.exchangeRates[m] = (year === 2025)
                ? { actual: 42.42, target: 41.78, prev: 41.78 }
                : { actual: 46.61, target: 41.78, prev: 42.42 };
        } else {
            const defaultRate = (code === 'vietnam' ? 0.055 : code === 'mexico' ? 75.0 : 1);
            data.exchangeRates[m] = { actual: defaultRate, target: defaultRate, prev: defaultRate };
        }
    }

    return data;
}

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
    divData.monthly[month] = calculateDerivedFields({ ...createEmptyPLData(), ...data });
    if (typeof exchangeRate === 'number') {
        if (!divData.exchangeRates[month]) divData.exchangeRates[month] = { actual: exchangeRate, target: exchangeRate, prev: exchangeRate };
        else divData.exchangeRates[month].actual = exchangeRate;
    }
    store.updatedAt = new Date().toISOString();
    return { ...store };
}
