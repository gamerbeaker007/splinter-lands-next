"use client";

import { ManageLink } from "@/components/player-overview/deed-overview/land-deed-card/link-components/ManageLink";
import { Box } from "@mui/material";
import { COLUMN_WIDTHS } from "../util/gridConstants";

type LinkColumnProps = {
  regionNumber: number;
  plotId: number;
  tractNumber: number;
  plotNumber: number;
};

export default function LinkColumn({
  regionNumber,
  plotId,
  tractNumber,
  plotNumber,
}: LinkColumnProps) {
  return (
    <Box width={COLUMN_WIDTHS.SMALL} flexShrink={0}>
      <ManageLink
        regionNumber={regionNumber}
        plotId={plotId}
        tractNumber={tractNumber}
        plotNumber={plotNumber}
      />
    </Box>
  );
}
