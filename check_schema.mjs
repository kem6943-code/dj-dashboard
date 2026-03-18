import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cojxzblihtpdbgmszyrc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvanh6YmxpaHRwZGJnbXN6eXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjkzNjEsImV4cCI6MjA4Nzc0NTM2MX0.5CHByqfPf-m3deSyUQYIKIZDp-NdLWjHiCgL8VkzSOw';

const supabase = createClient(supabaseUrl, supabaseKey);
const DOCUMENT_ID = 'global_dashboard_state';

async function checkSchema() {
    console.log("Checking columns in dashboard_data...");
    const { data, error } = await supabase
        .from('dashboard_data')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    console.log("Data sample:", Object.keys(data[0] || {}));
}

checkSchema();
