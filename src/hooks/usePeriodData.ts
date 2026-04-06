/**
 * usePeriodData 훅 (Phase 7: intervalType 집계 지원)
 * 
 * - dateRange + intervalType(월별/분기별/반기별/연간)에 따라
 *   개별 월 데이터를 그룹핑 → 합산(aggregate) → periodLabels/periodData 배열로 반환
 * - 비율(%)은 금액 합산 후 마지막에 calculateDerivedFields로 한 번만 계산
 */
import { useMemo } from 'react';
import {
    type DataStore, type DivisionCode, type MonthlyPLData, type MonthYear,
    calculateDerivedFields, createEmptyPLData, ALL_ITEMS_MAP,
    DIVISIONS_WITH_TOTAL,
} from '../utils/dataModel';

export type IntervalType = 'monthly' | 'quarterly' | 'semi' | 'yearly';

interface UsePeriodDataProps {
    store: DataStore | null;
    selectedDivision: DivisionCode;
    dateRange: { start: MonthYear; end: MonthYear };
    intervalType: IntervalType;
    selectedSubDiv: string;
    showTarget: boolean;
    showYoY: boolean;
}

// 시작~종료 사이의 모든 연/월 조합 생성 (최대 36개월)
function getMonthsInRange(start: MonthYear, end: MonthYear): MonthYear[] {
    const months: MonthYear[] = [];
    let curY = start.year;
    let curM = start.month;
    let count = 0;
    while ((curY < end.year || (curY === end.year && curM <= end.month)) && count < 36) {
        months.push({ year: curY, month: curM });
        curM++;
        if (curM > 12) { curM = 1; curY++; }
        count++;
    }
    return months;
}

// MonthlyPLData 리스트를 금액(amount)·인원(count)만 합산
// ⚠️ 비율(ratio)·단위(unit)는 절대 단순 덧셈 금지 → calculateDerivedFields가 마지막에 한 번만 재계산
function aggregateMonthlyList(list: MonthlyPLData[]): MonthlyPLData {
    // 단월 데이터: 합산 불필요 → 원본 그대로 반환 (수동 입력 보존)
    if (list.length === 1) return list[0];
    if (list.length === 0) return createEmptyPLData();

    const agg = createEmptyPLData();
    list.forEach(d => {
        if (!d) return;
        Object.entries(ALL_ITEMS_MAP).forEach(([k, item]) => {
            // 비율(%)과 단위 필드는 합산하면 안 됨 (예: 88% + 67% = 155% 방지)
            if (!item.isCalculated && item.type !== 'ratio' && item.type !== 'unit' && typeof d[k] === 'number') {
                agg[k] = (agg[k] || 0) + d[k];
            }
        });
        // isCalculated=true이지만 금액인 핵심 필드는 별도 합산
        agg.revenue = (agg.revenue || 0) + (d.revenue || 0);
        agg.materialCost = (agg.materialCost || 0) + (d.materialCost || 0);
        agg.operatingProfit = (agg.operatingProfit || 0) + (d.operatingProfit || 0);
        agg.ebt = (agg.ebt || 0) + (d.ebt || 0);
        agg.nonOpBalance = (agg.nonOpBalance || 0) + (d.nonOpBalance || 0);
    });
    // 합산된 금액으로 비율 재계산 (preserveAmounts=true: 합산 금액 보존, 비율만 재산출)
    return calculateDerivedFields(agg, true);
}

// intervalType에 따라 월 배열을 그룹핑
interface MonthGroup {
    label: string;
    months: MonthYear[];
}

function groupMonthsByInterval(months: MonthYear[], intervalType: IntervalType): MonthGroup[] {
    if (intervalType === 'monthly') {
        return months.map(m => ({
            label: `${m.year.toString().slice(2)}.${m.month}월`,
            months: [m],
        }));
    }

    if (intervalType === 'quarterly') {
        const map = new Map<string, MonthGroup>();
        months.forEach(m => {
            const q = Math.ceil(m.month / 3);
            const key = `${m.year}-Q${q}`;
            if (!map.has(key)) map.set(key, { label: `${m.year.toString().slice(2)}년 ${q}Q`, months: [] });
            map.get(key)!.months.push(m);
        });
        return Array.from(map.values());
    }

    if (intervalType === 'semi') {
        const map = new Map<string, MonthGroup>();
        months.forEach(m => {
            const h = m.month <= 6 ? 1 : 2;
            const key = `${m.year}-H${h}`;
            if (!map.has(key)) map.set(key, { label: `${m.year.toString().slice(2)}년 ${h === 1 ? '상반기' : '하반기'}`, months: [] });
            map.get(key)!.months.push(m);
        });
        return Array.from(map.values());
    }

    // yearly
    const map = new Map<string, MonthGroup>();
    months.forEach(m => {
        const key = `${m.year}`;
        if (!map.has(key)) map.set(key, { label: `${m.year}년`, months: [] });
        map.get(key)!.months.push(m);
    });
    return Array.from(map.values());
}

