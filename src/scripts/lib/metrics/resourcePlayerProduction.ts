import {prisma} from "@/lib/prisma";
import {calcCosts, getPrice, prepareSummary} from "@/scripts/lib/utils/productionCosts";
import {getPrices} from "@/lib/api/spl/splPricesAPI";
import {getLandResourcesPools} from "@/lib/api/spl/splLandAPI";
import {PRODUCING_RESOURCES} from "@/scripts/lib/utils/statics";

export async function computeAndStorePlayerProduction(today: Date) {

    const prices  = await getPrices()
    const metrics = await getLandResourcesPools()

    const rawResults = await prisma.$queryRawUnsafe<{
        region_uid: string;
        player: string;
        token_symbol: string;
        rewards_per_hour: number;
        total_harvest_pp: number;
        total_base_pp_after_cap: number;
        count: number;
    }[]>(`
  SELECT
    d.region_uid,
    d.player,
    w.token_symbol,
    SUM(w.rewards_per_hour) AS rewards_per_hour,
    SUM(s.total_harvest_pp) AS total_harvest_pp,
    SUM(s.total_base_pp_after_cap) AS total_base_pp_after_cap,
    COUNT(*) AS count
  FROM "Deed" d
  JOIN "WorksiteDetail" w ON d.deed_uid = w.deed_uid
  JOIN "StakingDetail" s ON d.deed_uid = s.deed_uid
  WHERE s.total_harvest_pp > 0 AND w.token_symbol != 'TAX'
  GROUP BY d.region_uid, d.player, w.token_symbol;
`);

    const resultsWithCosts = rawResults.map(row => {
        const costs = calcCosts(row.token_symbol, row.total_base_pp_after_cap);

        return {
            ...row,
            ...costs,
        };
    });

    const unitPrices: Record<string, number> = {};

    for (const key of PRODUCING_RESOURCES) {
        unitPrices[key.toLowerCase()] = await getPrice(metrics, prices, key, 1);
    }

    const playerMap: Record<string, typeof resultsWithCosts> = {};

    for (const row of resultsWithCosts) {
        if (!playerMap[row.player]) {
            playerMap[row.player] = [];
        }
        playerMap[row.player].push(row);
    }


    // Compute summary for each player
    const playerSummaries: any[] = [];

    for (const player of Object.keys(playerMap)) {
        const playerRows = playerMap[player];
        const summary = prepareSummary(playerRows, true, true); // includeTaxes, includeFee

        // === DEC calculations from summary ===
        const dec_net: Record<string, number> = {};
        let total_dec = 0;

        for (const key of PRODUCING_RESOURCES) {
            const k = key.toLowerCase();
            const adjNetKey = `adj_net_${k}`;

            const amount = summary.reduce((acc, row) => acc + (row[adjNetKey] || 0), 0);
            const decValue = unitPrices[k] * amount;
            dec_net[`dec_${k}`] = decValue;
            total_dec += decValue;
        }

        // === Aggregate sums from raw playerRows ===
        const harvest_sum = playerRows.reduce((acc, row) => acc + row.total_harvest_pp, 0);
        const base_sum = playerRows.reduce((acc, row) => acc + row.total_base_pp_after_cap, 0);
        const count_sum = playerRows.reduce((acc, row) => acc + Number(row.count), 0);

        // === Final output ===
        playerSummaries.push({
            player,
            total_harvest_pp: harvest_sum,
            total_base_pp_after_cap: base_sum,
            count: count_sum,
            total_dec,
            ...dec_net,
        });
    }

    await prisma.playerProductionSummary.deleteMany();
    await prisma.$transaction(
        playerSummaries.map(summary =>
            prisma.playerProductionSummary.create({
            data: {
                player: summary.player,
                total_harvest_pp: summary.total_harvest_pp,
                total_base_pp_after_cap: summary.total_base_pp_after_cap,
                count: summary.count,
                total_dec: summary.total_dec,
                dec_grain: summary.dec_grain || 0,
                dec_wood: summary.dec_wood || 0,
                dec_stone: summary.dec_stone || 0,
                dec_iron: summary.dec_iron || 0,
                dec_research: summary.dec_research || 0,
                dec_aura: summary.dec_aura || 0,
                dec_sps: summary.dec_sps || 0,
            },
            })
        )
        );

    console.log(`🧑‍🌾 Stored player production for ${today.toISOString().split('T')[0]}`);
}
