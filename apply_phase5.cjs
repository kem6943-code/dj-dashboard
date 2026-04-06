const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'src', 'components', 'Dashboard.tsx');
const kpiPath = path.join(__dirname, 'src', 'components', 'KPICards.tsx');
const plTablePath = path.join(__dirname, 'src', 'components', 'PLTable.tsx');

// --- 1. Dashboard.tsx ---
const dashboardPart1 = `import { useState, useMemo } from 'react';
import {
    type DivisionCode,
    DIVISIONS_WITH_TOTAL,
    getPLItemsForDivision,
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
import { BarChart3, TrendingUp, GitCompare, Target, LogOut, ChevronDown } from 'lucide-react';
import { signOut } from '../utils/supabaseClient';

type PeriodType = 'monthly' | 'quarterly' | 'half' | 'yearly';

export function Dashboard() {
    const [selectedDivision, setSelectedDivision] = useState<DivisionCode>(DIVISIONS_WITH_TOTAL[0].code);
    const [selectedYear, setSelectedYear] = useState(2026);
    const [periodType, setPeriodType] = useState<PeriodType>('monthly');
    const [activeView, setActiveView] = useState<'main' | 'dashboard' | 'comparison'>('main');
    const [isAccordionOpen, setIsAccordionOpen] = useState(true);
    
    // 연도 변경 시 기간 상태 연동 초기화
    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        // 필요 시 여기서 자동 매핑이나 추가 초기화 로직 구현
    };

    const [showInputModal, setShowInputModal] = useState(false);
    const [editMonth, setEditMonth] = useState(1);
    const [editDataType, setEditDataType] = useState<'actual' | 'target' | 'prevYear'>('actual');
    const [selectedSubDiv, setSelectedSubDiv] = useState('all');
    const [showTarget, setShowTarget] = useState(true);
    const [showYoY, setShowYoY] = useState(true);
    
    const { store, setStore, loading, handleSaveData } = useDashboardData(selectedDivision, selectedYear);

    const latestMonth = useMemo(() => {
        if (!store) return 1;
        const totalDiv = consolidateAllDivisions(store, selectedYear);
        if (!totalDiv || !totalDiv.monthly) return 1;
        const availableMonths = Object.keys(totalDiv.monthly).map(Number).filter(m => {
            const d = totalDiv.monthly[m];
            return d && d.revenue !== 0;
        });
        return availableMonths.length > 0 ? Math.max(...availableMonths) : 1;
    }, [store, selectedYear]);

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
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20 sticky top-0 h-screen shadow-sm">
                <div className="p-6 pb-8 border-b border-slate-100">
                    <h1 className="text-[1.2rem] font-bold tracking-tight flex items-center gap-2 text-slate-900 leading-tight">
                        <BarChart3 className="w-6 h-6 text-slate-800" />
                        <span>경영실적 대시보드</span>
                    </h1>
                    <p className="text-[11px] mt-2 text-slate-500 font-medium tracking-wide">동진테크윈 · 통합 실적 보고</p>
                </div>
                <nav className="flex-1 py-6 px-4 space-y-2">
                    <button onClick={() => { setActiveView('main'); setIsAccordionOpen(false); }} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 \${activeView === 'main' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}\`}> <Target className="w-4 h-4" /> 메인 대시보드 </button>
                    
                    {/* 아코디언 메뉴 */}
                    <div className="space-y-1">
                        <button 
                            onClick={() => { setIsAccordionOpen(!isAccordionOpen); setActiveView('dashboard'); }} 
                            className={\`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 \${activeView === 'dashboard' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}\`}
                        > 
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-4 h-4" /> 
                                <span>사업부별 손익 분석</span>
                            </div>
                            <ChevronDown className={\`w-4 h-4 transition-transform \${isAccordionOpen ? 'rotate-180' : ''}\`} />
                        </button>
                        
                        <div className={\`overflow-hidden transition-all duration-300 ease-in-out \${isAccordionOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}\`}>
                            <div className="flex flex-col gap-1 pl-4 border-l-2 border-slate-100 ml-6 py-1">
                                {DIVISIONS_WITH_TOTAL.map(div => (
                                    <button
                                        key={div.code}
                                        onClick={() => { setActiveView('dashboard'); setSelectedDivision(div.code); setIsAccordionOpen(true); }}
                                        className={\`w-full text-left px-4 py-2 text-[13px] font-semibold rounded-xl transition-all duration-200 \${selectedDivision === div.code && activeView === 'dashboard' ? 'text-blue-700 bg-blue-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}\`}
                                    >
                                        {div.flag} {div.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button onClick={() => { setActiveView('comparison'); setIsAccordionOpen(false); }} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 \${activeView === 'comparison' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}\`}> <GitCompare className="w-4 h-4" /> 사업부 지표 비교 </button>
                </nav>
                <div className="p-6 border-t border-slate-100 mt-auto">
                    <button onClick={async () => { await signOut(); window.location.reload(); }} className="w-full py-2.5 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium"> <LogOut size={16} /> <span className="text-sm">로그아웃</span> </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full min-w-0 bg-slate-50/50 relative">
                <header className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md pt-8 pb-4 px-8 lg:px-10 max-w-[1600px] w-full mx-auto border-b border-slate-200/80 mb-8 flex justify-between items-end">
                    <h2 className="text-[22px] font-extrabold text-slate-800 tracking-tight leading-none">
                        {activeView === 'main' ? '메인 대시보드' : activeView === 'dashboard' ? '사업부별 손익 분석' : '사업부 지표 비교'}
                    </h2>
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
                                <div className="glass-card p-6 shadow-sm border border-slate-200/60 bg-white rounded-2xl w-full min-w-0 max-w-[calc(100vw-300px)] overflow-x-auto"><Charts divData={consolidateAllDivisions(store!, selectedYear)} prevYearData={consolidateAllDivisions(store!, selectedYear - 1)} divisionInfo={DIVISIONS_WITH_TOTAL.find(d => d.code === 'total')!} year={selectedYear} /></div>
                            </div>
                        </div>
                    ) : activeView === 'comparison' ? (
                        <ComparisonView store={store} year={selectedYear} periodType={periodType} />
                    ) : (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-6 flex-wrap">
                                {DIVISIONS_WITH_TOTAL.map(div => (
                                    <button key={div.code} className={\`px-6 py-2.5 rounded-full text-[14px] font-bold transition-all duration-200 \${selectedDivision === div.code ? 'bg-blue-800 text-white shadow-md shadow-blue-900/10' : 'bg-white border text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300'}\`} onClick={() => setSelectedDivision(div.code)}>{div.flag} {div.name}</button>
                                ))}
                            </div>
                            
                            {/* 기간/연도 로컬 필터 */}
                            <div className="flex items-center gap-4 mb-8 bg-white border border-slate-200/60 rounded-xl px-4 py-3 shadow-sm inline-flex">
                                <span className="text-sm font-semibold text-slate-400">조회 조건</span>
                                <div className="w-px h-4 bg-slate-200 mx-1" />
                                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 block p-2 font-semibold outline-none cursor-pointer" value={selectedYear} onChange={(e) => handleYearChange(Number(e.target.value))}>
                                    {[2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
                                </select>
                                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 block p-2 font-semibold outline-none cursor-pointer" value={periodType} onChange={(e) => setPeriodType(e.target.value as PeriodType)}>
                                    {[ { key: 'monthly', label: '월별' }, { key: 'quarterly', label: '분기별' }, { key: 'half', label: '반기별' }, { key: 'yearly', label: '연간' } ].map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                </select>
                            </div>
`;

