import { determineCardInfo, determineCardMaxBCX } from "@/lib/utils/cardUtil";
import { Rarity } from "@/types/rarity";
import { SplCardDetails } from "@/types/splCardDetails";
import { Card } from "@/types/stakedAssets";
import { Box, Typography } from "@mui/material";
import React from "react";
import CardTile from "../card/CardTile";

export type RuniBoostProps = {
  cards: Card[];
  cardDetails: SplCardDetails[];
  runiBoost: number;
};

export const RuniBoost: React.FC<RuniBoostProps> = ({
  cards,
  cardDetails,
  runiBoost,
}) => {
  if (runiBoost === 0) return <></>;

  const runiCards = cards.filter((card) => {
    const { name } = determineCardInfo(card.card_detail_id, cardDetails);
    return name === "Runi";
  });

  if (runiCards.length === 0) return <></>;

  return (
    <Box textAlign="center">
      <Typography fontWeight="bold" fontFamily="monospace" fontSize="14px">
        {runiBoost * 100}%
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, zoom: "70%" }}>
        {runiCards.map((card) => {
          const { name, rarity } = determineCardInfo(
            card.card_detail_id,
            cardDetails,
          );
          const max_bcx = determineCardMaxBCX(
            card.card_set,
            rarity as Rarity,
            card.foil,
          );

          return (
            <CardTile
              key={card.uid ?? `${card.card_detail_id}-${card.foil}`}
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
