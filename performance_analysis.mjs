import { loadData } from './src/utils/storage.js';
import { DIVISIONS_WITH_TOTAL, aggregateYear } from './src/utils/dataModel.js';

async function analyzePerformance() {
    const store = await loadData();
    if (!store) {
        console.log("No data found.");
        return;
    }

    console.log("=== 2026 Yearly Performance Analysis (YTD/Target) ===");
    for (const divInfo of DIVISIONS_WITH_TOTAL) {
        if (divInfo.code === 'total') continue;

        const divYearData = store.divisions.find(d => d.divisionCode === divInfo.code && d.year === 2026);
        if (!divYearData) continue;

        const actualYear = aggregateYear(divYearData.monthly);
        const targetYear = aggregateYear(divYearData.targetMonthly || {});

        const revAct = actualYear.revenue || 0;
        const revTar = targetYear.revenue || 0;

        const opAct = actualYear.operatingProfit || 0;
        const opTar = targetYear.operatingProfit || 0;

        const matRatio = actualYear.materialRatio || 0;
        const laborRatio = actualYear.laborRatio || 0;
        const overheadRatio = actualYear.overheadRatio || 0;

        console.log(`\n[${divInfo.name}]`);
        console.log(`- Revenue: Act ${revAct.toLocaleString()} vs Tar ${revTar.toLocaleString()} (${((revAct / revTar) * 100).toFixed(1)}%)`);
        console.log(`- OP: Act ${opAct.toLocaleString()} vs Tar ${opTar.toLocaleString()} (${((opAct / opTar) * 100).toFixed(1)}%)`);
        console.log(`- Cost Ratios: Mat ${matRatio.toFixed(1)}%, Labor ${laborRatio.toFixed(1)}%, Overhead ${overheadRatio.toFixed(1)}%`);

        // Month by month trend check (latest available)
        const months = Object.keys(divYearData.monthly).map(Number).sort((a, b) => b - a);
        if (months.length > 0) {
            const latestMonth = months[0];
            const lmData = divYearData.monthly[latestMonth];
            console.log(`- Latest Month (${latestMonth}월) OP Ratio: ${((lmData.operatingProfit || 0) / (lmData.revenue || 1) * 100).toFixed(1)}%`);
        }
    }
}

analyzePerformance();