const dashboardPart2 = `
                            {selectedDivision === 'total' ? (
                                <>
                                    <KPICards divData={divData as any} divisionInfo={divisionInfo} />
                                    <div className="w-full min-w-0 max-w-[calc(100vw-300px)] overflow-x-auto mx-auto pb-6 mt-10">
                                        <ConsolidatedTable store={store} year={selectedYear} periodType={periodType} periodIndex={periodType === 'yearly' ? 1 : latestMonth} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <KPICards divData={divData as any} divisionInfo={divisionInfo} />
                                    <div className="mt-8 mb-8 w-full min-w-0 max-w-[calc(100vw-300px)] overflow-x-auto"><Charts divData={divData as any} prevYearData={prevYearDivData ?? undefined} divisionInfo={divisionInfo} year={selectedYear} /></div>
                                    <div className="flex items-center gap-4 mb-4 mt-8">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"><input type="checkbox" checked={showTarget} onChange={(e) => setShowTarget(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /><span className="font-semibold text-slate-600">TD목표 대비 보기</span></label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"><input type="checkbox" checked={showYoY} onChange={(e) => setShowYoY(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /><span className="font-semibold text-slate-600">'25년 대비 보기</span></label>
                                    </div>

                                    <div className="w-full min-w-0 max-w-[calc(100vw-300px)] overflow-x-auto mx-auto pb-6">
                                        <div className="glass-card p-8 mb-10 bg-white border border-slate-200/60 rounded-2xl min-w-[1000px]">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>{periodType === 'monthly' && divisionInfo.code !== 'total' && divisionInfo.subDivisionMode !== 'columns' && (<ExcelUploader currentStore={store} onUploadSuccess={(newStore) => setStore(newStore)} divisionCode={divisionInfo.code} year={selectedYear} />)}</div>
                                                <div className="text-sm font-semibold text-slate-500 text-right">단위: {divisionInfo.currency === 'KRW' ? '백만원' : divisionInfo.currency === 'MXN' ? \`천 \${divisionInfo.currency}\` : \`백만 \${divisionInfo.currency}\`}</div>
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

fs.writeFileSync(dashboardPath, dashboardPart1 + dashboardPart2, 'utf8');

// --- 2. KPICards.tsx ---
const kpiCode = `import { useState, useMemo, useEffect } from 'react';
import { type DivisionYearData, type DivisionInfo, MONTH_NAMES } from '../utils/dataModel';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardsProps {
    divData: DivisionYearData;
    divisionInfo: DivisionInfo;
}

