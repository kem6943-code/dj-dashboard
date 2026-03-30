import { createEmptyStore } from './src/utils/storage';
import { calculateDerivedFields, createEmptyPLData, ALL_ITEMS_MAP, DIVISIONS_WITH_TOTAL } from './src/utils/dataModel';

// Mock structure
const store = createEmptyStore();
const div = store.divisions.find(d => d.divisionCode === 'mexico');
div.subDivMonthly = {
  homeAppliance: {
    1: calculateDerivedFields({ ...createEmptyPLData(), revenue: 28648000, materialRatio: 68.0, laborCost: 5314000, overhead: 4837000 } as any, true)
  },
  automotive: {
    1: calculateDerivedFields({ ...createEmptyPLData(), revenue: 10000000, materialRatio: 60.0, laborCost: 2000000, overhead: 2000000 } as any, true)
  }
};

// Simulate broken monthly 
div.monthly[1] = calculateDerivedFields({ ...createEmptyPLData(), revenue: 38648000, laborCost: 7314000, overhead: 6837000 } as any, false);
console.log("Broken OP:", div.monthly[1].operatingProfit); // Should be large positive

// Run repair
function autoRepairAggregations(store) {
    const repaired = { ...store };
    repaired.divisions.forEach(div => {
        const divInfo = DIVISIONS_WITH_TOTAL.find(d => d.code === div.divisionCode);
        if (divInfo && divInfo.subDivisions && divInfo.subDivisionMode === 'tabs') {
            for (let month = 1; month <= 12; month++) {
                if (div.subDivMonthly) {
                    const totalActual = createEmptyPLData();
                    let hasData = false;
                    divInfo.subDivisions.forEach(sub => {
                        if (sub.key === 'all') return;
                        const subData = div.subDivMonthly?.[sub.key]?.[month];
                        if (subData && Object.keys(subData).length > 0) {
                            hasData = true;
                            Object.entries(subData).forEach(([k, val]) => {
                                if (typeof val === 'number' && !k.toLowerCase().includes('ratio') && k !== 'materialDiff' && k !== 'revenuePerHead') {
                                    totalActual[k] = (totalActual[k] || 0) + val;
                                }
                            });
                        }
                    });
                    if (hasData) {
                        div.monthly[month] = calculateDerivedFields(totalActual, false);
                    }
                }
            }
        }
    });
    return repaired;
}

autoRepairAggregations(store);
console.log("Repaired OP:", div.monthly[1].operatingProfit);
