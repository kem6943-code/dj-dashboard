import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://cojxzblihtpdbgmszyrc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvanh6YmxpaHRwZGJnbXN6eXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjkzNjEsImV4cCI6MjA4Nzc0NTM2MX0.5CHByqfPf-m3deSyUQYIKIZDp-NdLWjHiCgL8VkzSOw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase
        .from('dashboard_data')
        .select('content')
        .eq('id', 1)
        .single();
    
    if (error) {
        console.error(error);
        return;
    }
    
    const store = data.content;
    const mxDivs = store.divisions.filter(d => d.divisionCode === 'mexico');
    
    fs.writeFileSync('supabase_mexico_all_years.json', JSON.stringify(mxDivs, null, 2));
    console.log("Dumped", mxDivs.length, "years for mexico.");
    mxDivs.forEach(d => console.log(d.year));
}

run();
