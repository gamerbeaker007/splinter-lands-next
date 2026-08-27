"use client";

import {
  determineMaxLevelFromRarityFoil,
  getCardImgV2,
  parseCardUid,
  rarityName,
} from "@/lib/utils/cardUtil";
import { cardFoilOptions, CardRarity } from "@/types/planner";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box, Tooltip, Typography } from "@mui/material";
import Image from "next/image";

interface CardUidImageProps {
  /** Card uid, e.g. "G19-866-2632A608C0". */
  uid: string | null | undefined;
  cardDetails: SplCardDetails[] | null;
  /** Thumbnail width in px; height follows the 5:7 card ratio. */
  width?: number;
}

/**
 * Card artwork resolved from a card uid, with a large preview on hover.
 *
 * A single card of an arcane/black foil is already max level, while regular and
 * gold cards drop at 1 BCX — so anything above foil id 1 renders at max level.
 * Falls back to the raw uid while card details are still loading or unknown.
 */
export default function CardUidImage({
  uid,
  cardDetails,
  width = 40,
}: CardUidImageProps) {
  const parsed = parseCardUid(uid);
  const card = parsed
    ? cardDetails?.find((cd) => cd.id === parsed.cardDetailId)
    : undefined;

  if (!parsed || !card) {
    return (
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ fontFamily: "monospace" }}
      >
        {uid ?? "-"}
      </Typography>
    );
  }

  const level =
    cardFoilOptions.indexOf(parsed.foil) > 1
      ? determineMaxLevelFromRarityFoil(
          rarityName(card.rarity) as CardRarity,
          parsed.foil
        )
      : 1;
  const img = getCardImgV2(card.name, parsed.edition, parsed.foil, level);
  const height = Math.round((width * 7) / 5);

  return (
    <Tooltip
      title={
        <Box width={220} height={300} position="relative">
          <Image
            src={img}
            alt={card.name}
            fill
            sizes="220px"
            style={{
              objectFit: "contain",
              objectPosition: "center",
              borderRadius: 8,
            }}
          />
        </Box>
      }
      placement="right"
      arrow
    >
      <Box
        width={width}
        height={height}
        position="relative"
        flexShrink={0}
        sx={{ overflow: "hidden", borderRadius: 0.5, background: "#222" }}
      >
        <Image
          src={img}
          alt={card.name}
          fill
          sizes={`${width}px`}
          style={{ objectFit: "cover", objectPosition: "top center" }}
        />
      </Box>
    </Tooltip>
  );
}
