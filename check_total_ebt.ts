import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzeigdohowsdkhrflbsm.supabase.co';
const supabaseKey = 'sb_publishable_g_vNlDSq8zOFqyuWR1zrLQ_QNT3cwDZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('dashboard_data').select('content').eq('id', 1).single();
    if (error) return console.error(error);
    
    const store = data.content;
    const divs = store.divisions.filter(d => d.year === 2026);
    
    let totalEbt = 0;
    
    const rateMXN = 72.74; // Try 72.74
    // or 82? Let's print both.

    for (const r of [82, 72.74]) {
        let sum = 0;
        divs.forEach(div => {
            let divEbt = 0;
            [1, 2, 3].forEach(m => {
                const act = div.monthly?.[m];
                if (act) {
                    let rate = div.currency === 'KRW' ? 1 : (div.exchangeRates?.[m]?.actual || 1);
                    if (div.divisionCode === 'mexico') rate = r;
                    
                    let ebt = act.ebt || 0;
                    // Mocking v18 migration for mexico nonOpBalance if needed, 
                    // but the DB already has some data. Wait, usePeriodData uses DB data!
                    // If usePeriodData does not run migration, then DB data is what we see!
                    // In the actual app, migrations ARE run on load!
                    sum += ebt * rate;
                }
            });
            console.log(`Rate ${r} - ${div.divisionCode} EBT:`, sum);
        });
    }
}
run();
