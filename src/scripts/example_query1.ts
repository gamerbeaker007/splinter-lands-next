import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

async function fetch_all_joined() {
    const start = Date.now();

    const result = await prisma.deed.findMany({
        include: {
            worksiteDetail: true,
            stakingDetail: true,
        },
    });

    const end = Date.now();

    console.log(`📦 Joined ${result.length} deeds`);
    console.log(`⏱️ Fetch time: ${(end - start) / 1000}s`);
    return {start, end};
}

async function fetch_worksites() {
    const start = Date.now();

    const result = await prisma.worksiteDetail.findMany();

    const end = Date.now();

    console.log(`📦 ${result.length} worksites`);
    console.log(`⏱️ Fetch time: ${(end - start) / 1000}s`);
}

async function fetch_worksites_including_player() {
    const start = Date.now();

    type WorksiteWithDeed = Prisma.WorksiteDetailGetPayload<{
        include: {
          deed: {
            select: {
              player: true;
            };
          };
        };
      }>;


    const worksites: WorksiteWithDeed[] = await prisma.worksiteDetail.findMany({
        include: {
            deed: {
                select: { player: true },
            },
        },
    });

      
    const result = worksites.map(ws => ({
        ...ws,
        player: ws.deed?.player ?? null,
    }));

    const end = Date.now();

    console.log(`📦 ${result.length} worksites`);
    console.log(`fist result ${JSON.stringify(result[1])}`)
    console.log(`⏱️ Fetch time: ${(end - start) / 1000}s`);
}

async function fetch_harvest_stuff() {
    const start = Date.now();

    const stakingDetails = await prisma.stakingDetail.findMany({
        where: {
            deed: {
                worksiteDetail: {
                    token_symbol: 'GRAIN',
                },
            },
        },
        select: {
            total_harvest_pp: true,
            total_base_pp_after_cap: true,
            deed: {
                select: {
                    player: true,
                    worksiteDetail: {
                        select: {
                            token_symbol: true,
                            rewards_per_hour: true,
                        },
                    },
                },
            },
        },
    });

    let totalHarvest = 0;
    let totalBasePP = 0;
    let totalRewards = 0;

    for (const item of stakingDetails) {
        totalHarvest += item.total_harvest_pp ?? 0;
        totalBasePP += item.total_base_pp_after_cap ?? 0;
        totalRewards += item.deed?.worksiteDetail?.rewards_per_hour ?? 0;
    }

    console.log({ totalHarvest, totalBasePP, totalRewards });

    const end = Date.now();

    console.log(`⏱️ Fetch time: ${(end - start) / 1000}s`);

}

async function getManagerWithProductionSummary(manager: string) {
  return await prisma.$queryRaw`
    SELECT 
      s.manager,
      s.total_dec_stake_needed,
      s.total_dec_stake_in_use,
      s.total_dec_staked,
      p.*
    FROM (
      SELECT 
          a.manager,
          a.total_dec_stake_needed,
          a.total_dec_stake_in_use,
          b.total_dec_staked
      FROM (
          SELECT 
              manager,
              SUM(total_dec_stake_needed) AS total_dec_stake_needed,
              SUM(total_dec_stake_in_use) AS total_dec_stake_in_use
          FROM (
              SELECT 
                  manager,
                  region_uid,
                  SUM(total_dec_stake_needed) AS total_dec_stake_needed,
                  SUM(total_dec_stake_in_use) AS total_dec_stake_in_use
              FROM 
                  "StakingDetail"
              GROUP BY 
                  manager, region_uid
          ) AS grouped
          GROUP BY manager
      ) a
      JOIN (
          SELECT 
              manager,
              SUM(total_dec_staked) AS total_dec_staked
          FROM (
              SELECT 
                  manager,
                  region_uid,
                  SUM(total_dec_staked) AS total_dec_staked
              FROM (
                  SELECT DISTINCT manager, region_uid, total_dec_staked
                  FROM "StakingDetail"
              ) AS distinct_rows
              GROUP BY manager, region_uid
          ) AS grouped
          GROUP BY manager
      ) b ON a.manager = b.manager
    ) s
    LEFT JOIN "PlayerProductionSummary" p ON s.manager = p.player
    WHERE s.manager = ${manager};
  `;
}

async function fetch_total_dec() {
    const combinedQuery = await prisma.$queryRaw`
    SELECT 
        a.manager,
        a.total_dec_stake_needed,
        a.total_dec_stake_in_use,
        b.total_dec_staked
    FROM (
        SELECT 
            manager,
            SUM(total_dec_stake_needed) AS total_dec_stake_needed,
            SUM(total_dec_stake_in_use) AS total_dec_stake_in_use
        FROM (
            SELECT 
                manager,
                region_uid,
                SUM(total_dec_stake_needed) AS total_dec_stake_needed,
                SUM(total_dec_stake_in_use) AS total_dec_stake_in_use
            FROM 
                "StakingDetail"
            GROUP BY 
                manager, region_uid
        ) AS grouped
        GROUP BY manager
    ) a
    JOIN (
        SELECT 
            manager,
            SUM(total_dec_staked) AS total_dec_staked
        FROM (
            SELECT 
                manager,
                region_uid,
                SUM(total_dec_staked) AS total_dec_staked
            FROM (
                SELECT DISTINCT manager, region_uid, total_dec_staked
                FROM "StakingDetail"
            ) AS distinct_rows
            GROUP BY manager, region_uid
        ) AS grouped
        GROUP BY manager
    ) b ON a.manager = b.manager
    WHERE a.manager = 'beaker007';
    `;
    console.log(combinedQuery);
}



async function main() {
    await fetch_all_joined();
    await fetch_worksites();
    await fetch_worksites_including_player();
    await fetch_harvest_stuff();
    await fetch_total_dec();
    const res = await getManagerWithProductionSummary('beaker007');    
    console.log(res)
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
