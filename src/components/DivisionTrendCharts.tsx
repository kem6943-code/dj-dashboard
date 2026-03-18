import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DIVISIONS, MONTH_NAMES, type DataStore } from '../utils/dataModel';

interface Props {
    store: DataStore;
    year: number;
}

export function DivisionTrendCharts({ store, year }: Props) {
    // 억 단위 포맷터
    const formatEok = (val: number) => {
        const eok = val / 100000000;
        return Number(eok.toFixed(1));
    };

    return (
        <div className="space-y-6">
            {DIVISIONS.map(divInfo => {
                const divData = store.divisions.find(d => d.divisionCode === divInfo.code && d.year === year);
                const prevYearData = store.divisions.find(d => d.divisionCode === divInfo.code && d.year === year - 1);

                if (!divData) return null;

                // 월별 데이터 가공
                const chartData = MONTH_NAMES.map((name, i) => {
                    const month = i + 1;
                    const ds = divData.monthly[month];
                    const ts = divData.targetMonthly?.[month];
                    const pds = prevYearData?.monthly[month];

                    return {
                        name,
                        매출_실적: ds ? formatEok(ds.revenue || 0) : null,
                        매출_목표: ts ? formatEok(ts.revenue || 0) : null,
                        매출_전년: pds ? formatEok(pds.revenue || 0) : null,
                        영익_실적: ds ? formatEok(ds.operatingProfit || 0) : null,
                        영익_목표: ts ? formatEok(ts.operatingProfit || 0) : null,
                        영익_전년: pds ? formatEok(pds.operatingProfit || 0) : null,
                    };
                });

                return (
                    <div key={divInfo.code} className="bg-white border border-gray-200/60 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">{divInfo.flag}</span>
                            <h3 className="text-lg font-bold text-gray-800">{divInfo.name} 월별 트렌드</h3>
                            <span className="text-[11px] text-gray-400 font-medium ml-2 bg-gray-100 px-2 py-0.5 rounded">단위: 억원</span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* 매출액 추이 */}
                            <div className="border border-gray-100 rounded-lg p-3">
                                <h4 className="text-sm font-semibold text-gray-600 mb-3 text-center">매출액 추이</h4>
                                <div className="h-64">
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
                            <div className="border border-gray-100 rounded-lg p-3">
                                <h4 className="text-sm font-semibold text-gray-600 mb-3 text-center">영업이익 추이</h4>
                                <div className="h-64">
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
                    </div>
                );
            })}
        </div>
    );
}
