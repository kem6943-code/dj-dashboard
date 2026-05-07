import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzeigdohowsdkhrflbsm.supabase.co';
const supabaseKey = 'sb_publishable_g_vNlDSq8zOFqyuWR1zrLQ_QNT3cwDZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('dashboard_data').select('content').eq('id', 1).single();
    if (error) return console.error(error);
    
    let store = data.content;
    
    const mx = store.divisions.find((d: any) => d.divisionCode === 'mexico' && d.year === 2026);
    if (mx && mx.subDivMonthly && mx.subDivMonthly.automotive) {
        const m3 = mx.subDivMonthly.automotive[3];
        if (m3.nonOpBalance && m3.nonOpBalance < 0) {
            console.log('Restoring Month 3 Automotive nonOpBalance from', m3.nonOpBalance, 'to', Math.abs(m3.nonOpBalance));
            m3.nonOpBalance = Math.abs(m3.nonOpBalance);
            
            const op = m3.operatingProfit || 0;
            const inc = m3.nonOpIncome || 0;
            const exp = m3.nonOpExpense || 0;
            const bal = m3.nonOpBalance || 0;
            const fin = m3.financeCost || 0;
            m3.ebt = op + inc - exp + bal + fin;
            
            if (m3.manualOverrides) {
                m3.manualOverrides = m3.manualOverrides.filter((k: string) => k !== 'nonOpBalance');
            }
        }
    }
    
    store.lastUpdated = new Date().toISOString();
    
    const { error: updateError } = await supabase.from('dashboard_data').update({ content: store }).eq('id', 1);
    if (updateError) {
        console.error('Update failed:', updateError);
    } else {
        console.log('DB update successful!');
    }
}
run();
