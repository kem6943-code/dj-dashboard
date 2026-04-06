const fs = require('fs');
const file = 'c:/Users/김윤주/.gemini/antigravity/scratch/notebooklm/dashboard/src/components/Dashboard.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// 1. Replace the top imports. Lines 17-18 are:
// import { loadData, getDivisionData, saveData } from '../utils/storage';
// Wait, actually I will just find the import and replace it.
const importIdx = lines.findIndex(l => l.includes("import { loadData, getDivisionData, saveData }"));
if (importIdx !== -1) {
    lines.splice(importIdx, 1, 
        "import { useDashboardData } from '../hooks/useDashboardData';",
        "import { usePeriodData } from '../hooks/usePeriodData';"
    );
}

// 2. We need to delete from:
// `    const [store, setStore] = useState<DataStore | null>(null);`
// to
// `    // 데이터 입력 버튼`
// But we MUST KEEP the state variables above it (selectedDivision, selectedYear, etc.)
// Oh wait, `const [store, setStore]` is at line 41.
// State variables from selectedDivision to showYoY end at line 53.
// Loading and init are at line 54-72.
// Then divisionInfo, divData, etc. all the way to handleSaveData up to `// 데이터 입력 버튼`.
// It's safer to find exact keywords.

const startDel1 = lines.findIndex(l => l.includes('const [store, setStore] = useState<DataStore | null>(null);'));
const endDel1 = startDel1 + 1; // remove store
lines.splice(startDel1, endDel1 - startDel1);

const startDel2 = lines.findIndex(l => l.includes('const [loading, setLoading] = useState(true);'));
const endDel2 = lines.findIndex(l => l.includes('// 데이터 입력 버튼')) - 1; // right before handleEditMonth

if (startDel2 !== -1 && endDel2 !== -1 && endDel2 > startDel2) {
    lines.splice(startDel2, endDel2 - startDel2 + 1,
        "    const { store, loading, syncError, handleSaveData } = useDashboardData(selectedDivision, selectedYear);",
        "",
        "    const { ",
        "        divData, ",
        "        prevYearDivData, ",
        "        divisionInfo, ",
        "        periodLabels, ",
        "        periodData, ",
        "        periodRates ",
        "    } = usePeriodData({",
        "        store,",
        "        selectedDivision,",
        "        selectedYear,",
        "        periodType,",
        "        selectedSubDiv,",
        "        selectedTotalMonth,",
        "        showTarget,",
        "        showYoY",
        "    });",
        "",
        "    if (loading || !store) {",
        "        return (",
        "            <div className=\"min-h-screen flex items-center justify-center bg-gray-50\">",
        "                <div className=\"flex flex-col items-center gap-4\">",
        "                    <div className=\"w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin\"></div>",
        "                    <p className=\"text-gray-500 font-medium\">데이터를 불러오는 중입니다...</p>",
        "                </div>",
        "            </div>",
        "        );",
        "    }",
        ""
    );
}

fs.writeFileSync(file, lines.join('\n'));
console.log("Refactoring complete.");
