const fs = require('fs');
const file = 'c:/Users/김윤주/.gemini/antigravity/scratch/notebooklm/dashboard/src/components/Dashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `        );
    }
                    {/* 1. 상단: 전사 통합 YTD 요약 (KPI 카드) */}`;

const injectedStr = `        );
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

                {/* 하단 유저/로그아웃 영역 */}
                <div className="p-6 border-t border-slate-800 mt-auto">
                    <label className="block text-xs text-slate-500 mb-2 px-1">조회 연도</label>
                    <select
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-6 p-2.5 shadow-sm font-medium outline-none"
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                    >
                        <option value={2025}>2025년</option>
                        <option value={2026}>2026년</option>
                    </select>
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

                    {/* 1. 상단: 전사 통합 YTD 요약 (KPI 카드) */}`;

code = code.replace(targetStr, injectedStr);

const targetBottomStr = `            )}
        </div>
    );
}`;

const injectedBottomStr = `            )}
                </div>
            </main>
        </div>
    );
}`;

code = code.replace(targetBottomStr, injectedBottomStr);

fs.writeFileSync(file, code);
console.log('Fixed Dashboard wrapper successfully.');
