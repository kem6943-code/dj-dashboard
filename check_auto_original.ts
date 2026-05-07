import * as fs from 'fs';

const store = JSON.parse(fs.readFileSync('supabase_mexico_all_years.json', 'utf8'));
const mx2026 = store.find((d: any) => d.year === 2026);
const auto = mx2026.subDivMonthly.automotive;

console.log('Month 1 NonOp:', auto['1'].nonOpBalance);
console.log('Month 2 NonOp:', auto['2'].nonOpBalance);
console.log('Month 3 NonOp:', auto['3'].nonOpBalance);
