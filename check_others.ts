import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzeigdohowsdkhrflbsm.supabase.co';
const supabaseKey = 'sb_publishable_g_vNlDSq8zOFqyuWR1zrLQ_QNT3cwDZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('dashboard_data').select('content').eq('id', 1).single();
    if (error) return console.error(error);
    
    let store = data.content;
    for (const divCode of ['changwon', 'vietnam']) {
        const div = store.divisions.find((d: any) => d.divisionCode === divCode && d.year === 2026);
        let sum = 0;
        [1, 2, 3].forEach(m => {
            if (div.monthly?.[m]) {
                const ebt = div.monthly[m].ebt;
                const rate = div.currency === 'KRW' ? 1 : (div.exchangeRates?.[m]?.actual || 1);
                console.log(`${divCode} Month ${m} EBT: ${ebt}, Rate: ${rate}, KRW: ${ebt * rate}`);
                sum += ebt * rate;
            }
        });
        console.log(`Total ${divCode} EBT:`, sum);
    }
}
run();
