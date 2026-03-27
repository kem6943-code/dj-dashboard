import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DIVISIONS, MONTH_NAMES, type DataStore, type DivisionInfo, type DivisionYearData } from '../utils/dataModel';

interface Props {
    store: DataStore;
    year: number;
}

export function DivisionTrendCharts({ store, year }: Props) {
    // 사업부별 통화에 맞는 스케일링 함수 생성
    const getScaleInfo = (currency: string) => {
        switch (currency) {
            case 'MXN':
                return { multiplier: 1000, unitText: '천 MXN' };
            case 'VND':
                return { multiplier: 1000000, unitText: '백만 VND' };
            case 'THB':
                return { multiplier: 1000000, unitText: '백만 THB' };
            default: // KRW
                return { multiplier: 100000000, unitText: '억원' };
        }
    };

    const renderTrendSection = (
        title: string,
        divInfo: DivisionInfo,
        divData: DivisionYearData,
        prevYearData: DivisionYearData | undefined,
        subDivKey?: string
    ) => {
        const { multiplier, unitText } = getScaleInfo(divInfo.currency);
        const formatVal = (val: number) => Number((val / multiplier).toFixed(1));

        // 월별 데이터 가공
        const chartData = MONTH_NAMES.map((name, i) => {
            const month = i + 1;
            const ds = subDivKey ? divData.subDivMonthly?.[subDivKey]?.[month] : divData.monthly[month];
            const ts = subDivKey ? divData.subDivTargetMonthly?.[subDivKey]?.[month] : divData.targetMonthly?.[month];
            const pds = subDivKey ? prevYearData?.subDivMonthly?.[subDivKey]?.[month] : prevYearData?.monthly[month];

            return {
                name,
                매출_실적: ds ? formatVal(ds.revenue || 0) : null,
                매출_목표: ts ? formatVal(ts.revenue || 0) : null,
                매출_전년: pds ? formatVal(pds.revenue || 0) : null,
                영익_실적: ds ? formatVal(ds.operatingProfit || 0) : null,
                영익_목표: ts ? formatVal(ts.operatingProfit || 0) : null,
                영익_전년: pds ? formatVal(pds.operatingProfit || 0) : null,
            };
        });

        return (
            <div key={`${divInfo.code}-${subDivKey || 'main'}`} className="bg-white border border-gray-200/60 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{divInfo.flag}</span>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <span className="text-[11px] text-gray-400 font-medium ml-2 bg-gray-100 px-2 py-0.5 rounded">단위: {unitText}</span>
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
    };

    return (
        <div className="space-y-6">
            {DIVISIONS.map(divInfo => {
                const divData = store.divisions.find(d => d.divisionCode === divInfo.code && d.year === year);
                const prevYearData = store.divisions.find(d => d.divisionCode === divInfo.code && d.year === year - 1);

                if (!divData) return null;

                if (divInfo.code === 'mexico') {
                    // 멕시코 사업부는 가전/자동차 분리해서 출력
                    return (
                        <div key={divInfo.code} className="space-y-6">
                            {renderTrendSection(`${divInfo.name} 월별 트렌드 (가전)`, divInfo, divData, prevYearData, 'homeAppliance')}
                            {renderTrendSection(`${divInfo.name} 월별 트렌드 (자동차)`, divInfo, divData, prevYearData, 'automotive')}
                        </div>
                    );
                }

                return renderTrendSection(`${divInfo.name} 월별 트렌드`, divInfo, divData, prevYearData);
            })}
        </div>
    );
}
