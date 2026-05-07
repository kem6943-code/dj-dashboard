import { Target } from 'lucide-react';
import type { DataStore } from '../utils/dataModel';
import { DIVISIONS } from '../utils/dataModel';

interface Props {
    store: DataStore;
    year: number;
}

export function YearlyTargetCards({ store, year }: Props) {
    const divs = store.divisions.filter(d => d.year === year && d.yearlyTarget);

    if (divs.length === 0) return null;

    // '억' 단위 변환 포맷터 (주인님 특명: 무조건 '억'으로 통일)
    const formatEok = (val: number) => {
        const eok = val / 100000000;
        // 소수점이 있으면 한자리까지 표시, 없으면 정수표시
        const formatted = eok % 1 === 0 ? eok.toFixed(0) : eok.toFixed(1);
        return `${Number(formatted).toLocaleString()}억`;
    };

    return (
        <div>
            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2 text-slate-800 tracking-tight">
                <Target className="w-6 h-6 text-emerald-500" />
                {year}년 사업부별 TD목표 달성 진척도
                <span className="text-sm font-semibold text-slate-400 ml-2 tracking-normal">(YTD 기준)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8" style={{ padding: '20px 0', boxSizing: 'border-box' }}>
                {DIVISIONS.flatMap(divInfo => {
                    const divData = divs.find(d => d.divisionCode === divInfo.code);
                    if (!divData || !divData.yearlyTarget) return [];

                    const isMexico = divInfo.code === 'mexico';
                    const isKRW = divInfo.currency === 'KRW';

                    // 재사용 렌더러 (파라미터로 이미 환산된 KRW 원화 실적을 받음)
                    const renderCard = (
                        key: string,
                        name: string,
                        flag: string,
                        actualRevKRW: number,
                        actualOpKRW: number,
                        targetRevKRW: number | null,
                        targetOpKRW: number | null
                    ) => {
                        const hasTarget = (targetRevKRW || 0) > 0 || (targetOpKRW || 0) > 0;

                        const revAchieve = targetRevKRW && targetRevKRW > 0 ? (actualRevKRW / targetRevKRW) * 100 : 0;
                        const opAchieve = targetOpKRW && targetOpKRW > 0 ? (actualOpKRW / targetOpKRW) * 100 : 0;

                        return (
                            <div key={key} className="bg-white border border-gray-200/60 rounded-2xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-sm transition-all flex flex-col justify-between">
                                {/* 카드 헤더 (사업부명) */}
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-2.5">
                                        <div className="text-[22px]">{flag}</div>
                                        <div className="flex items-baseline gap-1.5">
                                            <h3 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{name}</h3>
                                            <span className="text-[10px] font-medium text-blue-500 font-mono tracking-wider bg-blue-50 px-1.5 py-0.5 rounded">KRW</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* 매출액 섹션 */}
                                    <div>
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-[12px] font-medium text-gray-500">
                                                {hasTarget ? '매출액 (달성률)' : '매출액 (실적)'}
                                            </span>
                                            {hasTarget && (
                                                <span className={`text-[13px] font-extrabold ${revAchieve >= 100 ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                    {revAchieve.toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                        {hasTarget && (
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="flex-1 bg-gray-100/60 h-2.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 origin-left ${revAchieve >= 100 ? 'bg-emerald-400' : 'bg-blue-400'}`}
                                                        style={{ width: `${Math.min(revAchieve, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className={`flex justify-between items-baseline mt-1 ${!hasTarget ? 'mt-4' : ''}`}>
                                            <span className="text-xl font-bold text-gray-800 tracking-tight">{formatEok(actualRevKRW)}</span>
                                            {hasTarget && <span className="text-[12px] font-medium text-gray-400">/ {formatEok(targetRevKRW || 0)}</span>}
                                        </div>
                                    </div>

                                    {/* 구분선 */}
                                    <div className="h-[1px] w-full bg-gray-100/80 my-2"></div>

                                    {/* 영업이익 섹션 */}
                                    <div>
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-[12px] font-medium text-gray-500">
                                                {hasTarget ? '영업이익 (달성률)' : '영업이익 (실적)'}
                                            </span>
                                            {hasTarget && (
                                                <span className={`text-[13px] font-extrabold ${opAchieve >= 100 ? 'text-emerald-500' : opAchieve >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                                                    {opAchieve.toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                        {hasTarget && (
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="flex-1 bg-gray-100/60 h-2.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 origin-left ${opAchieve >= 100 ? 'bg-emerald-400' : opAchieve >= 0 ? 'bg-blue-400' : 'bg-rose-400'}`}
                                                        style={{ width: `${Math.max(0, Math.min(opAchieve, 100))}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className={`flex justify-between items-baseline mt-1 ${!hasTarget ? 'mt-4' : ''}`}>
                                            <span className={`text-xl font-bold tracking-tight ${actualOpKRW < 0 ? 'text-rose-600' : 'text-gray-800'}`}>{formatEok(actualOpKRW)}</span>
                                            {hasTarget && <span className="text-[12px] font-medium text-gray-400">/ {formatEok(targetOpKRW || 0)}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    };

                    if (isMexico) {
                        // 멕시코(가전)
                        let haActRevKRW = 0;
                        let haActOpKRW = 0;
                        Object.keys(divData.monthly).forEach(mthStr => {
                            const mth = parseInt(mthStr);
                            const m = divData.subDivMonthly?.['homeAppliance']?.[mth];
                            const rate = divData.exchangeRates?.[mth]?.actual || 1;
                            if (!m) return;
                            haActRevKRW += (m.revenue || 0) * rate;
                            haActOpKRW += (m.operatingProfit || 0) * rate;
                        });
                        const cardHA = renderCard(
                            divInfo.code + '_ha',
                            '멕시코(가전)',
                            divInfo.flag,
                            haActRevKRW,
                            haActOpKRW,
                            divData.yearlyTarget.revenue,          // 기존 멕시코 전체 TD목표 이관
                            divData.yearlyTarget.operatingProfit   // 기존 멕시코 전체 TD목표 이관
                        );

                        // 멕시코(자동차)
                        let autoActRevKRW = 0;
                        let autoActOpKRW = 0;
                        Object.keys(divData.monthly).forEach(mthStr => {
                            const mth = parseInt(mthStr);
                            const m = divData.subDivMonthly?.['automotive']?.[mth];
                            const rate = divData.exchangeRates?.[mth]?.actual || 1;
                            if (!m) return;
                            autoActRevKRW += (m.revenue || 0) * rate;
                            autoActOpKRW += (m.operatingProfit || 0) * rate;
                        });
                        const cardAuto = renderCard(
                            divInfo.code + '_auto',
                            '멕시코(자동차)',
                            divInfo.flag,
                            autoActRevKRW,
                            autoActOpKRW,
                            null, // 자동차 목표 없음
                            null
                        );

                        return [cardHA, cardAuto];
                    } else {
                        // 일반 사업부
                        let actRevKRW = 0;
                        let actOpKRW = 0;
                        Object.entries(divData.monthly).forEach(([monthStr, m]) => {
                            const month = parseInt(monthStr);
                            const rates = divData.exchangeRates?.[month] || { actual: 1, target: 1 };
                            const actRate = isKRW ? 1 : (rates.actual || 1);
                            
                            actRevKRW += (m.revenue || 0) * actRate;
                            actOpKRW += (m.operatingProfit || 0) * actRate;
                        });
                        
                        return [renderCard(
                            divInfo.code,
                            divInfo.name,
                            divInfo.flag,
                            actRevKRW,
                            actOpKRW,
                            divData.yearlyTarget.revenue,
                            divData.yearlyTarget.operatingProfit
                        )];
                    }
                })}
            </div>
        </div>
    );
}
