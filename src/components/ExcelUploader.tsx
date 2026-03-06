import React, { useRef, useState } from 'react';
import { parseMonthlyExcel } from '../utils/excelParser';
import type { DataStore, DivisionCode, MonthlyPLData } from '../utils/dataModel';
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
            const { actual, target } = await parseMonthlyExcel(file, selectedMonth, divisionCode);

            // Deep clone store
            const newStore: DataStore = JSON.parse(JSON.stringify(currentStore));
            const divData = newStore.divisions.find(d => d.divisionCode === divisionCode && d.year === year);

            if (divData) {
                // Initialize objects if missing
                if (!divData.monthly) divData.monthly = {};
                if (!divData.targetMonthly) divData.targetMonthly = {};

                // Merge data
                divData.monthly[selectedMonth] = {
                    ...divData.monthly[selectedMonth],
                    ...actual
                } as MonthlyPLData;

                divData.targetMonthly[selectedMonth] = {
                    ...divData.targetMonthly[selectedMonth],
                    ...target
                } as MonthlyPLData;

                await saveData(newStore);
                onUploadSuccess(newStore);
                setIsOpen(false);
                alert(`${selectedMonth}월 엑셀 데이터 연동 성공!`);
            } else {
                alert('해당 사업부/연도 데이터를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error(error);
            alert('엑셀 연동 중 오류가 발생했습니다. 양식을 확인해주세요.');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative inline-block">
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
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-5 transform transition-all duration-200 origin-top-right">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-800">📊 엑셀 자동 매핑</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">업로드 대상 월 (Month)</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5"
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
                                className="w-full flex justify-center items-center px-4 py-3 border-2 border-dashed border-emerald-300 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer transition-colors"
                            >
                                {isLoading ? '처리 중...' : '파일 선택 (.xlsx)'}
                            </label>
                            <p className="mt-2 text-xs text-gray-400 text-center">
                                '당월' 열의 실적/TD목표를 매핑합니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
