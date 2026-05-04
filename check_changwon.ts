import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzeigdohowsdkhrflbsm.supabase.co';
const supabaseKey = 'sb_publishable_g_vNlDSq8zOFqyuWR1zrLQ_QNT3cwDZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('dashboard_data').select('content').eq('id', 1).single();
    if (error) { console.error(error); return; }
    
    const store = data.content;
    const cw = store.divisions.find((d: any) => d.divisionCode === 'changwon' && d.year === 2026);
    
    if (!cw) { console.error("Changwon 2026 not found"); return; }
    
    let sumRevenue = 0;
    let sumOpProfit = 0;
    let sumMaterial = 0;
    let sumLabor = 0;
    let sumOverhead = 0;
    
    for (let i = 1; i <= 3; i++) {
        const m = cw.monthly[i];
        if (m) {
            sumRevenue += m.revenue || 0;
            sumOpProfit += m.operatingProfit || 0;
            sumMaterial += m.materialCost || 0;
            sumLabor += m.laborCost || 0;
            sumOverhead += m.overhead || 0;
        }
    }
    
    console.log("=== Changwon 2026 Q1 (Jan-Mar) YTD ===");
    console.log(`Revenue (매출액): ${sumRevenue.toLocaleString()} 원 (${(sumRevenue / 100000000).toFixed(2)} 억)`);
    console.log(`OpProfit (영업이익): ${sumOpProfit.toLocaleString()} 원 (${(sumOpProfit / 100000000).toFixed(2)} 억)`);
    console.log(`Material Cost (재료비): ${sumMaterial.toLocaleString()} 원 (${(sumMaterial / 100000000).toFixed(2)} 억)`);
    console.log(`Labor Cost (노무비): ${sumLabor.toLocaleString()} 원 (${(sumLabor / 100000000).toFixed(2)} 억)`);
    console.log(`Overhead (경비): ${sumOverhead.toLocaleString()} 원 (${(sumOverhead / 100000000).toFixed(2)} 억)`);
    
    // Also log the month 3 individual to check if we have data up to march
    console.log("\n=== 2026 Month 3 only ===");
    const m3 = cw.monthly[3];
    if (m3) {
        console.log(`Revenue: ${m3.revenue.toLocaleString()} 원`);
    } else {
        console.log("No data for March");
    }
}
run();
