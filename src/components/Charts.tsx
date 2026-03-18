/**
 * 차트 컴포넌트 (Recharts 사용)
 * - 월별 비용 구조 추이: 매출액 vs 재료비 vs 노무비 vs 경비를 한 그래프에서 비교
 */
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { type DivisionYearData, type DivisionInfo, MONTH_NAMES } from '../utils/dataModel';

interface ChartsProps {
    divData: DivisionYearData | undefined;
    prevYearData?: DivisionYearData | undefined;
    divisionInfo: DivisionInfo;
    year: number;
}

export function Charts({ divData, divisionInfo }: ChartsProps) {
    if (!divData) {
        return (
            <div className="animate-fade-in" style={{ padding: '24px', boxSizing: 'border-box' }}>
                <div className="glass-card p-8 text-center" style={{ color: 'var(--text-muted)', padding: '32px', boxSizing: 'border-box' }}>
                    데이터가 없습니다. "데이터 입력" 버튼을 클릭하여 실적 데이터를 입력해주세요.
                </div>
            </div>
        );
    }

    const isMXN = divisionInfo.currency === 'MXN';
    const multiplier = isMXN ? 1000 : 1000000;
    const unitText = divisionInfo.currency === 'KRW' ? '백만 원' :
        isMXN ? `천 ${divisionInfo.currency}` :
            `백만 ${divisionInfo.currency}`;

    // 월별 데이터 가공 — 해당 법인의 화폐 단위로 누적 막대 그래프 구성
    const chartData = MONTH_NAMES.map((name, i) => {
        const month = i + 1;
        const ds = divData.monthly[month];

        // 매출액이 없으면 null 처리하여 그래프가 자연스럽게 끊기게 함
        const hasRevenue = ds && ds.revenue && ds.revenue > 0;
        if (!hasRevenue) {
            return {
                name,
                매출액: null,
                재료비: null,
                노무비: null,
                경비: null,
                영업이익: null,
            };
        }

        // 환율 변환 없이(원본 그대로), 화면 표시 단위(multiplier)로만 나눔
        const revScaled = (ds.revenue || 0) / multiplier;

        // 비율 가져오기 (Fallback 처리 적용)
        const matRatio = ds?.materialRatio || ds?.bomMaterialRatio || 0;
        const laborRatio = ds?.laborRatio || 0;
        const overheadRatio = ds?.overheadRatio || 0;

        // 금액 계산 (비율 기반): 이익은 전체 매출액에서 비용들을 차감한 나머지 갭으로 구성 (스택을 정확히 맞추기 위함)
        const matAmt = revScaled * (matRatio / 100);
        const laborAmt = revScaled * (laborRatio / 100);
        const overheadAmt = revScaled * (overheadRatio / 100);
        const opAmt = revScaled - matAmt - laborAmt - overheadAmt; // 남은 룸 = 이익 (적자일 수도 있음)

        return {
            name,
            매출액: Number(revScaled.toFixed(1)),
            재료비: Number(matAmt.toFixed(1)),
            노무비: Number(laborAmt.toFixed(1)),
            경비: Number(overheadAmt.toFixed(1)),
            영업이익: Number(opAmt.toFixed(1)),
        };
    });

    // 툴팁 포맷터: 각 법인 단위로 금액 표기 (KRW, MXN 등), 전체 매출 대비 비중(%)을 함께 표기
    const tooltipFormatter = (value: number | string | undefined, name: string | undefined, props: any) => {
        if (value === undefined || value === null) return ['-', name];
        const valNum = Number(value);

        // 매출액은 비율 표시 안 함
        if (name === '매출액') {
            return [`${valNum.toLocaleString()} ${unitText}`, name];
        }

        // 각 비용/이익의 경우 전체 매출액 대비 비중을 함께 계산해서 보여줌
        const revNum = Number(props.payload.매출액);
        let ratioStr = '';
        if (revNum > 0) {
            const ratio = (valNum / revNum) * 100;
            ratioStr = ` (${ratio.toFixed(1)}%)`;
        }

        return [`${valNum.toLocaleString()} ${unitText}${ratioStr}`, name];
    };

    return (
        <div className="animate-fade-in px-4">
            <div className="flex justify-between items-end mb-4">
                <h3 className="text-base font-bold text-gray-800">'26년 비용 구조 누적 막대 추이</h3>
                <span className="text-[11px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded">단위: {unitText}</span>
            </div>
            <div className="h-80 border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            width={50}
                            label={{
                                value: `금액(${unitText.split(' ')[0]})`, // '백만', '천'
                                angle: -90,
                                position: 'insideLeft',
                                offset: -5,
                                style: { fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }
                            }}
                        />

                        <Tooltip
                            formatter={tooltipFormatter}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                            cursor={{ fill: '#f3f4f6' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                        {/* 매출액과 높이를 맞추기 위해 비용을 누적(stackId="a")으로 쌓음 */}
                        <Bar stackId="a" dataKey="재료비" name="재료비" fill="#ef4444" fillOpacity={0.8} />
                        <Bar stackId="a" dataKey="노무비" name="노무비" fill="#f59e0b" fillOpacity={0.8} />
                        <Bar stackId="a" dataKey="경비" name="경비" fill="#8b5cf6" fillOpacity={0.8} />
                        {/* 이익은 마지막에 쌓되, 값이 음수(적자)이면 X축 아래로 그려짐 */}
                        <Bar stackId="a" dataKey="영업이익" name="영업이익" fill="#10b981" fillOpacity={0.8} radius={[4, 4, 0, 0]}>
                            {
                                chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={(entry.영업이익 ?? 0) < 0 ? '#ef4444' : '#10b981'} />
                                ))
                            }
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
