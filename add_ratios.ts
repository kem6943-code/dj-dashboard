import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzeigdohowsdkhrflbsm.supabase.co';
const supabaseKey = 'sb_publishable_g_vNlDSq8zOFqyuWR1zrLQ_QNT3cwDZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching DB...");
    const { data, error } = await supabase.from('dashboard_data').select('content').eq('id', 1).single();
    if (error) {
        console.error("Fetch error:", error);
        return;
    }
    
    const store = data.content;
    const mxDivs = store.divisions.filter((d: any) => d.divisionCode === 'mexico');
    
    for (const mx of mxDivs) {
        if (!mx.subDivMonthly) continue;
        
        ['homeAppliance', 'automotive'].forEach(subKey => {
            const subDiv = mx.subDivMonthly[subKey];
            if (!subDiv) return;
            
            for (const monthStr of Object.keys(subDiv)) {
                const sub = subDiv[monthStr];
                if (sub.revenue && sub.revenue !== 0) {
                    sub.operatingProfitRatio = (sub.operatingProfit || 0) / sub.revenue * 100;
                    sub.ebtRatio = (sub.ebt || 0) / sub.revenue * 100;
                    sub.laborRatio = (sub.laborCost || 0) / sub.revenue * 100;
                    sub.laborCostRatio = sub.laborRatio;
                    sub.materialRatio = (sub.materialCost || 0) / sub.revenue * 100;
                    sub.overheadRatio = (sub.overhead || 0) / sub.revenue * 100;
                    
                    // Also other overhead ratios if needed
                    const overheadKeys = ['techFee', 'electricity', 'transportation', 'importCost', 'consumables', 'depreciation', 'overheadOther'];
                    overheadKeys.forEach(key => {
                        if (typeof sub[key] === 'number') {
                            sub[`${key}Ratio`] = (sub[key] / sub.revenue) * 100;
                        }
                    });
                }
            }
        });
        
        // Also re-apply to targetMonthly subDivTargetMonthly
        if (mx.subDivTargetMonthly) {
            ['homeAppliance', 'automotive'].forEach(subKey => {
                const subDiv = mx.subDivTargetMonthly[subKey];
                if (!subDiv) return;
                
                for (const monthStr of Object.keys(subDiv)) {
                    const sub = subDiv[monthStr];
                    if (sub.revenue && sub.revenue !== 0) {
                        sub.operatingProfitRatio = (sub.operatingProfit || 0) / sub.revenue * 100;
                        sub.ebtRatio = (sub.ebt || 0) / sub.revenue * 100;
                        sub.laborRatio = (sub.laborCost || 0) / sub.revenue * 100;
                        sub.laborCostRatio = sub.laborRatio;
                        sub.materialRatio = (sub.materialCost || 0) / sub.revenue * 100;
                        sub.overheadRatio = (sub.overhead || 0) / sub.revenue * 100;
                        
                        const overheadKeys = ['techFee', 'electricity', 'transportation', 'importCost', 'consumables', 'depreciation', 'overheadOther'];
                        overheadKeys.forEach(key => {
                            if (typeof sub[key] === 'number') {
                                sub[`${key}Ratio`] = (sub[key] / sub.revenue) * 100;
                            }
                        });
                    }
                }
            });
        }
    }
    
    console.log("Upserting back to Supabase...");
    const { error: upErr } = await supabase.from('dashboard_data').upsert({ id: 1, content: store, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    
    if (upErr) {
        console.error("Update failed:", upErr);
    } else {
        console.log("Ratios updated successfully!");
    }
}

run();
