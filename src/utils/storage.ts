/**
 * localStorage를 사용한 데이터 저장/로드 유틸리티
 */
import type { DataStore, DivisionYearData, DivisionCode } from './dataModel';
import { calculateDerivedFields, createEmptyPLData } from './dataModel';
import { syncToCloud, fetchFromCloud } from './supabaseClient';

const STORAGE_KEY = 'management_dashboard_data_v10'; // v9→v10: 태국 P&L 모든 세부 행(경비 % 등) 100% 전수 싱크

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
                        materialRatio: 87.11,
                        lossReflected: 87.11,   // 슬라이드 그대로
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
                        revenuePerHead: 24.8,    // 원당생산액
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
                    const thTarget = {
                        revenue: 461200000,
                        salesCoverTop: 364700000,
                        salesTubOuter: 18600000,
                        salesBaseCab: 0,
                        salesAir: 0,
                        salesDryer: 50800000,
                        salesOther: 27000000,
                        materialRatio: 88.85,
                        lossReflected: 88.85,
                        bomMaterialRatio: 88.45,
                        lossRate: 0.40,
                        materialLoss: 1800000,
                        headcount: 464,
                        laborCost: 17100000,
                        laborCostRatio: 3.7,
                        revenuePerHead: 27.0,
                        overhead: 19700000,
                        overheadRatio: 4.3,
                        techFee: 5500000,
                        techFeeRatio: 1.2,
                        electricity: 2500000,
                        electricityRatio: 0.6,
                        transportation: 2500000,
                        transportationRatio: 0.5,
                        importCost: 1200000,
                        importCostRatio: 0.3,
                        consumables: 1900000,
                        consumablesRatio: 0.4,
                        depreciation: 2100000,
                        depreciationRatio: 0.5,
                        overheadOther: 3200000,
                        overheadOtherRatio: 0.9,
                        operatingProfit: 16300000,
                        operatingProfitRatio: 3.5,
                        nonOpBalance: -600000,
                        ebt: 15700000,
                        ebtRatio: 3.4,
                    };
                    if (!div.targetMonthly) div.targetMonthly = {};
                    div.targetMonthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...thTarget } as any, true);
                }

                if (div.year === 2025) {
                    // 🎯 전년('25실적) PPT 이미지 100% 셀 싱크 (슬라이드 3번 '전년' 컬럼)
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
                        viPerformance: 0, // Header
                        viGap: 400000,      // Gap 0.4 
                        viRatio: 0.1,       // 0.1%
                        headcount: 540,
                        laborCost: 18800000,
                        laborCostRatio: 3.6,
                        revenuePerHead: 27.8,   // 원당생산액
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
