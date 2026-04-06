/**
 * 통합 차트 컨테이너 (토글 전환)
 * - [손익 추이 보기]: 매출액 Bar + 영업이익률(%) Line
 * - [비용 구조 분석]: 재료비/노무비/경비 누적 Stacked Bar
 * - 경영진 보고용 블루톤/그레이 디자인
 */
import { useState } from 'react';
import {
    ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { type DataStore, type DivisionInfo, type MonthYear } from '../utils/dataModel';

type ChartMode = 'profit' | 'cost';

interface UnifiedChartProps {
    store: DataStore;
    divisionInfo: DivisionInfo;
    dateRange: { start: MonthYear; end: MonthYear };
    selectedSubDiv?: string;
}

// 색상 팔레트 — 경영진 보고용 (블루톤 + 그레이 + 레드 포인트)
const COLORS = {
    revenue: '#2563eb',       // 진한 블루 (매출액)
    opRateLine: '#dc2626',    // 레드 (영업이익률 선)
    material: '#3b82f6',      // 블루 (재료비)
    labor: '#64748b',         // 슬레이트 그레이 (노무비)
    overhead: '#94a3b8',      // 연한 그레이 (경비)
    opProfit: '#1e40af',      // 딥 블루 (영업이익)
    profitNeg: '#dc2626',     // 레드 (적자)
    gridStroke: '#e2e8f0',    // 연한 슬레이트 (그리드 점선)
};

// 커스텀 툴팁 — 깔끔한 박스
function ProfitTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const rev = payload.find((p: any) => p.dataKey === '매출액');
    const rate = payload.find((p: any) => p.dataKey === '영업이익률');
    return (
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', border: '1px solid #e2e8f0', minWidth: 170 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>{label}</p>
            {rev && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: COLORS.revenue, fontWeight: 600 }}>● 매출액</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{Number(rev.value).toLocaleString()}</span>
                </div>
            )}
            {rate && rate.value !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTop: '1px dashed #e2e8f0' }}>
                    <span style={{ fontSize: 11, color: COLORS.opRateLine, fontWeight: 600 }}>● 영업이익률</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: Number(rate.value) >= 0 ? '#1e293b' : COLORS.profitNeg }}>
                        {Number(rate.value).toFixed(1)}%
                    </span>
                </div>
            )}
        </div>
    );
}

function CostTooltip({ active, payload, label, unitText }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', border: '1px solid #e2e8f0', minWidth: 180 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>{label}</p>
            {payload.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: item.color, fontWeight: 600 }}>● {item.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{Number(item.value).toLocaleString()} {unitText}</span>
                </div>
            ))}
        </div>
    );
}

