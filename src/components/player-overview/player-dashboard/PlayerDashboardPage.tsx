"use client";

import { InfoCreatableItem } from "@/components/player-overview/player-dashboard/InfoItemWithCraftable";
import { PlayerCraftingOverview } from "@/components/player-overview/player-dashboard/PlayerCraftingOverview";
import { ResourceOverviewCard } from "@/components/player-overview/player-dashboard/ResourceOverviewCard";
import BoostTile from "@/components/region-overview/summary/BoostTile";
import DecGaugeIndicator from "@/components/region-overview/summary/DecGaugeIndicator";
import DeedRarityTile from "@/components/region-overview/summary/DeedRarityTile";
import DeedStatusTile from "@/components/region-overview/summary/DeedStatusTile";
import DeedTypeTile from "@/components/region-overview/summary/DeedTypeTile";
import WorksiteTypeTile from "@/components/region-overview/summary/WorksiteTypeTile";
import { usePlayerDashboard } from "@/hooks/usePlayerDashboard";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { Refresh } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import AlertSection from "./alerts/AlertSection";
import { PlayerProductionOverview } from "./PlayerProductionOverview";

type Props = {
  player: string;
};

export default function PlayerDashboardPage({ player }: Props) {
  const [force, setForce] = useState(false);
  const { playerOverview, loadingText, fetchPlayerData } =
    usePlayerDashboard(player);

  function refetchData() {
    setForce((prev) => !prev); // Toggle force to trigger useEffect in child components
    fetchPlayerData(true); // Pass force as true to refetch data
  }

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
            onClick={refetchData}
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
              <AlertSection
                alerts={playerOverview.alerts}
                player={player}
                force={force}
              />
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
                <Box>
                  <Typography variant={"h5"} mb={2}>
                    Est. DEC Income
                  </Typography>
                  <Typography variant="h6">Production (/hr):</Typography>
                  <InfoCreatableItem
                    icon={RESOURCE_ICON_MAP["DEC"]}
                    title={"DEC"}
                    number={playerOverview.totalDec}
                    precision={3}
                  />
                  {playerOverview.totalTaxDec && (
                    <>
                      <Typography variant="h6">Tax (/hr):</Typography>
                      <InfoCreatableItem
                        icon={RESOURCE_ICON_MAP["DEC"]}
                        title={"DEC"}
                        number={playerOverview.totalTaxDec}
                        precision={3}
                      />
                    </>
                  )}
                </Box>
                <Box maxWidth={450} flex={1}>
                  <Typography variant={"h5"} ml={2} mb={2}>
                    Staked DEC Information
                  </Typography>
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
                  <Typography variant={"h5"} mb={2}>
                    Resource / Crafting{" "}
                  </Typography>
                  <PlayerCraftingOverview
                    liquidityInfo={playerOverview.liquidityInfo}
                    balances={playerOverview.balances}
                  />
                </Box>
              </Box>

              <Box flex={1}>
                <PlayerProductionOverview
                  productionPoints={
                    playerOverview.summarizedRegionInfo.productionPoints
                  }
                  rewardsPerHour={
                    playerOverview.summarizedRegionInfo.rewardsPerHour
                  }
                />
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
