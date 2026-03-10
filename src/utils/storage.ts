/**
 * localStorage를 사용한 데이터 저장/로드 유틸리티
 */
import type { DataStore, DivisionYearData, DivisionCode } from './dataModel';
import { calculateDerivedFields, createEmptyPLData } from './dataModel';
import { syncToCloud, fetchFromCloud } from './supabaseClient';

const STORAGE_KEY = 'management_dashboard_data_v8'; // v7→v8: PPT 슬라이드 3번 데이터 100% 정밀 싱크 (6.7M 등)

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
            // 태국사업부 1월 데이터 전면 싱크 (PPT 슬라이드 3 기준)
            if (div.divisionCode === 'thailand') {
                if (div.year === 2026) {
                    // 실적('26실적)
                    const thActual = {
                        revenue: 452500000,
                        salesCoverTop: 388900000,
                        salesTubOuter: 18600000,
                        salesBaseCab: 0,
                        salesAir: 3200000,
                        salesDryer: 20900000,
                        salesOther: 20900000,
                        materialRatio: 87.1,
                        lossRate: 0.4,
                        bomMaterialRatio: 86.7,
                        materialLoss: 1800000,
                        lgImpact: 10100000,
                        djVI: 11600000,
                        viGap: -1500000,
                        headcount: 462,
                        laborCost: 18200000,
                        overhead: 19100000,
                        operatingProfit: 17800000,
                        nonOpBalance: 1200000,
                        financeCost: -300000,
                        forexGainLoss: 800000,
                        nonOpOther: 800000,
                        ebt: 19000000,
                        ebtRatio: 4.2,
                    };
                    div.monthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...thActual }, true);

                    // 목표('26목표)
                    const thTarget = {
                        revenue: 461200000,
                        salesCoverTop: 364700000,
                        salesTubOuter: 18600000,
                        salesBaseCab: 0,
                        salesAir: 0,
                        salesDryer: 50800000,
                        salesOther: 27000000,
                        materialRatio: 88.9,
                        lossRate: 0.4,
                        bomMaterialRatio: 88.5,
                        materialLoss: 1800000,
                        headcount: 464,
                        laborCost: 17100000,
                        overhead: 19700000,
                        operatingProfit: 16300000,
                        nonOpBalance: -600000,
                        ebt: 15700000,
                    };
                    if (!div.targetMonthly) div.targetMonthly = {};
                    div.targetMonthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...thTarget }, true);
                }

                if (div.year === 2025) {
                    // 전년('25실적)
                    const thPrev = {
                        revenue: 523500000,
                        salesCoverTop: 439100000,
                        salesTubOuter: 11300000,
                        salesBaseCab: 300000,
                        salesAir: 5000000,
                        salesDryer: 9100000,
                        salesOther: 58700000,
                        materialRatio: 90.0,
                        lossRate: 0.7,
                        bomMaterialRatio: 89.3,
                        materialLoss: 3400000,
                        headcount: 540,
                        laborCost: 18800000,
                        overhead: 24600000,
                        operatingProfit: 7600000,
                        nonOpBalance: -900000,
                        ebt: 6700000,
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

// 사업부별 샘플 데이터
function createSampleData(code: DivisionCode, year: number): DivisionYearData {
    const data: DivisionYearData = {
        divisionCode: code,
        year,
        exchangeRates: {},
        monthly: {},
        targetMonthly: {},
    };

    // 태국 1월 데이터 (레퍼런스 이미지 기준)
    if (code === 'thailand') {
        const is2026 = year === 2026;
        const janData = is2026 ? {
            revenue: 452500000,
            operatingProfit: 17800000,
            nonOpBalance: 1200000,
            ebt: 19000000,
        } : {
            revenue: 523500000,
            operatingProfit: 7600000,
            nonOpBalance: -900000,
            ebt: 6700000,
        };
        data.monthly[1] = calculateDerivedFields({ ...createEmptyPLData(), ...janData }, true);

        if (is2026) {
            data.targetMonthly[1] = calculateDerivedFields({ ...createEmptyPLData(), revenue: 461200000, operatingProfit: 16300000, ebt: 15700000 }, true);
        }
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
