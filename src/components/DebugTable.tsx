import React, { useState } from 'react';
import type { DataStore } from '../utils/dataModel';
import { DIVISIONS_WITH_TOTAL } from '../utils/dataModel';

interface DebugTableProps {
    store: DataStore;
}

export const DebugTable: React.FC<DebugTableProps> = ({ store }) => {
    const [showDetails, setShowDetails] = useState(false);
    
    // 1~3월 누적 데이터 계산
    const result: Record<string, { ebt: number, techFee: number }> = {
        'changwon': { ebt: 0, techFee: 0 },
        'thailand': { ebt: 0, techFee: 0 },
        'vietnam': { ebt: 0, techFee: 0 },
        'mexico': { ebt: 0, techFee: 0 }
    };

    // 상세 분석 데이터 수집
    const details: any[] = [];

    store.divisions.forEach(div => {
        if (div.year === 2026 && div.divisionCode !== 'total') {
            const divInfo = DIVISIONS_WITH_TOTAL.find(d => d.code === div.divisionCode);
            const currency = divInfo?.currency || 'KRW';

            [1, 2, 3].forEach(m => {
                const rates = div.exchangeRates?.[m] || { actual: 1 };
                const rate = rates.actual || 1;
                
                // 서브디비전이 있는 경우 개별 추적
                if (div.subDivMonthly && Object.keys(div.subDivMonthly).length > 0) {
                    Object.entries(div.subDivMonthly).forEach(([subKey, subMonths]) => {
                        const rawAct = subMonths?.[m];
                        if (rawAct) {
                            const ebtLocal = rawAct.ebt || 0;
                            const ebtKRW = ebtLocal * rate;
                            details.push({
                                division: divInfo?.name || div.divisionCode,
                                subDiv: subKey,
                                month: m,
                                currency,
                                rate,
                                ebtLocal,
                                ebtKRW
                            });
                        }
                    });
                } else {
                    const rawAct = div.monthly?.[m];
                    if (rawAct) {
                        const ebtLocal = rawAct.ebt || 0;
                        const ebtKRW = ebtLocal * rate;
                        details.push({
                            division: divInfo?.name || div.divisionCode,
                            subDiv: '전체',
                            month: m,
                            currency,
                            rate,
                            ebtLocal,
                            ebtKRW
                        });
                    }
                }

                // 전체 합계는 최상위 monthly 기준으로 합산 (autoRepair가 합쳐준 값)
                const totalAct = div.monthly?.[m];
                if (totalAct) {
                    result[div.divisionCode].ebt += (totalAct.ebt || 0) * rate;
                    result[div.divisionCode].techFee += (totalAct.techFee || 0) * rate;
                }
            });
        }
    });

    const formatKRW = (val: number) => Math.round(val / 1000000).toLocaleString();
    const formatLocal = (val: number) => (val / 1000000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    return (
        <div className="mt-8 p-4 bg-red-50 border-2 border-red-200 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-red-700 font-bold">🚨 [비밀 디버그 모드] 엑셀 vs 시스템 수치 검증표</h3>
                <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold border border-red-300 rounded hover:bg-red-200"
                >
                    {showDetails ? '요약 보기' : '원인 분석용 세부 데이터 펼치기 🔍'}
                </button>
            </div>
            <p className="text-sm text-red-600 mb-4">현재 시스템(DB)에 저장된 각 사업부별 1~3월 원화(백만원) 합계입니다.</p>
            
            <table className="w-full text-sm text-left text-gray-700 border border-red-200 mb-6">
                <thead className="bg-red-100 text-red-800">
                    <tr>
                        <th className="px-4 py-2 border border-red-200">사업부</th>
                        <th className="px-4 py-2 border border-red-200">시스템 세전이익 합계(백만원)</th>
                        <th className="px-4 py-2 border border-red-200">시스템 기술료 합계(백만원)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="px-4 py-2 border border-red-200 font-bold">창원</td>
                        <td className="px-4 py-2 border border-red-200">{formatKRW(result['changwon'].ebt)}</td>
                        <td className="px-4 py-2 border border-red-200">{formatKRW(result['changwon'].techFee)}</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-2 border border-red-200 font-bold">태국</td>
                        <td className="px-4 py-2 border border-red-200">{formatKRW(result['thailand'].ebt)}</td>
                        <td className="px-4 py-2 border border-red-200">{formatKRW(result['thailand'].techFee)}</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-2 border border-red-200 font-bold">베트남</td>
                        <td className="px-4 py-2 border border-red-200">{formatKRW(result['vietnam'].ebt)}</td>
                        <td className="px-4 py-2 border border-red-200">{formatKRW(result['vietnam'].techFee)}</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-2 border border-red-200 font-bold">멕시코</td>
                        <td className="px-4 py-2 border border-red-200">{formatKRW(result['mexico'].ebt)}</td>
                        <td className="px-4 py-2 border border-red-200">{formatKRW(result['mexico'].techFee)}</td>
                    </tr>
                    <tr className="bg-red-100 font-bold">
                        <td className="px-4 py-2 border border-red-200">합계</td>
                        <td className="px-4 py-2 border border-red-200">
                            {formatKRW(Object.values(result).reduce((acc, curr) => acc + curr.ebt, 0))}
                        </td>
                        <td className="px-4 py-2 border border-red-200">
                            {formatKRW(Object.values(result).reduce((acc, curr) => acc + curr.techFee, 0))}
                        </td>
                    </tr>
                </tbody>
            </table>

            {showDetails && (
                <div className="mt-4 border-t border-red-200 pt-4">
                    <h4 className="text-red-700 font-bold mb-2">🔍 월별 세부 환산 내역 (원인 분석용)</h4>
                    <p className="text-xs text-gray-500 mb-2">※ 계산식: 원화(KRW) = 현지통화 입력값 × 환율</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-gray-600 border border-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-2 py-1 border border-gray-200">사업부</th>
                                    <th className="px-2 py-1 border border-gray-200">실(Sub)</th>
                                    <th className="px-2 py-1 border border-gray-200">월</th>
                                    <th className="px-2 py-1 border border-gray-200 text-right">현지통화 세전이익 (백만)</th>
                                    <th className="px-2 py-1 border border-gray-200">통화</th>
                                    <th className="px-2 py-1 border border-gray-200 text-right">환율</th>
                                    <th className="px-2 py-1 border border-gray-200 text-right">변환된 원화 (백만 KRW)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {details.map((d, i) => (
                                    <tr key={i} className="hover:bg-red-50">
                                        <td className="px-2 py-1 border border-gray-200">{d.division}</td>
                                        <td className="px-2 py-1 border border-gray-200">{d.subDiv}</td>
                                        <td className="px-2 py-1 border border-gray-200 text-center">{d.month}월</td>
                                        <td className="px-2 py-1 border border-gray-200 text-right font-mono">{formatLocal(d.ebtLocal)}</td>
                                        <td className="px-2 py-1 border border-gray-200 text-center">{d.currency}</td>
                                        <td className="px-2 py-1 border border-gray-200 text-right font-mono text-blue-600">{d.rate}</td>
                                        <td className="px-2 py-1 border border-gray-200 text-right font-mono font-bold">{formatKRW(d.ebtKRW)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
