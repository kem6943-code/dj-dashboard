import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzeigdohowsdkhrflbsm.supabase.co';
const supabaseKey = 'sb_publishable_g_vNlDSq8zOFqyuWR1zrLQ_QNT3cwDZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching data from Supabase...");
    const { data, error } = await supabase
        .from('dashboard_data')
        .select('content')
        .eq('id', 1)
        .single();
    
    if (error) {
        console.error("Error fetching:", error);
        return;
    }
    
    const store = data.content;
    let modified = false;

    store.divisions.forEach((div: any) => {
        if (div.divisionCode === 'mexico') {
            [1, 2, 3].forEach(m => {
                const flipSignIfPositive = (dataObj: any) => {
                    if (dataObj && dataObj.nonOpBalance && dataObj.nonOpBalance > 0) {
                        dataObj.nonOpBalance = -dataObj.nonOpBalance;
                        // Also, let's recalculate ebt and ebtRatio just in case
                        if (dataObj.operatingProfit !== undefined) {
                            dataObj.ebt = Number(dataObj.operatingProfit) + Number(dataObj.nonOpBalance);
                            if (dataObj.revenue && dataObj.revenue > 0) {
                                dataObj.ebtRatio = (dataObj.ebt / dataObj.revenue) * 100;
                            }
                        }
                        modified = true;
                    }
                };

                flipSignIfPositive(div.monthly?.[m]);
                flipSignIfPositive(div.targetMonthly?.[m]);

                if (div.subDivMonthly) {
                    Object.values(div.subDivMonthly).forEach(subMonthly => {
                        flipSignIfPositive((subMonthly as any)?.[m]);
                    });
                }
                if (div.subDivTargetMonthly) {
                    Object.values(div.subDivTargetMonthly).forEach(subTargetMonthly => {
                        flipSignIfPositive((subTargetMonthly as any)?.[m]);
                    });
                }
            });
            
            // Re-aggregate monthly and targetMonthly from subDivisions
            for (let month = 1; month <= 3; month++) {
                if (div.subDivMonthly) {
                    let totalNonOp = 0;
                    let totalEbt = 0;
                    let totalOp = 0;
                    let totalRev = 0;
                    let hasData = false;
                    Object.values(div.subDivMonthly).forEach((subData: any) => {
                        const sm = subData[month];
                        if (sm && Object.keys(sm).length > 0) {
                            hasData = true;
                            totalNonOp += sm.nonOpBalance || 0;
                            totalEbt += sm.ebt || 0;
                            totalOp += sm.operatingProfit || 0;
                            totalRev += sm.revenue || 0;
                        }
                    });
                    if (hasData && div.monthly[month]) {
                        div.monthly[month].nonOpBalance = totalNonOp;
                        div.monthly[month].ebt = totalEbt;
                        div.monthly[month].operatingProfit = totalOp;
                        if (totalRev > 0) {
                            div.monthly[month].ebtRatio = (totalEbt / totalRev) * 100;
                            div.monthly[month].operatingProfitRatio = (totalOp / totalRev) * 100;
                        }
                    }
                }
            }
        }
    });

    if (modified) {
        console.log("Updating Supabase with fixed Mexico nonOpBalance...");
        const { error: updateError } = await supabase
            .from('dashboard_data')
            .update({ content: store })
            .eq('id', 1);
            
        if (updateError) {
            console.error("Failed to update:", updateError);
        } else {
            console.log("Supabase successfully updated!");
        }
    } else {
        console.log("No positive nonOpBalance found for Mexico. Nothing modified.");
    }
}

run();
