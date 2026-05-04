import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzeigdohowsdkhrflbsm.supabase.co';
const supabaseKey = 'sb_publishable_g_vNlDSq8zOFqyuWR1zrLQ_QNT3cwDZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('dashboard_data').select('content').eq('id', 1).single();
    if (error) { console.error(error); return; }
    
    const store = data.content;
    const cw = store.divisions.find((d: any) => d.divisionCode === 'changwon' && d.year === 2026);
    
    for (let i = 1; i <= 3; i++) {
        const m = cw.monthly[i];
        console.log(`\nMonth ${i}:`);
        console.log(`  Revenue: ${m.revenue}`);
        console.log(`  OpProfit: ${m.operatingProfit}`);
        console.log(`  Material: ${m.materialCost}`);
        console.log(`  Labor: ${m.laborCost}`);
        console.log(`  Overhead: ${m.overhead}`);
    }
}
run();
