/**
 * 통합 합계 테이블 컴포넌트
 * - 각 P&L 항목에 대해 사업부별 금액(원화 환산) + 합계를 한 눈에 표시
 * - 창원(KRW) | 태국(→KRW) | 베트남(→KRW) | 멕시코(→KRW) | 합계(KRW) 형태
 * - 월별 / 분기별 / 반기별 / 연간 기간 지원
 */
import {
    type DataStore,
    DIVISIONS,
    PL_ITEMS,
    ALL_ITEMS_MAP,
    formatAmount,
    createEmptyPLData,
    calculateDerivedFields,
    type MonthlyPLData,
    type DivisionCode,
    convertToKRW,
} from '../utils/dataModel';
import { getDivisionData } from '../utils/storage';

type PeriodType = 'monthly' | 'quarterly' | 'half' | 'yearly';

interface ConsolidatedTableProps {
    store: DataStore;
    year: number;
    periodType: PeriodType;
    periodIndex: number;
}

// 사업부별 특정 기간의 집계 데이터 + 환율
function getDivisionPeriodData(
    store: DataStore, code: DivisionCode, year: number,
    periodType: PeriodType, periodIndex: number
): { data: MonthlyPLData; avgRate: number } {
    const divData = getDivisionData(store, code, year);
    if (!divData) return { data: createEmptyPLData(), avgRate: 1 };

    let months: number[];
    switch (periodType) {
        case 'monthly': months = [periodIndex]; break;
        case 'quarterly': months = [(periodIndex - 1) * 3 + 1, (periodIndex - 1) * 3 + 2, (periodIndex - 1) * 3 + 3]; break;
        case 'half': months = Array.from({ length: 6 }, (_, i) => (periodIndex - 1) * 6 + i + 1); break;
        case 'yearly': months = Array.from({ length: 12 }, (_, i) => i + 1); break;
    }

    // 해당 월들 합산 (현지 화폐 기준)
    const result = createEmptyPLData();
    let rateSum = 0;
    let rateCount = 0;
    months.forEach(m => {
        const mData = divData.monthly[m];
        if (mData) {
            Object.values(ALL_ITEMS_MAP).forEach(item => {
                if (!item.isCalculated) {
                    result[item.key] = (result[item.key] || 0) + (mData[item.key] || 0);
                }
            });
        }
        const r = divData.exchangeRate[m];
        if (r) { rateSum += r; rateCount++; }
    });

    // 평균 환율
    const avgRate = rateCount > 0 ? rateSum / rateCount : (divData.exchangeRate[1] || 1);

    return { data: calculateDerivedFields(result, true), avgRate };
}

// 기간 라벨
function getPeriodLabel(periodType: PeriodType, periodIndex: number, year: number): string {
    switch (periodType) {
        case 'monthly': return `${year}년 ${periodIndex}월`;
        case 'quarterly': return `${year}년 Q${periodIndex} (${(periodIndex - 1) * 3 + 1}~${periodIndex * 3}월)`;
        case 'half': return `${year}년 ${periodIndex === 1 ? '상반기' : '하반기'}`;
        case 'yearly': return `${year}년 연간`;
    }
}

