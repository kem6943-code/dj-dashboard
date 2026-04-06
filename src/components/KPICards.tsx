/**
 * KPI 카드 컴포넌트 (Phase 6 - 이중 나눗셈 버그 수정)
 * 
 * 핵심 로직:
 * - raw 데이터는 원(₩) 단위로 aggregateData에 합산되어 들어옴
 * - formatAmount 함수가 이미 /1,000,000을 해서 백만원 단위로 표시함
 * - 비율(재료비율, 영업이익률)은 합산된 원시 금액으로 마지막에 한 번만 계산
 * - 'KR 창원사업부 KPI' 뱃지 완전 삭제됨
 */
import { type DivisionInfo, type MonthlyPLData, formatAmount } from '../utils/dataModel';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardsProps {
    data: MonthlyPLData;
    target: MonthlyPLData;
    divisionInfo: DivisionInfo;
}

export function KPICards({ data, target }: KPICardsProps) {
    // 합산된 원시 금액 (원 단위)
    const actRevenue = data?.revenue || 0;
    const actMaterialCost = data?.materialCost || 0;
    const actOperatingProfit = data?.operatingProfit || 0;
    const actEbt = data?.ebt || 0;

    const targRevenue = target?.revenue || 0;
    const targMaterialCost = target?.materialCost || 0;
    const targOperatingProfit = target?.operatingProfit || 0;
    const targEbt = target?.ebt || 0;

    // 비율: 합산 금액 기반 마지막에 한 번만 계산 (절대 % 끼리 더하지 않음)
    const actMaterialRate = actRevenue !== 0 ? (actMaterialCost / actRevenue) * 100 : 0;
    const actOpRate = actRevenue !== 0 ? (actOperatingProfit / actRevenue) * 100 : 0;
    const targMaterialRate = targRevenue !== 0 ? (targMaterialCost / targRevenue) * 100 : 0;
    const targOpRate = targRevenue !== 0 ? (targOperatingProfit / targRevenue) * 100 : 0;

    const kpis = [
        { label: '매출액', val: actRevenue, targ: targRevenue, isRate: false, colorClass: 'text-blue-600' },
        { label: '재료비율', val: actMaterialRate, targ: targMaterialRate, isRate: true, colorClass: 'text-slate-900' },
        { label: '영업이익', val: actOperatingProfit, targ: targOperatingProfit, isRate: false, colorClass: 'text-slate-900' },
        { label: '영업이익률', val: actOpRate, targ: targOpRate, isRate: true, colorClass: actOpRate < 0 ? 'text-red-500' : 'text-gray-900' },
        { label: '세전이익', val: actEbt, targ: targEbt, isRate: false, colorClass: 'text-slate-900' },
    ];

    // 포맷 함수: 금액은 formatAmount(백만원 자동 변환), 비율은 직접 % 표시
    const fmt = (val: number, isRate: boolean): string => {
        if (isRate) {
            if (val === 0 || isNaN(val) || !isFinite(val)) return '-';
            return `${val.toFixed(1)}%`;
        }
        // formatAmount가 내부적으로 /1,000,000 해서 백만원 단위로 표시
        return formatAmount(val, '백만', 'KRW');
    };

    return (
        <div className="animate-fade-in w-full">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {kpis.map((kpi, idx) => {
                    const displayVal = fmt(kpi.val, kpi.isRate);
                    const displayTarg = fmt(kpi.targ, kpi.isRate);

                    const diff = kpi.val - kpi.targ;
                    const isPositive = diff > 0;
                    const isZero = diff === 0 || kpi.targ === 0;
                    const displayDiff = fmt(Math.abs(diff), kpi.isRate);

                    return (
                        <div key={idx} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-sm font-bold text-slate-400 mb-1">{kpi.label}</h3>
                            <div className="flex items-end gap-2">
                                <span className={`text-2xl font-black tracking-tight ${kpi.colorClass}`}>
                                    {displayVal}
                                </span>
                                {!kpi.isRate && <span className="text-xs text-slate-400 mb-0.5">백만원</span>}
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold bg-slate-50 w-fit px-2 py-1 rounded-md">
                                <span className="text-slate-400">목표</span>
                                <span className="text-slate-600">{displayTarg}</span>
                                <span className="mx-1 text-slate-300">|</span>
                                <span className="flex items-center gap-0.5">
                                    {isZero ? <Minus className="w-3 h-3 text-slate-400" /> : isPositive ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                                    <span className={isZero ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-red-600'}>
                                        {isZero ? '-' : `${isPositive ? '+' : '-'}${displayDiff}`}
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
