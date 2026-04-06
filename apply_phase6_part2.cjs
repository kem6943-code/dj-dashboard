const fs = require('fs');
const path = require('path');

const usePeriodPath = path.join(__dirname, 'src', 'hooks', 'usePeriodData.ts');

const usePeriodCode = `import { useMemo } from 'react';
import { type DataStore, type DivisionCode, type MonthlyPLData, type MonthYear, MONTH_NAMES, calculateDerivedFields, createEmptyPLData, ALL_ITEMS_MAP } from '../utils/dataModel';
import { DIVISIONS_WITH_TOTAL } from '../utils/dataModel';

interface UsePeriodDataProps {
    store: DataStore | null;
    selectedDivision: DivisionCode;
    dateRange: { start: MonthYear, end: MonthYear };
    selectedSubDiv: string;
    showTarget: boolean;
    showYoY: boolean;
}

function getMonthsInRange(start: MonthYear, end: MonthYear): MonthYear[] {
    const months = [];
    let curY = start.year;
    let curM = start.month;
    // 최대 36개월 제한 (성능/UI 폭발 방지)
    let count = 0;
    while ((curY < end.year || (curY === end.year && curM <= end.month)) && count < 36) {
         months.push({ year: curY, month: curM });
         curM++;
         if (curM > 12) { curM = 1; curY++; }
         count++;
    }
    return months;
}

function aggregateMonthlyList(list: MonthlyPLData[]): MonthlyPLData {
    const agg = createEmptyPLData();
    list.forEach(d => {
        if (!d) return;
        Object.entries(ALL_ITEMS_MAP).forEach(([k, item]) => {
            if (!item.isCalculated && typeof d[k] === 'number') {
                agg[k] = (agg[k] || 0) + d[k];
            }
        });
    });
    return calculateDerivedFields(agg, true);
}

export function usePeriodData({ store, selectedDivision, dateRange, selectedSubDiv, showTarget, showYoY }: UsePeriodDataProps) {
    const divisionInfo = useMemo(() => DIVISIONS_WITH_TOTAL.find(d => d.code === selectedDivision)!, [selectedDivision]);

    return useMemo(() => {
        if (!store) return { periodLabels: [], periodData: [], periodRates: [], aggregateData: createEmptyPLData(), aggregateTarget: createEmptyPLData() };

        const months = getMonthsInRange(dateRange.start, dateRange.end);
        const periodLabels: string[] = [];
        const periodData: MonthlyPLData[] = [];
        const periodRates: number[] = [];

        const isSubDiv = divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all';
        const isColumns = divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'columns';

        const listActual: MonthlyPLData[] = [];
        const listTarget: MonthlyPLData[] = [];

        months.forEach(({ year, month }) => {
            const label = \`\${year.toString().slice(2)}.\${month}월\`;
            
            const divData = store.divisions.find(d => d.divisionCode === selectedDivision && d.year === year);
            const prevDivData = store.divisions.find(d => d.divisionCode === selectedDivision && d.year === year - 1);

            let act = (isSubDiv ? divData?.subDivMonthly?.[selectedSubDiv]?.[month] : divData?.monthly?.[month]) || createEmptyPLData();
            let targ = (isSubDiv ? divData?.subDivTargetMonthly?.[selectedSubDiv]?.[month] : divData?.targetMonthly?.[month]) || createEmptyPLData();
            let prev = (isSubDiv ? prevDivData?.subDivMonthly?.[selectedSubDiv]?.[month] : prevDivData?.monthly?.[month]) || createEmptyPLData();

            const rs = divData?.exchangeRates?.[month] || { actual: 1, target: 1, prev: 1 };
            const prs = prevDivData?.exchangeRates?.[month] || { actual: 1, target: 1, prev: 1 };

            listActual.push(act);
            listTarget.push(targ);

            if (isColumns) {
                // columns 모드면 periodLabels 생성 기준이 다름 (Dashboard에서 별도 렌더링)
                return;
            }

            if (showYoY) {
                periodData.push(prev);
                periodRates.push(prs.actual !== 1 && prs.actual !== undefined ? prs.actual : (prs.prev || 1));
            }
            
            periodData.push(act);
            periodRates.push(rs.actual || 1);
            
            if (showTarget) {
                periodData.push(targ);
                periodRates.push(rs.target || 1);
            }

            periodLabels.push(label);
        });

        if (isColumns && months.length > 0) {
            // columns 모드는 선택된 범위의 "합계"만을 서브디비전별로 매핑해서 periodData 배열로 반환!
            const actSum = createEmptyPLData();
            const targSum = createEmptyPLData();
            let sumRs = { actual: 1, target: 1 }; // 임시
            
            divisionInfo.subDivisions?.forEach(sub => {
                const subList: MonthlyPLData[] = [];
                const subTargList: MonthlyPLData[] = [];
                months.forEach(({ year, month }) => {
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
            const totalAct = aggregateMonthlyList(listActual);
            const totalTarg = aggregateMonthlyList(listTarget);
            
            if (showTarget) {
                periodData.push(totalTarg, totalAct);
                periodRates.push(sumRs.target, sumRs.actual);
            } else {
                periodData.push(totalAct);
                periodRates.push(sumRs.actual);
            }
        }

        if (!isColumns) {
            // 일반 모드의 "기간 합계" (누계)
            periodLabels.push('기간 합계');
            const aggAct = aggregateMonthlyList(listActual);
            const aggTarg = aggregateMonthlyList(listTarget);
            const aggPrev = createEmptyPLData(); // 임시로 YoY 합계 빈값

            if (showYoY) {
                periodData.push(aggPrev);
                periodRates.push(1);
            }
            periodData.push(aggAct);
            periodRates.push(1); // 누계 환율은 1 적용 (PLTable 내부에서 이미 각월 원화환산 후 계산하도록 Dashboard를 맞춰야 함)
            // 주의: PLTable은 rates 배열이 들어오면 각 컬럼에 환율을 곱함.
            // 월별 환산 시 각 월 환율이 다르면 누계의 역추산 환율은 무의미. 
            // 현재 구조상 PLTable은 periodRates 숫자를 받아 일괄 곱함. 
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
            aggregateData: aggregateMonthlyList(listActual),
            aggregateTarget: aggregateMonthlyList(listTarget),
            monthsList: months
        };

    }, [store, selectedDivision, dateRange, selectedSubDiv, showTarget, showYoY, divisionInfo]);
}
`;
fs.writeFileSync(usePeriodPath, usePeriodCode, 'utf8');

console.log('Finished usePeriodData.ts override');
