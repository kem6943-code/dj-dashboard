import { useState, useCallback, useEffect } from 'react';
import {
    type DivisionCode,
    type MonthlyPLData,
    DIVISIONS_WITH_TOTAL,
    getPLItemsForDivision,
    MONTH_NAMES,
    QUARTER_NAMES,
    HALF_NAMES,
    aggregateQuarter,
    aggregateHalf,
    aggregateYear,
    consolidateAllDivisions,
    type DataStore,
} from '../utils/dataModel';
import { loadData, getDivisionData, updateMonthlyData, saveData } from '../utils/storage';
import { PLTable } from './PLTable';
import { KPICards } from './KPICards';
import { Charts } from './Charts';
import { DataInputModal } from './DataInputModal';
import { ComparisonView } from './ComparisonView';
import { ConsolidatedTable } from './ConsolidatedTable';
import { YearlyTargetCards } from './YearlyTargetCards';
import {
    BarChart3,
    TrendingUp,
    GitCompare,
    PenLine,
    Calendar,
    Target,
    LogOut, // Added
} from 'lucide-react';
import { signOut } from '../utils/supabaseClient'; // Added

// 기간 타입
type PeriodType = 'monthly' | 'quarterly' | 'half' | 'yearly';

export function Dashboard() {
    const [store, setStore] = useState<DataStore | null>(null);
    const [selectedDivision, setSelectedDivision] = useState<DivisionCode>(DIVISIONS_WITH_TOTAL[0].code);
    const [selectedYear, setSelectedYear] = useState(2026);
    const [periodType, setPeriodType] = useState<PeriodType>('monthly');
    const [activeView, setActiveView] = useState<'main' | 'dashboard' | 'comparison'>('main');
    const [showInputModal, setShowInputModal] = useState(false);
    const [editMonth, setEditMonth] = useState(1);
    const [selectedTotalMonth, setSelectedTotalMonth] = useState(1);
    const [selectedSubDiv, setSelectedSubDiv] = useState('all');
    const [showTarget, setShowTarget] = useState(true);
    const [loading, setLoading] = useState(true);

    // 초기 데이터 로드
    useEffect(() => {
        const init = async () => {
            try {
                const data = await loadData();
                setStore(data);
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
                // 강제로 에러를 던져서 ErrorBoundary가 잡게 합니다
                throw err;
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const divisionInfo = DIVISIONS_WITH_TOTAL.find(d => d.code === selectedDivision)!;
    // 합계 탭일 륜 전 사업부 합산 데이터 생성, 아니면 개별 사업부 데이터
    const divData = store ? (selectedDivision === 'total'
        ? consolidateAllDivisions(store, selectedYear)
        : getDivisionData(store, selectedDivision, selectedYear)) : null;

    // P&L 데이터를 기간별로 변환
    const getPeriodData = useCallback((): { baseLabels: string[]; data: MonthlyPLData[] } => {
        if (!divData) return { baseLabels: [], data: [] };

        // 서브디비전 컬럼 모드 (예: 멕시코 가전/자동차 합계)
        if (divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'columns') {
            const subs = divisionInfo.subDivisions;
            const baseLabels: string[] = [];
            const data: MonthlyPLData[] = [];

            const m = selectedTotalMonth || 1; // 기준 월 지정

            subs.forEach(s => {
                const subData = divData.subDivMonthly?.[s.key] || {};
                let act = subData[m] || ({} as MonthlyPLData);
                if (periodType === 'yearly') act = aggregateYear(subData);
                if (periodType === 'quarterly') act = aggregateQuarter(subData, 1);

                if (showTarget) {
                    // 멕시코 서브디비전 목표 데이터가 없으므로 일단 빈 데이터 매핑
                    data.push({} as MonthlyPLData, act);
                } else {
                    data.push(act);
                }
            });

            let totalAct = divData.monthly[m] || ({} as MonthlyPLData);
            let totalTarg = divData.targetMonthly?.[m] || ({} as MonthlyPLData);
            if (periodType === 'yearly') {
                totalAct = aggregateYear(divData.monthly);
                totalTarg = aggregateYear(divData.targetMonthly || {});
            }
            if (periodType === 'quarterly') {
                totalAct = aggregateQuarter(divData.monthly, 1);
                totalTarg = aggregateQuarter(divData.targetMonthly || {}, 1);
            }

            baseLabels.push('합계');
            if (showTarget) {
                data.push(totalTarg, totalAct);
            } else {
                data.push(totalAct);
            }

            return { baseLabels, data };
        }

        // 서브디비전 탭 모드 (예: 베트남 생산실별)
        const targetMonthly = (divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all')
            ? (divData.subDivMonthly?.[selectedSubDiv] || {})
            : divData.monthly;

        const targetMonthlyGoals = (divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all')
            ? (divData.subDivTargetMonthly?.[selectedSubDiv] || {})
            : (divData.targetMonthly || {});

        const buildData = (
            baseLabels: string[],
            actualData: MonthlyPLData[],
            targetData: MonthlyPLData[]
        ) => {
            if (!showTarget) return { baseLabels, data: actualData };

            const data: MonthlyPLData[] = [];
            baseLabels.forEach((_, idx) => {
                data.push(targetData[idx] || ({} as MonthlyPLData));
                data.push(actualData[idx]);
            });
            return { baseLabels, data };
        };

        switch (periodType) {
            case 'monthly':
                return buildData(
                    MONTH_NAMES,
                    MONTH_NAMES.map((_, i) => targetMonthly[i + 1] || ({} as MonthlyPLData)),
                    MONTH_NAMES.map((_, i) => targetMonthlyGoals[i + 1] || ({} as MonthlyPLData))
                );
            case 'quarterly':
                return buildData(
                    QUARTER_NAMES,
                    [1, 2, 3, 4].map(q => aggregateQuarter(targetMonthly, q)),
                    [1, 2, 3, 4].map(q => aggregateQuarter(targetMonthlyGoals, q))
                );
            case 'half':
                return buildData(
                    HALF_NAMES,
                    [1, 2].map(h => aggregateHalf(targetMonthly, h)),
                    [1, 2].map(h => aggregateHalf(targetMonthlyGoals, h))
                );
            case 'yearly':
                return buildData(
                    [`${selectedYear}년 합계`],
                    [aggregateYear(targetMonthly)],
                    [aggregateYear(targetMonthlyGoals)]
                );
            default:
                return { baseLabels: [], data: [] };
        }
    }, [divData, periodType, selectedYear, divisionInfo, selectedSubDiv, selectedTotalMonth, showTarget]);

    const { baseLabels: periodLabels, data: periodData } = getPeriodData();

    // 데이터 로딩 중 표시 (모든 Hook 호출 이후에 렌더링을 차단해야 Rule of Hooks 에러 #310을 방지함)
    if (loading || !store || !divData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">데이터를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    // 데이터 저장 핸들러 (환율 포함)
    const handleSaveData = async (month: number, data: Record<string, number>, exchangeRate: number) => {
        if (!store) return;

        const newStore = updateMonthlyData(store, selectedDivision, selectedYear, month, data);
        // 환율 저장
        const divIdx = newStore.divisions.findIndex(
            d => d.divisionCode === selectedDivision && d.year === selectedYear
        );
        if (divIdx >= 0) {
            newStore.divisions[divIdx].exchangeRate[month] = exchangeRate;
        }

        await saveData(newStore);
        setStore({ ...newStore });
        setShowInputModal(false);
    };

    // 데이터 입력 버튼
    const handleEditMonth = (month: number) => {
        setEditMonth(month);
        setShowInputModal(true);
    };

    return (
        <div className="min-h-screen p-12 max-w-[1920px] mx-auto bg-[#fafafa]">
            {/* ===== 헤더 ===== */}
            <header className="mb-16">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            <BarChart3 className="w-7 h-7 text-blue-400" />
                            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                                경영실적 대시보드
                            </span>
                        </h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                            동진테크윈 · 사업부별 경영실적 통합 보고
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            className="select-field"
                            value={selectedYear}
                            onChange={e => setSelectedYear(Number(e.target.value))}
                        >
                            <option value={2025}>2025년</option>
                            <option value={2026}>2026년</option>
                        </select>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={async () => {
                                    await signOut();
                                    window.location.reload();
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 flex items-center gap-2 group"
                                title="로그아웃"
                            >
                                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                                <span className="text-sm font-medium">로그아웃</span>
                            </button>
                            <button
                                onClick={() => setShowInputModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition-all transform hover:-translate-y-1"
                            >
                                <PenLine size={20} />
                                데이터 직접 입력
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ===== 메인 뷰 스위처 ===== */}
            <div className="flex items-center gap-4 flex-wrap" style={{ marginBottom: '25px' }}>
                <button
                    className={`tab-btn ${activeView === 'main' ? 'active' : ''}`}
                    onClick={() => setActiveView('main')}
                >
                    <Target className="w-4 h-4 inline mr-1" />
                    메인 대시보드
                </button>
                <button
                    className={`tab-btn ${activeView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveView('dashboard')}
                >
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    사업부별 손익 분석
                </button>
                <button
                    className={`tab-btn ${activeView === 'comparison' ? 'active' : ''}`}
                    onClick={() => setActiveView('comparison')}
                >
                    <GitCompare className="w-4 h-4 inline mr-1" />
                    사업부 지표 비교
                </button>
            </div>

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
                            divData={consolidateAllDivisions(store, selectedYear)}
                            divisionInfo={DIVISIONS_WITH_TOTAL.find(d => d.code === 'total')!}
                        />
                    </div>

                    {/* 2. 중단: 사업부별 연간 TD목표 달성 진척도 */}
                    <div style={{ marginBottom: '25px' }}>
                        <YearlyTargetCards store={store} year={selectedYear} />
                    </div>

                    {/* 3. 하단: 전사 통합 월별 실적 트렌드 차트 */}
                    <div>
                        <h2 className="text-[22px] font-extrabold mb-10 flex items-center gap-3 text-slate-800 tracking-tight">
                            <TrendingUp className="text-emerald-500 w-7 h-7" />
                            전사 월별 실적 트렌드
                        </h2>
                        <div className="glass-card p-6 shadow-sm border border-gray-100">
                            <Charts
                                divData={consolidateAllDivisions(store, selectedYear)}
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
                    <div className="flex items-center gap-2 mb-6 flex-wrap">
                        {DIVISIONS_WITH_TOTAL.map(div => (
                            <button
                                key={div.code}
                                className={`tab-btn ${selectedDivision === div.code ? 'active' : ''}`}
                                onClick={() => setSelectedDivision(div.code)}
                            >
                                {div.flag} {div.name}
                            </button>
                        ))}
                    </div>

                    {selectedDivision === 'total' ? (
                        /* ===== 합계 탭: 사업부별 분류 + 합계 테이블 ===== */
                        <>
                            <KPICards divData={divData} divisionInfo={divisionInfo} />

                            {/* 기간 유형 선택 */}
                            <div className="flex items-center gap-2 mb-3 mt-6">
                                <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>기간:</span>
                                {[
                                    { key: 'monthly' as PeriodType, label: '월별' },
                                    { key: 'quarterly' as PeriodType, label: '분기별' },
                                    { key: 'half' as PeriodType, label: '반기별' },
                                    { key: 'yearly' as PeriodType, label: '연간' },
                                ].map(p => (
                                    <button
                                        key={p.key}
                                        className={`tab-btn text-xs ${periodType === p.key ? 'active' : ''}`}
                                        onClick={() => { setPeriodType(p.key); setSelectedTotalMonth(1); }}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            {/* 세부 기간 선택 (연간이 아닐 때만) */}
                            {periodType !== 'yearly' && (
                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                    <span className="text-xs ml-6" style={{ color: 'var(--text-muted)' }}>
                                        {periodType === 'monthly' ? '월:' : periodType === 'quarterly' ? '분기:' : '반기:'}
                                    </span>
                                    {(periodType === 'monthly'
                                        ? MONTH_NAMES.map((name, i) => ({ idx: i + 1, label: name }))
                                        : periodType === 'quarterly'
                                            ? [{ idx: 1, label: 'Q1' }, { idx: 2, label: 'Q2' }, { idx: 3, label: 'Q3' }, { idx: 4, label: 'Q4' }]
                                            : [{ idx: 1, label: '상반기' }, { idx: 2, label: '하반기' }]
                                    ).map(p => (
                                        <button
                                            key={p.idx}
                                            className={`tab-btn text-xs ${selectedTotalMonth === p.idx ? 'active' : ''}`}
                                            onClick={() => setSelectedTotalMonth(p.idx)}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <ConsolidatedTable
                                store={store}
                                year={selectedYear}
                                periodType={periodType}
                                periodIndex={periodType === 'yearly' ? 1 : selectedTotalMonth}
                            />

                            {/* 
                            차트 영역 삭제 (불필요한 정보 단순화)
                            <div className="mt-12">
                                <Charts divData={divData} divisionInfo={divisionInfo} year={selectedYear} />
                            </div> 
                            */}
                        </>
                    ) : (
                        <>
                            {/* ===== KPI 카드 ===== */}
                            <KPICards divData={divData} divisionInfo={divisionInfo} />

                            {/* ===== 기간 선택 ===== */}
                            <div className="flex items-center gap-2 mb-4 mt-6">
                                <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>기간:</span>
                                {[
                                    { key: 'monthly' as PeriodType, label: '월별' },
                                    { key: 'quarterly' as PeriodType, label: '분기별' },
                                    { key: 'half' as PeriodType, label: '반기별' },
                                    { key: 'yearly' as PeriodType, label: '연간' },
                                ].map(p => (
                                    <button
                                        key={p.key}
                                        className={`tab-btn text-xs ${periodType === p.key ? 'active' : ''}`}
                                        onClick={() => setPeriodType(p.key)}
                                    >
                                        {p.label}
                                    </button>
                                ))}

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
                            </div>

                            {/* ===== P&L 테이블 ===== */}
                            <div className="glass-card p-8 mb-10 animate-fade-in overflow-x-auto">
                                <div className="flex justify-end mb-4">
                                    <span className="text-xs font-semibold px-3 py-1 bg-gray-200 rounded-full" style={{ color: 'var(--text-primary)' }}>
                                        (단위: {divisionInfo.currency === 'KRW' ? '백만원' : `백만 ${divisionInfo.currency} `})
                                    </span>
                                </div>

                                {/* 서브 디비전 탭 (베트남: 생산1/2/3실 등) */}
                                {divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'tabs' && (
                                    <div className="flex flex-wrap gap-3 mb-6 mt-2">
                                        {divisionInfo.subDivisions.map(sub => (
                                            <button
                                                key={sub.key}
                                                onClick={() => setSelectedSubDiv(sub.key)}
                                                className={`px - 5 py - 2 rounded - full text - sm font - bold transition - all border - 2 ${selectedSubDiv === sub.key
                                                    ? 'border-blue-500 shadow-md ring-4 ring-blue-500/20'
                                                    : 'border-transparent hover:border-blue-300 hover:bg-white/60 shadow-sm'
                                                    } `}
                                                style={{
                                                    background: selectedSubDiv === sub.key ? 'var(--accent-blue)' : 'var(--glass-bg)',
                                                    color: selectedSubDiv === sub.key ? 'white' : 'var(--text-primary)',
                                                }}
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
                                    items={getPLItemsForDivision(selectedDivision)}
                                    labels={periodLabels}
                                    data={periodData}
                                    onEditMonth={(periodType === 'monthly' && divisionInfo.subDivisionMode !== 'columns') ? handleEditMonth : undefined}
                                    showTarget={showTarget}
                                />
                            </div>

                            {/* ===== 차트 ===== */}
                            <div className="mt-12">
                                <Charts divData={divData} divisionInfo={divisionInfo} year={selectedYear} />
                            </div>
                        </>
                    )}

                    {/* ===== 데이터 입력 모달 (합계 탭에서는 비활성화) ===== */}
                    {showInputModal && selectedDivision !== 'total' && (
                        <DataInputModal
                            divisionInfo={divisionInfo}
                            year={selectedYear}
                            month={editMonth}
                            initialData={divData?.monthly[editMonth]}
                            initialRate={divData?.exchangeRate[editMonth]}
                            onSave={handleSaveData}
                            onClose={() => setShowInputModal(false)}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
