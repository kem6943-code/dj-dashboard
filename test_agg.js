import { DIVISIONS_WITH_TOTAL, calculateDerivedFields, createEmptyPLData, ALL_ITEMS_MAP } from './src/utils/dataModel.js';
import * as fs from 'fs';

async function testAggregate() {
    const env = fs.readFileSync('.env.local', 'utf8');
    let url = '', key = '';
    env.split('\n').forEach(line => {
        if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
        if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
    });

    const res = await fetch(`${url}/rest/v1/dashboard_data?select=*`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const records = await res.json();
    const divisionsData = records[0].content.divisions;

    const mexicoDiv = divisionsData.find(d => d.divisionCode === 'mexico' && d.year === 2026);
    
    // Simulate what storage.ts does:
    const fixEbt = (m) => {
        if (m) {
            m.ebt = Number(m.operatingProfit || 0) + Number(m.nonOpBalance || 0) - Number(m.financeCost || 0);
        }
    };
    Object.values(mexicoDiv.monthly).forEach(fixEbt);
    Object.values(mexicoDiv.subDivMonthly).forEach(sub => Object.values(sub).forEach(fixEbt));

    // Simulate usePeriodData aggregation for Mexico
    let totalAct = createEmptyPLData();
    let ebtSum = 0;
    
    for (let m = 1; m <= 3; m++) {
        const act = mexicoDiv.monthly[m];
        const rsAct = mexicoDiv.exchangeRates[m] || { actual: 1 };
        const rate = rsAct.actual;

        // Multiply by rate
        Object.keys(act).forEach(k => {
            const itemDef = ALL_ITEMS_MAP[k];
            if (itemDef?.type === 'ratio' || itemDef?.type === 'unit' || String(k).endsWith('Ratio') || k === 'revenuePerHead') {
                return;
            }
            if (typeof act[k] === 'number') {
                totalAct[k] = (totalAct[k] || 0) + act[k] * rate;
            }
        });
    }

    // Now calculateDerivedFields
    const finalData = calculateDerivedFields(totalAct, true);
    console.log(`Aggregated EBT for Mexico: ${Math.round(finalData.ebt / 1000000)} 백만 원`);
    console.log(`Aggregated OP for Mexico: ${Math.round(finalData.operatingProfit / 1000000)} 백만 원`);
    
    // Also try subDivisions aggregation
    console.log("\nSubDivisions Aggregation:");
    for (const subKey of Object.keys(mexicoDiv.subDivMonthly)) {
        let subAct = createEmptyPLData();
        for (let m = 1; m <= 3; m++) {
            const act = mexicoDiv.subDivMonthly[subKey][m];
            const rate = mexicoDiv.exchangeRates[m].actual;
            Object.keys(act).forEach(k => {
                const itemDef = ALL_ITEMS_MAP[k];
                if (itemDef?.type === 'ratio' || itemDef?.type === 'unit' || String(k).endsWith('Ratio') || k === 'revenuePerHead') return;
                if (typeof act[k] === 'number') subAct[k] = (subAct[k] || 0) + act[k] * rate;
            });
        }
        const subFinal = calculateDerivedFields(subAct, true);
        console.log(`${subKey} EBT: ${Math.round(subFinal.ebt / 1000000)} 백만 원`);
    }
}
testAggregate().catch(console.error);
