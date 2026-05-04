/**
 * 전사 공통비 관리 모달 (HQ Cost Modal)
 * - 월별 본사 비용, 영외수익, 영외비용을 입력/수정
 * - 전사이익 = 사업부 세전이익 합계 - 본사비용 + 영외수익 - 영외비용
 */
import { useState, useEffect } from 'react';
import { X, Building2, Save, Info } from 'lucide-react';
import type { HQCostData, HQMonthlyCost } from '../utils/dataModel';

interface HQCostModalProps {
    year: number;
    hqCosts: HQCostData[];
    onSave: (updatedHQCosts: HQCostData[]) => void;
    onClose: () => void;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// 백만원 단위 숫자를 포맷 (입력 시 표시용)
function formatDisplay(val: number): string {
    if (val === 0) return '';
    return (val / 1_000_000).toFixed(0);
}

// 백만원 단위 입력을 원화로 변환
function parseInput(str: string): number {
    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    return num * 1_000_000;
}

export function HQCostModal({ year, hqCosts, onSave, onClose }: HQCostModalProps) {
    // 해당 연도 데이터를 찾거나 빈 데이터 생성
    const existingData = hqCosts.find(h => h.year === year);
    const [monthlyData, setMonthlyData] = useState<{ [month: number]: HQMonthlyCost }>(() => {
        const initial: { [month: number]: HQMonthlyCost } = {};
        MONTHS.forEach(m => {
            initial[m] = existingData?.monthly[m] || { cost: 0, nonOpRevenue: 0, nonOpExpense: 0 };
        });
        return initial;
    });

    const [isSaving, setIsSaving] = useState(false);

    // 특정 셀 업데이트 핸들러
    const updateCell = (month: number, field: keyof HQMonthlyCost, value: string) => {
        setMonthlyData(prev => ({
            ...prev,
            [month]: {
                ...prev[month],
                [field]: parseInput(value),
            }
        }));
    };

    // 합계 계산
    const totals = MONTHS.reduce((acc, m) => {
        acc.cost += monthlyData[m]?.cost || 0;
        acc.nonOpRevenue += monthlyData[m]?.nonOpRevenue || 0;
        acc.nonOpExpense += monthlyData[m]?.nonOpExpense || 0;
        return acc;
    }, { cost: 0, nonOpRevenue: 0, nonOpExpense: 0 });

    // 저장
    const handleSave = async () => {
        setIsSaving(true);
        const updatedHQCosts = [...hqCosts.filter(h => h.year !== year)];
        updatedHQCosts.push({ year, monthly: monthlyData });
        await onSave(updatedHQCosts);
        setIsSaving(false);
    };

    // ESC 키로 닫기
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-800">전사 공통비 관리</h2>
                            <p className="text-xs text-slate-500 mt-0.5">{year}년 · 본사 비용 / 전사 영외수지 입력</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 안내 배너 */}
                <div className="mx-8 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/60 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-800 leading-relaxed">
                        <span className="font-bold">전사이익 계산식:</span> 사업부 세전이익 합계 <span className="font-bold text-red-600">− 본사 공통비</span> <span className="font-bold text-blue-600">+ 영외수익</span> <span className="font-bold text-red-600">− 영외비용</span>
                        <br />
                        모든 금액은 <span className="font-bold underline">백만원 단위</span>로 입력해 주세요. (예: 738 → 7억 3,800만원)
                    </div>
                </div>

                {/* 입력 테이블 */}
                <div className="flex-1 overflow-auto px-8 py-4">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-600 border-b border-slate-200 w-16">월</th>
                                <th className="px-3 py-2.5 text-right text-xs font-bold text-red-600 border-b border-slate-200">
                                    본사 공통 비용
                                    <span className="block text-[10px] font-medium text-slate-400">(영업외비용 제외)</span>
                                </th>
                                <th className="px-3 py-2.5 text-right text-xs font-bold text-blue-600 border-b border-slate-200">
                                    전사 영외수익
                                </th>
                                <th className="px-3 py-2.5 text-right text-xs font-bold text-red-600 border-b border-slate-200">
                                    전사 영외비용
                                </th>
                                <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-600 border-b border-slate-200">
                                    순 영향액
                                    <span className="block text-[10px] font-medium text-slate-400">(비용-수익+비용)</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {MONTHS.map(m => {
                                const d = monthlyData[m] || { cost: 0, nonOpRevenue: 0, nonOpExpense: 0 };
                                const netImpact = (d.cost || 0) - (d.nonOpRevenue || 0) + (d.nonOpExpense || 0);
                                const hasData = d.cost > 0 || d.nonOpRevenue > 0 || d.nonOpExpense > 0;
                                return (
                                    <tr key={m} className={`border-b border-slate-100 transition-colors ${hasData ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                                        <td className="px-3 py-2 text-sm font-bold text-slate-700">{m}월</td>
                                        <td className="px-1 py-1.5">
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 text-right text-sm font-semibold rounded-lg border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all bg-white hover:border-slate-300"
                                                placeholder="0"
                                                value={d.cost ? formatDisplay(d.cost) : ''}
                                                onChange={e => updateCell(m, 'cost', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-1 py-1.5">
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 text-right text-sm font-semibold rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white hover:border-slate-300"
                                                placeholder="0"
                                                value={d.nonOpRevenue ? formatDisplay(d.nonOpRevenue) : ''}
                                                onChange={e => updateCell(m, 'nonOpRevenue', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-1 py-1.5">
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 text-right text-sm font-semibold rounded-lg border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all bg-white hover:border-slate-300"
                                                placeholder="0"
                                                value={d.nonOpExpense ? formatDisplay(d.nonOpExpense) : ''}
                                                onChange={e => updateCell(m, 'nonOpExpense', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {netImpact !== 0 ? (
                                                <span className={`text-sm font-bold ${netImpact > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                                    {netImpact > 0 ? '-' : '+'}{formatDisplay(Math.abs(netImpact))}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-800 text-white">
                                <td className="px-3 py-3 text-sm font-extrabold rounded-bl-lg">합계</td>
                                <td className="px-3 py-3 text-right text-sm font-extrabold">
                                    {totals.cost > 0 ? formatDisplay(totals.cost) : '-'}
                                </td>
                                <td className="px-3 py-3 text-right text-sm font-extrabold">
                                    {totals.nonOpRevenue > 0 ? formatDisplay(totals.nonOpRevenue) : '-'}
                                </td>
                                <td className="px-3 py-3 text-right text-sm font-extrabold">
                                    {totals.nonOpExpense > 0 ? formatDisplay(totals.nonOpExpense) : '-'}
                                </td>
                                <td className="px-3 py-3 text-right text-sm font-extrabold rounded-br-lg">
                                    {(() => {
                                        const netTotal = totals.cost - totals.nonOpRevenue + totals.nonOpExpense;
                                        return netTotal !== 0 ? (
                                            <span className={netTotal > 0 ? 'text-red-300' : 'text-blue-300'}>
                                                {netTotal > 0 ? '-' : '+'}{formatDisplay(Math.abs(netTotal))}
                                            </span>
                                        ) : '-';
                                    })()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* 하단 버튼 */}
                <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-wait"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? '저장 중...' : '저장하고 적용'}
                    </button>
                </div>
            </div>
        </div>
    );
}
