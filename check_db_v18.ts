import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzeigdohowsdkhrflbsm.supabase.co';
const supabaseKey = 'sb_publishable_g_vNlDSq8zOFqyuWR1zrLQ_QNT3cwDZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('dashboard_data').select('content').eq('id', 1).single();
    if (error) return console.error(error);
    
    let store = data.content;
    let modified = false;

    store.divisions.forEach((div: any) => {
        if (div.divisionCode === 'mexico') {
            [1, 2, 3].forEach(m => {
                if (div.subDivMonthly?.automotive?.[m]) {
                    const am = div.subDivMonthly.automotive[m];
                    // 만약 v18에 의해 강제로 음수가 되었고, manualOverrides에 nonOpBalance가 있다면!
                    // Wait, 자동차 부문의 원래 nonOpBalance가 양수였는지 음수였는지 어떻게 아나?
                    // 1월: 원래 음수 (-1,835,046)
                    // 2월: 원래 양수 (2.5M) 였나?
                    // 3월: 원래 양수 (1,616,442) 였나?
                    // Let's just print them out first!
                    console.log(`Month ${m} Automotive NonOp:`, am.nonOpBalance, am.manualOverrides);
                }
            });
        }
    });
}
run();
