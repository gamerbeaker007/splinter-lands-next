"use client";

import SummaryTile from "@/components/ui/region/SummaryTile";
import {
  land_aura_lab_icon_url,
  land_castle_icon_url,
  land_grain_farm_icon_url,
  land_keep_icon_url,
  land_logging_camp_icon_url,
  land_ore_mine_icon_url,
  land_quarry_icon_url,
  land_research_hut_icon_url,
  land_shard_mine_icon_url,
  land_under_construction_icon_url,
} from "@/scripts/statics_icon_urls";
import { Box } from "@mui/material";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

const worksiteTypeMapping: { [key: string]: string } = {
  "Grain Farm": land_grain_farm_icon_url,
  "Logging Camp": land_logging_camp_icon_url,
  "Ore Mine": land_ore_mine_icon_url,
  Quarry: land_quarry_icon_url,
  "Research Hut": land_research_hut_icon_url,
  "Aura Lab": land_aura_lab_icon_url,
  "Shard Mine": land_shard_mine_icon_url,
  KEEP: land_keep_icon_url,
  CASTLE: land_castle_icon_url,
  Undeveloped: land_under_construction_icon_url,
};

type WorksiteTypeTileProps = {
  data: Record<string, number>;
};

export default function WorksiteTypeTile({ data }: WorksiteTypeTileProps) {
  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Worksite Types:
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={1}>
        {Object.entries(data ?? {}).map(([type, count]) => {
          const imageUrl =
            worksiteTypeMapping[type] ?? worksiteTypeMapping["Undeveloped"];
          return (
            <SummaryTile
              key={type}
              type={type}
              imageUrl={imageUrl}
              count={Number(count)}
            />
          );
        })}
      </Box>
    </Paper>
  );
}
