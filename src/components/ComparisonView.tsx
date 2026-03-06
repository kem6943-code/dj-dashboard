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
    DIVISIONS,
    formatAmount,
    aggregateQuarter,
    aggregateHalf,
    aggregateYear,
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
    // 2026 사업계획 기준 표준 환율 (KRW)
    const FX_RATES: Record<string, number> = {
        'changwon': 1,      // KRW (원) -> 1배
        'thailand': 39.5,   // THB (바트) -> 39.5배
        'vietnam': 0.055,   // VND (동) -> 0.055배 (100동=5.5원)
        'mexico': 75.0,     // MXN (페소) -> 75.0배
    };

    const DIV_COLORS: Record<string, string> = {
        'changwon': '#f97316', // 주황
        'thailand': '#3b82f6', // 파랑
        'vietnam': '#10b981',  // 초록
        'mexico': '#8b5cf6',   // 보라
    };

    // 토글 상태
    const [visibleDivs, setVisibleDivs] = useState<Record<string, boolean>>({
        'changwon': true,
        'thailand': true,
        'vietnam': true,
        'mexico': true
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

    // 각 사업부의 가장 최근 월 데이터 또는 집계 데이터 (테이블용)
    const getLatestOrAgg = (): { label: string; data: { division: string; plData: MonthlyPLData }[] } => {
        const results: { division: string; plData: MonthlyPLData }[] = [];
        let label = '';

        // 글로벌 최신 월 계산 (모든 사업부 통틀어 매출이 있는 가장 최신 월)
        let globalLatestMonth = 0;
        if (periodType === 'monthly') {
            DIVISIONS.forEach(div => {
                const divData = getDivisionData(store, div.code, year);
                if (divData && divData.monthly) {
                    const months = Object.keys(divData.monthly).map(Number).filter(m => divData.monthly[m]?.revenue !== 0);
                    if (months.length > 0) {
                        const maxMonth = Math.max(...months);
                        if (maxMonth > globalLatestMonth) globalLatestMonth = maxMonth;
                    }
                }
            });
            label = globalLatestMonth > 0 ? `${globalLatestMonth}월` : '-';
        }

        DIVISIONS.forEach(div => {
            const divData = getDivisionData(store, div.code, year);
            if (!divData) {
                results.push({ division: div.name, plData: {} as MonthlyPLData });
                return;
            }

            let plData: MonthlyPLData;
            if (periodType === 'yearly') {
                plData = aggregateYear(divData.monthly);
                label = `${year}년 연간`;
            } else if (periodType === 'quarterly') {
                for (let q = 4; q >= 1; q--) {
                    const d = aggregateQuarter(divData.monthly, q);
                    if (d.revenue !== 0) { plData = d; label = `Q${q}`; break; }
                }
                plData = plData! || aggregateQuarter(divData.monthly, 1);
                label = label || 'Q1';
            } else if (periodType === 'half') {
                const h2 = aggregateHalf(divData.monthly, 2);
                if (h2.revenue !== 0) { plData = h2; label = '하반기'; }
                else { plData = aggregateHalf(divData.monthly, 1); label = '상반기'; }
            } else {
                plData = globalLatestMonth > 0 ? divData.monthly[globalLatestMonth] || ({} as MonthlyPLData) : ({} as MonthlyPLData);
            }

            results.push({ division: div.name, plData });
        });

        return { label, data: results };
    };

    const { label: periodLabel, data: rawCompData } = getLatestOrAgg();

    // 데이터에 환율 적용 처리 (원화 테이블 통일용)
    const compData = rawCompData.map((d, i) => {
        const divCode = DIVISIONS[i].code;
        const rate = FX_RATES[divCode] || 1;
        const convertedPL = { ...d.plData };

        Object.keys(convertedPL).forEach(key => {
            const isRatioOrCount = key.toLowerCase().includes('ratio') || key.toLowerCase().includes('rate') || key === 'headcount' || key === 'revenuePerHead';
            if (!isRatioOrCount && typeof convertedPL[key] === 'number') {
                convertedPL[key] = convertedPL[key] * rate;
            }
        });
        return { ...d, plData: convertedPL };
    });

    // 라인 차트용 시계열(1~12월) 데이터 가공 (환산 및 억원/백만원 스케일 조정 - 여기선 억원)
    const lineChartData = MONTH_NAMES.map((name, i) => {
        const month = i + 1;
        const pt: any = { name };
        DIVISIONS.forEach(div => {
            const divCode = div.code;
            const rate = FX_RATES[divCode] || 1;
            const divData = getDivisionData(store, divCode, year);
            const pl = divData?.monthly[month];

            if (pl && pl.revenue !== 0) {
                // 억 단위 환산 후 소수점 1자리 반올림 (금액 * 환율 / 1억)
                pt[`${divCode}_매출`] = Math.round((pl.revenue * rate) / 100000000 * 10) / 10;
                pt[`${divCode}_영익`] = Math.round((pl.operatingProfit * rate) / 100000000 * 10) / 10;
            } else {
                pt[`${divCode}_매출`] = null;
                pt[`${divCode}_영익`] = null;
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
            {/* 환율 적용 안내 */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6 flex items-center gap-3">
                <span className="text-xl">💱</span>
                <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">통합 보고를 위해 '원화(KRW)' 기준으로 환율을 일괄 적용했습니다. (2026 BP 기준)</h4>
                    <p className="text-xs text-blue-700">적용 환율: 🇹🇭 태국(THB) = 39.5원 / 🇻🇳 베트남(VND) = 0.055원 (100VND=5.5원) / 🇲🇽 멕시코(MXN) = 75.0원</p>
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
                {DIVISIONS.map(div => {
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
                            {DIVISIONS.map(div => visibleDivs[div.code] && (
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
                            {DIVISIONS.map(div => visibleDivs[div.code] && (
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
                            {DIVISIONS.map(div => (
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
                                const isPos = Number(ratio) >= 0;
                                return (
                                    <td key={i} className={ratio !== '-' ? (isPos ? 'value-positive' : 'value-negative') : ''} style={{ backgroundColor: '#f8fafc' }}>
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
