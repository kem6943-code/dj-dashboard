/**
 * 전사 사업부 통합 이익표 (Phase 8 - 전면 재설계)
 * 
 * 핵심 변경사항:
 * 1. 폰트 통일: font-mono 제거 → 전역 폰트(Pretendard) 상속
 * 2. 모든 사업부 [목표 vs 실적] 하위 컬럼 분할
 * 3. 멕시코 → 멕시코(가전) + 멕시코(자동차) 독립 컬럼
 * 4. 모든 해외 사업부 원화(KRW) 환산 후 렌더링
 *    → 개별 사업부 합산 === 글로벌(GLOBAL) 일치 보장
 */
import {
    type DataStore,
    CHANGWON_ITEMS,
    ALL_ITEMS_MAP,
    formatAmount,
    createEmptyPLData,
    calculateDerivedFields,
    type MonthlyPLData,
    type DivisionCode,
    type MonthYear,
} from '../utils/dataModel';

interface ConsolidatedTableProps {
    store: DataStore;
    dateRange: { start: MonthYear; end: MonthYear };
    globalActual?: MonthlyPLData;
    globalTarget?: MonthlyPLData;
}

// 테이블 헤더용 가상 사업부 컬럼 정의
// → 멕시코를 가전/자동차로 분리하여 6개 컬럼 구성
interface TableColumn {
    id: string;
    label: string;
    flag: string;
    divCode: DivisionCode;   // 실제 store에서 데이터를 꺼낼 사업부 코드
    subKey?: string;         // 멕시코 서브디비전 키 (homeAppliance, automotive)
    currency: string;
}

const TABLE_COLUMNS: TableColumn[] = [
    { id: 'changwon', label: '창원사업부', flag: '🇰🇷', divCode: 'changwon', currency: 'KRW' },
    { id: 'thailand', label: '태국사업부', flag: '🇹🇭', divCode: 'thailand', currency: 'THB' },
    { id: 'vietnam', label: '베트남사업부', flag: '🇻🇳', divCode: 'vietnam', currency: 'VND' },
    { id: 'mexico_ha', label: '멕시코(가전)', flag: '🇲🇽', divCode: 'mexico', subKey: 'homeAppliance', currency: 'MXN' },
    { id: 'mexico_auto', label: '멕시코(자동차)', flag: '🇲🇽', divCode: 'mexico', subKey: 'automotive', currency: 'MXN' },
];

// dateRange 내 모든 월 생성 유틸
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

// 비율/단위 필드인지 판별
function isRatioOrUnit(key: string): boolean {
    const itemDef = ALL_ITEMS_MAP[key];
    if (itemDef?.type === 'ratio' || itemDef?.type === 'unit') return true;
    if (key.endsWith('Ratio') || key === 'revenuePerHead') return true;
    return false;
}

// MonthlyPLData 리스트를 금액만 안전하게 합산 (비율은 마지막에 재계산)
function safeAggregate(list: MonthlyPLData[]): MonthlyPLData {
    if (list.length === 0) return createEmptyPLData();
    if (list.length === 1) return list[0];

    const agg = createEmptyPLData();
    list.forEach(d => {
        if (!d) return;
        Object.keys(d).forEach(k => {
            if (isRatioOrUnit(k)) return;
            if (typeof d[k] === 'number') {
                agg[k] = ((agg[k] as number) || 0) + (d[k] as number);
            }
        });
    });
    return calculateDerivedFields(agg, true);
}

/**
 * 특정 컬럼(사업부)의 기간 내 데이터를 원화(KRW) 환산하여 반환
 * - 창원(KRW): 환율 없이 원시 합산
 * - 해외사업부: 매 월 (현지 금액 * 해당 월 환율) 한 뒤 합산
 * - 멕시코 서브디비전: subDivMonthly / subDivTargetMonthly에서 추출
 */
function getColumnKRWData(
    store: DataStore,
    col: TableColumn,
    dateRange: { start: MonthYear; end: MonthYear }
): { actual: MonthlyPLData; target: MonthlyPLData } {
    const months = getMonthsInRange(dateRange.start, dateRange.end);
    const krwActList: MonthlyPLData[] = [];
    const krwTargList: MonthlyPLData[] = [];

    months.forEach(({ year, month }) => {
        const divD = store.divisions.find(x => x.divisionCode === col.divCode && x.year === year);
        if (!divD) return;

        const rs = divD.exchangeRates?.[month] || { actual: 1, target: 1 };

        // 원본 데이터 추출: 멕시코 서브인 경우 subDivMonthly, 아니면 monthly
        let act: MonthlyPLData;
        let targ: MonthlyPLData;
        if (col.subKey) {
            act = divD.subDivMonthly?.[col.subKey]?.[month] || createEmptyPLData();
            targ = divD.subDivTargetMonthly?.[col.subKey]?.[month] || createEmptyPLData();
        } else {
            act = divD.monthly?.[month] || createEmptyPLData();
            targ = divD.targetMonthly?.[month] || createEmptyPLData();
        }

        // 원화 환산
        const krwAct = createEmptyPLData();
        const krwTarg = createEmptyPLData();

        Object.keys(act).forEach(key => {
            if (isRatioOrUnit(key)) return; // 비율·단위는 스킵
            if (typeof act[key] === 'number') {
                const val = act[key] as number;
                krwAct[key] = col.currency === 'KRW' ? val : val * (rs.actual || 1);
            }
            if (typeof targ[key] === 'number') {
                const val = targ[key] as number;
                krwTarg[key] = col.currency === 'KRW' ? val : val * (rs.target || 1);
            }
        });

        krwActList.push(calculateDerivedFields(krwAct, true));
        krwTargList.push(calculateDerivedFields(krwTarg, true));
    });

    return {
        actual: safeAggregate(krwActList),
        target: safeAggregate(krwTargList),
    };
}

