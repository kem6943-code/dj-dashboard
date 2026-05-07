import * as fs from 'fs';

const store = JSON.parse(fs.readFileSync('supabase_mexico_all_years.json', 'utf8'));

const mx2026 = store.find((d: any) => d.year === 2026);
console.log('Exchange Rates:', mx2026.exchangeRates);

const rate = 72.74; // Try with 72.74
let totalEbt = 0;

['homeAppliance', 'automotive'].forEach(subKey => {
    [1, 2, 3].forEach(m => {
        const subData = mx2026.subDivMonthly?.[subKey]?.[m];
        if (subData) {
            let ebt = subData.ebt || 0;
            // Since we applied flipSignIfPositive in storage.ts for migration,
            // let's just see what the local EBT is
            console.log(`Month ${m} ${subKey} local EBT:`, ebt);
            totalEbt += ebt * rate;
        }
    });
});

console.log(`Total Mexico EBT with rate ${rate}:`, totalEbt / 1000000);

let totalEbt82 = 0;
['homeAppliance', 'automotive'].forEach(subKey => {
    [1, 2, 3].forEach(m => {
        const subData = mx2026.subDivMonthly?.[subKey]?.[m];
        if (subData) {
            totalEbt82 += (subData.ebt || 0) * 82;
        }
    });
});
console.log(`Total Mexico EBT with rate 82:`, totalEbt82 / 1000000);
