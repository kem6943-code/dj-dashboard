/**
 * 데이터 입력 모달 컴포넌트
 * - 각 P&L 항목을 직접 입력할 수 있는 폼
 * - 자동 계산 항목(매출원가, 영업이익 등)은 읽기 전용으로 표시
 */
import { useState, useEffect } from 'react';
import { type MonthlyPLData, type DivisionInfo, getPLItemsForDivision, MONTH_NAMES, calculateDerivedFields, createEmptyPLData } from '../utils/dataModel';
import { X, Save, Calculator } from 'lucide-react';

interface DataInputModalProps {
    divisionInfo: DivisionInfo;
    year: number;
    month: number;
    initialData?: MonthlyPLData;
    initialRate?: number; // 현재 환율
    onSave: (month: number, data: Record<string, number>, exchangeRate: number) => void;
    onClose: () => void;
}

export function DataInputModal({ divisionInfo, year, month, initialData, initialRate, onSave, onClose }: DataInputModalProps) {
    const [selectedMonth, setSelectedMonth] = useState(month);
    const [exchangeRate, setExchangeRate] = useState(initialRate || 1);
    const [formData, setFormData] = useState<Record<string, number>>(() => {
        return initialData ? { ...initialData } : createEmptyPLData();
    });

    // 자동 계산 필드 업데이트 (입력값 변경 시)
    const plItems = getPLItemsForDivision(divisionInfo.code as any);
    useEffect(() => {
        const calculated = calculateDerivedFields(formData);
        setFormData(prev => {
            const updated = { ...prev };
            plItems.forEach(item => {
                if (item.isCalculated) {
                    updated[item.key] = calculated[item.key] || 0;
                }
            });
            return updated;
        });
    }, [
        formData.revenue,
        formData.laborCost,
        formData.overhead,
        formData.bomMaterialRatio,
        formData.materialDiff,
        formData.headcount,
        formData.financeCost,
        formData.nonOpIncome,
    ]);

    const handleChange = (key: string, value: string) => {
        const numValue = value === '' ? 0 : Number(value);
        if (!isNaN(numValue)) {
            setFormData(prev => ({ ...prev, [key]: numValue }));
        }
    };

    const handleSubmit = () => {
        onSave(selectedMonth, formData, exchangeRate);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
            <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-blue-400" />
                        {divisionInfo.flag} {divisionInfo.name} 데이터 입력
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 기간 선택 */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{year}년</span>
                    <select
                        className="select-field flex-1"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                    >
                        {MONTH_NAMES.map((name, i) => (
                            <option key={i} value={i + 1}>{name}</option>
                        ))}
                    </select>
                </div>

                {/* 환율 입력 (해외법인만) */}
                {divisionInfo.currency !== 'KRW' && (
                    <div className="flex items-center gap-3 mb-6 p-3 rounded-lg" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                        <label className="text-sm font-medium w-28 flex-shrink-0" style={{ color: '#92400e' }}>
                            💱 환율
                        </label>
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs" style={{ color: '#92400e' }}>1 {divisionInfo.currency} =</span>
                            <input
                                type="number"
                                step="0.01"
                                className="input-field"
                                style={{ maxWidth: 120 }}
                                value={exchangeRate || ''}
                                onChange={e => setExchangeRate(Number(e.target.value) || 0)}
                                placeholder="0"
                            />
                            <span className="text-xs" style={{ color: '#92400e' }}>원 (KRW)</span>
                        </div>
                    </div>
                )}

                {/* 통화 안내 */}
                <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    💰 금액은 <strong>{divisionInfo.currency}</strong> (현지 통화) 기준으로 입력해주세요
                </div>

                {/* 입력 필드들 */}
                <div className="space-y-3">
                    {plItems.map(item => {
                        const isDisabled = item.isCalculated;
                        const value = formData[item.key] || 0;
                        return (
                            <div key={item.key} className="flex items-center gap-3"
                                style={{ paddingLeft: `${item.indent * 16}px` }}
                            >
                                <label className="text-sm w-28 flex-shrink-0" style={{
                                    color: item.isHeader ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                    fontWeight: item.isHeader ? 700 : 400,
                                }}>
                                    {item.label}
                                </label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={value || ''}
                                    onChange={e => handleChange(item.key, e.target.value)}
                                    disabled={isDisabled}
                                    placeholder="0"
                                    style={{
                                        opacity: isDisabled ? 0.6 : 1,
                                        background: isDisabled ? 'var(--bg-card-hover)' : undefined,
                                        fontWeight: item.isHeader ? 700 : 400,
                                        color: item.isHeader ? 'var(--accent-blue)' : undefined,
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* 하단 안내 + 저장 */}
                <div className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    💡 <strong>파란색 항목</strong>은 자동 계산됩니다 (매출원가, 매출총이익, 영업이익, 세전이익)
                </div>
                <div className="flex gap-3 mt-6">
                    <button className="btn-secondary flex-1" onClick={onClose}>취소</button>
                    <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={handleSubmit}>
                        <Save className="w-4 h-4" />
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}
