"use client";

import SummaryTile from "@/components/ui/region/SummaryTile";
import {
  land_default_icon_url_placeholder,
  land_unsurveyd_deed_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { Box } from "@mui/material";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function DeedStatusTile({
  data,
}: {
  data: Record<string, number>;
}) {
  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Status:
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={1}>
        {Object.entries(data ?? {}).map(([type, count]) => {
          const image =
            type == "Unknown"
              ? land_unsurveyd_deed_icon_url
              : land_default_icon_url_placeholder.replace(
                  "__NAME__",
                  type.toLowerCase(),
                );
          return (
            <SummaryTile
              key={type}
              type={type}
              imageUrl={image}
              count={Number(count)}
            />
          );
        })}
      </Box>
    </Paper>
  );
}
