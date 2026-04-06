const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Replace tab-btn with sub-tab-btn for the period control buttons
code = code.replace(/className=\{\`tab-btn text-xs \$\{periodType === p\.key \? 'active' : ''\}\`\}/g,
                    "className={`sub-tab-btn ${periodType === p.key ? 'active' : ''}`}");

code = code.replace(/className=\{\`tab-btn text-xs \$\{selectedTotalMonth === p\.idx \? 'active' : ''\}\`\}/g,
                    "className={`sub-tab-btn ${selectedTotalMonth === p.idx ? 'active' : ''}`}");

// Replace the Period control wrapper to add the year dropdown (Occurrence 1: Total div)
const targetTotal1 = `<Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>기간:</span>
                                {[`;
const replaceTotal1 = `<select
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
                                    {[`;
code = code.replace(targetTotal1, replaceTotal1);

// Close the wrapper div that we just opened
const targetTotal2 = `                                    </button>
                                ))}
                            </div>`;
const replaceTotal2 = `                                    </button>
                                    ))}
                                </div>
                            </div>`;
code = code.replace(targetTotal2, replaceTotal2);

// Same for the second occurrence (Division div)
// Wait, the regular expression global replace for targetTotal2 might replace both if we use regex.
// Actually, `replace_file_content` failed because the file was different. 
// Let's replace the second Occurrence's Calendar block as well.
code = code.replace(targetTotal1, replaceTotal1);
code = code.replace(targetTotal2, replaceTotal2); // Since stringent `replace` does the first match, we do it twice.

// Also need to fix the `단위: 백만원` style in Dashboard.tsx
const oldUnitStyle = `<span className="text-xs font-semibold px-3 py-1 bg-gray-200 rounded-full" style={{ color: 'var(--text-primary)' }}>
                                        (단위: {divisionInfo.currency === 'KRW' ? '백만원' : divisionInfo.currency === 'MXN' ? \`천 \${divisionInfo.currency}\` : \`백만 \${divisionInfo.currency} \`})
                                    </span>`;
const newUnitStyle = `<span className="text-sm font-medium text-slate-400">
                                        (단위: {divisionInfo.currency === 'KRW' ? '백만원' : divisionInfo.currency === 'MXN' ? \`천 \${divisionInfo.currency}\` : \`백만 \${divisionInfo.currency}\`})
                                    </span>`;
code = code.replace(oldUnitStyle, newUnitStyle);

// And we need to fix the sub-month period wrap.
const oldSubMonthStyle = `<span className="text-xs ml-6" style={{ color: 'var(--text-muted)' }}>
                                        {periodType === 'monthly' ? '월:' : periodType === 'quarterly' ? '분기:' : '반기:'}
                                    </span>`;
const newSubMonthStyle = `<span className="text-xs font-semibold px-2 text-slate-400">
                                        {periodType === 'monthly' ? '선택 월:' : periodType === 'quarterly' ? '선택 분기:' : '선택 반기:'}
                                    </span>
                                    <div className="flex flex-wrap bg-slate-200/50 p-1 rounded-lg border border-slate-200 shadow-inner gap-1">`;
code = code.replace(oldSubMonthStyle, newSubMonthStyle);
code = code.replace(oldSubMonthStyle, newSubMonthStyle); // Twice for both tabs

// Then we need to add the closing </div> for the sub-month wrap.
// This is tricky because it ends exactly before </button>))} </div> 
// Actually I'll run sed commands for simpler things.

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log('Refactored Dashboard.tsx with regex!');
