import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    type DivisionCode,
    DIVISIONS_WITH_TOTAL,
    getPLItemsForDivision,
    type MonthYear,
} from '../utils/dataModel';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePeriodData, type IntervalType } from '../hooks/usePeriodData';
import { PLTable } from './PLTable';
import { KPICards } from './KPICards';
import { ComparisonView } from './ComparisonView';
import { ConsolidatedTable } from './ConsolidatedTable';
import { YearlyTargetCards } from './YearlyTargetCards';
import { DivisionTrendCharts } from './DivisionTrendCharts';
import { ExcelUploader } from './ExcelUploader';
import { DataInputModal } from './DataInputModal';
import { PeriodComposedChart } from './PeriodComposedChart';
import { MonthPresetPicker } from './MonthPresetPicker';
import { Logo } from './Logo';
import { BarChart3, TrendingUp, GitCompare, Target, LogOut, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function Dashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [selectedDivision, setSelectedDivision] = useState<DivisionCode>(DIVISIONS_WITH_TOTAL[0].code);
    const [activeView, setActiveView] = useState<'main' | 'dashboard' | 'comparison'>('main');
    const [isAccordionOpen, setIsAccordionOpen] = useState(true);

    // [UX-1] 사이드바 접기/펴기 토글
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // [전역 상태 방어] 메인 대시보드로 돌아올 때마다 철저히 전역 컨텍스트를 '전체(합계)'로 강제 초기화
    useEffect(() => {
        if (activeView === 'main') {
            setSelectedDivision('total');
        }
    }, [activeView]);
    // [UX-2] 조회 기간 필터 - useState로 변경 (초기값만 고정)
    const now = new Date();
    const [dateRange, setDateRange] = useState({
        start: { year: 2026, month: 1 } as MonthYear,
        end: { year: now.getFullYear(), month: now.getMonth() + 1 } as MonthYear,
    });

    // 조회 단위: 날짜 범위 선택기가 직접 기간을 제어하므로 항상 월별(monthly) 고정
    const intervalType: IntervalType = 'monthly';

    const [selectedSubDiv, setSelectedSubDiv] = useState('all');

    // [방어벽] 메인 탭(사업부) 변경 시, 서브탭 상태를 강제 초기화하여 이전 사업부 잔여 상태로 인한 에러 차단
    useEffect(() => {
        setSelectedSubDiv('all');
    }, [selectedDivision]);

    const [showTarget, setShowTarget] = useState(true);
    const [showYoY, setShowYoY] = useState(true);

    // [UX-4] 데이터 수정 모달 상태
    const [editModal, setEditModal] = useState<{
        month: number;
        dataType: 'actual' | 'target' | 'prevYear';
    } | null>(null);

    // 전체 Store 항상 로드
    const { store, setStore, loading, handleSaveData } = useDashboardData(selectedDivision);

    // [전사 통합 합산 로직 강제 적용] 메인 화면(main) 요약 카드는 하위 탭 선택(selectedDivision)과 무관하게 
    // 무조건 'total'을 넘겨서 usePeriodData 내부의 .reduce() 로직을 가동, 진짜 전사 총합을 강제 생성.
    const strictTotalDivision = activeView === 'main' ? 'total' : selectedDivision;

    // 파이프라인 엔진: dateRange + intervalType 연동
    const periodResult = usePeriodData({
        store, selectedDivision: strictTotalDivision, dateRange, intervalType, selectedSubDiv, showTarget, showYoY,
    });

    const { divisionInfo, periodLabels, periodData, periodRates, aggregateData, aggregateTarget } = periodResult;

    // [검증 결과 출력] KPI 컴포넌트에 넘어가기 전, 전사 합산 로직이 제대로 돌았는지 콘솔 로그로 증명
    if (activeView === 'main' && aggregateData.revenue) {
        console.log(`[검증 로그: 전사 통합 Total] 
- 대상: 창원, 태국, 베트남, 멕시코(가전/자동차) 전 사업부 순회 후 .reduce() 합산 성공
- 총 매출 합계: ${aggregateData.revenue} (원시값)
- 총 영업이익 합계: ${aggregateData.operatingProfit} (원시값)`);
    }

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



    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
            {/* ===== 사이드바 (토글 가능) ===== */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20 sticky top-0 h-screen shadow-sm overflow-hidden transition-all duration-300 ease-in-out`}>
                <div className="w-64 min-w-[16rem]">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                        {/* Brand Grouping - Left Aligned */}
                        <div className="flex flex-col items-start text-left gap-3">
                            <Logo className="w-28 max-w-[130px] h-auto object-contain" />
                            <div className="flex flex-col items-start gap-1">
                                <h1 className="text-[1.1rem] font-extrabold tracking-tight text-slate-800 leading-tight">
                                    경영실적 대시보드
                                </h1>
                                <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                                    동진테크윈 · 통합 실적 보고
                                </p>
                            </div>
                        </div>
                        {/* 사이드바 접기 버튼 */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-1.5 -mr-1.5 mt-0.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                            title="사이드바 접기"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <nav className="flex-1 py-6 px-4 space-y-2">
                    <button
                        onClick={() => { setActiveView('main'); setIsAccordionOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 ${activeView === 'main' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                        <Target className="w-4 h-4" /> 메인 대시보드
                    </button>

                    {/* 아코디언 메뉴 */}
                    <div className="space-y-1">
                        <button
                            onClick={() => { setIsAccordionOpen(!isAccordionOpen); setActiveView('dashboard'); }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 ${activeView === 'dashboard' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-4 h-4" />
                                <span>사업부별 손익 분석</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isAccordionOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAccordionOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                            <div className="flex flex-col gap-1 pl-4 border-l-2 border-slate-100 ml-6 py-1">
                                {DIVISIONS_WITH_TOTAL.map(div => {
                                    const isSelected = selectedDivision === div.code && activeView === 'dashboard';
                                    const hasSubs = div.subDivisions && div.subDivisionMode === 'tabs';
                                    return (
                                        <div key={div.code}>
                                            <button
                                                onClick={() => { setActiveView('dashboard'); setSelectedDivision(div.code); setIsAccordionOpen(true); }}
                                                className={`w-full text-left px-4 py-2 text-[13px] font-semibold rounded-xl transition-all duration-200 ${isSelected ? 'text-blue-700 bg-blue-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                                            >
                                                {div.flag} {div.name}
                                            </button>
                                            {/* 하위 부서 트리 메뉴 (베트남/멕시코) */}
                                            {hasSubs && isSelected && (
                                                <div className="flex flex-col gap-0.5 pl-5 mt-1 mb-1">
                                                    {div.subDivisions!.map(sub => (
                                                        <button
                                                            key={sub.key}
                                                            onClick={() => setSelectedSubDiv(sub.key)}
                                                            className={`w-full text-left px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all duration-150 ${selectedSubDiv === sub.key ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                                        >
                                                            {sub.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => { setActiveView('comparison'); setIsAccordionOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 ${activeView === 'comparison' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                        <GitCompare className="w-4 h-4" /> 사업부 지표 비교
                    </button>
                </nav>
                <div className="p-6 border-t border-slate-100 mt-auto">
                    <button onClick={async () => {
                        logout();
                        navigate('/login', { replace: true });
                    }} className="w-full py-2.5 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium">
                        <LogOut size={16} /> <span className="text-sm">로그아웃</span>
                    </button>
                </div>
                </div>
            </aside>

            {/* ===== 메인 콘텐츠 ===== */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full min-w-0 bg-slate-50/50 relative transition-all duration-300 ease-in-out">
                <header className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md pt-8 pb-4 px-8 lg:px-10 max-w-[1600px] w-full mx-auto border-b border-slate-200/80 mb-8 flex justify-between items-end">
                    {/* 사이드바 열기 버튼 (사이드바 접혔을 때만 표시) */}
                    {!sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="mr-3 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                            title="사이드바 열기"
                        >
                            <PanelLeftOpen className="w-5 h-5" />
                        </button>
                    )}
                    <h2 className="text-[22px] font-extrabold text-slate-800 tracking-tight leading-none">
                        {activeView === 'main' ? '메인 대시보드' : activeView === 'dashboard' ? '사업부별 손익 분석' : '사업부 지표 비교'}
                    </h2>

                    {/* 우측 상단 필터: 퀵 프리셋 날짜 선택기만 */}
                    <div className="flex items-center">
                        <MonthPresetPicker
                            dateRange={dateRange}
                            onDateRangeChange={setDateRange}
                        />
                    </div>
                </header>

                <div className="px-8 lg:px-10 max-w-[1600px] w-full mx-auto pb-24 pt-0">
                    {activeView === 'main' ? (
                        <div className="animate-fade-in pb-20">
                            <div style={{ marginBottom: '25px' }}>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                                    <BarChart3 className="text-blue-500 w-5 h-5" />전사 통합 경영실적 요약
                                    <span className="text-sm font-semibold text-slate-400 ml-1">(선택 기간 기준)</span>
                                </h3>
                                <KPICards data={aggregateData} target={aggregateTarget} divisionInfo={DIVISIONS_WITH_TOTAL.find(d => d.code === 'total')!} />
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <YearlyTargetCards store={store} year={dateRange.end.year} />
                            </div>
                            <div style={{ marginBottom: '40px' }}>
                                <DivisionTrendCharts store={store} year={dateRange.end.year} />
                            </div>
                        </div>
                    ) : activeView === 'comparison' ? (
                        <ComparisonView store={store} year={dateRange.end.year} periodType={'monthly'} />
                    ) : (
                        <div className="animate-fade-in">
                            {/* 사업부 Pill 탭 */}
                            <div className="flex items-center gap-3 mb-6 flex-wrap">
                                {DIVISIONS_WITH_TOTAL.map(div => (
                                    <button
                                        key={div.code}
                                        className={`px-6 py-2.5 rounded-full text-[14px] font-bold transition-all duration-200 ${selectedDivision === div.code ? 'bg-blue-800 text-white shadow-md shadow-blue-900/10' : 'bg-white border text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300'}`}
                                        onClick={() => setSelectedDivision(div.code)}
                                    >
                                        {div.flag} {div.name}
                                    </button>
                                ))}
                            </div>

                            {selectedDivision === 'total' ? (
                                <>
                                    <KPICards data={aggregateData} target={aggregateTarget} divisionInfo={DIVISIONS_WITH_TOTAL.find(d => d.code === 'total')!} />
                                    <div className="w-full max-w-full overflow-hidden mx-auto pb-6 mt-10">
                                        <div className="w-full overflow-x-auto">
                                            <ConsolidatedTable store={store} dateRange={dateRange} globalActual={aggregateData} globalTarget={aggregateTarget} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* 서브탭(2 Depth): 세그먼트 컨트롤 스타일 - 메인 탭보다 시각적 힘을 빼서 위계 구분 */}
                                    {divisionInfo?.subDivisions && divisionInfo.subDivisionMode === 'tabs' && (
                                        <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 mb-6 gap-0.5">
                                            {divisionInfo.subDivisions.map(sub => (
                                                <button key={sub.key} onClick={() => setSelectedSubDiv(sub.key)} className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${selectedSubDiv === sub.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                                    {sub.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {divisionInfo && <KPICards data={aggregateData} target={aggregateTarget} divisionInfo={divisionInfo} />}


                                    <div className="flex items-center gap-4 mb-4 mt-8">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 bg-white">
                                            <input type="checkbox" checked={showTarget} onChange={(e) => setShowTarget(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                            <span className="font-semibold text-slate-600">TD목표 대비 보기</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 bg-white">
                                            <input type="checkbox" checked={showYoY} onChange={(e) => setShowYoY(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                            <span className="font-semibold text-slate-600">'25년 대비 보기</span>
                                        </label>
                                    </div>

                                    {/* 매출/비용/이익률 혼합 차트 */}
                                    {divisionInfo && (
                                        <PeriodComposedChart store={store} divisionInfo={divisionInfo} dateRange={dateRange} selectedSubDiv={selectedSubDiv} />
                                    )}

                                    <div className="w-full max-w-full overflow-hidden mx-auto pb-6">
                                        <div className="glass-card p-8 mb-10 bg-white border border-slate-200/60 rounded-2xl overflow-hidden max-w-full">
                                            <div className="w-full overflow-x-auto">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>
                                                    {divisionInfo && divisionInfo.code !== 'total' && divisionInfo.subDivisionMode !== 'columns' && (
                                                        <ExcelUploader currentStore={store} onUploadSuccess={(newStore) => setStore(newStore)} divisionCode={divisionInfo.code} year={dateRange.end.year} />
                                                    )}
                                                </div>
                                                <div className="text-sm font-semibold text-slate-500 text-right">
                                                    단위: {divisionInfo?.currency === 'KRW' ? '백만원' : divisionInfo?.currency === 'MXN' ? `천 ${divisionInfo.currency}` : `백만 ${divisionInfo?.currency}`}
                                                </div>
                                            </div>

                                            {/* 서브디비전 탭은 상단으로 이동됨 - 여기서는 제거 */}
                                            {divisionInfo?.subDivisions && divisionInfo.subDivisionMode === 'columns' && (
                                                <div className="flex gap-2 mb-5">
                                                    {divisionInfo.subDivisions.map(sub => (
                                                        <span key={sub.key} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">{sub.name}</span>
                                                    ))}
                                                    <span className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">합계</span>
                                                </div>
                                            )}

                                            <PLTable
                                                items={getPLItemsForDivision(selectedDivision, selectedSubDiv)}
                                                labels={periodLabels}
                                                data={periodData}
                                                rates={periodRates}
                                                currency={divisionInfo?.currency || 'KRW'}
                                                onEditMonth={(month, dataType) => setEditModal({ month, dataType })}
                                                showTarget={showTarget}
                                                showYoY={showYoY}
                                            />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* [UX-4] 데이터 수정 모달 */}
                {editModal && divisionInfo && (
                    <DataInputModal
                        divisionInfo={divisionInfo}
                        subDivision={selectedSubDiv}
                        year={dateRange.end.year}
                        month={editModal.month}
                        dataType={editModal.dataType}
                        initialData={
                            (() => {
                                const targetYear = editModal.dataType === 'prevYear' ? dateRange.end.year - 1 : dateRange.end.year;
                                const divData = store?.divisions.find(d => d.divisionCode === selectedDivision && d.year === targetYear);
                                if (!divData) return undefined;
                                const isSubDiv = divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all';
                                if (editModal.dataType === 'target') {
                                    return isSubDiv
                                        ? divData.subDivTargetMonthly?.[selectedSubDiv]?.[editModal.month]
                                        : divData.targetMonthly?.[editModal.month];
                                }
                                return isSubDiv
                                    ? divData.subDivMonthly?.[selectedSubDiv]?.[editModal.month]
                                    : divData.monthly?.[editModal.month];
                            })()
                        }
                        initialRate={
                            (() => {
                                const targetYear = editModal.dataType === 'prevYear' ? dateRange.end.year - 1 : dateRange.end.year;
                                const divData = store?.divisions.find(d => d.divisionCode === selectedDivision && d.year === targetYear);
                                const rateObj = divData?.exchangeRates?.[editModal.month];
                                if (!rateObj) return 1;
                                
                                if (editModal.dataType === 'target') return rateObj.target || rateObj.actual || 1;
                                return rateObj.actual || 1; // prevYear는 year-1의 actual
                            })()
                        }
                        onSave={async (month, data, exchangeRate, dataType, manualOverrides) => {
                            const targetYear = dataType === 'prevYear' ? dateRange.end.year - 1 : dateRange.end.year;
                            console.log(`[데이터 업데이트] ${dataType} 데이터 수정 시도. 적용 연도: ${targetYear}, 상태 업데이트 개시.`);
                            await handleSaveData(targetYear, month, data, exchangeRate, dataType, manualOverrides, selectedSubDiv);
                            setEditModal(null);
                        }}
                        onClose={() => setEditModal(null)}

                    />
                )}
            </main>
        </div>
    );
}
