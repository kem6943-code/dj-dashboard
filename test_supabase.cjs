const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pzeigdohowsdkhrflbsm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_g_vNlDSq8zOFqyuWR1zrLQ_QNT3cwDZ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing Supabase Insert ...');
    const { data, error } = await supabase
        .from('dashboard_data')
        .upsert({
            id: 1,
            content: { test: 'hello world from node script', ts: new Date().toISOString() },
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

    if (error) {
        console.error('Failed to Insert:', error);
    } else {
        console.log('Insert Success:', data);
        
        // Fetch to verify
        const { data: fetch, error: err2 } = await supabase.from('dashboard_data').select('*');
        if (err2) {
             console.error('Failed to Select:', err2);
        } else {
             console.log('Select Result length:', fetch.length);
             console.log('Row:', fetch[0]);
        }
    }
}

testConnection();
