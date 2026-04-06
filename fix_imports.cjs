const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const imports = `import { useState } from 'react';
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

// 기간 타입`;
const rest = code.substring(code.indexOf('// 기간 타입') + '// 기간 타입'.length);
fs.writeFileSync('src/components/Dashboard.tsx', imports + rest);

let storageCode = fs.readFileSync('src/utils/storage.ts', 'utf8');
storageCode = storageCode.replace(`    ALL_ITEMS_MAP,`, '');
fs.writeFileSync('src/utils/storage.ts', storageCode);

console.log('Fixed imports successfully.');
