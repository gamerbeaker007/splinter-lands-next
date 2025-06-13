"use client";

import SummaryTile from "@/components/ui/region/SummaryTile";
import {
  land_default_icon_url_placeholder,
  land_mythic_icon_url,
  land_under_construction_icon_url,
} from "@/scripts/statics_icon_urls";
import { Box } from "@mui/material";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

const orderedKeys = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "Unknown",
];

export default function DeedRarityTile({
  data,
}: {
  data: Record<string, number>;
}) {
  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Rarity:
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={1}>
        {Object.entries(data ?? {})
          .sort(([a], [b]) => orderedKeys.indexOf(a) - orderedKeys.indexOf(b))
          .map(([type, count]) => {
            const image =
              type == "mythic" || type == "Unknown"
                ? type == "Unknown"
                  ? land_under_construction_icon_url
                  : land_mythic_icon_url
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
