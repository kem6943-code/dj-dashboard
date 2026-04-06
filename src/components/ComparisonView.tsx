/**
 * 사업부 비교 뷰 컴포넌트
 * - 4개 사업부의 실적을 가로로 나란히 비교
 * - 사업부별 매출/영업이익 비교 월별 꺾은선 추이 차트 및 토글 기능 탑재
 */
import { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    type DataStore,
    type DivisionCode,
    DIVISIONS,
    formatAmount,
    aggregateQuarter,
    aggregateHalf,
    type MonthlyPLData,
    MONTH_NAMES
} from '../utils/dataModel';
import { getDivisionData } from '../utils/storage';

interface ComparisonViewProps {
    store: DataStore;
    year: number;
    periodType: string;
}

export function ComparisonView({ store, year, periodType }: ComparisonViewProps) {
    // 사업부별 환율을 store에서 동적으로 가져오는 헬퍼
    // → 사용자가 '26실적에서 입력한 exchangeRates를 실시간 반영
    const getFxRate = (divCode: DivisionCode, month: number): number => {
        if (divCode === 'changwon') return 1;
        const divData = getDivisionData(store, divCode, year);
        const rates = divData?.exchangeRates?.[month];
        if (rates?.actual && rates.actual !== 0) return rates.actual;
        // fallback: 해당 월에 환율이 없으면 가장 최근 입력된 환율 사용
        if (divData?.exchangeRates) {
            for (let m = month; m >= 1; m--) {
                const r = divData.exchangeRates[m];
                if (r?.actual && r.actual !== 0) return r.actual;
            }
        }
        // 최종 fallback: BP 기준 기본값
        if (divCode === 'thailand') return 39.5;
        if (divCode === 'vietnam') return 0.055;
        if (divCode === 'mexico') return 75.0;
        return 1;
    };

    // 글로벌 최신 월 계산 (환율 안내 표시 등에 사용)
    let globalLatestMonth = 0;
    DIVISIONS.forEach(div => {
        const divData = getDivisionData(store, div.code, year);
        if (divData?.monthly) {
            const months = Object.keys(divData.monthly).map(Number).filter(m => divData.monthly[m]?.revenue !== 0);
            if (months.length > 0) {
                const maxMonth = Math.max(...months);
                if (maxMonth > globalLatestMonth) globalLatestMonth = maxMonth;
            }
        }
    });
    const latestMonth = globalLatestMonth || 1;

    // 현재 적용 환율 정보 (안내 표시용)
    const currentRates = {
        thailand: getFxRate('thailand', latestMonth),
        vietnam: getFxRate('vietnam', latestMonth),
        mexico: getFxRate('mexico', latestMonth),
    };

    const DIV_COLORS: Record<string, string> = {
        'changwon': '#f97316', // 주황
        'thailand': '#3b82f6', // 파랑
        'vietnam': '#7E57C2',  // 대비되는 보라색
        'mexico_appliance': '#004D40',   // 진한 초록 (멕시코 가전)
        'mexico_auto': '#689F38',        // 올리브색 (멕시코 자동차)
    };

    const VIRTUAL_DIVS = [
        { code: 'changwon', name: '창원사업부', flag: '🇰🇷' },
        { code: 'thailand', name: '태국사업부', flag: '🇹🇭' },
        { code: 'vietnam', name: '베트남사업부', flag: '🇻🇳' },
        { code: 'mexico_appliance', name: '멕시코(가전)', flag: '🇲🇽' },
        { code: 'mexico_auto', name: '멕시코(자동차)', flag: '🇲🇽' },
    ];

    // 토글 상태
    const [visibleDivs, setVisibleDivs] = useState<Record<string, boolean>>({
        'changwon': true,
        'thailand': true,
        'vietnam': true,
        'mexico_appliance': true,
        'mexico_auto': true
    });

    const isAllVisible = Object.values(visibleDivs).every(v => v);
    const toggleAll = () => {
        const nextState = !isAllVisible;
        const newVisible: Record<string, boolean> = {};
        Object.keys(visibleDivs).forEach(k => newVisible[k] = nextState);
        setVisibleDivs(newVisible);
    };

    const toggleDiv = (code: string) => {
        setVisibleDivs(prev => ({ ...prev, [code]: !prev[code] }));
    };

    // 월별 데이터를 해당 월 환율로 원화 환산하는 헬퍼
    const convertMonthToKRW = (plData: MonthlyPLData, divCode: DivisionCode | string, month: number): MonthlyPLData => {
        // 실제 환율을 가져올 상위 code
        const realDivCode = divCode.toString().startsWith('mexico_') ? 'mexico' : divCode as DivisionCode;
        const rate = getFxRate(realDivCode, month);
        if (rate === 1) return { ...plData }; // KRW는 변환 불필요
        const converted = { ...plData };
        Object.keys(converted).forEach(key => {
            const isRatioOrCount = key.toLowerCase().includes('ratio') || key.toLowerCase().includes('rate') || key === 'headcount' || key === 'revenuePerHead';
            if (!isRatioOrCount && typeof converted[key] === 'number') {
                converted[key] = converted[key] * rate;
            }
        });
        return converted;
    };

    // 여러 월 데이터를 각각의 환율로 원화 환산 후 합산하는 헬퍼
    const aggregateWithFx = (divData: any, divCode: DivisionCode | string, subKey: string | null, months: number[]): MonthlyPLData => {
        const result: any = {};
        months.forEach(m => {
            const mData = subKey ? divData?.subDivMonthly?.[subKey]?.[m] : divData?.monthly?.[m];
            if (!mData || !mData.revenue) return;
            const converted = convertMonthToKRW(mData, divCode, m);
            Object.keys(converted).forEach(key => {
                const isRatioOrCount = key.toLowerCase().includes('ratio') || key.toLowerCase().includes('rate') || key === 'headcount' || key === 'revenuePerHead';
                if (typeof converted[key] === 'number') {
                    if (isRatioOrCount) {
                        // 비율은 마지막 월의 값 사용 (합산 부적합)
                        result[key] = converted[key];
                    } else {
                        result[key] = (result[key] || 0) + converted[key];
                    }
                }
            });
        });
        return result as MonthlyPLData;
    };

    // 각 사업부의 가장 최근 월 데이터 또는 집계 데이터 (테이블용) — 원화 환산 포함
    const getLatestOrAgg = (): { label: string; data: { division: string; plData: MonthlyPLData; divCode: string }[] } => {
        const results: { division: string; plData: MonthlyPLData; divCode: string }[] = [];
        let label = '';

        if (periodType === 'monthly') {
            label = globalLatestMonth > 0 ? `${globalLatestMonth}월` : '-';
        }

        VIRTUAL_DIVS.forEach(vdiv => {
            let realDivCode = vdiv.code as DivisionCode;
            let subKey: string | null = null;
            if (vdiv.code === 'mexico_appliance') { realDivCode = 'mexico' as DivisionCode; subKey = 'homeAppliance'; }
            if (vdiv.code === 'mexico_auto') { realDivCode = 'mexico' as DivisionCode; subKey = 'automotive'; }

            const divData = getDivisionData(store, realDivCode, year);
            if (!divData) {
                results.push({ division: vdiv.name, plData: {} as MonthlyPLData, divCode: vdiv.code });
                return;
            }

            let plData: MonthlyPLData;
            if (periodType === 'yearly') {
                plData = aggregateWithFx(divData, vdiv.code, subKey, Array.from({ length: 12 }, (_, i) => i + 1));
                label = `${year}년 연간`;
            } else if (periodType === 'quarterly') {
                let selectedQ = 1;
                for (let q = 4; q >= 1; q--) {
                    // Q 판단을 위해서는 전체 div.monthly를 바라봐도 무방함 (시점 확인용)
                    const d = aggregateQuarter(divData.monthly, q);
                    if (d.revenue !== 0) { selectedQ = q; label = `Q${q}`; break; }
                }
                label = label || 'Q1';
                const startM = (selectedQ - 1) * 3 + 1;
                plData = aggregateWithFx(divData, vdiv.code, subKey, [startM, startM + 1, startM + 2]);
            } else if (periodType === 'half') {
                const h2 = aggregateHalf(divData.monthly, 2);
                if (h2.revenue !== 0) {
                    plData = aggregateWithFx(divData, vdiv.code, subKey, [7, 8, 9, 10, 11, 12]);
                    label = '하반기';
                } else {
                    plData = aggregateWithFx(divData, vdiv.code, subKey, [1, 2, 3, 4, 5, 6]);
                    label = '상반기';
                }
            } else {
                const srcData = subKey ? divData.subDivMonthly?.[subKey] : divData.monthly;
                const monthData = globalLatestMonth > 0 ? (srcData?.[globalLatestMonth] || ({} as MonthlyPLData)) : ({} as MonthlyPLData);
                plData = convertMonthToKRW(monthData, vdiv.code, globalLatestMonth || 1);
            }

            results.push({ division: vdiv.name, plData, divCode: vdiv.code });
        });

        return { label, data: results };
    };

    const { label: periodLabel, data: compData } = getLatestOrAgg();

    // 라인 차트용 시계열(1~12월) 데이터 가공 — 월별 입력 환율 적용
    const lineChartData = MONTH_NAMES.map((name, i) => {
        const month = i + 1;
        const pt: any = { name };
        VIRTUAL_DIVS.forEach(vdiv => {
            let realDivCode = vdiv.code as DivisionCode;
            let subKey: string | null = null;
            if (vdiv.code === 'mexico_appliance') { realDivCode = 'mexico' as DivisionCode; subKey = 'homeAppliance'; }
            if (vdiv.code === 'mexico_auto') { realDivCode = 'mexico' as DivisionCode; subKey = 'automotive'; }

            const rate = getFxRate(realDivCode, month);
            const divData = getDivisionData(store, realDivCode, year);
            const pl = subKey ? divData?.subDivMonthly?.[subKey]?.[month] : divData?.monthly?.[month];

            if (pl && (pl.revenue || 0) !== 0) {
                // 억 단위 환산 후 소수점 1자리 반올림 (금액 * 환율 / 1억)
                pt[`${vdiv.code}_매출`] = Math.round(((pl.revenue || 0) * rate) / 100000000 * 10) / 10;
                pt[`${vdiv.code}_영익`] = Math.round(((pl.operatingProfit || 0) * rate) / 100000000 * 10) / 10;
            } else {
                pt[`${vdiv.code}_매출`] = null;
                pt[`${vdiv.code}_영익`] = null;
            }
        });
        return pt;
    });

    const comparisonItems = [
        { key: 'revenue', label: '매출액' },
        { key: 'materialRatio', label: '재료비율 (%)' },
        { key: 'laborCost', label: '노무비' },
        { key: 'overhead', label: '경비' },
        { key: 'operatingProfit', label: '영업이익' },
        { key: 'ebt', label: '세전이익' },
    ];

    return (
        <div className="animate-fade-in space-y-6" style={{ padding: '24px', boxSizing: 'border-box' }}>
            {/* 환율 적용 안내 — 사용자 입력 환율 동적 표시 */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6 flex items-center gap-3">
                <span className="text-xl">💱</span>
                <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">'{year % 100}실적 입력 환율 기준으로 원화(KRW) 환산하여 표시합니다. ({latestMonth}월 기준)</h4>
                    <p className="text-xs text-blue-700">적용 환율: 🇹🇭 태국(THB) = {currentRates.thailand}원 / 🇻🇳 베트남(VND) = {currentRates.vietnam}원 / 🇲🇽 멕시코(MXN) = {currentRates.mexico}원</p>
                </div>
            </div>

            {/* 토글 버튼 영역 */}
            <div className="flex items-center gap-3 flex-wrap bg-slate-50/80 p-3 rounded-2xl shadow-inner border border-gray-100" style={{ marginBottom: '8px' }}>
                <span className="text-sm font-extrabold text-slate-500 mr-2 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-slate-300 rounded-full"></div>비교 필터
                </span>
                <button
                    onClick={toggleAll}
                    style={{ fontSize: '13px' }}
                    className={`px-4 py-2 rounded-xl font-bold transition-all border ${isAllVisible ? 'bg-white shadow-sm border-slate-200 text-slate-800' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-200/50'}`}
                >
                    전체 켜기/끄기
                </button>
                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                {VIRTUAL_DIVS.map(div => {
                    const isActive = visibleDivs[div.code];
                    const color = DIV_COLORS[div.code];
                    return (
                        <button
                            key={div.code}
                            onClick={() => toggleDiv(div.code)}
                            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 border`}
                            style={{
                                backgroundColor: isActive ? '#ffffff' : 'transparent',
                                color: isActive ? '#334155' : '#94a3b8',
                                border: isActive ? `1px solid ${color}40` : '1px solid transparent',
                                boxShadow: isActive ? `0 2px 8px -2px ${color}30` : 'none'
                            }}
                        >
                            <span
                                className="w-2.5 h-2.5 rounded-full shadow-sm"
                                style={{
                                    backgroundColor: isActive ? color : '#cbd5e1',
                                    boxShadow: isActive ? `0 0 6px ${color}80` : 'none',
                                    transition: 'all 0.3s ease'
                                }}>
                            </span>
                            {div.name}
                        </button>
                    );
                })}
            </div>

            {/* 듀얼 라인 차트 영역 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. 매출액 비교 차트 */}
                <div className="glass-card p-5 transition-all hover:shadow-lg" style={{ padding: '24px', boxSizing: 'border-box' }}>
                    <div className="flex justify-between items-end mb-6">
                        <h3 className="text-sm font-extrabold tracking-tight" style={{ color: '#1e293b' }}>
                            📈 연간 매출액 성장 추이 비교
                        </h3>
                        <span className="text-[11px] text-gray-400 font-bold bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">단위: 억원 (KRW)</span>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.08" />
                                </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                            <Tooltip
                                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
                                labelStyle={{ fontSize: '13px', fontWeight: '800', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '6px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', paddingTop: '20px' }} iconType="circle" />
                            {VIRTUAL_DIVS.map(div => visibleDivs[div.code] && (
                                <Line
                                    key={div.code}
                                    type="monotone"
                                    dataKey={`${div.code}_매출`}
                                    name={div.name}
                                    stroke={DIV_COLORS[div.code]}
                                    strokeWidth={3.5}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: DIV_COLORS[div.code] }}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: DIV_COLORS[div.code] }}
                                    connectNulls
                                    filter="url(#shadow)"
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. 영업이익 비교 차트 */}
                <div className="glass-card p-5 transition-all hover:shadow-lg" style={{ padding: '24px', boxSizing: 'border-box' }}>
                    <div className="flex justify-between items-end mb-6">
                        <h3 className="text-sm font-extrabold tracking-tight" style={{ color: '#1e293b' }}>
                            📉 연간 영업이익 흑자/적자 추이 (원화)
                        </h3>
                        <span className="text-[11px] text-gray-400 font-bold bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">단위: 억원 (KRW)</span>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.08" />
                                </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                            <Tooltip
                                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
                                labelStyle={{ fontSize: '13px', fontWeight: '800', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '6px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', paddingTop: '20px' }} iconType="circle" />
                            {VIRTUAL_DIVS.map(div => visibleDivs[div.code] && (
                                <Line
                                    key={div.code}
                                    type="monotone"
                                    dataKey={`${div.code}_영익`}
                                    name={div.name}
                                    stroke={DIV_COLORS[div.code]}
                                    strokeWidth={3.5}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: DIV_COLORS[div.code] }}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: DIV_COLORS[div.code] }}
                                    connectNulls
                                    filter="url(#shadow2)"
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 비교 테이블 */}
            <div className="glass-card p-5 overflow-x-auto" style={{ padding: '24px', boxSizing: 'border-box' }}>
                <h3 className="text-sm font-extrabold mb-5 flex items-center gap-2" style={{ color: '#1e293b' }}>
                    <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                    사업부별 핵심 지표 요약표 ({periodLabel})
                    <span className="ml-2 text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">(단위: 백만원)</span>
                </h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>구분</th>
                            {VIRTUAL_DIVS.map(div => (
                                <th key={div.code} style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>{div.flag} {div.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {comparisonItems.map(item => (
                            <tr key={item.key} className={['revenue', 'operatingProfit', 'ebt'].includes(item.key) ? 'row-header' : ''}>
                                <td><strong>{item.label}</strong></td>
                                {compData.map((d, i) => {
                                    const value = d.plData?.[item.key] || 0;

                                    if (item.key === 'materialRatio') {
                                        return (
                                            <td key={i}>
                                                <strong>{value !== 0 ? `${value.toFixed(1)}%` : '-'}</strong>
                                            </td>
                                        );
                                    }

                                    const isProfit = ['operatingProfit', 'ebt'].includes(item.key);
                                    let cls = '';
                                    if (isProfit && value !== 0) cls = value > 0 ? 'value-positive' : 'value-negative';
                                    return (
                                        <td key={i} className={cls}>
                                            <strong>{formatAmount(value)}</strong>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {/* 영업이익률 */}
                        <tr className="row-header" style={{ borderTop: '2px solid #94a3b8' }}>
                            <td style={{ backgroundColor: '#f8fafc' }}><strong>영업이익률 (%)</strong></td>
                            {compData.map((d, i) => {
                                const rev = d.plData?.revenue || 0;
                                const op = d.plData?.operatingProfit || 0;
                                const ratio = rev !== 0 ? ((op / rev) * 100).toFixed(1) : '-';
                                return (
                                    <td key={i} className="text-gray-900" style={{ backgroundColor: '#f8fafc' }}>
                                        <strong>{ratio}{ratio !== '-' ? '%' : ''}</strong>
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
