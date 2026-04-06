const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'components', 'Dashboard.tsx');

const part1 = `import { useState, useMemo } from 'react';
import {
    type DivisionCode,
    DIVISIONS_WITH_TOTAL,
    getPLItemsForDivision,
    MONTH_NAMES,
    consolidateAllDivisions,
} from '../utils/dataModel';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePeriodData } from '../hooks/usePeriodData';
import { PLTable } from './PLTable';
import { KPICards } from './KPICards';
import { Charts } from './Charts';
import { DataInputModal } from './DataInputModal';
import { ComparisonView } from './ComparisonView';
import { ConsolidatedTable } from './ConsolidatedTable';
import { YearlyTargetCards } from './YearlyTargetCards';
import { DivisionTrendCharts } from './DivisionTrendCharts';
import { ExcelUploader } from './ExcelUploader';
import { BarChart3, TrendingUp, GitCompare, Target, LogOut } from 'lucide-react';
import { signOut } from '../utils/supabaseClient';

type PeriodType = 'monthly' | 'quarterly' | 'half' | 'yearly';

export function Dashboard() {
    const [selectedDivision, setSelectedDivision] = useState<DivisionCode>(DIVISIONS_WITH_TOTAL[0].code);
    const [selectedYear, setSelectedYear] = useState(2026);
    const [periodType, setPeriodType] = useState<PeriodType>('monthly');
    const [activeView, setActiveView] = useState<'main' | 'dashboard' | 'comparison'>('main');
    const [showInputModal, setShowInputModal] = useState(false);
    const [editMonth, setEditMonth] = useState(1);
    const [editDataType, setEditDataType] = useState<'actual' | 'target' | 'prevYear'>('actual');
    const [selectedSubDiv, setSelectedSubDiv] = useState('all');
    const [showTarget, setShowTarget] = useState(true);
    const [showYoY, setShowYoY] = useState(true);
    
    const { store, setStore, loading, syncError, setSyncError, handleSaveData } = useDashboardData(selectedDivision, selectedYear);

    const latestMonth = useMemo(() => {
        if (!store?.total?.monthly) return 1;
        const availableMonths = Object.keys(store.total.monthly).map(Number).filter(m => {
            const d = store.total.monthly[m];
            return d && d.revenue !== 0;
        });
        return availableMonths.length > 0 ? Math.max(...availableMonths) : 1;
    }, [store]);

    const { divData, prevYearDivData, divisionInfo, periodLabels, periodData, periodRates } = usePeriodData({
        store, selectedDivision, selectedYear, periodType, selectedSubDiv,
        selectedTotalMonth: latestMonth, showTarget, showYoY
    });

    if (loading || !store) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">데이터를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    const handleEditMonth = (month: number, dataType: 'actual' | 'target' | 'prevYear' = 'actual') => {
        setEditMonth(month); setEditDataType(dataType); setShowInputModal(true);
    };

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
            {/* 1 Depth */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20 sticky top-0 h-screen shadow-sm">
                <div className="p-6 pb-8 border-b border-slate-100">
                    <h1 className="text-[1.2rem] font-bold tracking-tight flex items-center gap-2 text-slate-900 leading-tight">
                        <BarChart3 className="w-6 h-6 text-slate-800" />
                        <span>경영실적 대시보드</span>
                    </h1>
                    <p className="text-[11px] mt-2 text-slate-500 font-medium tracking-wide">동진테크윈 · 통합 실적 보고</p>
                </div>
                <nav className="flex-1 py-6 px-4 space-y-1.5">
                    <button onClick={() => setActiveView('main')} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 \${activeView === 'main' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}\`}> <Target className="w-4 h-4" /> 메인 대시보드 </button>
                    <button onClick={() => setActiveView('dashboard')} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 \${activeView === 'dashboard' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}\`}> <TrendingUp className="w-4 h-4" /> 사업부별 손익 분석 </button>
                    <button onClick={() => setActiveView('comparison')} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 \${activeView === 'comparison' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}\`}> <GitCompare className="w-4 h-4" /> 사업부 지표 비교 </button>
                </nav>
                <div className="p-6 border-t border-slate-100 mt-auto">
                    <button onClick={async () => { await signOut(); window.location.reload(); }} className="w-full py-2.5 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium"> <LogOut size={16} /> <span className="text-sm">로그아웃</span> </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full relative">
                {/* 2 Depth Header */}
                <header className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md pt-6 pb-0 px-8 lg:px-10 max-w-[1600px] w-full mx-auto border-b border-slate-200/80 mb-8 flex justify-between items-end">
                    <div className="pb-4">
                        <h2 className="text-[22px] font-extrabold text-slate-800 tracking-tight leading-none">
                            {activeView === 'main' ? '메인 대시보드' : activeView === 'dashboard' ? '사업부별 손익 분석' : '사업부 지표 비교'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-6 relative top-[1px]">
                        <div className="flex items-center gap-4">
                            {[2025, 2026].map(y => (
                                <button key={y} onClick={() => setSelectedYear(y)} className={\`pb-4 border-b-2 font-bold text-[15px] transition-colors \${selectedYear === y ? 'border-blue-800 text-blue-800' : 'border-transparent text-slate-400 hover:text-slate-600'}\`}>{y}년</button>
                            ))}
                        </div>
                        <div className="w-px h-4 bg-slate-300 mx-2 mb-4" />
                        <div className="flex items-center gap-5">
                            {[ { key: 'monthly' as PeriodType, label: '월별' }, { key: 'quarterly' as PeriodType, label: '분기별' }, { key: 'half' as PeriodType, label: '반기별' }, { key: 'yearly' as PeriodType, label: '연간' } ].map(p => (
                                <button key={p.key} onClick={() => setPeriodType(p.key)} className={\`pb-4 border-b-2 font-bold text-[15px] transition-colors \${periodType === p.key ? 'border-blue-800 text-blue-800' : 'border-transparent text-slate-400 hover:text-slate-600'}\`}>{p.label}</button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="px-8 lg:px-10 max-w-[1600px] w-full mx-auto pb-24 pt-0">
                    {activeView === 'main' ? (
                        <div className="animate-fade-in pb-20">
                            <div style={{ marginBottom: '25px' }}>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800"><BarChart3 className="text-blue-500 w-5 h-5" />전사 통합 경영실적 요약<span className="text-sm font-semibold text-slate-400 ml-1">(YTD 기준)</span></h3>
                                <KPICards divData={consolidateAllDivisions(store!, selectedYear)} divisionInfo={DIVISIONS_WITH_TOTAL.find(d => d.code === 'total')!} />
                            </div>
                            <div style={{ marginBottom: '25px' }}><YearlyTargetCards store={store} year={selectedYear} /></div>
                            <div style={{ marginBottom: '40px' }}><DivisionTrendCharts store={store} year={selectedYear} /></div>
                            <div>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800"><TrendingUp className="text-emerald-500 w-5 h-5" />전사 기간 실적 트렌드</h3>
                                <div className="glass-card p-6 shadow-sm border border-slate-200/60 bg-white rounded-2xl"><Charts divData={consolidateAllDivisions(store!, selectedYear)} prevYearData={consolidateAllDivisions(store!, selectedYear - 1)} divisionInfo={DIVISIONS_WITH_TOTAL.find(d => d.code === 'total')!} year={selectedYear} /></div>
                            </div>
                        </div>
                    ) : activeView === 'comparison' ? (
                        <ComparisonView store={store} year={selectedYear} periodType={periodType} />
                    ) : (
                        <div className="animate-fade-in">
                            {/* 3 Depth Pills */}
                            <div className="flex items-center gap-3 mb-8 flex-wrap">
                                {DIVISIONS_WITH_TOTAL.map(div => (
                                    <button key={div.code} className={\`px-6 py-2.5 rounded-full text-[14px] font-bold transition-all duration-200 \${selectedDivision === div.code ? 'bg-blue-800 text-white shadow-md shadow-blue-900/10' : 'bg-white border text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300'}\`} onClick={() => setSelectedDivision(div.code)}>{div.flag} {div.name}</button>
                                ))}
                            </div>
`;

