/**
 * KPI 카드 컴포넌트 — 해외 사업부 듀얼 통화 표기 지원
 * 
 * - 창원(KRW): 기존 백만원 단일 표기
 * - 해외(THB/VND/MXN): 현지통화 메인 + (약 XX 백만원) 서브 표기
 * - 원화 환산은 월별 개별 환율을 각각 적용한 합산(가중평균)
 */
import { type DivisionInfo, type MonthlyPLData, formatAmount } from '../utils/dataModel';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// 통화별 단위 표기
const CURRENCY_UNIT: Record<string, string> = {
    KRW: '백만원', THB: '백만THB', VND: '백만VND', MXN: '천MXN',
};
// 통화별 나눗셈 단위 (표시용)
const CURRENCY_DIVISOR: Record<string, number> = {
    KRW: 1_000_000, THB: 1_000_000, VND: 1_000_000, MXN: 1_000,
};

interface KPICardsProps {
    data: MonthlyPLData;
    target: MonthlyPLData;
    divisionInfo: DivisionInfo;
    // 해외 사업부용: 월별 환율 적용 KRW 합산 데이터 (Dashboard에서 계산하여 전달)
    dataKRW?: MonthlyPLData;
    targetKRW?: MonthlyPLData;
}

export function KPICards({ data, target, divisionInfo, dataKRW, targetKRW }: KPICardsProps) {
    const currency = divisionInfo?.currency || 'KRW';
    const isOverseas = currency !== 'KRW';

    // 합산된 원시 금액 (현지통화 단위)
    const actRevenue = data?.revenue || 0;
    const actMaterialCost = data?.materialCost || 0;
    const actOperatingProfit = data?.operatingProfit || 0;
    const actEbt = data?.ebt || 0;

    const targRevenue = target?.revenue || 0;
    const targMaterialCost = target?.materialCost || 0;
    const targOperatingProfit = target?.operatingProfit || 0;
    const targEbt = target?.ebt || 0;

    // 가중평균 비율 계산
    const actMaterialRate = actRevenue !== 0 ? (actMaterialCost / actRevenue) * 100 : 0;
    const actOpRate = actRevenue !== 0 ? (actOperatingProfit / actRevenue) * 100 : 0;
    const targMaterialRate = targRevenue !== 0 ? (targMaterialCost / targRevenue) * 100 : 0;
    const targOpRate = targRevenue !== 0 ? (targOperatingProfit / targRevenue) * 100 : 0;

    // KRW 환산 금액 (해외 사업부용)
    const krwActRevenue = dataKRW?.revenue || 0;
    const krwActOP = dataKRW?.operatingProfit || 0;
    const krwActEbt = dataKRW?.ebt || 0;
    const krwTargRevenue = targetKRW?.revenue || 0;
    const krwTargOP = targetKRW?.operatingProfit || 0;
    const krwTargEbt = targetKRW?.ebt || 0;

    const unit = CURRENCY_UNIT[currency] || '백만원';
    const divisor = CURRENCY_DIVISOR[currency] || 1_000_000;

    const kpis = [
        { label: '매출액', val: actRevenue, targ: targRevenue, isRate: false, colorClass: 'text-blue-600', krwVal: krwActRevenue, krwTarg: krwTargRevenue },
        { label: '재료비율', val: actMaterialRate, targ: targMaterialRate, isRate: true, colorClass: 'text-slate-900', krwVal: 0, krwTarg: 0 },
        { label: '영업이익', val: actOperatingProfit, targ: targOperatingProfit, isRate: false, colorClass: 'text-slate-900', krwVal: krwActOP, krwTarg: krwTargOP },
        { label: '영업이익률', val: actOpRate, targ: targOpRate, isRate: true, colorClass: 'text-gray-900', krwVal: 0, krwTarg: 0 },
        { label: '세전이익', val: actEbt, targ: targEbt, isRate: false, colorClass: 'text-slate-900', krwVal: krwActEbt, krwTarg: krwTargEbt },
    ];

    // 현지통화 포맷: 통화별 divisor로 나눈 뒤 천단위 콤마
    const fmtLocal = (val: number): string => {
        if (val === 0 || isNaN(val) || !isFinite(val)) return '-';
        const converted = val / divisor;
        return converted.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
    };
    // KRW 포맷 (백만원)
    const fmtKRW = (val: number): string => {
        if (val === 0 || isNaN(val) || !isFinite(val)) return '-';
        const converted = val / 1_000_000;
        return converted.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
    };
    // 비율 포맷
    const fmtRate = (val: number): string => {
        if (val === 0 || isNaN(val) || !isFinite(val)) return '-';
        return `${val.toFixed(1)}%`;
    };

    // 통합 포맷
    const fmt = (val: number, isRate: boolean): string => {
        if (isRate) return fmtRate(val);
        if (isOverseas) return fmtLocal(val);
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

                    // 해외 사업부 KRW 환산 표기
                    const showDual = isOverseas && !kpi.isRate;
                    const krwDisplay = showDual ? fmtKRW(kpi.krwVal) : '';
                    const krwTargDisplay = showDual ? fmtKRW(kpi.krwTarg) : '';

                    return (
                        <div key={idx} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-sm font-bold text-slate-400 mb-1">{kpi.label}</h3>
                            <div className="flex items-end gap-1.5 flex-wrap">
                                <span className={`text-2xl font-black tracking-tight ${kpi.colorClass}`}>
                                    {displayVal}
                                </span>
                                {!kpi.isRate && (
                                    <span className="text-xs font-semibold text-slate-400 mb-0.5 whitespace-nowrap">
                                        {unit}
                                    </span>
                                )}
                                {/* 해외 사업부: 원화 환산 인라인 서브 표기 */}
                                {showDual && krwDisplay !== '-' && (
                                    <span className="text-sm font-medium text-slate-400 mb-0.5 whitespace-nowrap">
                                        (약 {krwDisplay} 백만원)
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center flex-wrap gap-1.5 mt-3 text-xs font-semibold bg-slate-50 w-fit px-2 py-1.5 rounded-md">
                                <span className="text-slate-400">목표</span>
                                <span className="text-slate-600 font-bold">{displayTarg}</span>
                                {/* 해외 사업부 목표도 KRW 인라인 서브 표기 */}
                                {showDual && krwTargDisplay !== '-' && (
                                    <span className="text-slate-400 whitespace-nowrap">({krwTargDisplay} 백만원)</span>
                                )}
                                <span className="mx-1 text-slate-300">|</span>
                                <span className="flex items-center gap-0.5 whitespace-nowrap">
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
