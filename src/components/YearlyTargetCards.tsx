import { Target } from 'lucide-react';
import type { DataStore } from '../utils/dataModel';
import { DIVISIONS, MXN_KRW_RATE } from '../utils/dataModel';

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" style={{ padding: '20px 0', boxSizing: 'border-box' }}>
                {DIVISIONS.map(divInfo => {
                    const divData = divs.find(d => d.divisionCode === divInfo.code);
                    if (!divData || !divData.yearlyTarget) return null;

                    const targetRevRaw = divData.yearlyTarget.revenue;
                    const targetOpRaw = divData.yearlyTarget.operatingProfit;

                    // 연간 누적 실적(YTD)
                    let actualRevRaw = 0;
                    let actualOpRaw = 0;
                    Object.values(divData.monthly).forEach(m => {
                        actualRevRaw += m.revenue || 0;
                        actualOpRaw += m.operatingProfit || 0;
                    });

                    // 경영진 지시사항(원화) 직관적 비교를 위해 전부 KRW 기준으로 변환
                    const rates = divData.exchangeRates?.[1] || { actual: 1, target: 1, prev: 1 };
                    const isMexico = divInfo.code === 'mexico';
                    // 🇲🇽 멕시코: 직접 MXN→KRW 환율 적용
                    const actualRate = isMexico ? MXN_KRW_RATE : (rates.actual || 1);

                    const actualRev = actualRevRaw * actualRate;
                    const actualOp = actualOpRaw * actualRate;
                    const targetRev = targetRevRaw; // v16 확정 수치 (KRW)
                    const targetOp = targetOpRaw;   // v16 확정 수치 (KRW)

                    const revAchieve = targetRev > 0 ? (actualRev / targetRev) * 100 : 0;
                    const opAchieve = targetOp > 0 ? (actualOp / targetOp) * 100 : 0;

                    return (
                        <div key={divInfo.code} className="bg-white border border-gray-200/60 rounded-2xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-sm transition-all flex flex-col justify-between">

                            {/* 카드 헤더 (사업부명) */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2.5">
                                    <div className="text-[22px]">
                                        {divInfo.flag}
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <h3 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{divInfo.name}</h3>
                                        <span className="text-[10px] font-medium text-blue-500 font-mono tracking-wider bg-blue-50 px-1.5 py-0.5 rounded">KRW</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* 매출액 섹션 */}
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-[12px] font-medium text-gray-500">매출액 (달성률)</span>
                                        <span className={`text-[13px] font-extrabold ${revAchieve >= 100 ? 'text-emerald-500' : 'text-blue-500'}`}>
                                            {revAchieve.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex-1 bg-gray-100/60 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 origin-left ${revAchieve >= 100 ? 'bg-emerald-400' : 'bg-blue-400'}`}
                                                style={{ width: `${Math.min(revAchieve, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-baseline mt-1">
                                        <span className="text-xl font-bold text-gray-800 tracking-tight">{formatEok(actualRev)}</span>
                                        <span className="text-[12px] font-medium text-gray-400">/ {formatEok(targetRev)}</span>
                                    </div>
                                </div>

                                {/* 구분선 */}
                                <div className="h-[1px] w-full bg-gray-100/80 my-2"></div>

                                {/* 영업이익 섹션 */}
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-[12px] font-medium text-gray-500">영업이익 (달성률)</span>
                                        <span className={`text-[13px] font-extrabold ${opAchieve >= 100 ? 'text-emerald-500' : opAchieve >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                                            {opAchieve.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex-1 bg-gray-100/60 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 origin-left ${opAchieve >= 100 ? 'bg-emerald-400' : opAchieve >= 0 ? 'bg-blue-400' : 'bg-rose-400'
                                                    }`}
                                                style={{ width: `${Math.max(0, Math.min(opAchieve, 100))}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-baseline mt-1">
                                        <span className={`text-xl font-bold tracking-tight ${actualOp < 0 ? 'text-rose-600' : 'text-gray-800'}`}>{formatEok(actualOp)}</span>
                                        <span className="text-[12px] font-medium text-gray-400">/ {formatEok(targetOp)}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}
