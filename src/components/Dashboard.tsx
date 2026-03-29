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
    createEmptyPLData,
    calculateDerivedFields,
    type DataStore,
} from '../utils/dataModel';
import { loadData, getDivisionData, saveData } from '../utils/storage';
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
    const [editDataType, setEditDataType] = useState<'actual' | 'target' | 'prevYear'>('actual');
    const [selectedTotalMonth, setSelectedTotalMonth] = useState(1);
    const [selectedSubDiv, setSelectedSubDiv] = useState('all');
    const [showTarget, setShowTarget] = useState(true);
    const [showYoY, setShowYoY] = useState(true); // '25' 대비 보기 토글 (기본 ON)
    const [loading, setLoading] = useState(true);
    const [syncError, setSyncError] = useState<string | null>(null);

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

    // 전년도 데이터 (예: 2025)
    const prevYearDivData = store ? (selectedDivision === 'total'
        ? consolidateAllDivisions(store, selectedYear - 1)
        : getDivisionData(store, selectedDivision, selectedYear - 1)) : null;

    // P&L 데이터를 기간별로 변환
    const getPeriodData = useCallback((): { baseLabels: string[]; data: MonthlyPLData[]; rates: number[] } => {
        if (!divData) return { baseLabels: [], data: [], rates: [] };

        // 서브디비전 컬럼 모드 (예: 멕시코 가전/자동차 합계)
        if (divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'columns') {
            const subs = divisionInfo.subDivisions;
            const baseLabels: string[] = [];
            const data: MonthlyPLData[] = [];
            const rates: number[] = [];

            const m = selectedTotalMonth || 1; // 기준 월 지정
            // 환율 도출
            const rs = (periodType === 'monthly' && m <= 12)
                ? (divData.exchangeRates?.[m] || { actual: 1, target: 1, prev: 1 })
                : (divData.exchangeRates?.[1] || { actual: 1, target: 1, prev: 1 });

            subs.forEach(s => {
                const subData = divData.subDivMonthly?.[s.key] || {};
                let act = subData[m] || ({} as MonthlyPLData);
                if (periodType === 'yearly') act = aggregateYear(subData);
                if (periodType === 'quarterly') act = aggregateQuarter(subData, 1);

                if (showTarget) {
                    // 멕시코 서브디비전 목표 데이터가 없으므로 일단 빈 데이터 매핑
                    data.push({} as MonthlyPLData, act);
                    rates.push(rs.target || 1, rs.actual || 1);
                } else {
                    data.push(act);
                    rates.push(rs.actual || 1);
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
                rates.push(rs.target || 1, rs.actual || 1);
            } else {
                data.push(totalAct);
                rates.push(rs.actual || 1);
            }

            return { baseLabels, data, rates }; // 수정: 단위 환율 적용
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
            targetData: MonthlyPLData[],
            prevYearActualData?: MonthlyPLData[]
        ): { baseLabels: string[]; data: MonthlyPLData[]; rates: number[] } => {
            // 아무 토글도 안 켜져있으면 실적만 표시
            if (!showTarget && !showYoY) return {
                baseLabels,
                data: actualData,
                rates: actualData.map((_, idx) => {
                    const rs = (periodType === 'monthly' && idx < 12)
                        ? (divData.exchangeRates?.[idx + 1] || { actual: 1, target: 1, prev: 1 })
                        : (divData.exchangeRates?.[1] || { actual: 1, target: 1, prev: 1 });
                    return rs.actual || 1;
                })
            };

            const data: MonthlyPLData[] = [];
            const rates: number[] = [];
            baseLabels.forEach((_, idx) => {
                const rs = (periodType === 'monthly' && idx < 12)
                    ? (divData.exchangeRates?.[idx + 1] || { actual: 1, target: 1, prev: 1 })
                    : (divData.exchangeRates?.[1] || { actual: 1, target: 1, prev: 1 });

                const prs = (periodType === 'monthly' && idx < 12)
                    ? (prevYearDivData?.exchangeRates?.[idx + 1] || { actual: 1, target: 1, prev: 1 })
                    : (prevYearDivData?.exchangeRates?.[1] || { actual: 1, target: 1, prev: 1 });

                // showYoY가 켜져있으면 전년 실적 먼저
                if (showYoY) {
                    data.push(prevYearActualData?.[idx] || ({} as MonthlyPLData));
                    rates.push(prs.actual !== 1 && prs.actual !== undefined ? prs.actual : (prs.prev || 1));
                }
                // 실적(현재 년도)은 항상 그 다음
                data.push(actualData[idx]);
                rates.push(rs.actual || 1);
                // showTarget이 켜져있으면 TD목표
                if (showTarget) {
                    data.push(targetData[idx] || ({} as MonthlyPLData));
                    rates.push(rs.target || 1);
                }
            });
            return { baseLabels, data, rates };
        };

        // 전년도 데이터 준비
        const prevMonthly = (divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all')
            ? (prevYearDivData?.subDivMonthly?.[selectedSubDiv] || {})
            : (prevYearDivData?.monthly || {});

        switch (periodType) {
            case 'monthly': {
                const monthLabels = [...MONTH_NAMES, '누계'];
                const monthActual = [
                    ...MONTH_NAMES.map((_, i) => targetMonthly[i + 1] || ({} as MonthlyPLData)),
                    aggregateYear(targetMonthly),
                ];
                const monthTarget = [
                    ...MONTH_NAMES.map((_, i) => targetMonthlyGoals[i + 1] || ({} as MonthlyPLData)),
                    aggregateYear(targetMonthlyGoals),
                ];
                const monthPrev = [
                    ...MONTH_NAMES.map((_, i) => prevMonthly[i + 1] || ({} as MonthlyPLData)),
                    aggregateYear(prevMonthly),
                ];
                return buildData(monthLabels, monthActual, monthTarget, monthPrev);
            }
            case 'quarterly':
                return buildData(
                    QUARTER_NAMES,
                    [1, 2, 3, 4].map(q => aggregateQuarter(targetMonthly, q)),
                    [1, 2, 3, 4].map(q => aggregateQuarter(targetMonthlyGoals, q)),
                    [1, 2, 3, 4].map(q => aggregateQuarter(prevMonthly, q))
                );
            case 'half':
                return buildData(
                    HALF_NAMES,
                    [1, 2].map(h => aggregateHalf(targetMonthly, h)),
                    [1, 2].map(h => aggregateHalf(targetMonthlyGoals, h)),
                    [1, 2].map(h => aggregateHalf(prevMonthly, h))
                );
            case 'yearly':
                return buildData(
                    [`${selectedYear}년 합계`],
                    [aggregateYear(targetMonthly)],
                    [aggregateYear(targetMonthlyGoals)],
                    [aggregateYear(prevMonthly)]
                );
            default:
                return { baseLabels: [], data: [], rates: [] };
        }
    }, [divData, prevYearDivData, periodType, selectedYear, divisionInfo, selectedSubDiv, selectedTotalMonth, showTarget, showYoY]);

    const { baseLabels: periodLabels, data: periodData, rates: periodRates } = getPeriodData();

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
    const handleSaveData = async (month: number, data: Record<string, number>, exchangeRate: number, dataType: 'actual' | 'target' | 'prevYear' = 'actual', manualOverrides?: Set<string>) => {
        if (!store) return;

        // 🔧 깊은 복사: React가 상태 변경을 감지하도록 divisions 배열 및 대상 division 객체를 새 참조로 교체
        let newStore = {
            ...store,
            divisions: store.divisions.map(d => ({
                ...d,
                monthly: { ...d.monthly },
                targetMonthly: { ...(d.targetMonthly || {}) },
                exchangeRates: { ...d.exchangeRates },
                subDivMonthly: d.subDivMonthly ? Object.fromEntries(
                    Object.entries(d.subDivMonthly).map(([k, v]) => [k, { ...v }])
                ) : undefined,
                subDivTargetMonthly: d.subDivTargetMonthly ? Object.fromEntries(
                    Object.entries(d.subDivTargetMonthly).map(([k, v]) => [k, { ...v }])
                ) : undefined,
            })),
        };
        const targetYear = dataType === 'prevYear' ? selectedYear - 1 : selectedYear;

        let divIdx = newStore.divisions.findIndex(
            d => d.divisionCode === selectedDivision && d.year === targetYear
        );

        // 연도 데이터가 없으면 새로 생성
        if (divIdx < 0) {
            newStore.divisions.push({
                divisionCode: selectedDivision,
                year: targetYear,
                exchangeRates: { [month]: { actual: exchangeRate, target: exchangeRate, prev: exchangeRate } },
                monthly: {},
                targetMonthly: {},
                subDivMonthly: {},
                subDivTargetMonthly: {},
            });
            divIdx = newStore.divisions.length - 1;
        }

        const divDataToUpdate = newStore.divisions[divIdx];
        const plData = { ...createEmptyPLData(), ...data };

        // 데이터에 manualOverrides가 포함되어 있다면 Set으로 변환하여 calculateDerivedFields에 전달
        const effectiveOverrides = manualOverrides || (data.manualOverrides ? new Set(data.manualOverrides as any as string[]) : undefined);

        const isSubDiv = divisionInfo.subDivisionMode === 'tabs' && selectedSubDiv !== 'all';

        if (isSubDiv) {
            if (dataType === 'target') {
                if (!divDataToUpdate.subDivTargetMonthly) divDataToUpdate.subDivTargetMonthly = {};
                if (!divDataToUpdate.subDivTargetMonthly[selectedSubDiv]) divDataToUpdate.subDivTargetMonthly[selectedSubDiv] = {};
                divDataToUpdate.subDivTargetMonthly[selectedSubDiv][month] = calculateDerivedFields(plData, true, effectiveOverrides);

                // 베트남 전체(all) 타겟 합산 재계산 로직
                const totalTarget = createEmptyPLData();
                let hasData = false;
                divisionInfo.subDivisions?.forEach(sub => {
                    if (sub.key === 'all') return;
                    const subData = divDataToUpdate.subDivTargetMonthly?.[sub.key]?.[month];
                    if (subData) {
                        hasData = true;
                        Object.entries(plData).forEach(([k]) => {
                            // 금액/카운트 항목만 단순 합산 (ALL_ITEMS_MAP이 Dashboard에 없으므로 대략적으로 합산)
                            const val = subData[k];
                            if (typeof val === 'number' && !k.toLowerCase().includes('ratio') && k !== 'materialDiff' && k !== 'revenuePerHead') {
                                totalTarget[k] = (totalTarget[k] || 0) + val;
                            }
                        });
                    }
                });
                if (hasData) {
                    if (!divDataToUpdate.targetMonthly) divDataToUpdate.targetMonthly = {};
                    divDataToUpdate.targetMonthly[month] = calculateDerivedFields(totalTarget, false);
                }
            } else {
                // actual or prevYear
                if (!divDataToUpdate.subDivMonthly) divDataToUpdate.subDivMonthly = {};
                if (!divDataToUpdate.subDivMonthly[selectedSubDiv]) divDataToUpdate.subDivMonthly[selectedSubDiv] = {};
                divDataToUpdate.subDivMonthly[selectedSubDiv][month] = calculateDerivedFields(plData, true, effectiveOverrides);

                // 베트남 전체(all) 실적 합산 재계산 로직
                const totalActual = createEmptyPLData();
                let hasData = false;
                divisionInfo.subDivisions?.forEach(sub => {
                    if (sub.key === 'all') return;
                    const subData = divDataToUpdate.subDivMonthly?.[sub.key]?.[month];
                    if (subData) {
                        hasData = true;
                        Object.entries(plData).forEach(([k]) => {
                            const val = subData[k];
                            if (typeof val === 'number' && !k.toLowerCase().includes('ratio') && k !== 'materialDiff' && k !== 'revenuePerHead') {
                                totalActual[k] = (totalActual[k] || 0) + val;
                            }
                        });
                    }
                });
                if (hasData) {
                    if (!divDataToUpdate.monthly) divDataToUpdate.monthly = {};
                    divDataToUpdate.monthly[month] = calculateDerivedFields(totalActual, false);
                }
            }
        } else {
            if (dataType === 'target') {
                if (!divDataToUpdate.targetMonthly) divDataToUpdate.targetMonthly = {};
                divDataToUpdate.targetMonthly[month] = calculateDerivedFields(plData, true, effectiveOverrides);
            } else {
                // actual or prevYear — manualOverrides 전달로 사용자 수정값 보존
                if (!divDataToUpdate.monthly) divDataToUpdate.monthly = {};
                divDataToUpdate.monthly[month] = calculateDerivedFields(plData, true, effectiveOverrides);
            }
        }

        // 환율 개별 업데이트 (원래 값을 유지하면서, 현재 수정 중인 데이터 타입의 환율만 업데이트)
        if (!divDataToUpdate.exchangeRates) divDataToUpdate.exchangeRates = {};
        const existingRates = divDataToUpdate.exchangeRates[month] || { actual: 1, target: 1, prev: 1 };
        divDataToUpdate.exchangeRates[month] = {
            ...existingRates,
            [dataType === 'prevYear' ? 'actual' : dataType]: exchangeRate
        };

        newStore.lastUpdated = new Date().toISOString();

        const success = await saveData(newStore);
        if (!success) {
            setSyncError('클라우드 DB 서버 연결 실패!\n입력하신 데이터는 로컬 컴퓨터에만 임시 저장되었습니다.');
        } else {
            setSyncError(null);
        }

        setStore(newStore);
        setShowInputModal(false);
    };

    // 데이터 입력 버튼
    const handleEditMonth = (month: number, dataType: 'actual' | 'target' | 'prevYear' = 'actual') => {
        setEditMonth(month);
        setEditDataType(dataType);
        setShowInputModal(true);
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-12 max-w-[1920px] mx-auto bg-[#fafafa]">
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
                        </div>
                    </div>
                </div>
            </header>

            {/* ===== 메인 뷰 스위처 ===== */}
            <div className="flex items-center gap-4 flex-wrap mb-6">
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
                    <div className="mb-6">
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
                    <div className="mb-6">
                        <YearlyTargetCards store={store} year={selectedYear} />
                    </div>

                    {/* 3. 하단 1: 각 사업부별 월별 실적 트렌드 그래고 */}
                    <div className="mb-10">
                        <DivisionTrendCharts store={store} year={selectedYear} />
                    </div>

                    {/* 4. 하단 2: 전사 통합 월별 실적 트렌드 차트 */}
                    <div>
                        <h2 className="text-[22px] font-extrabold mb-10 flex items-center gap-3 text-slate-800 tracking-tight">
                            <TrendingUp className="text-emerald-500 w-7 h-7" />
                            전사 월별 실적 트렌드
                        </h2>
                        <div className="glass-card p-4 sm:p-6 shadow-sm border border-gray-100">
                            <Charts
                                divData={consolidateAllDivisions(store, selectedYear)}
                                prevYearData={consolidateAllDivisions(store, selectedYear - 1)}
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

                            {/* ===== 비용 구조 추이 차트 ===== */}
                            <div className="mt-6 mb-4">
                                <Charts
                                    divData={divData}
                                    prevYearData={prevYearDivData ?? undefined}
                                    divisionInfo={divisionInfo}
                                    year={selectedYear}
                                />
                            </div>

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

                            {/* ===== P&L 테이블 ===== */}
                            <div className="glass-card p-4 sm:p-6 md:p-8 mb-10 animate-fade-in">
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
                                    <span className="text-xs font-semibold px-3 py-1 bg-gray-200 rounded-full" style={{ color: 'var(--text-primary)' }}>
                                        (단위: {divisionInfo.currency === 'KRW' ? '백만원' : divisionInfo.currency === 'MXN' ? `천 ${divisionInfo.currency}` : `백만 ${divisionInfo.currency} `})
                                    </span>
                                </div>

                                {/* 서브 디비전 프리미엄 탭 */}
                                {divisionInfo.subDivisions && divisionInfo.subDivisionMode === 'tabs' && (
                                    <div className="premium-tabs-container mb-6 mt-2">
                                        {divisionInfo.subDivisions.map(sub => (
                                            <button
                                                key={sub.key}
                                                onClick={() => setSelectedSubDiv(sub.key)}
                                                className={`premium-tab-btn ${selectedSubDiv === sub.key ? 'active' : ''}`}
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
                                    onEditMonth={(periodType === 'monthly' && divisionInfo.subDivisionMode !== 'columns') ? handleEditMonth : undefined}
                                    showTarget={showTarget}
                                    showYoY={showYoY}
                                />
                            </div>

                            {/* 
                            ===== 차트 ===== 
                            <div className="mt-12">
                                <Charts divData={divData} divisionInfo={divisionInfo} year={selectedYear} />
                            </div>
                            */}
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
