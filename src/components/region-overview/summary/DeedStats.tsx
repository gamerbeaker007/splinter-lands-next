"use client";

import SummaryTile from "@/components/ui/region/SummaryTile";
import {
  building_in_box_icon_url,
  unstable_totem_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { Box } from "@mui/material";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function DeedStats({
  totalBuildingInBox,
  totalUnstableTotems,
}: {
  totalBuildingInBox: number;
  totalUnstableTotems: number;
}) {
  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Deed Stats:
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={1}>
        <SummaryTile
          key="totalBuildingInBox"
          type="Building In Box"
          imageUrl={building_in_box_icon_url}
          count={totalBuildingInBox}
        />
        <SummaryTile
          key="totalUnstableTotems"
          type="Unstable Totems"
          imageUrl={unstable_totem_icon_url}
          count={totalUnstableTotems}
        />
      </Box>
    </Paper>
  );
}
