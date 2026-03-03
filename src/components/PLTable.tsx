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
    onEditMonth?: (month: number) => void;
    showTarget?: boolean;
    showYoY?: boolean;
}

// 값 포맷 (유형에 따라 다르게 표시)
function formatValue(value: number, item: PLItem): string {
    if (item.type === 'ratio') {
        if (value === 0) return '-';
        return `${value.toFixed(1)}%`;
    }
    if (item.type === 'count') {
        if (value === 0) return '-';
        return Math.round(value).toLocaleString();
    }
    if (item.type === 'unit') {
        if (value === 0) return '-';
        return (value / 1000000).toFixed(2); // 백만 단위로 소수점 2자리
    }
    return formatAmount(value);
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

export function PLTable({ items, labels, data, onEditMonth, showTarget, showYoY }: PLTableProps) {
    const sectionSpans = getSectionSpans(items);
    const renderedSections = new Set<string>();

    // 토글 조합에 따른 서브컨럼 구성
    const subColHeaders: string[] = [];
    if (showYoY) subColHeaders.push("'25실적");
    if (showTarget) subColHeaders.push('TD목표');
    subColHeaders.push("'26실적");
    const colSpan = subColHeaders.length;
    const hasSubHeaders = colSpan > 1; // 서브헤더가 필요한지 여부

    return (
        <div className="overflow-auto border border-gray-200 rounded-lg shadow-inner" style={{ maxHeight: 'calc(100vh - 260px)' }}>
            <table className="data-table">
                <thead>
                    <tr>
                        <th className="sticky-col-1" rowSpan={hasSubHeaders ? 2 : 1} style={{ minWidth: 70, textAlign: 'center' }}>섹션</th>
                        <th className="sticky-col-2" rowSpan={hasSubHeaders ? 2 : 1} style={{ minWidth: 110 }}>구분</th>
                        {labels.map((label, i) => (
                            <th key={i} colSpan={colSpan} style={{ minWidth: colSpan > 2 ? 200 : colSpan > 1 ? 150 : 90, textAlign: 'center' }}>
                                <div className="flex items-center justify-center gap-1">
                                    {label}
                                    {onEditMonth && !hasSubHeaders && (
                                        <button
                                            onClick={() => onEditMonth(i + 1)}
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
                                subColHeaders.map((subLabel, si) => (
                                    <th key={`${i}-${si}`} style={{
                                        minWidth: 65,
                                        textAlign: 'center',
                                        fontSize: '0.68rem',
                                        fontWeight: 600,
                                        backgroundColor: subLabel === "'25실적" ? '#fef3c7' : subLabel === 'TD목표' ? '#f0f9ff' : '#f0fdf4',
                                        borderTop: 'none',
                                        borderLeft: si > 0 ? '1px solid var(--border-color)' : undefined,
                                        color: subLabel === "'25실적" ? '#92400e' : subLabel === 'TD목표' ? '#1e40af' : '#166534',
                                    }}>
                                        <div className="flex items-center justify-center gap-1">
                                            {subLabel}
                                            {subLabel === "'26실적" && onEditMonth && (
                                                <button
                                                    onClick={() => onEditMonth(i + 1)}
                                                    className="opacity-40 hover:opacity-100 transition-opacity"
                                                    title={`${label} 실적 데이터 편집`}
                                                >
                                                    <PenLine className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))
                            )}
                        </tr>
                    )}
                </thead>
                <tbody>
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
                                        className="sticky-col-1"
                                        rowSpan={sectionSpans.get(section) || 1}
                                        style={{
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            fontSize: '0.72rem',
                                            verticalAlign: 'middle',
                                            background: '#f8fafc',
                                            borderRight: '2px solid var(--border-color)',
                                            color: 'var(--text-secondary)',
                                            whiteSpace: 'pre-line',
                                            lineHeight: 1.3,
                                            padding: '4px 6px',
                                        }}
                                    >
                                        {section}
                                    </td>
                                ) : !section ? (
                                    <td className="sticky-col-1" style={{ background: '#f8fafc' }}></td>
                                ) : null}

                                {/* 항목명 */}
                                <td className="sticky-col-2" style={{
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
                                    const formatted = formatValue(value, item);

                                    // 목표/실적 컬럼 구분 스타일 (showTarget이 참일 경우 짝수 인덱스는 목표, 홀수는 실적)
                                    const isTargetCol = showTarget && i % 2 === 0;
                                    const isActualCol = showTarget && i % 2 === 1;

                                    return (
                                        <td key={i} className={colorClass} style={{
                                            fontSize: item.indent > 0 ? '0.75rem' : undefined,
                                            backgroundColor: isTargetCol ? '#f8fafc' : undefined, // 목표 컬럼 배경을 헤더와 맞춤
                                            borderRight: isTargetCol ? 'none' : undefined, // 목표와 실적 사이 경계선
                                            borderLeft: isActualCol ? '1px dashed var(--border-color)' : undefined,
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
