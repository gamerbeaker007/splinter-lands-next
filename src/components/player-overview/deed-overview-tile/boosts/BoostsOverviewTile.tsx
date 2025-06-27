import React from "react";
import { Box, Typography } from "@mui/material";
import { BiomeBoosts } from "./BiomeBoost";
import { DeedComplete } from "@/types/deed";
import { RarityBoost } from "./RarityBoost";
import { DeedStatusBoost } from "./DeedStatusBoost";
import { ItemBoosts } from "./ItemBoost";
import { SplCardDetails } from "@/types/splCardDetails";
import { RuniBoost } from "./RuniBoost";

type Props = {
  data: DeedComplete;
  cardDetails: SplCardDetails[];
};

export default function BoostsOverviewTile({ data, cardDetails }: Props) {
  return (
    <Box minHeight={"185px"}>
      <Typography variant="h6">
        Boosts:{" "}
        <span style={{ color: "gray" }}>
          ({(data.stakingDetail?.total_boost ?? 0) * 100}%)
        </span>
      </Typography>

      <Box mt={1} display="flex" alignItems="flex-start">
        <Box sx={{ textAlign: "left" }}>
          <BiomeBoosts
            modifiers={{
              red: data.stakingDetail?.red_biome_modifier ?? 0,
              blue: data.stakingDetail?.blue_biome_modifier ?? 0,
              white: data.stakingDetail?.white_biome_modifier ?? 0,
              black: data.stakingDetail?.black_biome_modifier ?? 0,
              green: data.stakingDetail?.green_biome_modifier ?? 0,
              gold: data.stakingDetail?.gold_biome_modifier ?? 0,
            }}
          />
        </Box>

        <Box sx={{ textAlign: "left" }}>
          <RarityBoost
            rarity={data.rarity!}
            boost={data.stakingDetail?.deed_rarity_boost ?? 0}
          />
        </Box>
        <Box sx={{ textAlign: "left" }}>
          <DeedStatusBoost
            plotStatus={data.plot_status!}
            boost={data.stakingDetail?.deed_status_token_boost ?? 0}
          />
        </Box>
        <Box sx={{ textAlign: "left" }}>
          <ItemBoosts items={data.stakedAssets?.items ?? []} />
        </Box>

        <Box sx={{ textAlign: "left" }}>
          <RuniBoost
            cards={data.stakedAssets?.cards ?? []}
            cardDetails={cardDetails}
            runiBoost={data.stakingDetail?.runi_boost ?? 0}
          />
        </Box>
      </Box>
    </Box>
  );
}
