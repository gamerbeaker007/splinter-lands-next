"use client";

import {
  land_default_off_icon_url_placeholder,
  land_under_construction_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { Box, Tooltip } from "@mui/material";
import Image from "next/image";
import { COLUMN_WIDTHS } from "../util/gridConstants";

const statusIconMap: Record<string, string> = {
  natural: land_default_off_icon_url_placeholder.replace("__NAME__", "natural"),
  magical: land_default_off_icon_url_placeholder.replace("__NAME__", "magical"),
  kingdom: land_default_off_icon_url_placeholder.replace("__NAME__", "kingdom"),
  construction: land_under_construction_icon_url,
};

type StatusColumnProps = {
  plotStatus: string | null;
};

export default function StatusColumn({ plotStatus }: StatusColumnProps) {
  if (!plotStatus)
    return (
      <Box width={COLUMN_WIDTHS.SMALL} flexShrink={0}>
        -
      </Box>
    );

  const icon = statusIconMap[plotStatus.toLowerCase()];
  if (!icon)
    return (
      <Box width={COLUMN_WIDTHS.SMALL} flexShrink={0}>
        {plotStatus}
      </Box>
    );

  return (
    <Box width={COLUMN_WIDTHS.SMALL} flexShrink={0}>
      <Tooltip title={plotStatus}>
        <Image
          src={icon}
          alt={plotStatus}
          width={24}
          height={24}
          style={{ objectFit: "contain", width: "auto", height: "auto" }}
        />
      </Tooltip>
    </Box>
  );
}
