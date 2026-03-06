/**
 * KPI 카드 컴포넌트
 * - 매출액, 영업이익, 영업이익률, 재료비율 등 핵심 지표 카드
 */
import { type DivisionYearData, type DivisionInfo, formatAmount } from '../utils/dataModel';
import { TrendingUp, TrendingDown, DollarSign, Percent, Package } from 'lucide-react';

interface KPICardsProps {
    divData: DivisionYearData | undefined;
    divisionInfo: DivisionInfo;
}

export function KPICards({ divData, divisionInfo }: KPICardsProps) {
    // 가장 최근 데이터가 있는 월 찾기
    const latestMonth = divData
        ? Math.max(...Object.keys(divData.monthly).map(Number).filter(m => {
            const d = divData.monthly[m];
            return d && d.revenue !== 0;
        }), 0)
        : 0;

    const currentData = divData?.monthly[latestMonth];

    const revenue = currentData?.revenue || 0;
    const operatingProfit = currentData?.operatingProfit || 0;
    const ebt = currentData?.ebt || 0;

    const opMargin = revenue !== 0 ? ((operatingProfit / revenue) * 100).toFixed(1) : '0.0';
    const materialRatio = currentData?.materialRatio !== undefined
        ? Number(currentData.materialRatio).toFixed(1)
        : '0.0';

    const kpis = [
        {
            label: '매출액',
            value: formatAmount(revenue),
            unit: '백만',
            icon: DollarSign,
            color: 'var(--accent-blue)',
            month: latestMonth > 0 ? `${latestMonth}월` : '-',
        },
        {
            label: '영업이익',
            value: formatAmount(operatingProfit),
            unit: '백만',
            icon: operatingProfit >= 0 ? TrendingUp : TrendingDown,
            color: operatingProfit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            month: latestMonth > 0 ? `${latestMonth}월` : '-',
        },
        {
            label: '영업이익률',
            value: `${opMargin}%`,
            unit: '',
            icon: Percent,
            color: Number(opMargin) >= 5 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
            month: latestMonth > 0 ? `${latestMonth}월` : '-',
        },
        {
            label: '재료비율',
            value: `${materialRatio}%`,
            unit: '',
            icon: Package,
            color: Number(materialRatio) <= 60 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            month: latestMonth > 0 ? `${latestMonth}월` : '-',
        },
        {
            label: '세전이익',
            value: formatAmount(ebt),
            unit: '백만',
            icon: ebt >= 0 ? TrendingUp : TrendingDown,
            color: ebt >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            month: latestMonth > 0 ? `${latestMonth}월` : '-',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 animate-fade-in" style={{ padding: '20px 0', boxSizing: 'border-box' }}>
            {kpis.map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                    <div key={i} className="kpi-card" style={{ padding: '20px', boxSizing: 'border-box' }}>
                        <div className="flex items-center justify-between">
                            <span className="kpi-label">{kpi.label}</span>
                            <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                        </div>
                        <span className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {divisionInfo.flag} {kpi.month}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
