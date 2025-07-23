"use client";

import { DeedAlertCard } from "@/components/player-overview/player-dashboard/DeedAlertCard";
import { PlayerCraftingOverview } from "@/components/player-overview/player-dashboard/PlayerCraftingOverview";
import { ResourceOverviewCard } from "@/components/player-overview/player-dashboard/ResourceOverviewCard";
import BoostTile from "@/components/region-overview/summary/BoostTile";
import DecGaugeIndicator from "@/components/region-overview/summary/DecGaugeIndicator";
import DeedRarityTile from "@/components/region-overview/summary/DeedRarityTile";
import DeedStatusTile from "@/components/region-overview/summary/DeedStatusTile";
import DeedTypeTile from "@/components/region-overview/summary/DeedTypeTile";
import WorksiteTypeTile from "@/components/region-overview/summary/WorksiteTypeTile";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { alert_gif as alert_gif_url } from "@/lib/shared/statics_icon_urls";
import { PlayerOverview } from "@/types/playerOverview";
import { Refresh } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Props = {
  player: string;
};

export default function PlayerDashboardPage({ player }: Props) {
  const [playerOverview, setPlayerOverview] = useState<PlayerOverview | null>(
    null,
  );
  const [loadingText, setLoadingText] = useState<string | null>(null);

  const fetchPlayerData = useCallback(
    async (force: boolean = false) => {
      try {
        setLoadingText("Fetching base player data...");
        setPlayerOverview(null);

        const data = await fetchPlayerDashboardData(player, force);

        setLoadingText(null);
        setPlayerOverview(data);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setLoadingText("An error occurred while loading data.");
      }
    },
    [player],
  );

  useEffect(() => {
    if (!player || player === "") {
      setLoadingText(null);
      return;
    }

    fetchPlayerData(false);
  }, [player, fetchPlayerData]);

  console.log(playerOverview);
  return (
    <>
      {loadingText ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">{loadingText}</Typography>
        </Box>
      ) : (
        <>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchPlayerData(true)}
          >
            Refresh Data
          </Button>
          {playerOverview && (
            <Box
              gap={2}
              display={"flex"}
              flexWrap={"wrap"}
              flexDirection={"column"}
              mt={4}
            >
              {playerOverview.alerts.length > 0 && (
                <>
                  <Typography variant="h5">
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Image
                        src={alert_gif_url}
                        alt={"Alert"}
                        width={25}
                        height={25}
                        style={{ marginLeft: 10, marginRight: 10 }}
                      />
                      Alerts!
                      <Image
                        src={alert_gif_url}
                        alt={"Alert"}
                        width={25}
                        height={25}
                        style={{ marginLeft: 10, marginRight: 10 }}
                      />
                    </Box>
                  </Typography>
                  <Typography variant={"body1"}>
                    Deeds that needs attention these plot are either full or the
                    building is finished
                  </Typography>
                  <Box display={"flex"} flexWrap={"wrap"}>
                    {playerOverview.alerts.map((alert) => (
                      <DeedAlertCard key={alert.plotId} alert={alert} />
                    ))}
                  </Box>
                </>
              )}

              <Typography variant={"h5"}>Resource Stores</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {["GRAIN", "WOOD", "STONE", "IRON", "RESEARCH", "AURA"].map(
                  (resource) => (
                    <ResourceOverviewCard
                      key={resource}
                      resource={resource}
                      liquidityInfo={playerOverview.liquidityInfo}
                      liquidityPoolInfo={playerOverview.liquidityPoolInfo}
                    />
                  ),
                )}
              </Box>
              <Box display={"flex"} flexWrap={"wrap"} gap={4}>
                <Box maxWidth={450} flex={1}>
                  <Typography variant={"h5"}>DEC Info</Typography>
                  <DecGaugeIndicator
                    title={`STAKED DEC MAX: ${formatNumberWithSuffix(playerOverview.summarizedRegionInfo.deedsCount * 50_000)}`}
                    maxPossibleStakedDec={
                      playerOverview.summarizedRegionInfo.deedsCount * 50_000
                    }
                    totalDecStaked={
                      playerOverview.summarizedRegionInfo.totalDecStaked
                    }
                    totalDecNeeded={
                      playerOverview.summarizedRegionInfo.totalDecNeeded
                    }
                    runiStakedDEC={
                      playerOverview.summarizedRegionInfo.runiCount * 50_000
                    }
                  />
                </Box>
                <Box flex={1}>
                  <PlayerCraftingOverview
                    liquidityInfo={playerOverview.liquidityInfo}
                    balances={playerOverview.balances}
                  />
                </Box>
              </Box>

              <Box mt={2}>
                <Typography variant={"h5"}>Summarized</Typography>
                <Stack spacing={3}>
                  <DeedRarityTile
                    data={playerOverview.summarizedRegionInfo.rarities ?? {}}
                  />
                  <WorksiteTypeTile
                    data={playerOverview.summarizedRegionInfo.worksites ?? {}}
                  />
                  <DeedTypeTile
                    data={playerOverview.summarizedRegionInfo.deedTypes ?? {}}
                  />
                  <DeedStatusTile
                    data={
                      playerOverview.summarizedRegionInfo.plotStatuses ?? {}
                    }
                  />
                  <BoostTile
                    titleBoosts={
                      playerOverview.summarizedRegionInfo.titleBoosts ?? {}
                    }
                    totemBoosts={
                      playerOverview.summarizedRegionInfo.totemBoosts ?? {}
                    }
                    runiBoosts={
                      playerOverview.summarizedRegionInfo.runiBoosts ?? {}
                    }
                    rarityBoosts={
                      playerOverview.summarizedRegionInfo.deedRarityBoosts ?? {}
                    }
                  />
                </Stack>{" "}
              </Box>
            </Box>
          )}
        </>
      )}
    </>
  );
}

async function fetchPlayerDashboardData(
  player: string,
  force: boolean,
): Promise<PlayerOverview> {
  const res = await fetch("/api/player/dashboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, force }),
  });
  return await res.json();
}
