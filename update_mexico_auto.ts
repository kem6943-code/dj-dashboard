import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://pzeigdohowsdkhrflbsm.supabase.co';
const supabaseKey = 'sb_publishable_g_vNlDSq8zOFqyuWR1zrLQ_QNT3cwDZ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to the extracted data
const extractedDataPath = '../mexico_auto_correct.json';
const rawData = fs.readFileSync(extractedDataPath, 'utf8').replace(/NaN/g, 'null');
const extractedData = JSON.parse(rawData);

async function run() {
    console.log("Fetching latest DB...");
    const { data, error } = await supabase.from('dashboard_data').select('content').eq('id', 1).single();
    if (error) {
        console.error("Fetch error:", error);
        return;
    }
    
    const store = data.content;
    
    // Process both 2025 and 2026
    const years = [2025, 2026];
    
    for (const year of years) {
        let mx = store.divisions.find((d: any) => d.divisionCode === 'mexico' && d.year === year);
        
        if (!mx) {
            console.log(`Mexico division for ${year} not found. Creating...`);
            mx = {
                divisionCode: 'mexico',
                year: year,
                exchangeRates: {},
                monthly: {},
                targetMonthly: {},
                subDivMonthly: { homeAppliance: {}, automotive: {} },
                subDivTargetMonthly: { homeAppliance: {}, automotive: {} }
            };
            store.divisions.push(mx);
        }
        
        if (!mx.subDivMonthly) mx.subDivMonthly = { homeAppliance: {}, automotive: {} };
        if (!mx.subDivMonthly.automotive) mx.subDivMonthly.automotive = {};
        
        // Months to update: 1, 3
        const months = [1, 3];
        
        for (const m of months) {
            const key = `${year}_${m.toString().padStart(2, '0')}`;
            const ext = extractedData[key];
            if (!ext) continue;
            
            console.log(`Updating Mexico Automotive for ${year} Month ${m}...`);
            
            const revenueMXN = ext['Ⅰ. 매출액(MXN)'] || 0;
            const revenueUSD = ext['매출액(USD)'] || 0;
            const laborCost = ext['ⅱ)노무비'] || 0;
            
            const overhead = ext['ⅲ)제조경비'] || 0;
            const electricity = ext['전력비'] || 0;
            const depreciation = ext['감가상각비'] || 0;
            const techFee = ext['기술료'] || 0;
            const importCost = ext['수입통관비'] || 0;
            const repair = ext['수선비'] || 0;
            const welfare = ext['복리후생비'] || 0;
            const transportation = ext['운반비'] || 0;
            const consumables = ext['소모품비'] || 0;
            const commission = ext['지급수수료'] || 0;
            const rent = ext['지급임차료'] || 0;
            const packaging = ext['포장비'] || 0;
            
            // 기타 경비 계산 = 경비합계 - 명시된항목들
            const overheadOther = overhead - (electricity + depreciation + techFee + importCost + repair + welfare + transportation + consumables + commission + rent + packaging);
            
            const operatingProfit = ext['Ⅲ. 영업이익'] || 0;
            const financeCost = ext['이자비용'] || 0;
            const ebt = ext['Ⅳ. 세전이익'] || 0;
            
            const nonOpBalance = ebt - operatingProfit;
            
            // Other revenue items
            const salesFridge = ext['냉장고'] || 0;
            const salesOven = ext['오븐'] || 0;
            const salesHanon = ext['한온'] || 0;
            const salesSeoyeon = ext['서연이화'] || 0;
            const salesKefico = ext['현대 케피코'] || 0;
            const salesDonggwang = ext['동광 라모스'] || 0;
            const salesAmotech = ext['엠오토텍'] || 0;
            const salesKyungrim = ext['경림'] || 0;
            const salesMobis = ext['현대 모비스'] || 0;
            const salesYoungshin = ext['영신'] || 0;
            const salesOther = ext['기타수익'] || 0; // Or whatever is left
            
            // Material costs
            const materialCost = ext['ⅰ)재료비(순액)'] || 0;
            const purchaseVI = ext['구매 VI'] || 0;
            const materialLoss = ext['재료Loss 금액'] || 0;

            if (!mx.subDivMonthly.automotive[m]) {
                mx.subDivMonthly.automotive[m] = {};
            }
            
            const sub = mx.subDivMonthly.automotive[m];
            
            // Put everything inside.
            sub.revenue = revenueMXN;
            sub.revenueUSD = revenueUSD;
            sub.laborCost = laborCost;
            
            sub.overhead = overhead;
            sub.electricity = electricity;
            sub.depreciation = depreciation;
            sub.techFee = techFee;
            sub.importCost = importCost;
            sub.repair = repair;
            sub.welfare = welfare;
            sub.transportation = transportation;
            sub.consumables = consumables;
            sub.commission = commission;
            sub.rent = rent;
            sub.packaging = packaging;
            sub.overheadOther = overheadOther;
            
            sub.operatingProfit = operatingProfit;
            sub.financeCost = financeCost;
            sub.ebt = ebt;
            sub.nonOpBalance = nonOpBalance;
            
            sub.materialCost = materialCost;
            sub.purchaseVI = purchaseVI;
            sub.materialLoss = materialLoss;
            
            sub.salesFridge = salesFridge;
            sub.salesOven = salesOven;
            sub.salesHanon = salesHanon;
            sub.salesSeoyeon = salesSeoyeon;
            sub.salesKefico = salesKefico;
            sub.salesDonggwang = salesDonggwang;
            sub.salesAmotech = salesAmotech;
            sub.salesKyungrim = salesKyungrim;
            sub.salesMobis = salesMobis;
            sub.salesYoungshin = salesYoungshin;
            sub.salesOther = salesOther;
            
            // Do NOT touch revenuePerHead as requested by user.
            
            // Set exchange rate
            const exchangeRate = revenueMXN / revenueUSD;
            if (!mx.exchangeRates) mx.exchangeRates = {};
            if (!mx.exchangeRates[m]) mx.exchangeRates[m] = { actual: exchangeRate, target: 1, prev: 1 };
            else mx.exchangeRates[m].actual = exchangeRate;
        }
        
        // Recompute the totals for this year (summing HomeAppliance + Automotive)
        if (mx && mx.subDivMonthly) {
            for (let month of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
                if (mx.subDivMonthly.homeAppliance?.[month] || mx.subDivMonthly.automotive?.[month]) {
                    const totalActual: any = {};
                    let manualOverrides = new Set<string>();
                    
                    ['homeAppliance', 'automotive'].forEach(k => {
                        const sub = mx.subDivMonthly[k]?.[month];
                        if (sub) {
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
                    totalActual.operatingProfitRatio = totalActual.operatingProfit / totalActual.revenue * 100 || 0;
                    totalActual.ebtRatio = totalActual.ebt / totalActual.revenue * 100 || 0;
                    totalActual.materialRatio = totalActual.materialCost / totalActual.revenue * 100 || 0;
                    
                    if (!mx.monthly) mx.monthly = {};
                    mx.monthly[month] = totalActual;
                }
            }
        }
    }
    
    console.log("Upserting back to Supabase...");
    const { error: upErr } = await supabase.from('dashboard_data').upsert({ id: 1, content: store, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    
    if (upErr) {
        console.error("Update failed:", upErr);
    } else {
        console.log("Update SUCCESS! 🚀");
    }
}

run();
