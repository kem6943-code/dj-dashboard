import * as fs from 'fs';

const store = JSON.parse(fs.readFileSync('supabase_mexico_all_years.json', 'utf8'));
const mx2026 = store.find((d: any) => d.year === 2026);
const m3 = mx2026.subDivMonthly.automotive['3'];

console.log('Automotive 3월 OP:', m3.operatingProfit);
console.log('Automotive 3월 NonOp:', m3.nonOpBalance);
console.log('Automotive 3월 EBT (migrated):', m3.operatingProfit + (m3.nonOpBalance > 0 ? -m3.nonOpBalance : m3.nonOpBalance));
console.log('Automotive 3월 EBT in KRW (rate 82):', (m3.operatingProfit + (m3.nonOpBalance > 0 ? -m3.nonOpBalance : m3.nonOpBalance)) * 82 / 1000000);
