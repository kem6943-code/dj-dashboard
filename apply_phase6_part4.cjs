const fs = require('fs');
const path = require('path');

const chartsPath = path.join(__dirname, 'src', 'components', 'Charts.tsx');
const consolidatedPath = path.join(__dirname, 'src', 'components', 'ConsolidatedTable.tsx');
const dashboardPath = path.join(__dirname, 'src', 'components', 'Dashboard.tsx');

let content = fs.readFileSync(chartsPath, 'utf8');

// Replace standard signature
const newChartsCode = `import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { type DataStore, type DivisionInfo, type MonthYear } from '../utils/dataModel';

interface ChartsProps {
    store: DataStore;
    divisionInfo: DivisionInfo;
    dateRange: { start: MonthYear, end: MonthYear };
}

export function Charts({ store, divisionInfo, dateRange }: ChartsProps) {
    if (!store) return null;

    const isMXN = divisionInfo.currency === 'MXN';
    const multiplier = isMXN ? 1000 : 1000000;
    const unitText = divisionInfo.currency === 'KRW' ? '백만 원' :
        isMXN ? \`천 \${divisionInfo.currency}\` :
            \`백만 \${divisionInfo.currency}\`;

    const months = [];
    let curY = dateRange.start.year;
    let curM = dateRange.start.month;
    let count = 0;
    while ((curY < dateRange.end.year || (curY === dateRange.end.year && curM <= dateRange.end.month)) && count < 36) {
         months.push({ year: curY, month: curM });
         curM++;
         if (curM > 12) { curM = 1; curY++; }
         count++;
    }

    const chartData = months.map(({ year, month }) => {
        const name = \`\${year.toString().slice(2)}.\${month}\`;
        const divD = store.divisions.find(d => d.divisionCode === divisionInfo.code && d.year === year);
        const ds = divD?.monthly?.[month];

        const hasRevenue = ds && ds.revenue && ds.revenue > 0;
        if (!hasRevenue) {
            return { name, 매출액: null, 재료비: null, 노무비: null, 경비: null, 영업이익: null };
        }

        const revScaled = (ds.revenue || 0) / multiplier;
        const matAmt = (ds.materialCost || ds.rawMaterialCost || 0) / multiplier;
        const laborAmt = (ds.laborCost || 0) / multiplier;
        const overheadAmt = (ds.overhead || 0) / multiplier;
        const opAmt = (ds.operatingProfit || 0) / multiplier;

        return {
            name,
            매출액: Number(revScaled.toFixed(1)),
            재료비: Number(matAmt.toFixed(1)),
            노무비: Number(laborAmt.toFixed(1)),
            경비: Number(overheadAmt.toFixed(1)),
            영업이익: Number(opAmt.toFixed(1)),
        };
    });

    const tooltipFormatter = (value: number | string | undefined, name: string | undefined, props: any) => {
        if (value === undefined || value === null) return ['-', name];
        const valNum = Number(value);
        if (name === '매출액') {
            return [\`\${valNum.toLocaleString()} \${unitText}\`, name];
        }
        const revNum = Number(props.payload.매출액);
        let ratioStr = '';
        if (revNum > 0) {
            const ratio = (valNum / revNum) * 100;
            ratioStr = \` (\${ratio.toFixed(1)}%)\`;
        }
        return [\`\${valNum.toLocaleString()} \${unitText}\${ratioStr}\`, name];
    };

    return (
        <div className="animate-fade-in px-4 w-full">
            <div className="glass-card p-6 shadow-sm border border-slate-200/60 bg-white rounded-2xl w-full">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-base font-bold text-gray-800">기간 실적 누적 막대 추이</h3>
                    <span className="text-[11px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded">단위: {unitText}</span>
                </div>
                <div className="h-80 border border-gray-100 rounded-xl p-4 bg-white shadow-sm w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(val) => val.toLocaleString()} dx={-10} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(val) => val.toLocaleString()} dx={10} />
                            <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: '0 4px 6px -1px var(--shadow-color)', padding: '12px', fontSize: '13px' }} cursor={{ fill: 'var(--bg-muted)', opacity: 0.4 }} />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="circle" />
                            <Bar yAxisId="left" dataKey="재료비" stackId="costs" fill="#94a3b8" radius={[0, 0, 4, 4]} />
                            <Bar yAxisId="left" dataKey="노무비" stackId="costs" fill="#38bdf8" />
                            <Bar yAxisId="left" dataKey="경비" stackId="costs" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="left" dataKey="매출액" fill="#1e40af" radius={[4, 4, 0, 0]} barSize={32} />
                            <Bar yAxisId="right" dataKey="영업이익" fill="#facc15" radius={[4, 4, 0, 0]} barSize={32}>
                                {chartData.map((entry, index) => (
                                    <Cell key={\`cell-\${index}\`} fill={entry.영업이익 && entry.영업이익 < 0 ? '#ef4444' : '#facc15'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
`;
fs.writeFileSync(chartsPath, newChartsCode, 'utf8');