export function usePeriodData({
    store, selectedDivision, dateRange, intervalType, selectedSubDiv, showTarget, showYoY,
}: UsePeriodDataProps) {
    const divisionInfo = useMemo(
        () => DIVISIONS_WITH_TOTAL.find(d => d.code === selectedDivision)!,
        [selectedDivision],
    );

    return useMemo(() => {
        if (!store) {
            return {
                periodLabels: [] as string[], periodData: [] as MonthlyPLData[],
                periodRates: [] as number[], aggregateData: createEmptyPLData(),
                aggregateTarget: createEmptyPLData(), divisionInfo, monthsList: [] as MonthYear[],
            };
        }

        const allMonths = getMonthsInRange(dateRange.start, dateRange.end);

        if (selectedDivision === 'total') {
            const totalActualList: MonthlyPLData[] = [];
            const totalTargetList: MonthlyPLData[] = [];

            allMonths.forEach(({ year, month }) => {
                const combinedActual = createEmptyPLData();
                const combinedTarget = createEmptyPLData();
                
                DIVISIONS_WITH_TOTAL.forEach(div => {
                    if (div.code === 'total') return;
                    const divD = store.divisions.find(d => d.divisionCode === div.code && d.year === year);
                    if (divD) {
                        const act = divD.monthly?.[month] || createEmptyPLData();
                        const targ = divD.targetMonthly?.[month] || createEmptyPLData();
                        const rs = divD.exchangeRates?.[month] || { actual: 1, target: 1 };
                        
                        if (div.code === 'thailand' && month === 1 && act.revenue) {
                            console.log(`[검증 로그: 1월 태국 매출(THB) ${act.revenue} * 환율 ${rs.actual} = 원화(백만) ${(act.revenue * (rs.actual || 1)) / 1000000}]`);
                        }

                        // 통합 단위(원화 합산) - 비율 필드는 환율 적용/합산에서 완전히 제외
                        Object.keys(act).forEach(key => {
                            const k = key as keyof MonthlyPLData;
                            const itemDef = ALL_ITEMS_MAP[k as string];
                            // 비율(%)이나 단위당 매출 같은 지표는 더하지 않음
                            if (itemDef?.type === 'ratio' || itemDef?.type === 'unit' || String(k).endsWith('Ratio') || k === 'revenuePerHead') {
                                return;
                            }

                            if (typeof act[k] === 'number') {
                                const valAct = act[k] as number;
                                const convAct = div.currency === 'KRW' ? valAct : (valAct * (rs.actual || 1));
                                combinedActual[k] = ((combinedActual[k] as number) || 0) + convAct;
                            }
                            if (typeof targ[k] === 'number') {
                                const valTarg = targ[k] as number;
                                const convTarg = div.currency === 'KRW' ? valTarg : (valTarg * (rs.target || 1));
                                combinedTarget[k] = ((combinedTarget[k] as number) || 0) + convTarg;
                            }
                        });
                    }
                });
                
                // 각 월별 합산 결과는 비율을 재계산(단월 보존)하여 목록에 추가
                totalActualList.push(calculateDerivedFields(combinedActual, true));
                totalTargetList.push(calculateDerivedFields(combinedTarget, true));
            });

            return {
                divisionInfo,
                periodLabels: [],
                periodData: [],
                periodRates: [],
                // [버그 수정] 무지성 전체 키 합산(.reduce)를 버리고, accumulatePLList를 통해
                // 절대 금액(revenue, cost)은 안전하게 더하고, 비율(%)은 합산하지 않은 뒤 마지막에 1회 산출(preserveAmounts=false)
                aggregateData: aggregateMonthlyList(totalActualList),
                aggregateTarget: aggregateMonthlyList(totalTargetList),
                monthsList: allMonths,
            };
        }

        const groups = groupMonthsByInterval(allMonths, intervalType);

        const isSubDiv = divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all';
        const isColumns = divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'columns';

        const periodLabels: string[] = [];
        const periodData: MonthlyPLData[] = [];
        const periodRates: number[] = [];

        const allActual: MonthlyPLData[] = [];
        const allTarget: MonthlyPLData[] = [];

        // 각 그룹(기간 단위)별로 데이터를 합산
        groups.forEach(group => {
            const groupActList: MonthlyPLData[] = [];
            const groupTargList: MonthlyPLData[] = [];
            const groupPrevList: MonthlyPLData[] = [];
            
            // 각 데이터 타입별 환율 합산 분리
            let rateSumAct = 0;
            let rateSumTarg = 0;
            let rateSumPrev = 0;
            let rateCountAct = 0;
            let rateCountTarg = 0;
            let rateCountPrev = 0;

            group.months.forEach(({ year, month }) => {
                const divData = store.divisions.find(d => d.divisionCode === selectedDivision && d.year === year);
                const prevDivData = store.divisions.find(d => d.divisionCode === selectedDivision && d.year === year - 1);

                const act = (isSubDiv ? divData?.subDivMonthly?.[selectedSubDiv]?.[month] : divData?.monthly?.[month]) || createEmptyPLData();
                const targ = (isSubDiv ? divData?.subDivTargetMonthly?.[selectedSubDiv]?.[month] : divData?.targetMonthly?.[month]) || createEmptyPLData();
                const prev = (isSubDiv ? prevDivData?.subDivMonthly?.[selectedSubDiv]?.[month] : prevDivData?.monthly?.[month]) || createEmptyPLData();

                groupActList.push(act);
                groupTargList.push(targ);
                groupPrevList.push(prev);

                const rsAct = divData?.exchangeRates?.[month] || { actual: 1, target: 1 };
                const rsPrev = prevDivData?.exchangeRates?.[month] || { actual: 1, target: 1 };

                // '26실적 환율
                rateSumAct += rsAct.actual || 1;
                rateCountAct++;
                
                // TD목표 환율
                rateSumTarg += rsAct.target || 1;
                rateCountTarg++;

                // '25실적 환율 (prevYear 데이터의 actual 환율 적용)
                rateSumPrev += rsPrev.actual || 1;
                rateCountPrev++;
            });

            allActual.push(...groupActList);
            allTarget.push(...groupTargList);

            if (isColumns) return; // columns 모드는 아래에서 별도 처리

            const groupAct = aggregateMonthlyList(groupActList);
            const groupTarg = aggregateMonthlyList(groupTargList);
            const groupPrev = aggregateMonthlyList(groupPrevList);
            
            const avgRateAct = rateCountAct > 0 ? rateSumAct / rateCountAct : 1;
            const avgRateTarg = rateCountTarg > 0 ? rateSumTarg / rateCountTarg : 1;
            const avgRatePrev = rateCountPrev > 0 ? rateSumPrev / rateCountPrev : 1;

            if (showYoY) {
                periodData.push(groupPrev);
                periodRates.push(avgRatePrev);
            }

            periodData.push(groupAct);
            periodRates.push(avgRateAct);

            if (showTarget) {
                periodData.push(groupTarg);
                periodRates.push(avgRateTarg);
            }

            periodLabels.push(group.label);
        });

        if (isColumns && allMonths.length > 0) {
            const sumRs = { actual: 1, target: 1 };
            divisionInfo.subDivisions?.forEach(sub => {
                const subList: MonthlyPLData[] = [];
                const subTargList: MonthlyPLData[] = [];
                allMonths.forEach(({ year, month }) => {
                    const d = store.divisions.find(x => x.divisionCode === selectedDivision && x.year === year);
                    subList.push(d?.subDivMonthly?.[sub.key]?.[month] || createEmptyPLData());
                    subTargList.push(d?.subDivTargetMonthly?.[sub.key]?.[month] || createEmptyPLData());
                });
                const sAct = aggregateMonthlyList(subList);
                const sTarg = aggregateMonthlyList(subTargList);
                if (showTarget) {
                    periodData.push(sTarg, sAct);
                    periodRates.push(sumRs.target, sumRs.actual);
                } else {
                    periodData.push(sAct);
                    periodRates.push(sumRs.actual);
                }
            });
            periodLabels.push('선택기간 누계');
            const totalAct = aggregateMonthlyList(allActual);
            const totalTarg = aggregateMonthlyList(allTarget);
            if (showTarget) {
                periodData.push(totalTarg, totalAct);
                periodRates.push(sumRs.target, sumRs.actual);
            } else {
                periodData.push(totalAct);
                periodRates.push(sumRs.actual);
            }
        }

        if (!isColumns) {
            // 기간 합계 (모든 그룹의 총합)
            periodLabels.push('기간 합계');
            const aggAct = aggregateMonthlyList(allActual);
            const aggTarg = aggregateMonthlyList(allTarget);
            const aggPrev = createEmptyPLData();

            if (showYoY) {
                periodData.push(aggPrev);
                periodRates.push(1);
            }
            periodData.push(aggAct);
            periodRates.push(1);
            if (showTarget) {
                periodData.push(aggTarg);
                periodRates.push(1);
            }
        }

        return {
            divisionInfo,
            periodLabels,
            periodData,
            periodRates,
            aggregateData: aggregateMonthlyList(allActual),
            aggregateTarget: aggregateMonthlyList(allTarget),
            monthsList: allMonths,
        };
    }, [store, selectedDivision, dateRange, intervalType, selectedSubDiv, showTarget, showYoY, divisionInfo]);
}
