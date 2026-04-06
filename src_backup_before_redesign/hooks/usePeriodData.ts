import { useCallback } from 'react';
import {
    type MonthlyPLData,
    type DataStore,
    type DivisionCode,
    DIVISIONS_WITH_TOTAL,
    MONTH_NAMES,
    QUARTER_NAMES,
    HALF_NAMES,
    aggregateQuarter,
    aggregateHalf,
    aggregateYear,
    consolidateAllDivisions
} from '../utils/dataModel';
import { getDivisionData } from '../utils/storage';

interface UsePeriodDataProps {
    store: DataStore | null;
    selectedDivision: DivisionCode;
    selectedYear: number;
    periodType: 'monthly' | 'quarterly' | 'half' | 'yearly';
    selectedSubDiv: string;
    selectedTotalMonth: number;
    showTarget: boolean;
    showYoY: boolean;
}

export function usePeriodData({
    store,
    selectedDivision,
    selectedYear,
    periodType,
    selectedSubDiv,
    selectedTotalMonth,
    showTarget,
    showYoY
}: UsePeriodDataProps) {
    const divisionInfo = DIVISIONS_WITH_TOTAL.find(d => d.code === selectedDivision)!;
    
    // 합성 데이터 (현재 년도)
    const divData = store ? (selectedDivision === 'total'
        ? consolidateAllDivisions(store, selectedYear)
        : getDivisionData(store, selectedDivision, selectedYear)) : null;

    // 합성 데이터 (이전 년도)
    const prevYearDivData = store ? (selectedDivision === 'total'
        ? consolidateAllDivisions(store, selectedYear - 1)
        : getDivisionData(store, selectedDivision, selectedYear - 1)) : null;

    const getPeriodData = useCallback(() => {
        if (!divData) return { baseLabels: [], data: [], rates: [] };

        // 서브디비전 컬럼 모드 (가전/자동차 등)
        if (divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'columns') {
            const subs = divisionInfo.subDivisions;
            const baseLabels: string[] = [];
            const data: MonthlyPLData[] = [];
            const rates: number[] = [];

            const m = selectedTotalMonth || 1;
            const rs = (periodType === 'monthly' && m <= 12)
                ? (divData.exchangeRates?.[m] || { actual: 1, target: 1, prev: 1 })
                : (divData.exchangeRates?.[1] || { actual: 1, target: 1, prev: 1 });

            subs.forEach(s => {
                const subData = divData.subDivMonthly?.[s.key] || {};
                let act = subData[m] || ({} as MonthlyPLData);
                if (periodType === 'yearly') act = aggregateYear(subData);
                if (periodType === 'quarterly') act = aggregateQuarter(subData, 1);

                if (showTarget) {
                    data.push({} as MonthlyPLData, act);
                    rates.push(rs.target || 1, rs.actual || 1);
                } else {
                    data.push(act);
                    rates.push(rs.actual || 1);
                }
            });

            let totalAct = divData.monthly[m] || ({} as MonthlyPLData);
            let totalTarg = divData.targetMonthly?.[m] || ({} as MonthlyPLData);
            if (periodType === 'yearly') {
                totalAct = aggregateYear(divData.monthly);
                totalTarg = aggregateYear(divData.targetMonthly || {});
            }
            if (periodType === 'quarterly') {
                totalAct = aggregateQuarter(divData.monthly, 1);
                totalTarg = aggregateQuarter(divData.targetMonthly || {}, 1);
            }

            baseLabels.push('합계');
            if (showTarget) {
                data.push(totalTarg, totalAct);
                rates.push(rs.target || 1, rs.actual || 1);
            } else {
                data.push(totalAct);
                rates.push(rs.actual || 1);
            }

            return { baseLabels, data, rates };
        }

        // 서브디비전 탭 모드 (생산실별 등)
        const targetMonthly = (divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all')
            ? (divData.subDivMonthly?.[selectedSubDiv] || {})
            : divData.monthly;

        const targetMonthlyGoals = (divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all')
            ? (divData.subDivTargetMonthly?.[selectedSubDiv] || {})
            : (divData.targetMonthly || {});

        const buildData = (
            baseLabels: string[],
            actualData: MonthlyPLData[],
            targetData: MonthlyPLData[],
            prevYearActualData?: MonthlyPLData[]
        ) => {
            if (!showTarget && !showYoY) return {
                baseLabels,
                data: actualData,
                rates: actualData.map((_, idx) => {
                    const rs = (periodType === 'monthly' && idx < 12)
                        ? (divData.exchangeRates?.[idx + 1] || { actual: 1, target: 1, prev: 1 })
                        : (divData.exchangeRates?.[1] || { actual: 1, target: 1, prev: 1 });
                    return rs.actual || 1;
                })
            };

            const data: MonthlyPLData[] = [];
            const rates: number[] = [];
            baseLabels.forEach((_, idx) => {
                const rs = (periodType === 'monthly' && idx < 12)
                    ? (divData.exchangeRates?.[idx + 1] || { actual: 1, target: 1, prev: 1 })
                    : (divData.exchangeRates?.[1] || { actual: 1, target: 1, prev: 1 });

                const prs = (periodType === 'monthly' && idx < 12)
                    ? (prevYearDivData?.exchangeRates?.[idx + 1] || { actual: 1, target: 1, prev: 1 })
                    : (prevYearDivData?.exchangeRates?.[1] || { actual: 1, target: 1, prev: 1 });

                if (showYoY) {
                    data.push(prevYearActualData?.[idx] || ({} as MonthlyPLData));
                    rates.push(prs.actual !== 1 && prs.actual !== undefined ? prs.actual : (prs.prev || 1));
                }
                data.push(actualData[idx]);
                rates.push(rs.actual || 1);
                if (showTarget) {
                    data.push(targetData[idx] || ({} as MonthlyPLData));
                    rates.push(rs.target || 1);
                }
            });
            return { baseLabels, data, rates };
        };

        const prevMonthly = (divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all')
            ? (prevYearDivData?.subDivMonthly?.[selectedSubDiv] || {})
            : (prevYearDivData?.monthly || {});

        switch (periodType) {
            case 'monthly': {
                const monthLabels = [...MONTH_NAMES, '누계'];
                const monthActual = [
                    ...MONTH_NAMES.map((_, i) => targetMonthly[i + 1] || ({} as MonthlyPLData)),
                    aggregateYear(targetMonthly),
                ];
                const monthTarget = [
                    ...MONTH_NAMES.map((_, i) => targetMonthlyGoals[i + 1] || ({} as MonthlyPLData)),
                    aggregateYear(targetMonthlyGoals),
                ];
                const monthPrev = [
                    ...MONTH_NAMES.map((_, i) => prevMonthly[i + 1] || ({} as MonthlyPLData)),
                    aggregateYear(prevMonthly),
                ];
                return buildData(monthLabels, monthActual, monthTarget, monthPrev);
            }
            case 'quarterly':
                return buildData(
                    QUARTER_NAMES,
                    [1, 2, 3, 4].map(q => aggregateQuarter(targetMonthly, q)),
                    [1, 2, 3, 4].map(q => aggregateQuarter(targetMonthlyGoals, q)),
                    [1, 2, 3, 4].map(q => aggregateQuarter(prevMonthly, q))
                );
            case 'half':
                return buildData(
                    HALF_NAMES,
                    [1, 2].map(h => aggregateHalf(targetMonthly, h)),
                    [1, 2].map(h => aggregateHalf(targetMonthlyGoals, h)),
                    [1, 2].map(h => aggregateHalf(prevMonthly, h))
                );
            case 'yearly':
                return buildData(
                    [`${selectedYear}년 합계`],
                    [aggregateYear(targetMonthly)],
                    [aggregateYear(targetMonthlyGoals)],
                    [aggregateYear(prevMonthly)]
                );
            default:
                return { baseLabels: [], data: [], rates: [] };
        }
    }, [divData, prevYearDivData, periodType, selectedYear, divisionInfo, selectedSubDiv, selectedTotalMonth, showTarget, showYoY]);

    const { baseLabels: periodLabels, data: periodData, rates: periodRates } = getPeriodData();

    return {
        divData,
        prevYearDivData,
        divisionInfo,
        periodLabels,
        periodData,
        periodRates
    };
}
