import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzeigdohowsdkhrflbsm.supabase.co';
const supabaseKey = 'sb_publishable_g_vNlDSq8zOFqyuWR1zrLQ_QNT3cwDZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('dashboard_data').select('content').eq('id', 1).single();
    if (error) return console.error(error);
    
    let store = data.content;
    const div = store.divisions.find((d: any) => d.divisionCode === 'mexico' && d.year === 2026);
    
    [1, 2, 3].forEach(m => {
        const am = div.subDivMonthly.automotive[m];
        console.log(`Month ${m} Automotive OP:`, am.operatingProfit, 'NonOp:', am.nonOpBalance, 'EBT:', am.ebt);
    });
}
run();
