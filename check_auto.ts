import * as fs from 'fs';

const store = JSON.parse(fs.readFileSync('supabase_mexico_all_years.json', 'utf8'));
const mx2026 = store.find((d: any) => d.year === 2026);

console.log('Automotive 1월 OP:', mx2026.subDivMonthly.automotive['1'].operatingProfit);
console.log('Automotive 1월 NonOp:', mx2026.subDivMonthly.automotive['1'].nonOpBalance);
console.log('Automotive 1월 EBT:', mx2026.subDivMonthly.automotive['1'].ebt);

['homeAppliance', 'automotive'].forEach(subKey => {
    [1, 2, 3].forEach(m => {
        const subData = mx2026.subDivMonthly?.[subKey]?.[m];
        if (subData) {
            let op = subData.operatingProfit || 0;
            let nonOp = subData.nonOpBalance || 0;
            if (nonOp > 0) nonOp = -nonOp; // Apply flipSignIfPositive
            let ebt = op + nonOp;
            console.log(`Month ${m} ${subKey} local EBT (migrated):`, ebt, `=> in KRW with 82:`, ebt * 82 / 1000000, `=> in KRW with 72.74:`, ebt * 72.74 / 1000000);
        }
    });
});
