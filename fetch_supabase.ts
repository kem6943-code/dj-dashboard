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
    const mx = store.divisions.find(d => d.divisionCode === 'mexico');
    
    fs.writeFileSync('supabase_mexico_dump.json', JSON.stringify(mx, null, 2));
    console.log("Successfully dumped mexico division to supabase_mexico_dump.json");
    
    // Quick extract
    console.log("\n--- MONTH 1 ACTUAL ---");
    console.log("HomeAppliance OP:", mx.subDivMonthly?.homeAppliance?.[1]?.operatingProfit);
    console.log("Automotive OP:", mx.subDivMonthly?.automotive?.[1]?.operatingProfit);
    console.log("All (Total) OP:", mx.monthly?.[1]?.operatingProfit);
    
    console.log("\n--- MONTH 2 ACTUAL ---");
    console.log("HomeAppliance OP:", mx.subDivMonthly?.homeAppliance?.[2]?.operatingProfit);
    console.log("Automotive OP:", mx.subDivMonthly?.automotive?.[2]?.operatingProfit);
    console.log("All (Total) OP:", mx.monthly?.[2]?.operatingProfit);
}

run();