export function PeriodComposedChart({ store, divisionInfo, dateRange, selectedSubDiv = 'all' }: UnifiedChartProps) {
    const [chartMode, setChartMode] = useState<ChartMode>('profit');

    if (!store) return null;

    const isMXN = divisionInfo.currency === 'MXN';
    const multiplier = isMXN ? 1000 : 1000000;
    const unitText = divisionInfo.currency === 'KRW' ? '백만원' :
        isMXN ? `천${divisionInfo.currency}` : `백만${divisionInfo.currency}`;

    // dateRange 기반 월 배열
    const months: MonthYear[] = [];
    let curY = dateRange.start.year, curM = dateRange.start.month, cnt = 0;
    while ((curY < dateRange.end.year || (curY === dateRange.end.year && curM <= dateRange.end.month)) && cnt < 36) {
        months.push({ year: curY, month: curM });
        curM++;
        if (curM > 12) { curM = 1; curY++; }
        cnt++;
    }

    // 차트 데이터 가공
    const chartData = months.map(({ year, month }) => {
        const name = `${month}월`;
        const divD = store.divisions.find(d => d.divisionCode === divisionInfo.code && d.year === year);
        // 서브디비전 선택 시 subDivMonthly에서 데이터를 가져옴 (핵심 버그 수정)
        const ds = (selectedSubDiv && selectedSubDiv !== 'all' && divD?.subDivMonthly?.[selectedSubDiv]?.[month])
            || divD?.monthly?.[month];

        if (!ds || !ds.revenue || ds.revenue <= 0) {
            return { name, 매출액: null, 영업이익률: null, 재료비: null, 노무비: null, 경비: null, 영업이익: null };
        }

        const rev = (ds.revenue || 0) / multiplier;
        const mat = (ds.materialCost || ds.rawMaterialCost || 0) / multiplier;
        const labor = (ds.laborCost || 0) / multiplier;
        const overhead = (ds.overhead || 0) / multiplier;
        const opProfit = (ds.operatingProfit || 0) / multiplier;
        const opRate = ds.revenue > 0 ? ((ds.operatingProfit || 0) / ds.revenue) * 100 : 0;

        return {
            name,
            매출액: Number(rev.toFixed(1)),
            영업이익률: Number(opRate.toFixed(1)),
            재료비: Number(mat.toFixed(1)),
            노무비: Number(labor.toFixed(1)),
            경비: Number(overhead.toFixed(1)),
            영업이익: Number(opProfit.toFixed(1)),
        };
    });

    const hasData = chartData.some(d => d.매출액 !== null);
    if (!hasData) return null;

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] mb-8 overflow-hidden">
            {/* 헤더: 타이틀 + 토글 스위치 + 단위 */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                <h3 className="text-[15px] font-bold text-slate-800">
                    {chartMode === 'profit' ? '📈 손익 추이' : '📊 비용 구조 분석'}
                </h3>
                <div className="flex items-center gap-3">
                    {/* 세그먼트 컨트롤 */}
                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setChartMode('profit')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                                chartMode === 'profit'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            손익 추이 보기
                        </button>
                        <button
                            onClick={() => setChartMode('cost')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                                chartMode === 'cost'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            비용 구조 분석
                        </button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded">
                        단위: {unitText}
                    </span>
                </div>
            </div>

            {/* 차트 영역 */}
            <div className="px-6 py-5 h-80">
                <ResponsiveContainer width="100%" height="100%">
                    {chartMode === 'profit' ? (
                        /* ===== 손익 추이: 매출액 Bar + 영업이익률 Line ===== */
                        <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={COLORS.gridStroke} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} />
                            <YAxis
                                yAxisId="left" axisLine={false} tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8' }} width={55}
                            />
                            <YAxis
                                yAxisId="right" orientation="right" axisLine={false} tickLine={false}
                                tick={{ fontSize: 10, fill: COLORS.opRateLine }} width={38}
                                tickFormatter={(v: number) => `${v}%`}
                            />
                            <Tooltip content={<ProfitTooltip />} cursor={{ fill: 'rgba(241,245,249,0.6)' }} />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                                formatter={(v: string) => <span style={{ color: '#475569', fontWeight: 600, fontSize: 11 }}>{v}</span>}
                            />
                            <Bar yAxisId="left" dataKey="매출액" name="매출액" fill={COLORS.revenue} fillOpacity={0.85} radius={[3, 3, 0, 0]} barSize={32} />
                            <Line yAxisId="right" dataKey="영업이익률" name="영업이익률(%)" type="monotone"
                                stroke={COLORS.opRateLine} strokeWidth={2.5}
                                dot={{ fill: COLORS.opRateLine, r: 3.5, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 5, strokeWidth: 0 }} connectNulls={false}
                            />
                        </ComposedChart>
                    ) : (
                        /* ===== 비용 구조: 누적 Stacked Bar ===== */
                        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={COLORS.gridStroke} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={55} />
                            <Tooltip content={<CostTooltip unitText={unitText} />} cursor={{ fill: 'rgba(241,245,249,0.6)' }} />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                                formatter={(v: string) => <span style={{ color: '#475569', fontWeight: 600, fontSize: 11 }}>{v}</span>}
                            />
                            <Bar stackId="cost" dataKey="재료비" name="재료비" fill={COLORS.material} fillOpacity={0.85} />
                            <Bar stackId="cost" dataKey="노무비" name="노무비" fill={COLORS.labor} fillOpacity={0.85} />
                            <Bar stackId="cost" dataKey="경비" name="경비" fill={COLORS.overhead} fillOpacity={0.8} />
                            <Bar stackId="cost" dataKey="영업이익" name="영업이익" fill={COLORS.opProfit} fillOpacity={0.85} radius={[3, 3, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={(entry.영업이익 ?? 0) < 0 ? COLORS.profitNeg : COLORS.opProfit} />
                                ))}
                            </Bar>
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
