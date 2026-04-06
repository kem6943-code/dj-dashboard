const fs = require('fs');

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. .tab-btn -> .sub-tab-btn
code = code.replace(/className=\{\`tab-btn text-xs \$\{periodType === p\.key \? 'active' : ''\}\`\}/g,
                    "className={`sub-tab-btn ${periodType === p.key ? 'active' : ''}`}");

code = code.replace(/className=\{\`tab-btn text-xs \$\{selectedTotalMonth === p\.idx \? 'active' : ''\}\`\}/g,
                    "className={`sub-tab-btn ${selectedTotalMonth === p.idx ? 'active' : ''}`}");

// 2. Unit Text Standardization
code = code.replace(/<span className="text-xs font-semibold px-3 py-1 bg-gray-200 rounded-full" style=\{\{ color: 'var\(--text-primary\)' \}\}>/g,
                    '<span className="text-sm font-medium text-slate-400">');

// 3. Sub Month Label Standardization
code = code.replace(/<span className="text-xs ml-6" style=\{\{ color: 'var\(--text-muted\)' \}\}>\s*\{periodType === 'monthly' \? '월:' : periodType === 'quarterly' \? '분기:' : '반기:'\}\s*<\/span>\s*\{\(periodType === 'monthly'/g,
                    `<span className="text-xs font-semibold px-2 text-slate-400">\n                                        {periodType === 'monthly' ? '선택 월:' : periodType === 'quarterly' ? '선택 분기:' : '선택 반기:'}\n                                    </span>\n                                    <div className="flex flex-wrap bg-slate-200/50 p-1 rounded-lg border border-slate-200 shadow-inner gap-1">\n                                        {(periodType === 'monthly'`);

// 4. Inject Year Selector
code = code.replace(/<Calendar className="w-4 h-4" style=\{\{ color: 'var\(--text-muted\)' \}\} \/>\s*<span className="text-sm font-medium" style=\{\{ color: 'var\(--text-muted\)' \}\}>기간:<\/span>\s*\{\[/g,
                    `<select
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
                                    {[`);

code = code.replace(/<\/button>\s*\}\)\}\s*<\/div>\s*\{\/\* 세부/g,
                    `</button>\n                                    ))}\n                                </div>\n                            </div>\n\n                            {/* 세부`);

// The division specific Period selector closing wrapper
code = code.replace(/<\/button>\s*\}\)\}\s*<div className="w-px h-5 bg-gray-200 mx-2" \/>/g,
                    `</button>\n                                    ))}\n                                </div>\n\n                                <div className="w-px h-5 bg-gray-200 mx-2" />`);

// Close the injected divs for sub-month
code = code.replace(/<\/button>\s*\}\)\}\s*<\/div>\s*\)\}\s*<ConsolidatedTable/g,
                    `</button>\n                                        ))}\n                                    </div>\n                                </div>\n                            )}\n\n                            <ConsolidatedTable`);

// And the one attached to the view branch ends with </> or ) : (
code = code.replace(/<\/button>\s*\}\)\}\s*<\/div>\s*\)\}\s*<\/div>\s*<\/main>/g,
                    `</button>\n                                        ))}\n                                    </div>\n                                </div>\n                            )}\n                </div>\n            </main>`);


fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log('Done replacement');
