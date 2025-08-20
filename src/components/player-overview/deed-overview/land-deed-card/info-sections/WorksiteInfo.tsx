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
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { Box } from "@mui/material";
import React from "react";

type Props = {
  worksiteType: string;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

const worksiteTypeMapping: Record<string, string> = {
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

export const WorksiteInfo: React.FC<Props> = ({
  worksiteType,
  pos = { x: "0px", y: "0px", w: "auto" },
}) => {
  const { x, y, w } = pos;

  const worksiteImage =
    worksiteTypeMapping[worksiteType] ?? land_under_construction_icon_url;

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: "left",
      }}
    >
      <Box borderRadius={1} bgcolor="rgba(70, 71, 70, 0.9)" minHeight={100}>
        <Box
          sx={{
            width: 110,
            height: 110,
            backgroundImage: `url(${worksiteImage})`,
            backgroundSize: "95%",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
          }}
        />
      </Box>
    </Box>
  );
};