export function ConsolidatedTable({ store, year, periodType, periodIndex }: ConsolidatedTableProps) {
    // 각 사업부의 해당 기간 데이터 (현지화폐 + 환율)
    const divisionData = DIVISIONS.map(div => {
        const { data, avgRate } = getDivisionPeriodData(store, div.code, year, periodType, periodIndex);
        const dataKRW = convertToKRW(data, avgRate);
        return { info: div, dataLocal: data, dataKRW, avgRate };
    });

    // 합계: 원화 기준 합산
    const totalData = createEmptyPLData();
    divisionData.forEach(({ dataKRW }) => {
        Object.values(ALL_ITEMS_MAP).forEach(item => {
            if (!item.isCalculated) {
                totalData[item.key] = (totalData[item.key] || 0) + (dataKRW[item.key] || 0);
            }
        });
    });
    const totalComputed = calculateDerivedFields(totalData, true);

    const periodLabel = getPeriodLabel(periodType, periodIndex, year);

    return (
        <div className="glass-card p-5 animate-fade-in overflow-x-auto" style={{ padding: '24px', boxSizing: 'border-box' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
                📊 전 사업부 통합 손익계산서 · {periodLabel}
                <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>(단위: 원화 환산 백만)</span>
            </h2>

            {/* 환율 정보 표시 */}
            <div className="flex gap-4 mb-3 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
                {divisionData.filter(d => d.avgRate !== 1).map(d => (
                    <span key={d.info.code}>
                        {d.info.flag} 1 {d.info.currency} = {d.avgRate.toFixed(2)}원
                    </span>
                ))}
            </div>

            <div className="overflow-auto border border-gray-200 rounded-lg shadow-inner" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="sticky-col-1" style={{ minWidth: 110 }}>구분</th>
                            {DIVISIONS.map(div => {
                                return (
                                    <th key={div.code} style={{ minWidth: 100 }}>
                                        <div>{div.flag} {div.name}</div>
                                        <div className="text-xs font-normal" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                                            (→KRW)
                                        </div>
                                    </th>
                                );
                            })}
                            <th style={{
                                minWidth: 100,
                                background: '#dbeafe',
                                color: 'var(--accent-blue)',
                                fontWeight: 700,
                            }}>
                                📊 합계
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {PL_ITEMS.filter(item => ['revenue', 'materialRatio', 'laborCost', 'overhead', 'operatingProfit', 'operatingProfitRatio', 'ebt', 'ebtRatio'].includes(item.key)).map(item => {
                            const isProfit = ['operatingProfit', 'grossProfit', 'ebt'].includes(item.key);
                            const totalVal = totalComputed[item.key] || 0;

                            return (
                                <tr key={item.key} className={item.isHeader ? 'row-header' : ''}>
                                    <td className="sticky-col-1" style={{ paddingLeft: `${12 + item.indent * 16}px`, background: item.isHeader ? '#fafbfd' : '#f8fafc' }}>
                                        {item.isHeader ? <strong>{item.label}</strong> : item.label}
                                    </td>
                                    {divisionData.map(({ info, dataKRW }) => {
                                        const val = dataKRW[item.key] || 0;
                                        let cls = '';
                                        if (isProfit && val !== 0) cls = val > 0 ? 'value-positive' : 'value-negative';
                                        return (
                                            <td key={info.code} className={cls}>
                                                {item.isHeader ? <strong>{formatAmount(val)}</strong> : formatAmount(val)}
                                            </td>
                                        );
                                    })}
                                    <td style={{
                                        background: '#eff6ff',
                                        fontWeight: 700,
                                        color: isProfit && totalVal !== 0
                                            ? (totalVal > 0 ? 'var(--accent-blue)' : 'var(--accent-rose)')
                                            : 'var(--text-primary)',
                                    }}>
                                        <strong>{formatAmount(totalVal)}</strong>
                                    </td>
                                </tr>
                            );
                        })}
                        {/* 영업이익률 행 */}
                        <tr className="row-header" style={{ borderTop: '2px solid var(--accent-blue)' }}>
                            <td className="sticky-col-1" style={{ background: '#fafbfd' }}><strong>영업이익률 (%)</strong></td>
                            {divisionData.map(({ info, dataKRW }) => {
                                const rev = dataKRW.revenue || 0;
                                const op = dataKRW.operatingProfit || 0;
                                const ratio = rev !== 0 ? ((op / rev) * 100).toFixed(1) : '-';
                                const isPos = Number(ratio) >= 0;
                                return (
                                    <td key={info.code} className={ratio !== '-' ? (isPos ? 'value-positive' : 'value-negative') : ''}>
                                        <strong>{ratio}{ratio !== '-' ? '%' : ''}</strong>
                                    </td>
                                );
                            })}
                            <td style={{ background: '#eff6ff', fontWeight: 700 }}>
                                {(() => {
                                    const rev = totalComputed.revenue || 0;
                                    const op = totalComputed.operatingProfit || 0;
                                    const ratio = rev !== 0 ? ((op / rev) * 100).toFixed(1) : '-';
                                    const isPos = Number(ratio) >= 0;
                                    return (
                                        <strong className={ratio !== '-' ? (isPos ? 'value-positive' : 'value-negative') : ''}>
                                            {ratio}{ratio !== '-' ? '%' : ''}
                                        </strong>
                                    );
                                })()}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
