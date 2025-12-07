import { determineCardInfo, determineCardMaxBCX } from "@/lib/utils/cardUtil";
import { CSSSize } from "@/types/cssSize";
import { SplCardDetails } from "@/types/splCardDetails";
import { StakedAssets } from "@/types/stakedAssets";
import { Box } from "@mui/material";
import CardTile from "../card/CardTile";

export type Props = {
  stakedAssets: StakedAssets;
  cardDetails: SplCardDetails[];
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const CardInfo: React.FC<Props> = ({
  stakedAssets,
  cardDetails,
  pos = { x: "0px", y: "0px", w: "auto" },
}) => {
  const { x, y, w } = pos;

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: "center",
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {stakedAssets?.cards?.map((card) => {
          const { name, rarity } = determineCardInfo(
            card.card_detail_id,
            cardDetails
          );

          if (name === "Runi") return null;

          const max_bcx = determineCardMaxBCX(card.card_set, rarity, card.foil);

          return (
            <CardTile
              key={card.uid}
              name={name}
              rarity={rarity}
              edition={card.edition}
              foil={card.foil}
              terrain_boost={Number(card.terrain_boost)}
              actual_bcx={card.bcx}
              max_bcx={max_bcx}
              base_pp={Number(card.base_pp_after_cap)}
              boosted_pp={Number(card.total_harvest_pp)}
              uid={card.uid}
            />
          );
        })}
      </Box>
    </Box>
  );
};
