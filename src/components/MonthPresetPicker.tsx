/**
 * 월별 퀵 프리셋 날짜 선택기 (ERP 스타일 + 범위 선택)
 * - 일간(Daily) 달력 없이 연도/월만 다루는 UI
 * - 프리셋 버튼으로 한 번 클릭 기간 셋팅
 * - 1~12월 범위(Range) 선택: 시작 월 → 종료 월 클릭
 * - 프리셋 선택 시 하단 달력과 시각적 연동
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { type MonthYear } from '../utils/dataModel';

interface MonthPresetPickerProps {
    dateRange: { start: MonthYear; end: MonthYear };
    onDateRangeChange: (range: { start: MonthYear; end: MonthYear }) => void;
}

export function MonthPresetPicker({ dateRange, onDateRangeChange }: MonthPresetPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(dateRange.end.year);
    // 범위 선택 상태: null이면 시작 월 선택 대기, 숫자면 시작 월이 이미 선택된 상태
    const [rangeStart, setRangeStart] = useState<number | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // 외부 클릭 시 팝오버 닫기
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setRangeStart(null);
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // 현재 선택된 범위를 텍스트로 표시
    const rangeText = `${dateRange.start.year}.${String(dateRange.start.month).padStart(2, '0')} ~ ${dateRange.end.year}.${String(dateRange.end.month).padStart(2, '0')}`;

    // 프리셋 클릭 핸들러
    const applyPreset = useCallback((start: MonthYear, end: MonthYear) => {
        onDateRangeChange({ start, end });
        setRangeStart(null); // 범위 선택 상태 리셋
    }, [onDateRangeChange]);

    // 월 버튼 클릭 → 범위 선택 로직
    const handleMonthClick = (m: number) => {
        if (rangeStart === null) {
            // 첫 번째 클릭: 시작 월 설정 + 즉시 단일 월로 반영
            setRangeStart(m);
            onDateRangeChange({
                start: { year: pickerYear, month: m },
                end: { year: pickerYear, month: m },
            });
        } else {
            // 두 번째 클릭: 범위 완성
            const startM = Math.min(rangeStart, m);
            const endM = Math.max(rangeStart, m);
            applyPreset(
                { year: pickerYear, month: startM },
                { year: pickerYear, month: endM },
            );
        }
    };

    // 월이 현재 선택 범위 안에 있는지 체크 (프리셋과 연동)
    const isMonthInRange = (m: number): boolean => {
        if (dateRange.start.year !== pickerYear && dateRange.end.year !== pickerYear) return false;
        // 같은 연도일 때
        if (dateRange.start.year === pickerYear && dateRange.end.year === pickerYear) {
            return m >= dateRange.start.month && m <= dateRange.end.month;
        }
        // 시작 연도만 같을 때
        if (dateRange.start.year === pickerYear) return m >= dateRange.start.month;
        // 종료 연도만 같을 때
        if (dateRange.end.year === pickerYear) return m <= dateRange.end.month;
        return false;
    };

    // 월이 범위의 시작 또는 끝인지
    const isRangeEdge = (m: number): boolean => {
        return (dateRange.start.year === pickerYear && dateRange.start.month === m)
            || (dateRange.end.year === pickerYear && dateRange.end.month === m);
    };

    // 프리셋 활성 판별
    const isPresetActive = (startM: number, endM: number, year?: number) => {
        const y = year || pickerYear;
        return dateRange.start.year === y && dateRange.start.month === startM
            && dateRange.end.year === y && dateRange.end.month === endM;
    };

    const btnBase = "text-xs font-semibold rounded-lg border transition-all duration-150 cursor-pointer py-2";
    const btnDefault = `${btnBase} border-slate-200 text-slate-600 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300`;
    const btnActive = `${btnBase} border-blue-600 bg-blue-700 text-white shadow-sm`;

    // 월 버튼 스타일: 범위 안이면 파란색 하이라이트
    const getMonthBtnClass = (m: number): string => {
        const inRange = isMonthInRange(m);
        const isEdge = isRangeEdge(m);
        const isRangeStartPending = rangeStart === m;

        if (isEdge || isRangeStartPending) {
            return `${btnBase} border-blue-600 bg-blue-700 text-white shadow-sm`;
        }
        if (inRange) {
            return `${btnBase} border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200`;
        }
        return btnDefault;
    };

    return (
        <div className="relative" ref={popoverRef}>
            {/* 트리거 버튼 */}
            <button
                onClick={() => { setIsOpen(!isOpen); setRangeStart(null); }}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3.5 py-2 shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer"
            >
                <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">{rangeText}</span>
                <svg className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* 팝오버 */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-lg border border-slate-200 p-5 w-[340px] animate-fade-in">
                    {/* 연도 선택 */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setPickerYear(y => y - 1)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-bold text-slate-800">{pickerYear}년</span>
                        <button
                            onClick={() => setPickerYear(y => y + 1)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* 1행: 연도/반기 프리셋 */}
                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                        <button
                            className={isPresetActive(1, 12, pickerYear - 1) ? btnActive : btnDefault}
                            onClick={() => { setPickerYear(pickerYear - 1); applyPreset({ year: pickerYear - 1, month: 1 }, { year: pickerYear - 1, month: 12 }); }}
                        >전년도</button>
                        <button
                            className={isPresetActive(1, 12) ? btnActive : btnDefault}
                            onClick={() => applyPreset({ year: pickerYear, month: 1 }, { year: pickerYear, month: 12 })}
                        >올해</button>
                        <button
                            className={isPresetActive(1, 6) ? btnActive : btnDefault}
                            onClick={() => applyPreset({ year: pickerYear, month: 1 }, { year: pickerYear, month: 6 })}
                        >상반기</button>
                        <button
                            className={isPresetActive(7, 12) ? btnActive : btnDefault}
                            onClick={() => applyPreset({ year: pickerYear, month: 7 }, { year: pickerYear, month: 12 })}
                        >하반기</button>
                    </div>

                    {/* 2행: 분기 프리셋 */}
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                        <button
                            className={isPresetActive(1, 3) ? btnActive : btnDefault}
                            onClick={() => applyPreset({ year: pickerYear, month: 1 }, { year: pickerYear, month: 3 })}
                        >1분기</button>
                        <button
                            className={isPresetActive(4, 6) ? btnActive : btnDefault}
                            onClick={() => applyPreset({ year: pickerYear, month: 4 }, { year: pickerYear, month: 6 })}
                        >2분기</button>
                        <button
                            className={isPresetActive(7, 9) ? btnActive : btnDefault}
                            onClick={() => applyPreset({ year: pickerYear, month: 7 }, { year: pickerYear, month: 9 })}
                        >3분기</button>
                        <button
                            className={isPresetActive(10, 12) ? btnActive : btnDefault}
                            onClick={() => applyPreset({ year: pickerYear, month: 10 }, { year: pickerYear, month: 12 })}
                        >4분기</button>
                    </div>

                    {/* 구분선 */}
                    <div className="border-t border-slate-100 my-3" />

                    {/* 범위 선택 안내 */}
                    {rangeStart !== null && (
                        <p className="text-[11px] text-blue-500 font-semibold mb-2 text-center">
                            📌 종료 월을 선택하세요 (시작: {rangeStart}월)
                        </p>
                    )}

                    {/* 3~4행: 월별 버튼 (4열 × 3행) — 범위 선택 */}
                    <div className="grid grid-cols-4 gap-1.5">
                        {Array.from({ length: 12 }, (_, i) => {
                            const m = i + 1;
                            return (
                                <button
                                    key={m}
                                    className={getMonthBtnClass(m)}
                                    onClick={() => handleMonthClick(m)}
                                >
                                    {m}월
                                </button>
                            );
                        })}
                    </div>

                    {/* 하단: 선택된 기간 표시 */}
                    <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                        <span className="text-[11px] text-slate-400 font-medium">
                            선택 기간: {rangeText}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