const formatValue = (val: number, isRate: boolean = false) => {
    if (val === 0 || isNaN(val) || !isFinite(val)) return '-';
    if (isRate) return \`\${(val * 100).toFixed(1)}%\`;
    return Math.round(val).toLocaleString();
};

export function KPICards({ divData, divisionInfo }: KPICardsProps) {
    const [localPeriodType, setLocalPeriodType] = useState<'YTD' | 'monthly'>('YTD');
    const [localPeriodIndex, setLocalPeriodIndex] = useState(1);

    // 가용 월 산출
    const availableMonths = useMemo(() => {
        return Object.keys(divData.monthly ?? {}).map(Number).filter(m => divData.monthly[m]?.revenue !== 0);
    }, [divData]);

    // 연도/데이터 갱신 시 필터 초기화 또는 최신 월로 폴백
    useEffect(() => {
        setLocalPeriodType('YTD');
        if (availableMonths.length > 0) {
            setLocalPeriodIndex(Math.max(...availableMonths));
        }
    }, [divData, availableMonths]);

    const activeData = useMemo(() => {
        if (localPeriodType === 'YTD') return divData.kpi;
        if (localPeriodType === 'monthly' && divData.monthly[localPeriodIndex]) return divData.monthly[localPeriodIndex];
        return divData.kpi; // Fallback
    }, [divData, localPeriodType, localPeriodIndex]);

    const activeTarget = useMemo(() => {
        if (localPeriodType === 'YTD') return divData.targetKpi;
        if (localPeriodType === 'monthly' && divData.targetMonthly[localPeriodIndex]) return divData.targetMonthly[localPeriodIndex];
        return divData.targetKpi;
    }, [divData, localPeriodType, localPeriodIndex]);

    const kpis = [
        { key: 'revenue', label: '매출액', isRate: false, colorClass: 'text-blue-600' },
        { key: 'materialCostRate', label: '재료비율', isRate: true, colorClass: 'text-slate-900', compute: (d: any) => d.revenue ? d.materialCost / d.revenue : 0, computeTarget: (t: any) => t.revenue ? t.materialCost / t.revenue : 0 },
        { key: 'operatingProfit', label: '영업이익', isRate: false, colorClass: 'text-slate-900' },
        { key: 'operatingProfitRate', label: '영업이익률', isRate: true, colorClass: 'text-red-600', compute: (d: any) => d.revenue ? d.operatingProfit / d.revenue : 0, computeTarget: (t: any) => t.revenue ? t.operatingProfit / t.revenue : 0 },
        { key: 'preTaxProfit', label: '세전이익', isRate: false, colorClass: 'text-slate-900' },
    ];

    return (
        <div className="animate-fade-in w-full">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                    {divisionInfo.flag} {divisionInfo.name} KPI
                </span>
                
                {/* KPI 임원용 요약 조회 필터 */}
                <div className="flex items-center gap-2 bg-white border border-slate-200/60 rounded-xl px-2 py-1 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 pl-2">기간 요약:</span>
                    <select className="bg-transparent border-none text-slate-700 text-sm focus:ring-0 cursor-pointer font-bold outline-none" value={localPeriodType} onChange={(e) => setLocalPeriodType(e.target.value as any)}>
                        <option value="YTD">YTD 누적</option>
                        {availableMonths.length > 0 && <option value="monthly">월별 조회</option>}
                    </select>
                    {localPeriodType === 'monthly' && (
                        <select className="bg-transparent border-l border-slate-200 pl-2 text-slate-700 text-sm focus:ring-0 cursor-pointer font-bold outline-none" value={localPeriodIndex} onChange={(e) => setLocalPeriodIndex(Number(e.target.value))}>
                            {availableMonths.map(m => <option key={m} value={m}>{MONTH_NAMES[m-1]}</option>)}
                        </select>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {kpis.map((kpi, idx) => {
                    const val = kpi.compute ? kpi.compute(activeData) : (activeData as any)[kpi.key];
                    const target = kpi.computeTarget ? kpi.computeTarget(activeTarget) : (activeTarget as any)[kpi.key];
                    const diff = val - target;
                    const isPositive = diff > 0;
                    const isZero = diff === 0 || !target || target === 0;

                    return (
                        <div key={idx} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-sm font-bold text-slate-400 mb-1">{kpi.label}</h3>
                            <div className="flex items-end gap-2">
                                <span className={\`text-2xl font-black tracking-tight \${kpi.colorClass}\`}>
                                    {formatValue(val, kpi.isRate)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold bg-slate-50 w-fit px-2 py-1 rounded-md">
                                <span className="text-slate-400">목표 </span>
                                <span className="text-slate-600">{formatValue(target, kpi.isRate)}</span>
                                <span className="mx-1 text-slate-300">|</span>
                                <span className="flex items-center gap-0.5">
                                    {isZero ? <Minus className="w-3 h-3 text-slate-400" /> : isPositive ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                                    <span className={isZero ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-red-600'}>
                                        {isZero ? '-' : \`\${isPositive ? '+' : ''}\${formatValue(diff, kpi.isRate)}\`}
                                    </span>
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
`;

fs.writeFileSync(kpiPath, kpiCode, 'utf8');

// --- 3. Replace PLTable Sticky Column via RegEx (Simulating surgical edits) ---
let plTableContent = fs.readFileSync(plTablePath, 'utf8');

// The Table definition replacement to add sticky column
plTableContent = plTableContent.replace(
    /<th className="py-4 px-4 font-bold tracking-wide text-center uppercase text-xs">\s*구분\s*<\/th>/,
    '<th className="py-4 px-4 font-bold tracking-wide text-center uppercase text-xs sticky left-0 z-20 bg-slate-50 ring-1 ring-slate-200">구분</th>'
);

plTableContent = plTableContent.replace(
    /<td className="py-3 px-4 font-semibold text-slate-700 bg-slate-50 border-r border-slate-200">/,
    '<td className="py-3 px-4 font-semibold text-slate-700 bg-slate-50 border-r border-slate-200 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">'
);

fs.writeFileSync(plTablePath, plTableContent, 'utf8');
console.log('Successfully applied all Phase 5 modifications!');