// 셀 값 포맷 (비율이면 %, 금액이면 백만원)
function formatCell(value: number, isRatio: boolean): string {
    if (isRatio) {
        if (value === 0 || isNaN(value) || !isFinite(value)) return '-';
        return `${value.toFixed(1)}%`;
    }
    return formatAmount(value, '백만', 'KRW');
}

export function ConsolidatedTable({ store, dateRange, globalActual = createEmptyPLData(), globalTarget = createEmptyPLData() }: ConsolidatedTableProps) {
    const periodLabel = `선택기간 누계 (${dateRange.start.year.toString().slice(2)}.${dateRange.start.month}월 ~ ${dateRange.end.year.toString().slice(2)}.${dateRange.end.month}월)`;
    const plItems = CHANGWON_ITEMS;

    // 각 컬럼별 원화 환산 데이터를 미리 계산 (1회만 호출)
    const columnData = TABLE_COLUMNS.map(col => ({
        col,
        ...getColumnKRWData(store, col, dateRange),
    }));


    return (
        <div className="glass-card p-8 bg-white border border-slate-200/60 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">
                    전사 사업부 통합 이익표 <span className="text-blue-600 ml-2">{periodLabel}</span>
                </h3>
                <span className="text-sm font-semibold text-slate-500">단위: 원화 환산(백만원)</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[1400px]">
                    <thead>
                        {/* 1행: 사업부명 (colSpan=2) + 글로벌 (colSpan=2) */}
                        <tr className="bg-slate-50">
                            <th className="py-4 px-3 font-bold tracking-wide text-center text-xs sticky left-0 z-20 bg-slate-50 border-r-2 border-b-2 border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" rowSpan={2}>
                                구분
                            </th>
                            {TABLE_COLUMNS.map(col => (
                                <th
                                    key={col.id}
                                    className="py-3 px-2 font-bold tracking-wide text-center text-xs bg-slate-50 border-r-2 border-b-2 border-slate-300"
                                    colSpan={2}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        {col.flag} {col.label}
                                    </div>
                                </th>
                            ))}
                            <th
                                className="py-3 px-2 font-extrabold tracking-wide text-center text-[13px] bg-blue-50/60 text-blue-900 border-b-2 border-slate-300"
                                colSpan={2}
                            >
                                📈 통합 (GLOBAL)
                            </th>
                        </tr>
                        {/* 2행: 각 사업부 + 글로벌에 목표/실적 서브헤더 */}
                        <tr className="bg-slate-50">
                            {TABLE_COLUMNS.map(col => (
                                <>
                                    <th key={`${col.id}-targ`} className="py-2 px-2 text-[11px] font-bold text-slate-400 text-center border-r border-slate-200 border-b-2 border-slate-300">
                                        목표
                                    </th>
                                    <th key={`${col.id}-act`} className="py-2 px-2 text-[11px] font-bold text-slate-600 text-center border-r-2 border-slate-300 border-b-2 border-slate-300">
                                        실적
                                    </th>
                                </>
                            ))}
                            <th className="py-2 px-2 text-[11px] font-bold text-slate-400 bg-blue-50/40 text-center border-r border-slate-200 border-b-2 border-slate-300">
                                목표
                            </th>
                            <th className="py-2 px-2 text-[11px] font-bold text-blue-800 bg-blue-50/40 text-center border-b-2 border-slate-300">
                                실적
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {plItems.map(item => {
                            const isRatio = item.type === 'ratio';

                            return (
                                <tr key={item.key} className={`border-b border-slate-200 hover:bg-slate-50/50 ${item.isHeader ? 'bg-slate-50/80 font-bold' : ''}`}>
                                    {/* 구분 라벨 */}
                                    <td
                                        className="py-2.5 px-3 font-semibold text-slate-700 bg-slate-50 border-r-2 border-slate-300 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-[13px] whitespace-nowrap"
                                        style={{ paddingLeft: `${(item.indent || 0) * 1.2 + 0.75}rem` }}
                                    >
                                        {item.label}
                                    </td>

                                    {/* 각 사업부 목표 + 실적 셀 */}
                                    {columnData.map(({ col, actual, target }) => {
                                        const actVal = actual[item.key] || 0;
                                        const targVal = target[item.key] || 0;

                                        return (
                                            <>
                                                <td key={`${col.id}-${item.key}-targ`} className="py-2.5 px-2 text-right text-slate-400 text-[12px] bg-white border-r border-slate-200 tabular-nums">
                                                    {formatCell(targVal as number, isRatio)}
                                                </td>
                                                <td key={`${col.id}-${item.key}-act`} className="py-2.5 px-2 text-right text-slate-700 font-semibold text-[13px] bg-white border-r-2 border-slate-300 tabular-nums">
                                                    {formatCell(actVal as number, isRatio)}
                                                </td>
                                            </>
                                        );
                                    })}

                                    {/* 글로벌 통합 목표 + 실적 */}
                                    <td className="py-2.5 px-2 text-right text-slate-500 font-bold text-[13px] bg-blue-50/20 border-r border-slate-200 tabular-nums">
                                        {formatCell((globalTarget[item.key] || 0) as number, isRatio)}
                                    </td>
                                    <td className="py-2.5 px-2 text-right text-blue-900 font-black text-[14px] bg-blue-50/30 tabular-nums">
                                        {formatCell((globalActual[item.key] || 0) as number, isRatio)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
