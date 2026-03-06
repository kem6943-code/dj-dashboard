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
    dataType?: 'actual' | 'target' | 'prevYear';
    initialData?: MonthlyPLData;
    initialRate?: number; // 현재 환율
    onSave: (month: number, data: Record<string, number>, exchangeRate: number, dataType: 'actual' | 'target' | 'prevYear') => void;
    onClose: () => void;
}

export function DataInputModal({ divisionInfo, year, month, dataType = 'actual', initialData, initialRate, onSave, onClose }: DataInputModalProps) {
    const [selectedMonth, setSelectedMonth] = useState(month);
    const [exchangeRate, setExchangeRate] = useState(initialRate || 1);

    // 단위 계산 (모든 사업부 백만 단위로 통일 입력 권장)
    const multiplier = 1000000;

    // 통화 단위 커스텀 텍스트
    const unitText =
        divisionInfo.currency === 'KRW' ? '백만원' :
            divisionInfo.currency === 'VND' ? '백만동' :
                `백만${divisionInfo.currency}`;

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
        const item = plItems.find(i => i.key === key);
        const isAmount = !item?.type || item.type === 'amount';
        const numValue = value === '' ? 0 : Number(value);
        if (!isNaN(numValue)) {
            // 금액인 경우에만 multiplier 적용
            setFormData(prev => ({ ...prev, [key]: numValue * (isAmount ? multiplier : 1) }));
        }
    };

    const handleSubmit = () => {
        onSave(selectedMonth, formData, exchangeRate, dataType);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" style={{ padding: '20px', boxSizing: 'border-box' }}>
            <div className="glass-card px-5 py-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12)', padding: '24px 20px', boxSizing: 'border-box' }}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-blue-400" />
                            {divisionInfo.flag} {divisionInfo.name} 데이터 입력
                        </h2>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            입력 항목: <strong style={{
                                color: dataType === 'prevYear' ? '#92400e' : dataType === 'target' ? '#1e40af' : '#166534',
                                backgroundColor: dataType === 'prevYear' ? '#fef3c7' : dataType === 'target' ? '#f0f9ff' : '#f0fdf4',
                                padding: '2px 8px', borderRadius: '4px'
                            }}>
                                {dataType === 'prevYear' ? "'25실적" : dataType === 'target' ? 'TD목표' : "'26실적"}
                            </strong>
                        </p>
                    </div>
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
                            💱 단위 환율
                        </label>
                        <div className="flex items-center gap-2 flex-1 relative group">
                            <span className="text-xs font-bold" style={{ color: '#92400e' }}>1 {divisionInfo.currency} =</span>
                            <input
                                type="number"
                                step="0.001"
                                className="input-field font-bold text-amber-900 border-amber-300 focus:border-amber-500 focus:ring-amber-200"
                                style={{ maxWidth: 120, border: '1px solid #fcd34d', backgroundColor: '#fff', padding: '6px 12px' }}
                                value={exchangeRate || ''}
                                onChange={e => {
                                    const val = Number(e.target.value);
                                    if (val >= 0) setExchangeRate(val);
                                }}
                                placeholder="0"
                            />
                            <span className="text-xs font-bold" style={{ color: '#92400e' }}>원 (KRW)</span>

                            {/* 환율 툴팁 (기존 상수값 안내) */}
                            <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-800 text-white text-[11px] rounded shadow-lg z-10 whitespace-nowrap min-w-max text-center">
                                권장 기준 환율:<br />
                                🇹🇭 THB: 39.5원 / 🇻🇳 VND: 0.055원<br />🇲🇽 MXN: 75.0원
                            </div>
                        </div>
                    </div>
                )}

                {/* 통화 안내 */}
                <div className="text-sm border-b pb-3 mb-4" style={{ color: 'var(--text-muted)' }}>
                    💰 금액은 <strong>{unitText}</strong> 단위로 입력해주세요.
                    {divisionInfo.currency === 'KRW' && " (예: 95억5900만원 -> 9559 입력)"}
                    {divisionInfo.currency === 'THB' && " (예: 1억7400만바트 -> 174 입력)"}
                    {divisionInfo.currency === 'VND' && " (예: 49억1100만동 -> 4911 입력)"}
                    {divisionInfo.currency === 'MXN' && " (예: 5100만페소 -> 51 입력)"}
                </div>

                {/* 입력 필드들 */}
                <div className="space-y-0 border-t border-gray-200 mt-2">
                    {plItems.map((item, index) => {
                        const isDisabled = item.isCalculated;
                        const isAmount = !item.type || item.type === 'amount';
                        const currentMultiplier = isAmount ? multiplier : 1;

                        // 화면에 보여줄 때는 배수로 나눈 값 (금액에만)
                        const rawValue = formData[item.key] || 0;
                        const displayValue = rawValue === 0 ? '' : rawValue / currentMultiplier;

                        return (
                            <div key={item.key} className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                            >
                                <label className="text-sm w-44 flex-shrink-0" style={{
                                    paddingLeft: `${item.indent * 24}px`,
                                    color: item.isHeader ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                    fontWeight: item.isHeader ? 700 : 500,
                                }}>
                                    {item.label}
                                </label>
                                <div className="flex-1 relative flex items-center">
                                    <input
                                        type="number"
                                        data-input-index={index} // 엔터키 이동을 위한 인덱스 속성 부여
                                        className="w-full text-left bg-transparent outline-none transition-all placeholder:text-gray-300"
                                        value={displayValue}
                                        onChange={e => handleChange(item.key, e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                // 현재 인덱스 기준으로 다음 활성화된 input 찾기
                                                let nextIndex = index + 1;
                                                const inputs = document.querySelectorAll('input[data-input-index]');
                                                while (nextIndex < inputs.length) {
                                                    const nextInput = document.querySelector(`input[data-input-index="${nextIndex}"]`) as HTMLInputElement | null;
                                                    if (nextInput && !nextInput.disabled) {
                                                        nextInput.focus();
                                                        nextInput.select(); // 포커스 후 전체 텍스트 선택(입력 편의성)
                                                        break;
                                                    }
                                                    nextIndex++;
                                                }
                                            }
                                        }}
                                        disabled={isDisabled}
                                        placeholder="0"
                                        style={{
                                            opacity: isDisabled ? 0.6 : 1,
                                            fontWeight: item.isHeader ? 700 : 500,
                                            color: item.isHeader ? 'var(--accent-blue)' : '#374151',
                                            padding: '4px 0',
                                            paddingRight: (currentMultiplier === 1000000 && !isDisabled && displayValue !== '') ? '40px' : '0px',
                                            fontSize: '15px'
                                        }}
                                    />
                                    {currentMultiplier === 1000000 && !isDisabled && displayValue !== '' && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 pointer-events-none font-medium">
                                            백만
                                        </div>
                                    )}
                                </div>
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
