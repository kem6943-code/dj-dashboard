const fs = require('fs');
const path = require('path');

const kpiPath = path.join(__dirname, 'src', 'components', 'KPICards.tsx');

const kpiCode = `import { useState, useMemo, useEffect } from 'react';
import { type DivisionYearData, type DivisionInfo, MONTH_NAMES, aggregateYear } from '../utils/dataModel';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardsProps {
    divData: DivisionYearData;
    divisionInfo: DivisionInfo;
}

const formatValue = (val: number, isRate: boolean = false) => {
    if (val === 0 || isNaN(val) || !isFinite(val) || val === undefined) return '-';
    if (isRate) return \`\${(val * 100).toFixed(1)}%\`;
    return Math.round(val).toLocaleString();
};

export function KPICards({ divData, divisionInfo }: KPICardsProps) {
    const [localPeriodType, setLocalPeriodType] = useState<'YTD' | 'monthly'>('YTD');
    const [localPeriodIndex, setLocalPeriodIndex] = useState(1);

    // 가용 월 산출
    const availableMonths = useMemo(() => {
        return Object.keys(divData.monthly ?? {}).map(Number).filter(m => divData.monthly[m]?.revenue !== 0);
    }, [divData]);

    // 연도/데이터 갱신 시 필터 초기화 또는 최신 월로 폴백
    useEffect(() => {
        setLocalPeriodType('YTD');
        if (availableMonths.length > 0) {
            setLocalPeriodIndex(Math.max(...availableMonths));
        }
    }, [divData, availableMonths]);

    const activeData = useMemo(() => {
        if (localPeriodType === 'monthly' && divData.monthly[localPeriodIndex]) return divData.monthly[localPeriodIndex];
        return aggregateYear(divData.monthly);
    }, [divData, localPeriodType, localPeriodIndex]);

    const activeTarget = useMemo(() => {
        if (localPeriodType === 'monthly' && divData.targetMonthly?.[localPeriodIndex]) return divData.targetMonthly[localPeriodIndex];
        return aggregateYear(divData.targetMonthly || {});
    }, [divData, localPeriodType, localPeriodIndex]);

    const kpis = [
        { key: 'revenue', label: '매출액', isRate: false, colorClass: 'text-blue-600' },
        { key: 'materialCostRate', label: '재료비율', isRate: true, colorClass: 'text-slate-900', compute: (d: any) => d.revenue ? d.materialCost / d.revenue : 0, computeTarget: (t: any) => t.revenue ? t.materialCost / t.revenue : 0 },
        { key: 'operatingProfit', label: '영업이익', isRate: false, colorClass: 'text-slate-900' },
        { key: 'operatingProfitRate', label: '영업이익률', isRate: true, colorClass: 'text-red-600', compute: (d: any) => d.revenue ? d.operatingProfit / d.revenue : 0, computeTarget: (t: any) => t.revenue ? t.operatingProfit / t.revenue : 0 },
        { key: 'ebt', label: '세전이익', isRate: false, colorClass: 'text-slate-900' },
    ];

    return (
        <div className="animate-fade-in w-full">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                    {divisionInfo.flag} {divisionInfo.name} KPI
                </span>
                
                {/* KPI 임원용 요약 조회 필터 */}
                <div className="flex items-center gap-2 bg-white border border-slate-200/60 rounded-xl px-2 py-1 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 pl-2">기간 요약:</span>
                    <select className="bg-transparent border-none text-slate-700 text-sm focus:ring-0 cursor-pointer font-bold outline-none" value={localPeriodType} onChange={(e) => setLocalPeriodType(e.target.value as any)}>
                        <option value="YTD">YTD 누적</option>
                        {availableMonths.length > 0 && <option value="monthly">월별 조회</option>}
                    </select>
                    {localPeriodType === 'monthly' && (
                        <select className="bg-transparent border-l border-slate-200 pl-2 text-slate-700 text-sm focus:ring-0 cursor-pointer font-bold outline-none" value={localPeriodIndex} onChange={(e) => setLocalPeriodIndex(Number(e.target.value))}>
                            {availableMonths.map(m => <option key={m} value={m}>{MONTH_NAMES[m-1]}</option>)}
                        </select>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {kpis.map((kpi, idx) => {
                    const val = kpi.compute ? kpi.compute(activeData) : (activeData as any)[kpi.key];
                    const target = kpi.computeTarget ? kpi.computeTarget(activeTarget) : (activeTarget as any)[kpi.key];
                    const diff = (val || 0) - (target || 0);
                    const isPositive = diff > 0;
                    const isZero = diff === 0 || !target || target === 0;

                    return (
                        <div key={idx} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-sm font-bold text-slate-400 mb-1">{kpi.label}</h3>
                            <div className="flex items-end gap-2">
                                <span className={\`text-2xl font-black tracking-tight \${kpi.colorClass}\`}>
                                    {formatValue(val, kpi.isRate)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold bg-slate-50 w-fit px-2 py-1 rounded-md">
                                <span className="text-slate-400">목표 </span>
                                <span className="text-slate-600">{formatValue(target, kpi.isRate)}</span>
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

fs.writeFileSync(kpiPath, kpiCode, 'utf8');

console.log('Successfully fixed KPICards.tsx!');
