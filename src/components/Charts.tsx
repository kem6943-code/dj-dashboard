/**
 * 차트 컴포넌트 (Recharts 사용)
 * - 월별 매출 추이 (Bar Chart)
 * - 비용 구조 비율 (Pie Chart)
 */
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { type DivisionYearData, type DivisionInfo, MONTH_NAMES } from '../utils/dataModel';

interface ChartsProps {
    divData: DivisionYearData | undefined;
    prevYearData?: DivisionYearData | undefined;
    divisionInfo: DivisionInfo;
    year: number;
}

export function Charts({ divData, prevYearData }: ChartsProps) {
    if (!divData) {
        return (
            <div className="animate-fade-in relative min-h-[500px]" style={{ padding: '24px', boxSizing: 'border-box' }}>
                <div className="glass-card p-8 text-center" style={{ color: 'var(--text-muted)', padding: '32px', boxSizing: 'border-box' }}>
                    데이터가 없습니다. "데이터 입력" 버튼을 클릭하여 실적 데이터를 입력해주세요.
                </div>
            </div>
        );
    }

    // 억 단위 포맷터
    const formatEok = (val: number) => {
        const eok = val / 100000000;
        return Number(eok.toFixed(1));
    };

    // 월별 데이터 가공
    const chartData = MONTH_NAMES.map((name, i) => {
        const month = i + 1;
        const ds = divData.monthly[month];
        const ts = divData.targetMonthly?.[month];
        const pds = prevYearData?.monthly[month];

        return {
            name,
            매출_실적: ds ? formatEok(ds.revenue) : null,
            매출_목표: ts ? formatEok(ts.revenue) : null,
            매출_전년: pds ? formatEok(pds.revenue) : null,
            영익_실적: ds ? formatEok(ds.operatingProfit) : null,
            영익_목표: ts ? formatEok(ts.operatingProfit) : null,
            영익_전년: pds ? formatEok(pds.operatingProfit) : null,
        };
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pl-4 pr-4">
            {/* 매출액 추이 */}
            <div>
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-base font-bold text-gray-800">매출액 추이</h3>
                    <span className="text-[11px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded">단위: 억원</span>
                </div>
                <div className="h-72 border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '12px' }}
                                labelStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            <Line type="monotone" dataKey="매출_전년" name="전년" stroke="#9ca3af" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                            <Line type="monotone" dataKey="매출_목표" name="TD목표" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                            <Line type="monotone" dataKey="매출_실적" name="실적" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 영업이익 추이 */}
            <div>
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-base font-bold text-gray-800">영업이익 추이</h3>
                    <span className="text-[11px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded">단위: 억원</span>
                </div>
                <div className="h-72 border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '12px' }}
                                labelStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            <Line type="monotone" dataKey="영익_전년" name="전년" stroke="#9ca3af" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                            <Line type="monotone" dataKey="영익_목표" name="TD목표" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                            <Line type="monotone" dataKey="영익_실적" name="실적" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
