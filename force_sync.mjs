import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cojxzblihtpdbgmszyrc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvanh6YmxpaHRwZGJnbXN6eXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjkzNjEsImV4cCI6MjA4Nzc0NTM2MX0.5CHByqfPf-m3deSyUQYIKIZDp-NdLWjHiCgL8VkzSOw';

const supabase = createClient(supabaseUrl, supabaseKey);
const DOCUMENT_ID = 1;

async function forceSync() {
    console.log("1. Fetching current cloud data...");
    const { data, error } = await supabase
        .from('dashboard_data')
        .select('content')
        .eq('id', DOCUMENT_ID)
        .single();

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    let store = data.content;

    console.log("2. Applying v16 migration (KRW targets)...");

    const targets = {
        changwon: { revenue: 110500000000, operatingProfit: 2500000000 },
        vietnam: { revenue: 55000000000, operatingProfit: 7500000000 },
        thailand: { revenue: 91916000000, operatingProfit: 2507000000 },
        mexico: { revenue: 6797000000, operatingProfit: 2497000000 }
    };

    if (store && store.divisions) {
        store.divisions.forEach(div => {
            if (div.year === 2026 && targets[div.divisionCode]) {
                div.yearlyTarget = targets[div.divisionCode];
            }
        });
        store._migrated_v16 = true;

        console.log("3. Syncing updated data to cloud...");
        const { error: upsertError } = await supabase
            .from('dashboard_data')
            .upsert({
                id: DOCUMENT_ID,
                content: store,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (upsertError) {
            console.error("Upsert error:", upsertError);
        } else {
            console.log("SUCCESS: Cloud data updated!");
        }
    } else {
        console.log("No divisions found in store.");
    }
}

forceSync();
