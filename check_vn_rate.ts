import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzeigdohowsdkhrflbsm.supabase.co';
const supabaseKey = 'sb_publishable_g_vNlDSq8zOFqyuWR1zrLQ_QNT3cwDZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('dashboard_data').select('content').eq('id', 1).single();
    if (error) return console.error(error);
    
    let store = data.content;
    const vn = store.divisions.find((d: any) => d.divisionCode === 'vietnam' && d.year === 2026);
    console.log(vn?.exchangeRates);
}
run();
