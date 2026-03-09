import React, { useRef, useState } from 'react';
import { parseMonthlyExcel } from '../utils/excelParser';
import type { DataStore, DivisionCode, MonthlyPLData } from '../utils/dataModel';
import { calculateDerivedFields } from '../utils/dataModel';
import { saveData } from '../utils/storage';

interface ExcelUploaderProps {
    currentStore: DataStore;
    onUploadSuccess: (newStore: DataStore) => void;
    divisionCode: DivisionCode;
    year: number;
}

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ currentStore, onUploadSuccess, divisionCode, year }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const { actual, target, prevYear } = await parseMonthlyExcel(file, selectedMonth, divisionCode);

            // Deep clone store
            const newStore: DataStore = JSON.parse(JSON.stringify(currentStore));

            // 1. 당월 연도 데이터 (예: 2026) 업데이트
            let divData = newStore.divisions.find(d => d.divisionCode === divisionCode && d.year === year);
            if (!divData) {
                // 데이터 공간이 없으면 생성
                divData = {
                    divisionCode,
                    year,
                    monthly: {},
                    targetMonthly: {},
                    exchangeRate: {}
                };
                newStore.divisions.push(divData);
            }

            if (!divData.monthly) divData.monthly = {};
            if (!divData.targetMonthly) divData.targetMonthly = {};

            divData.monthly[selectedMonth] = calculateDerivedFields({
                ...divData.monthly[selectedMonth],
                ...actual
            } as MonthlyPLData);

            divData.targetMonthly[selectedMonth] = calculateDerivedFields({
                ...divData.targetMonthly[selectedMonth],
                ...target
            } as MonthlyPLData);

            // 2. 전년도 데이터 (예: 2025) 업데이트
            const prevYearNum = year - 1;
            let prevDivData = newStore.divisions.find(d => d.divisionCode === divisionCode && d.year === prevYearNum);
            if (!prevDivData) {
                prevDivData = {
                    divisionCode,
                    year: prevYearNum,
                    monthly: {},
                    targetMonthly: {},
                    exchangeRate: {}
                };
                newStore.divisions.push(prevDivData);
            }

            if (!prevDivData.monthly) prevDivData.monthly = {};

            // 전년 실적은 actual을 업데이트 하는 개념
            prevDivData.monthly[selectedMonth] = calculateDerivedFields({
                ...prevDivData.monthly[selectedMonth],
                ...prevYear
            } as MonthlyPLData);

            await saveData(newStore);
            onUploadSuccess(newStore);
            setIsOpen(false);
            alert(`${selectedMonth}월 엑셀 데이터 연동 성공! (전년도 실적 포함)`);
        } catch (error) {
            console.error(error);
            alert('엑셀 연동 중 오류가 발생했습니다. 양식을 확인해주세요.');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                title="엑셀 일괄 업로드"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>엑셀 파일 연동</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                <span>📊</span> 엑셀 자동 매핑
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">업로드 대상 월 (Month)</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 transition-shadow"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{m}월 (M{m}) 실적/목표</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="excel-upload"
                                />
                                <label
                                    htmlFor="excel-upload"
                                    className="w-full flex flex-col justify-center items-center px-4 py-8 border-2 border-dashed border-emerald-200 rounded-xl text-sm font-medium text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer transition-all group"
                                >
                                    <svg className="w-8 h-8 mb-2 text-emerald-400 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    {isLoading ? '엑셀 데이터 분석/매핑 중...' : '엑셀 파일 선택 (.xlsx)'}
                                </label>
                                <p className="mt-3 text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    '당월' 열의 실적/TD목표 데이터를 일괄 매핑합니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
