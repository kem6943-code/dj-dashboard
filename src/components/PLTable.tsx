/**
 * P&L 테이블 컴포넌트
 * - 회사 보고서 형식에 맞춘 구조 (섹션 그룹 + 상세 항목)
 * - 비율(%), 인원(명), 금액(백만) 유형별 포맷팅
 * - 왼쪽 섹션 병합 셀 표시
 */
import { type PLItem, type MonthlyPLData, formatAmount } from '../utils/dataModel';
import { PenLine } from 'lucide-react';

interface PLTableProps {
    items: PLItem[];
    labels: string[];
    data: MonthlyPLData[];
    onEditMonth?: (month: number, dataType: 'actual' | 'target' | 'prevYear') => void;
    showTarget?: boolean;
    showYoY?: boolean;
    rates?: number[]; // 각 데이터 컬럼에 대응하는 환율 리스트
    currency?: string; // 현재 테이블의 통화 코드 (KRW, THB 등)
}

// 값 포맷 (유형에 따라 다르게 표시)
function formatValue(value: number, item: PLItem, currency: string = 'KRW'): string {
    if (item.type === 'ratio') {
        if (value === 0) return '-';
        // [V9] PPT 슬라이드 3번 행별 소수점 싱크
        // 재료비 관련은 2자리, 나머지는 1자리
        const isMaterialDetail = ['materialRatio', 'bomMaterialRatio', 'lossRate'].includes(item.key);
        const decimals = isMaterialDetail ? 2 : 1;
        return `${value.toFixed(decimals)}%`;
    }
    if (item.type === 'count') {
        if (value === 0) return '-';
        return Math.round(value).toLocaleString();
    }
    if (item.type === 'unit') {
        if (value === 0) return '-';
        // 원당매출액 등 (이미지: 24.8) -> 금액 단위(백만/천)에 맞게 스케일링 후 소수점 1자리
        const divider = currency === 'MXN' ? 1000 : 1000000;
        return (value / divider).toFixed(1);
    }
    const unit = currency === 'MXN' ? '천' : '백만';
    return formatAmount(value, unit, currency);
}

// 섹션별 행 수 계산 (rowspan용)
function getSectionSpans(items: PLItem[]): Map<string, number> {
    const spans = new Map<string, number>();
    items.forEach(item => {
        if (item.section) {
            spans.set(item.section, (spans.get(item.section) || 0) + 1);
        }
    });
    return spans;
}

