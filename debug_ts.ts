import { calculateDerivedFields, createEmptyPLData, ALL_ITEMS_MAP } from './src/utils/dataModel.ts';

const divData = {
    monthly: {
        2: {
            revenue: 35000,
            operatingProfit: -8518,
            operatingProfitRatio: -14.9,
            nonOpBalance: 718,
            financeCost: -1065,
            ebtRatio: 0
        }
    }
};

const totalActual = createEmptyPLData();
const subData = divData.monthly[2];

Object.entries(subData).forEach(([k, val]) => {
    if (typeof val === 'number' && !k.toLowerCase().includes('ratio') && k !== 'materialDiff' && k !== 'revenuePerHead') {
        totalActual[k] = (totalActual[k] || 0) + val;
    }
});

const result = calculateDerivedFields(totalActual, true);
console.log("Total Actual ebt:", result.ebt);
console.log("Total Actual ebtRatio:", result.ebtRatio);
console.log("Result:", result);
