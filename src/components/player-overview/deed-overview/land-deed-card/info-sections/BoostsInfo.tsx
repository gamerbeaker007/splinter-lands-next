import { CSSSize } from "@/types/cssSize";
import { SplCardDetails } from "@/types/splCardDetails";
import { StakedAssets } from "@/types/stakedAssets";
import { Box, Divider } from "@mui/material";
import { DeedStatusBoost } from "../boosts/DeedStatusBoost";
import { ItemBoosts } from "../boosts/ItemBoost";
import { RarityBoost } from "../boosts/RarityBoost";
import { RuniBoost } from "../boosts/RuniBoost";
import { BiomeBoosts } from "../boosts/BiomeBoost";

type Props = {
  rarity: string;
  rarityBoost: number;
  plotStatus: string;
  plotStatusBoost: number;
  runiBoost: number;
  redBiomeBoost: number;
  blueBiomeBoost: number;
  whiteBiomeBoost: number;
  blackBiomeBoost: number;
  greenbBiomeBoost: number;
  goldBiomeBoost: number;
  stakedAssets: StakedAssets | null;
  cardDetails: SplCardDetails[];
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export default function BoostInfo({
  rarity,
  rarityBoost,
  plotStatus,
  plotStatusBoost,
  runiBoost,
  stakedAssets,
  redBiomeBoost,
  blueBiomeBoost,
  whiteBiomeBoost,
  blackBiomeBoost,
  greenbBiomeBoost,
  goldBiomeBoost,
  cardDetails,
  pos = { x: "0px", y: "0px", w: "auto" },
}: Props) {
  const { x, y, w } = pos;

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: "left",
      }}
    >
      <Box
        display={"flex"}
        borderRadius={1}
        bgcolor="rgba(70, 71, 70, 0.9)"
        gap={2}
        pl={2}
        pt={0.5}
        pb={0.5}
        pr={2}
        minHeight={100}
      >
        <BiomeBoosts
          modifiers={{
            red: redBiomeBoost,
            blue: blueBiomeBoost,
            white: whiteBiomeBoost,
            black: blackBiomeBoost,
            green: greenbBiomeBoost,
            gold: goldBiomeBoost,
          }}
        />
        <Divider
          orientation="vertical"
          flexItem
          sx={{ bgcolor: "white", width: 2 }}
        />

        <RarityBoost rarity={rarity} boost={rarityBoost ?? 0} />
        <DeedStatusBoost plotStatus={plotStatus} boost={plotStatusBoost} />

        <ItemBoosts items={stakedAssets?.items ?? []} />

        <RuniBoost
          cards={stakedAssets?.cards ?? []}
          cardDetails={cardDetails}
          runiBoost={runiBoost}
        />
      </Box>
    </Box>
  );
}
