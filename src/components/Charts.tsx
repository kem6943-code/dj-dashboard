/**
 * 차트 컴포넌트 (Recharts 사용)
 * - 월별 매출 추이 (Bar Chart)
 * - 비용 구조 비율 (Pie Chart)
 */
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { type DivisionYearData, type DivisionInfo, MONTH_NAMES } from '../utils/dataModel';

interface ChartsProps {
    divData: DivisionYearData | undefined;
    divisionInfo: DivisionInfo;
    year: number;
}

// 차트 색상 팔레트
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

export function Charts({ divData }: ChartsProps) {
    if (!divData) {
        return (
            <div className="glass-card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                데이터가 없습니다. "데이터 입력" 버튼을 클릭하여 실적 데이터를 입력해주세요.
            </div>
        );
    }

    // 월별 데이터 변환
    const monthlyChartData = MONTH_NAMES.map((name, i) => {
        const m = divData.monthly[i + 1];
        const revenue = m ? Math.round(m.revenue / 1000000) : 0;
        const op = m ? Math.round(m.operatingProfit / 1000000) : 0;
        // 이익률 계산 (매출 0인 경우 0 처리)
        const margin = revenue !== 0 ? (op / revenue) * 100 : 0;

        return {
            name,
            매출액: revenue,
            영업이익: op,
            이익률: Number(margin.toFixed(1)), // 소수점 첫째자리까지
        };
    });

    // 가장 최근 월의 비용 구조 (파이 차트)
    const latestMonth = Math.max(...Object.keys(divData.monthly).map(Number).filter(m => {
        const d = divData.monthly[m];
        return d && d.revenue !== 0;
    }), 0);

    const latestData = divData.monthly[latestMonth];
    const costBreakdown = latestData ? [
        { name: '재료비', value: Math.abs(latestData.materialCost || 0) },
        { name: '노무비', value: Math.abs(latestData.laborCost || 0) },
        { name: '경비', value: Math.abs(latestData.overhead || 0) },
        { name: '판관비', value: Math.abs(latestData.sgna || 0) },
    ].filter(c => c.value > 0) : [];

    const totalCost = costBreakdown.reduce((sum, c) => sum + c.value, 0);

    // 커스텀 Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload) return null;
        return (
            <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: '0.8rem',
            }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>{label}</p>
                {payload.map((p: any, i: number) => (
                    <p key={i} style={{ color: p.color }}>
                        {p.name}: {Number(p.value).toLocaleString()}{p.name === '이익률' ? '%' : ' 백만'}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* 매출/영업이익 추이 */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
                    📈 월별 매출액 · 영업이익률 추이
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        {/* 왼쪽 Y축 (매출액) */}
                        <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        {/* 오른쪽 Y축 (이익률) */}
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#10b981', fontSize: 11 }} unit="%" axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                        <Bar yAxisId="left" name="매출액" dataKey="매출액" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                        <Line yAxisId="right" name="이익률" type="monotone" dataKey="이익률" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* 비용 구조 파이 차트 */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
                    🍩 비용 구조 분석 ({latestMonth > 0 ? `${latestMonth}월` : '-'})
                </h3>
                {costBreakdown.length > 0 ? (
                    <div className="flex items-center justify-center gap-6">
                        <ResponsiveContainer width={200} height={200}>
                            <PieChart>
                                <Pie
                                    data={costBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {costBreakdown.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number | undefined) => `${Math.round((value || 0) / 1000000).toLocaleString()} 백만`}
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 8,
                                        fontSize: '0.8rem',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-2">
                            {costBreakdown.map((c, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 rounded" style={{ background: COLORS[i] }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {totalCost > 0 ? ((c.value / totalCost) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-muted)' }}>
                        데이터 없음
                    </div>
                )}
            </div>
        </div>
    );
}
