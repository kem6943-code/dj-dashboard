import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cojxzblihtpdbgmszyrc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvanh6YmxpaHRwZGJnbXN6eXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjkzNjEsImV4cCI6MjA4Nzc0NTM2MX0.5CHByqfPf-m3deSyUQYIKIZDp-NdLWjHiCgL8VkzSOw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('dashboard_data').select('content').eq('id', 1).single();
    if (error) { console.error(error); return; }
    
    const store = data.content;
    const mx = store.divisions.find((d: any) => d.divisionCode === 'mexico');
    
    if (mx && mx.subDivMonthly) {
        for (let month of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
            // Actual
            if (mx.subDivMonthly.homeAppliance?.[month] || mx.subDivMonthly.automotive?.[month]) {
                const totalActual: any = {};
                let manualOverrides = new Set<string>();
                
                ['homeAppliance', 'automotive'].forEach(k => {
                    const sub = mx.subDivMonthly[k]?.[month];
                    if (sub) {
                        // calculate fallback matCost if missing
                        if (!sub.materialCost && sub.revenue > 0 && sub.materialRatio > 0) {
                            sub.materialCost = (sub.revenue * sub.materialRatio) / 100;
                        }
                        
                        Object.entries(sub).forEach(([key, val]) => {
                            if (typeof val === 'number' && !key.toLowerCase().includes('ratio') && key !== 'materialDiff' && key !== 'revenuePerHead') {
                                totalActual[key] = (totalActual[key] || 0) + val;
                            }
                        });
                        
                        if (sub.manualOverrides) {
                            sub.manualOverrides.forEach((m: string) => manualOverrides.add(m));
                        }
                    }
                });
                
                totalActual.manualOverrides = Array.from(manualOverrides);
                
                // Emulate calculateDerivedFields
                totalActual.operatingProfitRatio = totalActual.operatingProfit / totalActual.revenue * 100 || 0;
                totalActual.ebtRatio = totalActual.ebt / totalActual.revenue * 100 || 0;
                totalActual.materialRatio = totalActual.materialCost / totalActual.revenue * 100 || 0;
                
                mx.monthly[month] = totalActual;
            }
            
            // Target
            if (mx.subDivTargetMonthly?.homeAppliance?.[month] || mx.subDivTargetMonthly?.automotive?.[month]) {
                const totalTarget: any = {};
                let manualOverrides = new Set<string>();
                
                ['homeAppliance', 'automotive'].forEach(k => {
                    const sub = mx.subDivTargetMonthly[k]?.[month];
                    if (sub) {
                        if (!sub.materialCost && sub.revenue > 0 && sub.materialRatio > 0) {
                            sub.materialCost = (sub.revenue * sub.materialRatio) / 100;
                        }
                        Object.entries(sub).forEach(([key, val]) => {
                            if (typeof val === 'number' && !key.toLowerCase().includes('ratio') && key !== 'materialDiff' && key !== 'revenuePerHead') {
                                totalTarget[key] = (totalTarget[key] || 0) + val;
                            }
                        });
                        if (sub.manualOverrides) {
                            sub.manualOverrides.forEach((m: string) => manualOverrides.add(m));
                        }
                    }
                });
                
                totalTarget.manualOverrides = Array.from(manualOverrides);
                totalTarget.operatingProfitRatio = totalTarget.operatingProfit / totalTarget.revenue * 100 || 0;
                totalTarget.ebtRatio = totalTarget.ebt / totalTarget.revenue * 100 || 0;
                totalTarget.materialRatio = totalTarget.materialCost / totalTarget.revenue * 100 || 0;
                
                if (!mx.targetMonthly) mx.targetMonthly = {};
                mx.targetMonthly[month] = totalTarget;
            }
        }
    }
    
    // Also repair vietnam
    const vn = store.divisions.find((d: any) => d.divisionCode === 'vietnam');
    if (vn && vn.subDivMonthly) {
        for (let month of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
            if (vn.subDivMonthly.prod1?.[month]) {
                const totalActual: any = {};
                let manualOverrides = new Set<string>();
                ['prod1', 'prod2', 'prod3'].forEach(k => {
                    const sub = vn.subDivMonthly[k]?.[month];
                    if (sub) {
                        Object.entries(sub).forEach(([key, val]) => {
                            if (typeof val === 'number' && !key.toLowerCase().includes('ratio') && key !== 'materialDiff' && key !== 'revenuePerHead') {
                                totalActual[key] = (totalActual[key] || 0) + val;
                            }
                        });
                        if (sub.manualOverrides) {
                            sub.manualOverrides.forEach((m: string) => manualOverrides.add(m));
                        }
                    }
                });
                totalActual.manualOverrides = Array.from(manualOverrides);
                totalActual.operatingProfitRatio = totalActual.operatingProfit / totalActual.revenue * 100 || 0;
                if (!vn.monthly) vn.monthly = {};
                vn.monthly[month] = totalActual;
            }
        }
    }
    
    const { error: upErr } = await supabase.from('dashboard_data').upsert({ id: 1, content: store, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (upErr) console.error("Update failed", upErr);
    else console.log("Update SUCCESS for Supabase DB");
}
run();
