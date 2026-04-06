const fs = require('fs');

let code = `import { useState } from 'react';
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
import {
    BarChart3,
    TrendingUp,
    GitCompare,
    Calendar,
    Target,
    LogOut,
} from 'lucide-react';
import { signOut } from '../utils/supabaseClient';

// 기간 타입
type PeriodType = 'monthly' | 'quarterly' | 'half' | 'yearly';

export function Dashboard() {
    const [selectedDivision, setSelectedDivision] = useState<DivisionCode>(DIVISIONS_WITH_TOTAL[0].code);
    const [selectedYear, setSelectedYear] = useState(2026);
    const [periodType, setPeriodType] = useState<PeriodType>('monthly');
    const [activeView, setActiveView] = useState<'main' | 'dashboard' | 'comparison'>('main');
    const [showInputModal, setShowInputModal] = useState(false);
    const [editMonth, setEditMonth] = useState(1);
    const [editDataType, setEditDataType] = useState<'actual' | 'target' | 'prevYear'>('actual');
    const [selectedTotalMonth, setSelectedTotalMonth] = useState(1);
    const [selectedSubDiv, setSelectedSubDiv] = useState('all');
    const [showTarget, setShowTarget] = useState(true);
    const [showYoY, setShowYoY] = useState(true); // '25' 대비 보기 토글 (기본 ON)
    const { store, setStore, loading, syncError, setSyncError, handleSaveData } = useDashboardData(selectedDivision, selectedYear);

    const { 
        divData, 
        prevYearDivData, 
        divisionInfo, 
        periodLabels, 
        periodData, 
        periodRates 
    } = usePeriodData({
        store,
        selectedDivision,
        selectedYear,
        periodType,
        selectedSubDiv,
        selectedTotalMonth,
        showTarget,
        showYoY
    });

    if (loading || !store) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">데이터를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    // 데이터 입력 버튼
    const handleEditMonth = (month: number, dataType: 'actual' | 'target' | 'prevYear' = 'actual') => {
        setEditMonth(month);
        setEditDataType(dataType);
        setShowInputModal(true);
    };

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
            {/* ===== 좌측 사이드바 (다크 네이비) ===== */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 shadow-2xl z-20 sticky top-0 h-screen">
                <div className="p-6 pb-8 border-b border-slate-800">
                    <h1 className="text-[1.2rem] font-bold tracking-tight flex items-center gap-2 text-white leading-tight">
                        <BarChart3 className="w-6 h-6 text-blue-500" />
                        <span>경영실적 대시보드</span>
                    </h1>
                    <p className="text-[11px] mt-2 text-slate-400">동진테크윈 · 사업부별 통합 보고</p>
                </div>
                
                <nav className="flex-1 py-6 px-4 space-y-2">
                    <button
                        className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 \${activeView === 'main' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}\`}
                        onClick={() => setActiveView('main')}
                    >
                        <Target className="w-4 h-4" />
                        메인 대시보드
                    </button>
                    <button
                        className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 \${activeView === 'dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}\`}
                        onClick={() => setActiveView('dashboard')}
                    >
                        <TrendingUp className="w-4 h-4" />
                        사업부별 손익 분석
                    </button>
                    <button
                        className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 \${activeView === 'comparison' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}\`}
                        onClick={() => setActiveView('comparison')}
                    >
                        <GitCompare className="w-4 h-4" />
                        사업부 지표 비교
                    </button>
                </nav>

                {/* 하단 로그아웃 영역 */}
                <div className="p-6 border-t border-slate-800 mt-auto">
                    <button
                        onClick={async () => {
                            await signOut();
                            window.location.reload();
                        }}
                        className="w-full py-2.5 flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors group"
                        title="로그아웃"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">로그아웃</span>
                    </button>
                </div>
            </aside>

            {/* ===== 메인 컨텐츠 영역 ===== */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
                <div className="p-8 lg:p-10 max-w-[1600px] w-full mx-auto pb-24">

            {/* ===== 세부 탭 및 컨텐츠 영역 ===== */}
            {activeView === 'main' ? (
                /* ===== 메인 대시보드 (프리미엄 요약 뷰) ===== */
                <div className="animate-fade-in pb-20">

                    {/* 1. 상단: 전사 통합 YTD 요약 (KPI 카드) */}
                    <div style={{ marginBottom: '25px' }}>
                        <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2 text-slate-800 tracking-tight">
                            <BarChart3 className="text-blue-500 w-6 h-6" />
                            {selectedYear}년 전사 통합 경영실적 요약 <span className="text-sm font-semibold text-slate-400 ml-2 tracking-normal">(YTD 기준)</span>
                        </h2>
                        <KPICards
                            divData={consolidateAllDivisions(store!, selectedYear)}
                            divisionInfo={DIVISIONS_WITH_TOTAL.find(d => d.code === 'total')!}
                        />
                    </div>

                    {/* 2. 중단: 사업부별 연간 TD목표 달성 진척도 */}
                    <div style={{ marginBottom: '25px' }}>
                        <YearlyTargetCards store={store} year={selectedYear} />
                    </div>

                    {/* 3. 하단 1: 각 사업부별 월별 실적 트렌드 그래고 */}
                    <div style={{ marginBottom: '40px' }}>
                        <DivisionTrendCharts store={store} year={selectedYear} />
                    </div>

                    {/* 4. 하단 2: 전사 통합 월별 실적 트렌드 차트 */}
                    <div>
                        <h2 className="text-[22px] font-extrabold mb-10 flex items-center gap-3 text-slate-800 tracking-tight">
                            <TrendingUp className="text-emerald-500 w-7 h-7" />
                            전사 월별 실적 트렌드
                        </h2>
                        <div className="glass-card p-6 shadow-sm border border-gray-100" style={{ padding: '24px', boxSizing: 'border-box' }}>
                            <Charts
                                divData={consolidateAllDivisions(store!, selectedYear)}
                                prevYearData={consolidateAllDivisions(store!, selectedYear - 1)}
                                divisionInfo={DIVISIONS_WITH_TOTAL.find(d => d.code === 'total')!}
                                year={selectedYear}
                            />
                        </div>
                    </div>
                </div>
            ) : activeView === 'comparison' ? (
                <ComparisonView store={store} year={selectedYear} periodType={periodType} />
            ) : (
                /* ===== 손익 분석 (기존 dashboard 뷰) ===== */
                <div className="animate-fade-in">
                    {/* 사업부 탭 */}
                    <div className="flex items-center gap-4 mb-8 flex-wrap">
                        {DIVISIONS_WITH_TOTAL.map(div => (
                            <button
                                key={div.code}
                                className={\`tab-btn \${selectedDivision === div.code ? 'active' : ''}\`}
                                onClick={() => setSelectedDivision(div.code)}
                            >
                                {div.flag} {div.name}
                            </button>
                        ))}
                    </div>

                    {selectedDivision === 'total' ? (
                        /* ===== 합계 탭: 사업부별 분류 + 합계 테이블 ===== */
                        <>
                            <KPICards divData={divData as any} divisionInfo={divisionInfo} />

                            {/* 기간 유형 선택 */}
                            <div className="flex items-center gap-2 mb-3 mt-6">
                                <select
                                    className="bg-white border text-sm font-semibold border-slate-300 text-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                                    value={selectedYear}
                                    onChange={e => setSelectedYear(Number(e.target.value))}
                                >
                                    <option value={2025}>2025년</option>
                                    <option value={2026}>2026년</option>
                                </select>
                                <div className="w-px h-5 bg-slate-300 mx-1" />
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <div className="flex bg-slate-200/50 p-1 rounded-lg border border-slate-200 shadow-inner">
                                    {[
                                        { key: 'monthly' as PeriodType, label: '월별' },
                                        { key: 'quarterly' as PeriodType, label: '분기별' },
                                        { key: 'half' as PeriodType, label: '반기별' },
                                        { key: 'yearly' as PeriodType, label: '연간' },
                                    ].map(p => (
                                        <button
                                            key={p.key}
                                            className={\`sub-tab-btn \${periodType === p.key ? 'active' : ''}\`}
                                            onClick={() => { setPeriodType(p.key); setSelectedTotalMonth(1); }}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 세부 기간 선택 (연간이 아닐 때만) */}
                            {periodType !== 'yearly' && (
                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                    <span className="text-xs font-semibold px-2 text-slate-400">
                                        {periodType === 'monthly' ? '선택 월:' : periodType === 'quarterly' ? '선택 분기:' : '선택 반기:'}
                                    </span>
                                    <div className="flex flex-wrap bg-slate-200/50 p-1 rounded-lg border border-slate-200 shadow-inner gap-1">
                                        {(periodType === 'monthly'
                                            ? MONTH_NAMES.map((name, i) => ({ idx: i + 1, label: name }))
                                            : periodType === 'quarterly'
                                                ? [{ idx: 1, label: 'Q1' }, { idx: 2, label: 'Q2' }, { idx: 3, label: 'Q3' }, { idx: 4, label: 'Q4' }]
                                                : [{ idx: 1, label: '상반기' }, { idx: 2, label: '하반기' }]
                                        ).map(p => (
                                            <button
                                                key={p.idx}
                                                className={\`sub-tab-btn \${selectedTotalMonth === p.idx ? 'active' : ''}\`}
                                                onClick={() => setSelectedTotalMonth(p.idx)}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <ConsolidatedTable
                                store={store}
                                year={selectedYear}
                                periodType={periodType}
                                periodIndex={periodType === 'yearly' ? 1 : selectedTotalMonth}
                            />
                        </>
                    ) : (
                        <>
                            {/* ===== KPI 카드 ===== */}
                            <KPICards divData={divData as any} divisionInfo={divisionInfo} />

                            {/* ===== 비용 구조 추이 차트 ===== */}
                            <div className="mt-6 mb-4">
                                <Charts
                                    divData={divData as any}
                                    prevYearData={prevYearDivData ?? undefined}
                                    divisionInfo={divisionInfo}
                                    year={selectedYear}
                                />
                            </div>

                            {/* ===== 기간 선택 ===== */}
                            <div className="flex items-center gap-2 mb-4 mt-6">
                                <select
                                    className="bg-white border text-sm font-semibold border-slate-300 text-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                                    value={selectedYear}
                                    onChange={e => setSelectedYear(Number(e.target.value))}
                                >
                                    <option value={2025}>2025년</option>
                                    <option value={2026}>2026년</option>
                                </select>
                                <div className="w-px h-5 bg-slate-300 mx-1" />
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <div className="flex bg-slate-200/50 p-1 rounded-lg border border-slate-200 shadow-inner">
                                    {[
                                        { key: 'monthly' as PeriodType, label: '월별' },
                                        { key: 'quarterly' as PeriodType, label: '분기별' },
                                        { key: 'half' as PeriodType, label: '반기별' },
                                        { key: 'yearly' as PeriodType, label: '연간' },
                                    ].map(p => (
                                        <button
                                            key={p.key}
                                            className={\`sub-tab-btn \${periodType === p.key ? 'active' : ''}\`}
                                            onClick={() => setPeriodType(p.key)}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="w-px h-5 bg-gray-200 mx-2" />
                                <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={showTarget}
                                        onChange={(e) => setShowTarget(e.target.checked)}
                                        className="rounded text-blue-500 focus:ring-blue-500"
                                    />
                                    <span style={{ color: 'var(--text-secondary)' }}>TD목표 대비 보기</span>
                                </label>

                                <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-amber-50 px-2 py-1 rounded transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={showYoY}
                                        onChange={(e) => setShowYoY(e.target.checked)}
                                        className="rounded text-amber-500 focus:ring-amber-500"
                                    />
                                    <span style={{ color: 'var(--text-secondary)' }}>'25년 대비 보기</span>
                                </label>
                            </div>

                            {/* 세부 기간 선택 (연간이 아닐 때만) 추가 (디비전 탭 용) */}
                            {periodType !== 'yearly' && (
                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                    <span className="text-xs font-semibold px-2 text-slate-400">
                                        {periodType === 'monthly' ? '선택 월:' : periodType === 'quarterly' ? '선택 분기:' : '선택 반기:'}
                                    </span>
                                    <div className="flex flex-wrap bg-slate-200/50 p-1 rounded-lg border border-slate-200 shadow-inner gap-1">
                                        {(periodType === 'monthly'
                                            ? MONTH_NAMES.map((name, i) => ({ idx: i + 1, label: name }))
                                            : periodType === 'quarterly'
                                                ? [{ idx: 1, label: 'Q1' }, { idx: 2, label: 'Q2' }, { idx: 3, label: 'Q3' }, { idx: 4, label: 'Q4' }]
                                                : [{ idx: 1, label: '상반기' }, { idx: 2, label: '하반기' }]
                                        ).map(p => (
                                            <button
                                                key={p.idx}
                                                className={\`sub-tab-btn \${selectedTotalMonth === p.idx ? 'active' : ''}\`}
                                                onClick={() => setSelectedTotalMonth(p.idx)}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ===== P&L 테이블 ===== */}
                            <div className="glass-card p-8 mb-10 animate-fade-in" style={{ padding: '32px', boxSizing: 'border-box' }}>
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        {periodType === 'monthly' && divisionInfo.code !== 'total' && divisionInfo.subDivisionMode !== 'columns' && (
                                            <ExcelUploader
                                                currentStore={store}
                                                onUploadSuccess={(newStore) => setStore(newStore)}
                                                divisionCode={divisionInfo.code}
                                                year={selectedYear}
                                            />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-slate-400">
                                        (단위: {divisionInfo.currency === 'KRW' ? '백만원' : divisionInfo.currency === 'MXN' ? \`천 \${divisionInfo.currency}\` : \`백만 \${divisionInfo.currency}\`})
                                    </span>
                                </div>

                                {/* 서브 디비전 프리미엄 탭 */}
                                {divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'tabs' && (
                                    <div className="premium-tabs-container mb-6 mt-2">
                                        {divisionInfo.subDivisions.map(sub => (
                                            <button
                                                key={sub.key}
                                                onClick={() => setSelectedSubDiv(sub.key)}
                                                className={\`premium-tab-btn \${selectedSubDiv === sub.key ? 'active' : ''}\`}
                                            >
                                                {sub.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* 멕시코: 가전/자동차 컬럼 헤더 */}
                                {divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'columns' && (
                                    <div className="flex gap-2 mb-3">
                                        {divisionInfo.subDivisions.map(sub => (
                                            <span key={sub.key} className="px-3 py-1 rounded-full text-xs font-medium"
                                                style={{ background: 'var(--accent-blue)', color: 'white', opacity: 0.85 }}>
                                                {sub.name}
                                            </span>
                                        ))}
                                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                                            style={{ background: 'var(--accent-green)', color: 'white', opacity: 0.85 }}>
                                            합계
                                        </span>
                                    </div>
                                )}

                                <PLTable
                                    items={getPLItemsForDivision(selectedDivision, selectedSubDiv)}
                                    labels={periodLabels}
                                    data={periodData}
                                    rates={periodRates}
                                    currency={divisionInfo.currency}
                                    onEditMonth={(periodType === 'monthly' && divisionInfo.subDivisionMode !== 'columns' && !(divisionInfo.subDivisions && selectedSubDiv === 'all')) ? handleEditMonth : undefined}
                                    showTarget={showTarget}
                                    showYoY={showYoY}
                                />
                            </div>
                        </>
                    )}

                    {/* ===== 데이터 입력 모달 (합계 탭에서는 비활성화) ===== */}
                    {showInputModal && selectedDivision !== 'total' && (() => {
                        const isSubDiv = divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all';
                        return (
                            <DataInputModal
                                divisionInfo={divisionInfo}
                                subDivision={selectedSubDiv}
                                year={editDataType === 'prevYear' ? selectedYear - 1 : selectedYear}
                                month={editMonth}
                                dataType={editDataType}
                                initialData={
                                    editDataType === 'prevYear'
                                        ? (isSubDiv ? prevYearDivData?.subDivMonthly?.[selectedSubDiv]?.[editMonth] : prevYearDivData?.monthly?.[editMonth])
                                        : editDataType === 'target'
                                            ? (isSubDiv ? divData?.subDivTargetMonthly?.[selectedSubDiv]?.[editMonth] : divData?.targetMonthly?.[editMonth])
                                            : (isSubDiv ? divData?.subDivMonthly?.[selectedSubDiv]?.[editMonth] : divData?.monthly?.[editMonth])
                                }
                                initialRate={
                                    editDataType === 'prevYear'
                                        ? (prevYearDivData?.exchangeRates?.[editMonth]?.actual !== 1 && prevYearDivData?.exchangeRates?.[editMonth]?.actual !== undefined) 
                                            ? prevYearDivData?.exchangeRates?.[editMonth]?.actual 
                                            : prevYearDivData?.exchangeRates?.[editMonth]?.prev
                                        : editDataType === 'target'
                                            ? divData?.exchangeRates?.[editMonth]?.target
                                            : divData?.exchangeRates?.[editMonth]?.actual
                                }
                                onSave={(month, data, rate, type) => handleSaveData(month, data, rate, type)}
                                onClose={() => setShowInputModal(false)}
                            />
                        );
                    })()}
                </div>
            )}
                </div>
            </main>

            {/* 클라우드 동기화 실패 에러 토스트 */}
            {syncError && (
                <div className="fixed bottom-6 right-6 z-[100] animate-fade-in flex items-start gap-4 bg-red-50 border border-red-200 text-red-700 px-5 py-5 rounded-2xl shadow-2xl max-w-sm" style={{ boxShadow: '0 10px 40px rgba(239,68,68,0.2)' }}>
                    <div className="flex-shrink-0 mt-0.5">
                        <div className="w-10 h-10 bg-red-100/80 rounded-full flex items-center justify-center border border-red-200">
                            <span className="text-red-500 font-extrabold text-lg">!</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-[15px] mb-1 text-red-900 tracking-tight">🚨 클라우드 동기화 경고</h4>
                        <p className="text-[13px] text-red-800 leading-relaxed opacity-90 whitespace-pre-line">{syncError}</p>
                        <p className="text-[11px] text-red-700/80 mt-2 font-medium">Supabase 프로젝트가 일시 중지되었는지 확인해주세요.</p>
                    </div>
                    <button onClick={() => setSyncError(null)} className="p-1 hover:bg-red-100 rounded-full transition-colors self-start opacity-70 hover:opacity-100 -mr-1 -mt-1">
                        <span className="text-2xl leading-none block w-6 h-6 text-center text-red-500">&times;</span>
                    </button>
                </div>
            )}
        </div>
    );
}
`;

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log('Successfully recreated Dashboard.tsx completely, bypassing all AST and regex mismatch errors!');
