const fs = require('fs');

const file = 'src/components/Dashboard.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');
const head = lines.slice(0, 418); // everything perfectly up to the start of "initialData=" ternary body
const tail = [
"                                        : editDataType === 'target'",
"                                            ? (isSubDiv ? divData?.subDivTargetMonthly?.[selectedSubDiv]?.[editMonth] : divData?.targetMonthly?.[editMonth])",
"                                            : (isSubDiv ? divData?.subDivMonthly?.[selectedSubDiv]?.[editMonth] : divData?.monthly?.[editMonth])",
"                                }",
"                                initialRate={",
"                                    editDataType === 'prevYear'",
"                                        ? (prevYearDivData?.exchangeRates?.[editMonth]?.actual !== 1 && prevYearDivData?.exchangeRates?.[editMonth]?.actual !== undefined) ",
"                                            ? prevYearDivData?.exchangeRates?.[editMonth]?.actual ",
"                                            : prevYearDivData?.exchangeRates?.[editMonth]?.prev",
"                                        : editDataType === 'target'",
"                                            ? divData?.exchangeRates?.[editMonth]?.target",
"                                            : divData?.exchangeRates?.[editMonth]?.actual",
"                                }",
"                                onSave={(month, data, rate, type) => handleSaveData(month, data, rate, type)}",
"                                onClose={() => setShowInputModal(false)}",
"                            />",
"                        );",
"                    })()}",
"                </div>",
"            )}",
"                </div>",
"            </main>",
"",
"            {/* 클라우드 동기화 실패 에러 토스트 */}",
"            {syncError && (",
"                <div className=\"fixed bottom-6 right-6 z-[100] animate-fade-in flex items-start gap-4 bg-red-50 border border-red-200 text-red-700 px-5 py-5 rounded-2xl shadow-2xl max-w-sm\" style={{ boxShadow: '0 10px 40px rgba(239,68,68,0.2)' }}>",
"                    <div className=\"flex-shrink-0 mt-0.5\">",
"                        <div className=\"w-10 h-10 bg-red-100/80 rounded-full flex items-center justify-center border border-red-200\">",
"                            <span className=\"text-red-500 font-extrabold text-lg\">!</span>",
"                        </div>",
"                    </div>",
"                    <div className=\"flex-1\">",
"                        <h4 className=\"font-bold text-[15px] mb-1 text-red-900 tracking-tight\">🚨 클라우드 동기화 경고</h4>",
"                        <p className=\"text-[13px] text-red-800 leading-relaxed opacity-90 whitespace-pre-line\">{syncError}</p>",
"                        <p className=\"text-[11px] text-red-700/80 mt-2 font-medium\">Supabase 프로젝트가 일시 중지되었는지 확인해주세요.</p>",
"                    </div>",
"                    <button onClick={() => setSyncError(null)} className=\"p-1 hover:bg-red-100 rounded-full transition-colors self-start opacity-70 hover:opacity-100 -mr-1 -mt-1\">",
"                        <span className=\"text-2xl leading-none block w-6 h-6 text-center text-red-500\">&times;</span>",
"                    </button>",
"                </div>",
"            )}",
"        </div>",
"    );",
"}"
];

fs.writeFileSync(file, [...head, ...tail].join('\n'));
console.log('Fixed Dashboard successfully.');
