import { useState, useEffect } from 'react';
import { type DataStore, type DivisionCode, createEmptyPLData, calculateDerivedFields } from '../utils/dataModel';
import { loadData, saveData } from '../utils/storage';
import { DIVISIONS_WITH_TOTAL } from '../utils/dataModel';

export function useDashboardData(selectedDivision: DivisionCode, selectedYear: number) {
    const [store, setStore] = useState<DataStore | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncError, setSyncError] = useState<string | null>(null);

    // 초기 데이터 로드
    useEffect(() => {
        const init = async () => {
            try {
                const data = await loadData();
                setStore(data);
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
                throw err;
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // 데이터 저장 핸들러 (환율 포함)
    const handleSaveData = async (
        month: number,
        data: Record<string, number>,
        exchangeRate: number,
        dataType: 'actual' | 'target' | 'prevYear' = 'actual',
        manualOverrides?: Set<string>,
        selectedSubDiv: string = 'all'
    ) => {
        if (!store) return;

        const divisionInfo = DIVISIONS_WITH_TOTAL.find(d => d.code === selectedDivision)!;

        // 깊은 복사: React가 상태 변경을 감지하도록 divisions 배열 및 대상 division 객체를 새 참조로 교체
        let newStore = {
            ...store,
            divisions: store.divisions.map(d => ({
                ...d,
                monthly: { ...d.monthly },
                targetMonthly: { ...(d.targetMonthly || {}) },
                exchangeRates: { ...d.exchangeRates },
                subDivMonthly: d.subDivMonthly ? Object.fromEntries(
                    Object.entries(d.subDivMonthly).map(([k, v]) => [k, { ...v }])
                ) : undefined,
                subDivTargetMonthly: d.subDivTargetMonthly ? Object.fromEntries(
                    Object.entries(d.subDivTargetMonthly).map(([k, v]) => [k, { ...v }])
                ) : undefined,
            })),
        };
        
        const targetYear = dataType === 'prevYear' ? selectedYear - 1 : selectedYear;

        let divIdx = newStore.divisions.findIndex(
            d => d.divisionCode === selectedDivision && d.year === targetYear
        );

        // 연도 데이터가 없으면 새로 생성
        if (divIdx < 0) {
            newStore.divisions.push({
                divisionCode: selectedDivision,
                year: targetYear,
                exchangeRates: { [month]: { actual: exchangeRate, target: exchangeRate, prev: exchangeRate } },
                monthly: {},
                targetMonthly: {},
                subDivMonthly: {},
                subDivTargetMonthly: {},
            });
            divIdx = newStore.divisions.length - 1;
        }

        const divDataToUpdate = newStore.divisions[divIdx];
        const plData = { ...createEmptyPLData(), ...data };

        // 데이터에 manualOverrides가 포함되어 있다면 Set으로 변환하여 calculateDerivedFields에 전달
        const effectiveOverrides = manualOverrides || (data.manualOverrides ? new Set(data.manualOverrides as any as string[]) : undefined);

        const isSubDiv = divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all';

        if (isSubDiv) {
            if (dataType === 'target') {
                if (!divDataToUpdate.subDivTargetMonthly) divDataToUpdate.subDivTargetMonthly = {};
                if (!divDataToUpdate.subDivTargetMonthly[selectedSubDiv]) divDataToUpdate.subDivTargetMonthly[selectedSubDiv] = {};
                divDataToUpdate.subDivTargetMonthly[selectedSubDiv][month] = calculateDerivedFields(plData, true, effectiveOverrides);

                // 베트남 전체(all) 타겟 합산 재계산 로직
                const totalTarget = createEmptyPLData();
                let hasDataTarget = false;
                let manualOverridesTarget = new Set<string>();
                divisionInfo.subDivisions?.forEach(sub => {
                    if (sub.key === 'all') return;
                    const subData = divDataToUpdate.subDivTargetMonthly?.[sub.key]?.[month];
                    if (subData) {
                        hasDataTarget = true;
                        if (subData.manualOverrides) subData.manualOverrides.forEach(m => manualOverridesTarget.add(m));
                        if (!subData.materialCost && (subData.revenue as number) > 0 && (subData.materialRatio as number) > 0) {
                            subData.materialCost = ((subData.revenue as number) * (subData.materialRatio as number)) / 100;
                        }
                        Object.entries(subData).forEach(([k, val]) => {
                            // 금액/카운트 항목만 단순 합산
                            if (typeof val === 'number' && !k.toLowerCase().includes('ratio') && k !== 'materialDiff' && k !== 'revenuePerHead') {
                                totalTarget[k] = (totalTarget[k] || 0) + val;
                            }
                        });
                    }
                });
                if (hasDataTarget) {
                    totalTarget.manualOverrides = Array.from(manualOverridesTarget);
                    if (!divDataToUpdate.targetMonthly) divDataToUpdate.targetMonthly = {};
                    divDataToUpdate.targetMonthly[month] = calculateDerivedFields(totalTarget, false);
                }
            } else {
                // actual or prevYear
                if (!divDataToUpdate.subDivMonthly) divDataToUpdate.subDivMonthly = {};
                if (!divDataToUpdate.subDivMonthly[selectedSubDiv]) divDataToUpdate.subDivMonthly[selectedSubDiv] = {};
                divDataToUpdate.subDivMonthly[selectedSubDiv][month] = calculateDerivedFields(plData, true, effectiveOverrides);

                // 베트남 전체(all) 실적 합산 재계산 로직
                const totalActual = createEmptyPLData();
                let hasDataActual = false;
                let manualOverridesActual = new Set<string>();
                divisionInfo.subDivisions?.forEach(sub => {
                    if (sub.key === 'all') return;
                    const subData = divDataToUpdate.subDivMonthly?.[sub.key]?.[month];
                    if (subData) {
                        hasDataActual = true;
                        if (subData.manualOverrides) subData.manualOverrides.forEach(m => manualOverridesActual.add(m));
                        if (!subData.materialCost && (subData.revenue as number) > 0 && (subData.materialRatio as number) > 0) {
                            subData.materialCost = ((subData.revenue as number) * (subData.materialRatio as number)) / 100;
                        }
                        Object.entries(subData).forEach(([k, val]) => {
                            if (typeof val === 'number' && !k.toLowerCase().includes('ratio') && k !== 'materialDiff' && k !== 'revenuePerHead') {
                                totalActual[k] = (totalActual[k] || 0) + val;
                            }
                        });
                    }
                });
                if (hasDataActual) {
                    totalActual.manualOverrides = Array.from(manualOverridesActual);
                    if (!divDataToUpdate.monthly) divDataToUpdate.monthly = {};
                    divDataToUpdate.monthly[month] = calculateDerivedFields(totalActual, false);
                }
            }
        } else {
            if (dataType === 'target') {
                if (!divDataToUpdate.targetMonthly) divDataToUpdate.targetMonthly = {};
                divDataToUpdate.targetMonthly[month] = calculateDerivedFields(plData, true, effectiveOverrides);
            } else {
                // actual or prevYear
                if (!divDataToUpdate.monthly) divDataToUpdate.monthly = {};
                divDataToUpdate.monthly[month] = calculateDerivedFields(plData, true, effectiveOverrides);
            }
        }

        // 환율 개별 업데이트
        if (!divDataToUpdate.exchangeRates) divDataToUpdate.exchangeRates = {};
        const existingRates = divDataToUpdate.exchangeRates[month] || { actual: 1, target: 1, prev: 1 };
        divDataToUpdate.exchangeRates[month] = {
            ...existingRates,
            [dataType === 'prevYear' ? 'actual' : dataType]: exchangeRate
        };

        newStore.lastUpdated = new Date().toISOString();

        const success = await saveData(newStore);
        if (!success) {
            setSyncError('클라우드 DB 서버 연결 실패!\n입력하신 데이터는 로컬 컴퓨터에만 임시 저장되었습니다.');
        } else {
            setSyncError(null);
        }

        setStore(newStore);
        return true;
    };

    return { store, setStore, loading, syncError, setSyncError, handleSaveData };
}