export function PLTable({ items, labels, data, onEditMonth, showTarget, showYoY, rates, currency = 'KRW' }: PLTableProps) {
    const sectionSpans = getSectionSpans(items);
    const renderedSections = new Set<string>();

    // 토글 조합에 따른 서브컨럼 구성
    const subColHeaders: string[] = [];
    if (showYoY) subColHeaders.push("'25실적");
    subColHeaders.push("'26실적");
    if (showTarget) subColHeaders.push('TD목표');
    const colSpan = subColHeaders.length;
    const hasSubHeaders = colSpan > 1; // 서브헤더가 필요한 여부

    return (
        <div className="table-scroll-container bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] w-full overflow-x-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
            <table className="data-table w-max min-w-max">
                <thead>
                    <tr>
                        <th className="sticky-col-1 whitespace-nowrap px-2 z-20" rowSpan={hasSubHeaders ? 2 : 1} style={{ minWidth: 70, width: 70, textAlign: 'center', position: 'sticky', left: 0, backgroundColor: '#f8fafc' }}>섹션</th>
                        <th className="sticky-col-2 whitespace-nowrap px-2 z-20" rowSpan={hasSubHeaders ? 2 : 1} style={{ minWidth: 130, width: 130, position: 'sticky', left: 70, backgroundColor: '#f8fafc' }}>구분</th>
                        {labels.map((label, i) => (
                            <th key={i} colSpan={colSpan} className="whitespace-nowrap px-2" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                                <div className="flex items-center justify-center gap-1">
                                    {label}
                                    {onEditMonth && !hasSubHeaders && (
                                        <button
                                            onClick={() => onEditMonth(i + 1, 'actual')}
                                            className="opacity-40 hover:opacity-100 transition-opacity"
                                            title={`${label} 실적 데이터 편집`}
                                        >
                                            <PenLine className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                    {hasSubHeaders && (
                        <tr className="header-row-2">
                            {labels.map((label, i) =>
                                subColHeaders.map((subLabel, si) => {
                                    const dataType = subLabel === "'25실적" ? 'prevYear' : subLabel === 'TD목표' ? 'target' : 'actual';
                                    return (
                                        <th key={`${i}-${si}`} className="whitespace-nowrap px-2 min-w-[70px]" style={{
                                            textAlign: 'center',
                                            fontSize: '0.68rem',
                                            fontWeight: 600,
                                            backgroundColor: subLabel === "'25실적" ? '#fef3c7' : subLabel === 'TD목표' ? '#f0f9ff' : '#f0fdf4',
                                            borderTop: 'none',
                                            borderLeft: '1px solid var(--border-color)',
                                            color: subLabel === "'25실적" ? '#92400e' : subLabel === 'TD목표' ? '#1e40af' : '#166534',
                                        }}>
                                            <div className="flex items-center justify-center gap-1">
                                                {subLabel}
                                                {onEditMonth && label !== '누계' && (
                                                    <button
                                                        onClick={() => onEditMonth(i + 1, dataType)}
                                                        className="opacity-40 hover:opacity-100 transition-opacity"
                                                        title={`${label} ${subLabel} 데이터 편집`}
                                                    >
                                                        <PenLine className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })
                            )}
                        </tr>
                    )}
                </thead>
                <tbody>
                    {/* [NEW] 환율 전용 행 추가 - 레퍼런스 이미지 스타일 반영 */}
                    {rates && rates.length > 0 && rates.some(r => r !== 1) && (
                        <tr className="row-header" style={{ backgroundColor: '#fdfcf0', borderBottom: '2px solid #fde68a' }}>
                            <td className="sticky-col-1 whitespace-nowrap px-2 z-10" style={{ position: 'sticky', left: 0, background: '#fdfcf0' }}></td>
                            <td className="sticky-col-2 whitespace-nowrap px-2 z-10" style={{ position: 'sticky', left: 70, background: '#fdfcf0', color: '#92400e', fontWeight: 700, textAlign: 'center' }}>
                                환율
                            </td>
                            {labels.map((_, monthIndex) => {
                                // 현재 라벨(월/누계)에 해당하는 서브 컬럼들 렌더링
                                return subColHeaders.map((_, subColIndex) => {
                                    const rateIndex = monthIndex * colSpan + subColIndex;
                                    const rate = rates[rateIndex];
                                    return (
                                        <td key={`${monthIndex}-${subColIndex}`} className="whitespace-nowrap px-2 min-w-[70px]" style={{
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            color: '#92400e',
                                            fontSize: '0.7rem',
                                            backgroundColor: '#fefce8',
                                            borderLeft: subColIndex > 0 ? '1px dashed #fde68a' : undefined
                                        }}>
                                            {rate && rate !== 1 ? rate.toFixed(2) : '-'}
                                        </td>
                                    );
                                });
                            })}
                        </tr>
                    )}
                    {items.map(item => {
                        const section = item.section || '';
                        const isFirstInSection = !renderedSections.has(section);
                        if (isFirstInSection && section) renderedSections.add(section);

                        // 컬러코딩 대상
                        const isProfit = ['operatingProfit', 'ebt', 'nonOpBalance'].includes(item.key);

                        return (
                            <tr key={item.key} className={item.isHeader ? 'row-header' : ''}>
                                {/* 섹션 병합 셀 */}
                                {isFirstInSection && section ? (
                                    <td
                                        className="sticky-col-1 whitespace-nowrap px-2 z-10"
                                        rowSpan={sectionSpans.get(section) || 1}
                                        style={{
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            fontSize: '0.72rem',
                                            verticalAlign: 'top',
                                            background: '#f8fafc',
                                            borderRight: '2px solid var(--border-color)',
                                            color: 'var(--text-secondary)',
                                            whiteSpace: 'pre-line',
                                            lineHeight: 1.3,
                                            padding: '12px 6px 4px 6px',
                                            position: 'sticky',
                                            left: 0,
                                        }}
                                    >
                                        {section}
                                    </td>
                                ) : !section ? (
                                    <td className="sticky-col-1 whitespace-nowrap z-10" style={{ position: 'sticky', left: 0, background: '#f8fafc' }}></td>
                                ) : null}

                                {/* 항목명 */}
                                <td className="sticky-col-2 whitespace-nowrap px-2 z-10" style={{
                                    position: 'sticky',
                                    left: 70,
                                    background: '#ffffff',
                                    paddingLeft: `${8 + item.indent * 14}px`,
                                    fontSize: item.indent > 0 ? '0.75rem' : undefined,
                                }}>
                                    {item.indent > 0 && <span style={{ color: 'var(--text-muted)' }}>- </span>}
                                    {item.isHeader ? <strong>{item.label}</strong> : item.label}
                                </td>

                                {/* 데이터 셀 */}
                                {data.map((periodData, i) => {
                                    const value = periodData[item.key] || 0;
                                    let colorClass = '';
                                    if (isProfit && value !== 0) {
                                        colorClass = value > 0 ? 'value-positive' : 'value-negative';
                                    }
                                    const formatted = formatValue(value, item, currency);

                                    // 하위 컬럼 종류에 따른 스타일 (showTarget, showYoY 등의 배열을 기반)
                                    let isTargetCol = false;
                                    if (hasSubHeaders) {
                                        const colType = subColHeaders[i % colSpan];
                                        isTargetCol = colType === 'TD목표';
                                    }

                                    return (
                                        <td key={i} className={`${colorClass} whitespace-nowrap px-2 min-w-[70px]`} style={{
                                            fontSize: item.indent > 0 ? '0.75rem' : undefined,
                                            textAlign: 'right',
                                            backgroundColor: isTargetCol ? '#f8fafc' : undefined,
                                            borderLeft: '1px solid var(--border-color)',
                                            paddingRight: '8px',
                                        }}>
                                            {item.isHeader ? <strong>{formatted}</strong> : formatted}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
