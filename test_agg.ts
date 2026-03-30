import { calculateDerivedFields, createEmptyPLData, ALL_ITEMS_MAP } from './src/utils/dataModel';

console.log("Starting test...");

const homeAppliance = {
    revenue: 28648000,
    salesFridge: 28463000,
    salesOven: 176000,
    salesOther: 9000,
    laborCost: 5314000,
    overhead: 4837000,
    operatingProfit: -989000,
    materialCost: 19480640,
    materialRatio: 68.0
};

const automotive = {
    revenue: 10000000,
    salesHanon: 10000000,
    laborCost: 2000000,
    overhead: 2000000,
    materialCost: 6000000,
    materialRatio: 60.0,
    operatingProfit: 0
};

const totalActual = createEmptyPLData();

const subs = [homeAppliance, automotive];
subs.forEach(subData => {
    Object.entries(subData).forEach(([k, val]) => {
        if (typeof val === 'number' && !k.toLowerCase().includes('ratio') && k !== 'materialDiff' && k !== 'revenuePerHead') {
            totalActual[k] = (totalActual[k] || 0) + val;
        }
    });
});

console.log("totalActual before calculate:", {
    revenue: totalActual.revenue,
    salesFridge: totalActual.salesFridge,
    laborCost: totalActual.laborCost,
    overhead: totalActual.overhead,
    materialCost: totalActual.materialCost,
    operatingProfit: totalActual.operatingProfit
});

const result = calculateDerivedFields(totalActual as any, false);

console.log("result after calculate:", {
    revenue: result.revenue,
    materialRatio: result.materialRatio,
    materialCost: result.materialCost,
    operatingProfit: result.operatingProfit
});
