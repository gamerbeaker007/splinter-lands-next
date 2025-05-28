import {computeAndStoreResourceHubMetrics} from "@/scripts/lib/metrics/resourceHub";
import {computeAndStoreDailyActiveMetrics} from "@/scripts/lib/metrics/active";
import {fetchAndProcessRegionData} from "@/scripts/lib/region/region";
import {computeAndStoreTotalSupply} from "@/scripts/lib/metrics/resourceSupply";
import {computeAndStoreResourceProduction} from "@/scripts/lib/metrics/resourceProduction";
import {getTodayAtMidnight} from "@/scripts/lib/utils/date";
import {computeAndStorePlayerProduction} from "@/scripts/lib/metrics/resourcePlayerProduction";

async function main() {
    const today = getTodayAtMidnight();

    await fetchAndProcessRegionData()
    await computeAndStoreDailyActiveMetrics(today)
    await computeAndStoreResourceHubMetrics(today)
    await computeAndStoreTotalSupply(today)
    await computeAndStoreResourceProduction(today)
    await computeAndStorePlayerProduction(today)
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
