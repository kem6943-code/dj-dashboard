const fs = require('fs');
const path = require('path');

const dataModelPath = path.join(__dirname, 'src', 'utils', 'dataModel.ts');
const useDashboardPath = path.join(__dirname, 'src', 'hooks', 'useDashboardData.ts');
const dashboardPath = path.join(__dirname, 'src', 'components', 'Dashboard.tsx');
const kpiPath = path.join(__dirname, 'src', 'components', 'KPICards.tsx');
const usePeriodPath = path.join(__dirname, 'src', 'hooks', 'usePeriodData.ts');
const chartsPath = path.join(__dirname, 'src', 'components', 'Charts.tsx');
const consolidatedPath = path.join(__dirname, 'src', 'components', 'ConsolidatedTable.tsx');
const dataInputModalPath = path.join(__dirname, 'src', 'components', 'DataInputModal.tsx');
const plTablePath = path.join(__dirname, 'src', 'components', 'PLTable.tsx');

// --- 1. dataModel.ts Additions ---
let dataModelCode = fs.readFileSync(dataModelPath, 'utf8');

const newDataModelCode = `
export interface MonthYear {
    year: number;
    month: number;
}

export function getEarliestYearMonth(store: DataStore): MonthYear {
    let earliest = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
    store.divisions.forEach(div => {
        const months = Object.keys(div.monthly || {}).map(Number).filter(m => div.monthly[m]?.revenue !== 0);
        if (months.length > 0) {
            const minM = Math.min(...months);
            if (div.year < earliest.year || (div.year === earliest.year && minM < earliest.month)) {
                earliest = { year: div.year, month: minM };
            }
        }
    });
    return earliest;
}
`;

if (!dataModelCode.includes('export interface MonthYear')) {
    dataModelCode += '\\n' + newDataModelCode;
    fs.writeFileSync(dataModelPath, dataModelCode, 'utf8');
}

// --- 2. KPICards.tsx ---
const newKpiCode = `import { useState, useMemo, useEffect } from 'react';
import { type DivisionInfo, type MonthlyPLData } from '../utils/dataModel';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardsProps {
    data: MonthlyPLData;
    target: MonthlyPLData;
    divisionInfo: DivisionInfo;
}

const formatValue = (val: number | undefined, isRate: boolean = false) => {
    if (val === 0 || val === undefined || isNaN(val) || !isFinite(val)) return '-';
    if (isRate) return \`\${(val * 100).toFixed(1)}%\`;
    return Math.round(val).toLocaleString();
};

export function KPICards({ data, target, divisionInfo }: KPICardsProps) {
    const kpis = [
        { key: 'revenue', label: '매출액', isRate: false, colorClass: 'text-blue-600' },
        { key: 'materialCostRate', label: '재료비율', isRate: true, colorClass: 'text-slate-900', compute: (d: any) => d?.revenue ? d.materialCost / d.revenue : 0 },
        { key: 'operatingProfit', label: '영업이익', isRate: false, colorClass: 'text-slate-900' },
        { key: 'operatingProfitRate', label: '영업이익률', isRate: true, colorClass: 'text-red-600', compute: (d: any) => d?.revenue ? d.operatingProfit / d.revenue : 0 },
        { key: 'ebt', label: '세전이익', isRate: false, colorClass: 'text-slate-900' },
    ];

    return (
        <div className="animate-fade-in w-full">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                    {divisionInfo.flag} {divisionInfo.name} KPI
                </span>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {kpis.map((kpi, idx) => {
                    const val = kpi.compute ? kpi.compute(data) : (data as any)?.[kpi.key];
                    const targ = kpi.compute ? kpi.compute(target) : (target as any)?.[kpi.key];
                    const diff = (val || 0) - (targ || 0);
                    const isPositive = diff > 0;
                    const isZero = diff === 0 || !targ || targ === 0;

                    return (
                        <div key={idx} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-sm font-bold text-slate-400 mb-1">{kpi.label}</h3>
                            <div className="flex items-end gap-2">
                                <span className={\`text-2xl font-black tracking-tight \${kpi.colorClass}\`}>
                                    {formatValue(val, kpi.isRate)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold bg-slate-50 w-fit px-2 py-1 rounded-md">
                                <span className="text-slate-400">목표</span>
                                <span className="text-slate-600">{formatValue(targ, kpi.isRate)}</span>
                                <span className="mx-1 text-slate-300">|</span>
                                <span className="flex items-center gap-0.5">
                                    {isZero ? <Minus className="w-3 h-3 text-slate-400" /> : isPositive ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                                    <span className={isZero ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-red-600'}>
                                        {isZero ? '-' : \`\${isPositive ? '+' : ''}\${formatValue(Math.abs(diff), kpi.isRate)}\`}
                                    </span>
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
`;
fs.writeFileSync(kpiPath, newKpiCode, 'utf8');

// --- 3. useDashboardData.ts ---
let dData = fs.readFileSync(useDashboardPath, 'utf8');
dData = dData.replace(
    /export function useDashboardData\(selectedDivision: DivisionCode, selectedYear: number\) \{/,
    'export function useDashboardData(selectedDivision: DivisionCode) {'
);
dData = dData.replace(
    /const targetYear = dataType === 'prevYear' \? selectedYear - 1 : selectedYear;/,
    '// removed targetYear'
);
dData = dData.replace(
    /handleSaveData = async \(\s*month: number,/,
    'handleSaveData = async (\\n        targetYear: number,\\n        month: number,'
);
fs.writeFileSync(useDashboardPath, dData, 'utf8');

console.log('Finished preliminary stubbing of partial files.');
