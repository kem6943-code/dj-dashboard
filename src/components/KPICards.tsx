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
    // 전사이익 (= 사업부 세전이익 - 공통비 + 기술료 + 영외수익 - 영외비용)
    companyProfit?: number;
}

export function KPICards({ data, target, divisionInfo, dataKRW, targetKRW, companyProfit }: KPICardsProps) {
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

    // 전사이익 여부 판별 (전사 합계일 때만 표시)
    const showCompanyProfit = companyProfit !== undefined;

    const kpis = [
        { label: '매출액', val: actRevenue, targ: targRevenue, isRate: false, colorClass: 'text-blue-600', krwVal: krwActRevenue, krwTarg: krwTargRevenue },
        { label: '재료비율', val: actMaterialRate, targ: targMaterialRate, isRate: true, colorClass: 'text-slate-900', krwVal: 0, krwTarg: 0 },
        { label: showCompanyProfit ? '사업부 영업이익 합계' : '영업이익', val: actOperatingProfit, targ: targOperatingProfit, isRate: false, colorClass: 'text-slate-900', krwVal: krwActOP, krwTarg: krwTargOP },
        { label: '영업이익률', val: actOpRate, targ: targOpRate, isRate: true, colorClass: 'text-gray-900', krwVal: 0, krwTarg: 0 },
        { label: showCompanyProfit ? '사업부 세전이익 합계' : '세전이익', val: actEbt, targ: targEbt, isRate: false, colorClass: 'text-slate-900', krwVal: krwActEbt, krwTarg: krwTargEbt },
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
        <div className="animate-fade-in w-full flex flex-col gap-4">
            {/* === 1층: 전사이익 Hero Banner (전사 합계일 때만 표시) === */}
            {showCompanyProfit && (() => {
                const cpVal = companyProfit || 0;
                const cpDisplay = formatAmount(cpVal, '백만', 'KRW');

                return (
                    <div className="relative bg-gradient-to-r from-indigo-50 via-white to-blue-50 border-2 border-indigo-200/60 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1.5">
                            <h3 className="text-[13px] font-extrabold text-indigo-600 tracking-tight">전사이익 (Total Company Profit)</h3>
                            <div className="flex items-end gap-1.5">
                                <span className="text-3xl md:text-4xl font-black tracking-tight text-indigo-700">
                                    {cpDisplay}
                                </span>
                                <span className="text-sm font-semibold text-indigo-500 mb-1">백만원</span>
                            </div>
                            {/* 목표 뱃지 UI 제거됨 (사용자 요청) */}
                        </div>
                        {/* 인라인 설명 영역 (우측 배치) */}
                        <div className="mt-2 md:mt-0 md:shrink-0 w-full md:w-auto">
                            <div className="text-[12px] leading-relaxed text-slate-600 bg-white/90 px-4 py-3 rounded-xl border border-indigo-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md shrink-0 text-center">💡 계산식</span>
                                <div className="flex items-center flex-wrap font-medium">
                                    <span>세전이익 합계</span>
                                    <span className="text-red-500 font-bold mx-2">−</span><span className="text-slate-700">공통비</span>
                                    <span className="text-emerald-500 font-bold mx-2">+</span><span className="text-slate-700">기술료</span>
                                    <span className="text-indigo-400 font-bold mx-2">+</span><span className="text-slate-700">영외수지</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* === 2층: 세부 지표 카드 (1줄 5칸 배열) === */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {kpis.map((kpi, idx) => {
                    const displayVal = fmt(kpi.val, kpi.isRate);
                    const displayTarg = fmt(kpi.targ, kpi.isRate);

                    const diff = kpi.val - kpi.targ;
                    const isPositive = diff > 0;
                    const isZero = diff === 0 || kpi.targ === 0;
                    const displayDiff = fmt(Math.abs(diff), kpi.isRate);

                    const showDual = isOverseas && !kpi.isRate;
                    const krwDisplay = showDual ? fmtKRW(kpi.krwVal) : '';
                    const krwTargDisplay = showDual ? fmtKRW(kpi.krwTarg) : '';

                    return (
                        <div key={idx} className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <h3 className="text-[11px] font-bold text-slate-400 mb-1">{kpi.label}</h3>
                                <div className="flex items-end gap-1 flex-wrap">
                                    <span className={`text-xl font-black tracking-tight ${kpi.colorClass}`}>
                                        {displayVal}
                                    </span>
                                    {!kpi.isRate && (
                                        <span className="text-[10px] font-semibold text-slate-400 mb-0.5 whitespace-nowrap">
                                            {unit}
                                        </span>
                                    )}
                                </div>
                                {showDual && krwDisplay !== '-' && (
                                    <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                                        (약 {krwDisplay} 백만원)
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center flex-wrap gap-1 mt-3 text-[10px] font-semibold bg-slate-50 w-full px-2 py-1.5 rounded">
                                <span className="text-slate-400">목표</span>
                                <span className="text-slate-600 font-bold">{displayTarg}</span>
                                {showDual && krwTargDisplay !== '-' && (
                                    <span className="text-slate-400">({krwTargDisplay} 백만)</span>
                                )}
                                <span className="mx-0.5 text-slate-300">|</span>
                                <span className="flex items-center gap-0.5 ml-auto">
                                    {isZero ? <Minus className="w-2.5 h-2.5 text-slate-400" /> : isPositive ? <TrendingUp className="w-2.5 h-2.5 text-emerald-500" /> : <TrendingDown className="w-2.5 h-2.5 text-red-500" />}
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
