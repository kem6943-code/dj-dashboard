/**
 * 사업부 비교 뷰 컴포넌트
 * - 4개 사업부의 실적을 가로로 나란히 비교
 * - 사업부별 매출/영업이익 비교 Bar Chart
 */
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    type DataStore,
    DIVISIONS,
    formatAmount,
    aggregateQuarter,
    aggregateHalf,
    aggregateYear,
    type MonthlyPLData,
} from '../utils/dataModel';
import { getDivisionData } from '../utils/storage';

interface ComparisonViewProps {
    store: DataStore;
    year: number;
    periodType: string;
}



export function ComparisonView({ store, year, periodType }: ComparisonViewProps) {
    // 각 사업부의 가장 최근 월 데이터 또는 집계 데이터
    const getLatestOrAgg = (): { label: string; data: { division: string; plData: MonthlyPLData }[] } => {
        const results: { division: string; plData: MonthlyPLData }[] = [];
        let label = '';

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
                // 가장 최근 분기
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
                // 월별 - 가장 최근 월
                const months = Object.keys(divData.monthly).map(Number).filter(m => divData.monthly[m]?.revenue !== 0);
                const latestM = months.length > 0 ? Math.max(...months) : 0;
                plData = latestM > 0 ? divData.monthly[latestM] : ({} as MonthlyPLData);
                label = latestM > 0 ? `${latestM}월` : '-';
            }

            results.push({ division: div.name, plData });
        });

        return { label, data: results };
    };

    const { label: periodLabel, data: compData } = getLatestOrAgg();

    // 비교 차트 데이터
    const chartData = DIVISIONS.map((div, i) => ({
        name: `${div.flag} ${div.nameEn}`,
        매출액: Math.round((compData[i]?.plData?.revenue || 0) / 1000000),
        영업이익: Math.round((compData[i]?.plData?.operatingProfit || 0) / 1000000),
    }));

    // 핵심 비교 항목
    const comparisonItems = [
        { key: 'revenue', label: '매출액' },
        { key: 'materialCost', label: '재료비' },
        { key: 'laborCost', label: '노무비' },
        { key: 'overhead', label: '경비' },
        { key: 'operatingProfit', label: '영업이익' },
        { key: 'ebt', label: '세전이익' },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            {/* 사업부 비교 차트 */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
                    📊 사업부별 매출 · 영업이익 비교 ({periodLabel}) (단위: 백만)
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={120} />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 8,
                                fontSize: '0.8rem',
                            }}
                            formatter={(value: number | undefined) => `${(value || 0).toLocaleString()} 백만`}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="매출액" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="영업이익" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* 비교 테이블 */}
            <div className="glass-card p-5 overflow-x-auto">
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
                    📋 사업부별 핵심 지표 비교 ({periodLabel})
                    <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>(단위: 백만)</span>
                </h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>구분</th>
                            {DIVISIONS.map(div => (
                                <th key={div.code}>{div.flag} {div.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {comparisonItems.map(item => (
                            <tr key={item.key} className={['revenue', 'operatingProfit', 'ebt'].includes(item.key) ? 'row-header' : ''}>
                                <td><strong>{item.label}</strong></td>
                                {compData.map((d, i) => {
                                    const value = d.plData?.[item.key] || 0;
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
                        <tr className="row-header" style={{ borderTop: '2px solid var(--accent-blue)' }}>
                            <td><strong>영업이익률 (%)</strong></td>
                            {compData.map((d, i) => {
                                const rev = d.plData?.revenue || 0;
                                const op = d.plData?.operatingProfit || 0;
                                const ratio = rev !== 0 ? ((op / rev) * 100).toFixed(1) : '-';
                                const isPos = Number(ratio) >= 0;
                                return (
                                    <td key={i} className={ratio !== '-' ? (isPos ? 'value-positive' : 'value-negative') : ''}>
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