// --- ConsolidatedTable.tsx ---
const newConsolidatedCode = `import {
    type DataStore,
    DIVISIONS,
    ALL_ITEMS_MAP,
    formatAmount,
    createEmptyPLData,
    calculateDerivedFields,
    type MonthlyPLData,
    type DivisionCode,
    type MonthYear,
    CHANGWON_ITEMS
} from '../utils/dataModel';

interface ConsolidatedTableProps {
    store: DataStore;
    dateRange: { start: MonthYear, end: MonthYear };
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

function getDivisionPeriodData(store: DataStore, code: DivisionCode, dateRange: { start: MonthYear, end: MonthYear }) {
    const months = [];
    let curY = dateRange.start.year;
    let curM = dateRange.start.month;
    let count = 0;
    while ((curY < dateRange.end.year || (curY === dateRange.end.year && curM <= dateRange.end.month)) && count < 36) {
         months.push({ year: curY, month: curM });
         curM++;
         if (curM > 12) { curM = 1; curY++; }
         count++;
    }

    const actualList = [];
    const targetList = [];
    let actualRateSum = 0;
    let targetRateSum = 0;
    let rateCount = 0;

    months.forEach(({ year, month }) => {
        const divD = store.divisions.find(x => x.divisionCode === code && x.year === year);
        if (divD) {
            actualList.push(divD.monthly[month] || createEmptyPLData());
            targetList.push(divD.targetMonthly?.[month] || createEmptyPLData());
            const rs = divD.exchangeRates?.[month] || { actual: 1, target: 1, prev: 1 };
            actualRateSum += rs.actual || 1;
            targetRateSum += rs.target || 1;
            rateCount++;
        }
    });

    const avgActualRate = rateCount > 0 ? actualRateSum / rateCount : 1;
    const avgTargetRate = rateCount > 0 ? targetRateSum / rateCount : 1;

    return {
        actualData: aggregateMonthlyList(actualList),
        targetData: aggregateMonthlyList(targetList),
        avgActualRate,
        avgTargetRate
    };
}

export function ConsolidatedTable({ store, dateRange }: ConsolidatedTableProps) {
    const periodLabel = \`선택기간 누계 ({\${dateRange.start.year.toString().slice(2)}.\${dateRange.start.month}월 ~ \${dateRange.end.year.toString().slice(2)}.\${dateRange.end.month}월)\`;
    const headerCols = DIVISIONS.map(d => ({ code: d.code, name: d.name, flag: d.flag, currency: d.currency }));
    const plItems = CHANGWON_ITEMS;

    return (
        <div className="glass-card p-8 bg-white border border-slate-200/60 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">
                    전사 사업부 통합 이익표 <span className="text-blue-600 ml-2">{periodLabel}</span>
                </h3>
                <span className="text-sm font-semibold text-slate-500">단위: 원화 환산(백만원)</span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="border-b-2 border-slate-800">
                            <th className="py-4 px-4 font-bold tracking-wide text-center uppercase text-xs sticky left-0 z-20 bg-slate-50 ring-1 ring-slate-200" rowSpan={2}>구분</th>
                            {headerCols.map(col => (
                                <th key={col.code} className="py-4 px-4 font-bold tracking-wide text-center uppercase text-xs bg-slate-50 border-r border-slate-200" colSpan={2}>
                                    <div className="flex items-center justify-center gap-1.5">{col.flag} {col.name} <span className="text-[10px] text-slate-400 font-normal">({col.currency})</span></div>
                                </th>
                            ))}
                            <th className="py-4 px-4 font-extrabold tracking-wide text-center uppercase text-xs bg-slate-100/50 text-blue-900 border-l-2 border-slate-300" colSpan={2}>📈 통합 (Global)</th>
                        </tr>
                        <tr className="border-b border-slate-300">
                            {headerCols.map(col => (
                                <th key={\`\${col.code}-empty\`} colSpan={2} className="py-2 bg-slate-50 border-r border-slate-200"></th>
                            ))}
                            <th colSpan={2} className="py-2 bg-slate-100/50 border-l-2 border-slate-300"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {plItems.map(item => {
                            let totalTargetKRW = 0;
                            let totalActualKRW = 0;

                            const rowCells = headerCols.map(col => {
                                const { actualData, targetData, avgActualRate, avgTargetRate } = getDivisionPeriodData(store, col.code, dateRange);
                                let actVal = actualData[item.key] || 0;
                                let targVal = targetData[item.key] || 0;

                                if (item.isCalculated && item.type === 'ratio') {
                                    actVal = item.key === 'materialRatio' 
                                        ? (actualData.revenue ? (actualData.materialCost || 0) / actualData.revenue * 100 : 0)
                                        : item.key === 'operatingProfitRatio'
                                            ? (actualData.revenue ? (actualData.operatingProfit || 0) / actualData.revenue * 100 : 0)
                                            : 0;
                                    targVal = item.key === 'materialRatio' 
                                        ? (targetData.revenue ? (targetData.materialCost || 0) / targetData.revenue * 100 : 0)
                                        : item.key === 'operatingProfitRatio'
                                            ? (targetData.revenue ? (targetData.operatingProfit || 0) / targetData.revenue * 100 : 0)
                                            : 0;
                                }

                                if (!item.isCalculated || item.type !== 'ratio') {
                                    const convAct = col.currency === 'KRW' ? actVal : (actVal * avgActualRate) / 1000000;
                                    const convTarg = col.currency === 'KRW' ? targVal : (targVal * avgTargetRate) / 1000000;
                                    totalActualKRW += convAct;
                                    totalTargetKRW += convTarg;
                                }

                                return <td key={col.code} className="py-3 px-4 font-semibold text-right text-slate-700 font-mono tracking-tight bg-white border-r border-slate-100">{formatAmount(actVal, col.currency === 'KRW' ? '백만' : '원본', '')}</td>;
                            });

                            let totalActVal = totalActualKRW;
                            let totalTargVal = totalTargetKRW;

                            return (
                                <tr key={item.key} className={\`border-b border-slate-100 hover:bg-slate-50/50 \${item.isHeader ? 'bg-slate-50/80 font-bold' : ''}\`}>
                                    <td className="py-3 px-4 font-semibold text-slate-700 bg-slate-50 border-r border-slate-200 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" style={{ paddingLeft: \`\${(item.indent || 0) * 1.5 + 1}rem\` }}>{item.label}</td>
                                    {rowCells}
                                    <td className="py-3 px-4 text-right font-black text-blue-900 bg-blue-50/30 font-mono text-[15px]">{formatAmount(totalTargVal, '원본', '')}</td>
                                    <td className="py-3 px-4 text-right font-black text-blue-900 bg-blue-50/30 font-mono text-[15px]">{formatAmount(totalActVal, '원본', '')}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
`;
fs.writeFileSync(consolidatedPath, newConsolidatedCode, 'utf8');

// Patch Dashboard.tsx again to fix the <Charts /> invocation
let dash = fs.readFileSync(dashboardPath, 'utf8');
dash = dash.replace(
    /<Charts divData=\{divData as any\} prevYearData=\{prevYearDivData \?\? undefined\} divisionInfo=\{divisionInfo\} year=\{dateRange\.end\.year\} chartPayload=\{periodData\} \/>/g,
    '<Charts store={store} divisionInfo={divisionInfo} dateRange={dateRange} />'
);
dash = dash.replace(
    /chartPayload=\{periodData\}/g,
    ''
);
fs.writeFileSync(dashboardPath, dash, 'utf8');

console.log('Finished apply_phase6_part4.cjs');