const part2 = `
                            {selectedDivision === 'total' ? (
                                <>
                                    <KPICards divData={divData as any} divisionInfo={divisionInfo} />
                                    {/* Consolidated Table Max-W constraints */}
                                    <div className="w-full max-w-screen-2xl overflow-x-auto mx-auto pb-6 mt-10">
                                        <ConsolidatedTable store={store} year={selectedYear} periodType={periodType} periodIndex={periodType === 'yearly' ? 1 : latestMonth} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <KPICards divData={divData as any} divisionInfo={divisionInfo} />
                                    <div className="mt-8 mb-8"><Charts divData={divData as any} prevYearData={prevYearDivData ?? undefined} divisionInfo={divisionInfo} year={selectedYear} /></div>
                                    <div className="flex items-center gap-4 mb-4 mt-8">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"><input type="checkbox" checked={showTarget} onChange={(e) => setShowTarget(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /><span className="font-semibold text-slate-600">TD목표 대비 보기</span></label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"><input type="checkbox" checked={showYoY} onChange={(e) => setShowYoY(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /><span className="font-semibold text-slate-600">'25년 대비 보기</span></label>
                                    </div>

                                    <div className="w-full max-w-screen-2xl overflow-x-auto mx-auto pb-6">
                                        <div className="glass-card p-8 mb-10 bg-white border border-slate-200/60 rounded-2xl min-w-[1000px]">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>{periodType === 'monthly' && divisionInfo.code !== 'total' && divisionInfo.subDivisionMode !== 'columns' && (<ExcelUploader currentStore={store} onUploadSuccess={(newStore) => setStore(newStore)} divisionCode={divisionInfo.code} year={selectedYear} />)}</div>
                                                <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">단위: {divisionInfo.currency === 'KRW' ? '백만원' : divisionInfo.currency === 'MXN' ? \`천 \${divisionInfo.currency}\` : \`백만 \${divisionInfo.currency}\`}</span>
                                            </div>
                                            {divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'tabs' && (
                                                <div className="flex gap-2 mb-6">
                                                    {divisionInfo.subDivisions.map(sub => (<button key={sub.key} onClick={() => setSelectedSubDiv(sub.key)} className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all \${selectedSubDiv === sub.key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}\`}>{sub.name}</button>))}
                                                </div>
                                            )}
                                            {divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'columns' && (
                                                <div className="flex gap-2 mb-5">
                                                    {divisionInfo.subDivisions.map(sub => (<span key={sub.key} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">{sub.name}</span>))}
                                                    <span className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">합계</span>
                                                </div>
                                            )}
                                            <PLTable items={getPLItemsForDivision(selectedDivision, selectedSubDiv)} labels={periodLabels} data={periodData} rates={periodRates} currency={divisionInfo.currency} onEditMonth={(periodType === 'monthly' && divisionInfo.subDivisionMode !== 'columns' && !(divisionInfo.subDivisions && selectedSubDiv === 'all')) ? handleEditMonth : undefined} showTarget={showTarget} showYoY={showYoY} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {showInputModal && selectedDivision !== 'total' && (() => {
                                const isSubDiv = divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all';
                                return (
                                    <DataInputModal divisionInfo={divisionInfo} subDivision={selectedSubDiv} year={editDataType === 'prevYear' ? selectedYear - 1 : selectedYear} month={editMonth} dataType={editDataType}
                                        initialData={editDataType === 'prevYear' ? (isSubDiv ? prevYearDivData?.subDivMonthly?.[selectedSubDiv]?.[editMonth] : prevYearDivData?.monthly?.[editMonth]) : editDataType === 'target' ? (isSubDiv ? divData?.subDivTargetMonthly?.[selectedSubDiv]?.[editMonth] : divData?.targetMonthly?.[editMonth]) : (isSubDiv ? divData?.subDivMonthly?.[selectedSubDiv]?.[editMonth] : divData?.monthly?.[editMonth])}
                                        initialRate={editDataType === 'prevYear' ? (prevYearDivData?.exchangeRates?.[editMonth]?.actual !== 1 && prevYearDivData?.exchangeRates?.[editMonth]?.actual !== undefined) ? prevYearDivData?.exchangeRates?.[editMonth]?.actual : prevYearDivData?.exchangeRates?.[editMonth]?.prev : editDataType === 'target' ? divData?.exchangeRates?.[editMonth]?.target : divData?.exchangeRates?.[editMonth]?.actual}
                                        onSave={(month, data, rate, type) => handleSaveData(month, data, rate, type)} onClose={() => setShowInputModal(false)}
                                    />
                                );
                            })()}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
`;

fs.writeFileSync(targetPath, part1 + part2, 'utf8');
console.log('Done!');
