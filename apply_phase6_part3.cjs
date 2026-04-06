const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'src', 'components', 'Dashboard.tsx');

const dashboardCodePart1 = `import { useState, useMemo, useEffect } from 'react';
import {
    type DivisionCode,
    DIVISIONS_WITH_TOTAL,
    getPLItemsForDivision,
    consolidateAllDivisions,
    getEarliestYearMonth,
    type MonthYear
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
import { BarChart3, TrendingUp, GitCompare, Target, LogOut, ChevronDown, CalendarRange } from 'lucide-react';
import { signOut } from '../utils/supabaseClient';

export function Dashboard() {
    const [selectedDivision, setSelectedDivision] = useState<DivisionCode>(DIVISIONS_WITH_TOTAL[0].code);
    const [activeView, setActiveView] = useState<'main' | 'dashboard' | 'comparison'>('main');
    const [isAccordionOpen, setIsAccordionOpen] = useState(true);
    
    // 신규 통합 날짜 범위 필터
    const [dateRange, setDateRange] = useState<{ start: MonthYear, end: MonthYear }>({
        start: { year: new Date().getFullYear(), month: 1 },
        end: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
    });

    const [showInputModal, setShowInputModal] = useState(false);
    const [editYear, setEditYear] = useState(new Date().getFullYear());
    const [editMonth, setEditMonth] = useState(1);
    const [editDataType, setEditDataType] = useState<'actual' | 'target' | 'prevYear'>('actual');
    const [selectedSubDiv, setSelectedSubDiv] = useState('all');
    const [showTarget, setShowTarget] = useState(true);
    const [showYoY, setShowYoY] = useState(true);
    
    // 단일 연도 파라미터 폐기 (전체 Store 항상 로드)
    const { store, setStore, loading, handleSaveData } = useDashboardData(selectedDivision);

    useEffect(() => {
        if (store && store.divisions.length > 0) {
            const earliest = getEarliestYearMonth(store);
            const now = new Date();
            setDateRange({
                start: earliest,
                end: { year: now.getFullYear(), month: now.getMonth() + 1 }
            });
        }
    }, [store === null]); // 최초 로드시에만 동작하도록 단순 의존성 (배열 크기 등) 제외

    // 파이프라인 엔진 교체: dateRange 연동
    const { divData, prevYearDivData, divisionInfo, periodLabels, periodData, periodRates, aggregateData, aggregateTarget, monthsList } = usePeriodData({
        store, selectedDivision, dateRange, selectedSubDiv, showTarget, showYoY
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

    const handleEditMonth = (year: number, month: number, dataType: 'actual' | 'target' | 'prevYear' = 'actual') => {
        setEditYear(year); setEditMonth(month); setEditDataType(dataType); setShowInputModal(true);
    };

    const handleDateChange = (field: 'start' | 'end', value: string) => {
        if (!value) return;
        const [y, m] = value.split('-');
        setDateRange(prev => ({
            ...prev,
            [field]: { year: parseInt(y), month: parseInt(m) }
        }));
    };

`;

const dashboardCodePart2 = `
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
                    
                    {/* [Phase 6] 통합된 원-버튼 Date Range Picker */}
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
                        <CalendarRange className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-500 mr-1">조회 범위:</span>
                        <input type="month" className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                            value={\`\${dateRange.start.year}-\${dateRange.start.month.toString().padStart(2, '0')}\`}
                            onChange={e => handleDateChange('start', e.target.value)}
                        />
                        <span className="text-slate-300 font-light">~</span>
                        <input type="month" className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                            value={\`\${dateRange.end.year}-\${dateRange.end.month.toString().padStart(2, '0')}\`}
                            onChange={e => handleDateChange('end', e.target.value)}
                        />
                    </div>
                </header>

                <div className="px-8 lg:px-10 max-w-[1600px] w-full mx-auto pb-24 pt-0">
                    {activeView === 'main' ? (
                        <div className="animate-fade-in pb-20">
                            {/* Main 화면 (현재 연도 의존도가 있는 구형 요약 카드들은 추후 고도화 시 개선. 임시로 end year 사용) */}
                            <div style={{ marginBottom: '25px' }}>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800"><BarChart3 className="text-blue-500 w-5 h-5" />전사 통합 경영실적 요약<span className="text-sm font-semibold text-slate-400 ml-1">(YTD 기준)</span></h3>
                                {/* KPI 하위 호환 목적으로 임시로 aggregateData 우회 패스 로직 구성 가능하지만 렌더링 유지 위함 */}
                            </div>
                        </div>
                    ) : activeView === 'comparison' ? (
                        <ComparisonView store={store} year={dateRange.end.year} periodType={'monthly'} />
                    ) : (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-6 flex-wrap">
                                {DIVISIONS_WITH_TOTAL.map(div => (
                                    <button key={div.code} className={\`px-6 py-2.5 rounded-full text-[14px] font-bold transition-all duration-200 \${selectedDivision === div.code ? 'bg-blue-800 text-white shadow-md shadow-blue-900/10' : 'bg-white border text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300'}\`} onClick={() => setSelectedDivision(div.code)}>{div.flag} {div.name}</button>
                                ))}
                            </div>

                            {selectedDivision === 'total' ? (
                                <>
                                    <KPICards data={aggregateData} target={aggregateTarget} divisionInfo={divisionInfo} />
                                    <div className="w-full min-w-0 max-w-[calc(100vw-300px)] overflow-x-auto mx-auto pb-6 mt-10">
                                        <ConsolidatedTable store={store} dateRange={dateRange} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <KPICards data={aggregateData} target={aggregateTarget} divisionInfo={divisionInfo} />
                                    
                                    <div className="mt-8 mb-8 w-full min-w-0 max-w-[calc(100vw-300px)] overflow-x-auto">
                                        <Charts divData={divData as any} prevYearData={prevYearDivData ?? undefined} divisionInfo={divisionInfo} year={dateRange.end.year} chartPayload={periodData} />
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mb-4 mt-8">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"><input type="checkbox" checked={showTarget} onChange={(e) => setShowTarget(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /><span className="font-semibold text-slate-600">TD목표 대비 보기</span></label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"><input type="checkbox" checked={showYoY} onChange={(e) => setShowYoY(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /><span className="font-semibold text-slate-600">'25년 대비 보기</span></label>
                                    </div>

                                    <div className="w-full min-w-0 max-w-[calc(100vw-300px)] overflow-x-auto mx-auto pb-6">
                                        <div className="glass-card p-8 mb-10 bg-white border border-slate-200/60 rounded-2xl min-w-[1000px]">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>{divisionInfo.code !== 'total' && divisionInfo.subDivisionMode !== 'columns' && (<ExcelUploader currentStore={store} onUploadSuccess={(newStore) => setStore(newStore)} divisionCode={divisionInfo.code} year={dateRange.end.year} />)}</div>
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
                                            
                                            <PLTable 
                                                items={getPLItemsForDivision(selectedDivision, selectedSubDiv)} 
                                                labels={periodLabels} 
                                                data={periodData} 
                                                rates={periodRates} 
                                                currency={divisionInfo.currency} 
                                                onEditMonth={undefined} 
                                                showTarget={showTarget} 
                                                showYoY={showYoY} 
                                            />
                                            <p className="text-xs text-slate-400 mt-4 text-right">* 다중-연도 통합 필터가 활성화된 모드에서는 직접 수정 모드(모달) 진입이 비활성화됩니다. (수정 필요 시 기존 모드 활용)</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
`;
fs.writeFileSync(dashboardPath, dashboardCodePart1 + dashboardCodePart2, 'utf8');
console.log('Finished Dashboard.tsx override');
