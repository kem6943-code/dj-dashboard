const fs = require('fs');
const file = 'c:/Users/김윤주/.gemini/antigravity/scratch/notebooklm/dashboard/src/components/Dashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Upgrade background container
code = code.replace(
  /<div className="min-h-screen p-12 max-w-\[1920px\] mx-auto bg-\[#fafafa\]" style=\{\{ padding: '48px', boxSizing: 'border-box' \}\}>/,
  `<div className="min-h-screen bg-slate-50 text-slate-800 pb-24 font-sans">`
);

// 2. Upgrade Header to premium Topbar
code = code.replace(
  /<header className="mb-16">/,
  `<header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] mb-10 px-6 lg:px-12 py-3">\n<div className="flex items-center justify-between max-w-[1920px] mx-auto w-full">`
);

// 3. Close the expanded Topbar div and add the main content wrapper
code = code.replace(
  /<\/header>/,
  `</div>\n</header>\n<main className="max-w-[1920px] mx-auto px-6 lg:px-12">`
);

// 4. Upgrade Tab Buttons
const btnTmplMain = 'className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300 tracking-wide flex items-center gap-2 ${activeView === \'main\' ? \'bg-slate-800 text-white shadow-md\' : \'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-sm\'}`}';
code = code.replace(/className={`tab-btn \$\{activeView === 'main' \? 'active' : ''\}`}/g, btnTmplMain);

const btnTmplDash = 'className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300 tracking-wide flex items-center gap-2 ${activeView === \'dashboard\' ? \'bg-slate-800 text-white shadow-md\' : \'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-sm\'}`}';
code = code.replace(/className={`tab-btn \$\{activeView === 'dashboard' \? 'active' : ''\}`}/g, btnTmplDash);

const btnTmplComp = 'className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300 tracking-wide flex items-center gap-2 ${activeView === \'comparison\' ? \'bg-slate-800 text-white shadow-md\' : \'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-sm\'}`}';
code = code.replace(/className={`tab-btn \$\{activeView === 'comparison' \? 'active' : ''\}`}/g, btnTmplComp);

// 5. Close the main tag at the very end right before the toast
code = code.replace(
  /\{\/\* ===== 클라우드 동기화 실패 에러 토스트 ===== \*\/\}/,
  `</main>\n            {/* ===== 클라우드 동기화 실패 에러 토스트 ===== */}`
);

// 6. Fix select field generic
code = code.replace(
  /className="select-field"/g,
  `className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 shadow-sm font-medium"`
);

fs.writeFileSync(file, code);
console.log("Dashboard UI Refactored successfully.");
