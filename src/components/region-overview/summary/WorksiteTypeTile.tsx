"use client";

import {
  formatNumber,
  toPascalCaseLabel,
} from "@/scripts/lib/utils/string_util";
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
import Image from "next/image";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { useFilters } from "@/lib/context/FilterContext";

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

export default function WorksiteTypeTile() {
  const [worksiteType, setWorksiteType] = useState<JSON | null>(null);
  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;

    fetch("/api/deed/worksite-types", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filters),
    })
      .then((res) => res.json())
      .then(setWorksiteType)
      .catch(console.error);
  }, [filters]);

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Worksite Types:
      </Typography>

      {worksiteType ? (
        <Box display="flex" flexWrap="wrap" gap={2}>
          {Object.entries(worksiteType).map(([type, count]) => {
            const imageUrl =
              worksiteTypeMapping[type] ?? worksiteTypeMapping["Undeveloped"];
            return (
              <Paper
                key={type}
                elevation={2}
                sx={{
                  width: 100,
                  height: 200,
                  p: 2,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                title={type || "Undeveloped"}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: 80,
                    mb: 1,
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={imageUrl}
                    alt={type}
                    fill
                    sizes="100px"
                    style={{ objectFit: "contain" }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  align="center"
                  sx={{ minHeight: 32 }}
                >
                  {toPascalCaseLabel(type)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  align="center"
                >
                  Count: {formatNumber(count)}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" align="center">
          Loading worksite data...
        </Typography>
      )}
    </Paper>
  );
}
