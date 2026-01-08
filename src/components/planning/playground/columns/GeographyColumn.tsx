"use client";

import { land_default_off_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import { Box, Tooltip } from "@mui/material";
import Image from "next/image";
import { COLUMN_WIDTHS } from "../util/gridConstants";

type GeographyColumnProps = {
  deedType: string | null;
};

export default function GeographyColumn({ deedType }: GeographyColumnProps) {
  if (!deedType)
    return (
      <Box width={COLUMN_WIDTHS.MEDIUM_PLUS} flexShrink={0}>
        -
      </Box>
    );

  const icon = land_default_off_icon_url_placeholder.replace(
    "__NAME__",
    deedType.toLowerCase()
  );

  return (
    <Box width={COLUMN_WIDTHS.MEDIUM_PLUS} flexShrink={0}>
      <Tooltip title={deedType}>
        <Image
          src={icon}
          alt={deedType}
          width={24}
          height={24}
          style={{ objectFit: "contain", width: "auto", height: "auto" }}
        />
      </Tooltip>
    </Box>
  );
}
