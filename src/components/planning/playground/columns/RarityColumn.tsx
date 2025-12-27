"use client";

import {
  land_default_off_icon_url_placeholder,
  land_mythic_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { Box } from "@mui/material";
import Image from "next/image";
import { COLUMN_WIDTHS } from "../gridConstants";

type RarityColumnProps = {
  rarity: string | null;
};

export default function RarityColumn({ rarity }: RarityColumnProps) {
  if (!rarity)
    return (
      <Box width={COLUMN_WIDTHS.SMALL} flexShrink={0}>
        -
      </Box>
    );

  const icon =
    rarity === "mythic"
      ? land_mythic_icon_url
      : land_default_off_icon_url_placeholder.replace(
          "__NAME__",
          rarity.toLowerCase()
        );

  return (
    <Box width={COLUMN_WIDTHS.SMALL} flexShrink={0}>
      <Image
        src={icon}
        alt={rarity}
        width={24}
        height={24}
        style={{ objectFit: "contain", width: "auto", height: "auto" }}
      />
    </Box>
  );
}
