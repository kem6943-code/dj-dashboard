import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cojxzblihtpdbgmszyrc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvanh6YmxpaHRwZGJnbXN6eXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjkzNjEsImV4cCI6MjA4Nzc0NTM2MX0.5CHByqfPf-m3deSyUQYIKIZDp-NdLWjHiCgL8VkzSOw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: data1 } = await supabase.from('dashboard_data').select('id, content').eq('id', 1).single();
    const { data: dataG } = await supabase.from('dashboard_data').select('id, content').eq('id', 'global_dashboard_state').single();

    console.log("ID = 1 exists:", !!data1);
    if (data1) {
        console.log("ID 1 content keys:", Object.keys(data1.content));
        if (data1.content.divisions) {
            console.log("ID 1 divisions count:", data1.content.divisions.length);
            console.log("ID 1 division 0 keys:", Object.keys(data1.content.divisions[0] || {}));
            console.log("ID 1 division 0 monthly:", !!data1.content.divisions[0]?.monthly);
        }
    }

    console.log("ID = global_dashboard_state exists:", !!dataG);
    if (dataG) {
        console.log("ID global content keys:", Object.keys(dataG.content));
        if (dataG.content.divisions) {
            console.log("ID global divisions count:", dataG.content.divisions.length);
        }
    }
}
checkData();
