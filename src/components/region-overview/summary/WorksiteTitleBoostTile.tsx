"use client";

import SummaryTile from "@/components/ui/region/SummaryTile";
import {
  land_common_totem_icon_url_placeholder,
  land_default_icon_url_placeholder,
  land_epic_totem_icon_url_placeholder,
  land_legendary_totem_icon_url_placeholder,
  land_rare_totem_icon_url_placeholder,
  land_runi_boost_icon_url,
  land_title_epic_icon_url,
  land_title_legendary_icon_url,
  land_title_rare_icon_url,
} from "@/scripts/statics_icon_urls";
import { Box } from "@mui/material";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

const boostMetaMapTitle: Record<string, { name: string; icon: string }> = {
  "0.1": { name: "Rare", icon: land_title_rare_icon_url },
  "0.25": { name: "Epic", icon: land_title_epic_icon_url },
  "0.5": { name: "Legendary", icon: land_title_legendary_icon_url },
};

const boostMetaMapRarity: Record<string, { name: string }> = {
  "0.1": { name: "Rare" },
  "0.4": { name: "Epic" },
  "1": { name: "Legendary" },
};

const boostMetaMapTotem: Record<string, { name: string; icon: string }> = {
  "0.1": { name: "Common", icon: land_common_totem_icon_url_placeholder },
  "0.25": { name: "Rare", icon: land_rare_totem_icon_url_placeholder },
  "0.5": { name: "Epic", icon: land_epic_totem_icon_url_placeholder },
  "1": { name: "Legendary", icon: land_legendary_totem_icon_url_placeholder },
};

interface WorksiteBoostProps {
  titleBoosts: Partial<Record<"0" | "0.0" | "0.1" | "0.25" | "0.5", number>>;
  runiBoosts: Partial<Record<"0" | "0.0" | "0.1" | "0.25" | "0.5", number>>;
  totemBoosts: Partial<Record<"0" | "0.0" | "0.1" | "0.25" | "0.5", number>>;
  rarityBoosts: Partial<Record<"0" | "0.0" | "0.1" | "0.25" | "0.5", number>>;
}

export default function WorksiteBoostTile({
  titleBoosts,
  runiBoosts,
  totemBoosts,
  rarityBoosts,
}: WorksiteBoostProps) {
  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Boosts:
      </Typography>

      <Box px={{ xs: 2, sm: 4, md: 6 }} py={2} maxWidth="1000px" mx="auto">
        <Box display="flex" flexWrap="wrap" gap={1}>
          {Object.entries(titleBoosts ?? {})
            .filter(([type]) => type !== "0" && type !== "0.0")
            .map(([type, count]) => {
              const meta = boostMetaMapTitle[type];
              if (!meta) return null;

              return (
                <SummaryTile
                  key={type}
                  type={`Title: ${meta.name}`}
                  imageUrl={meta.icon}
                  info={`Boost ${Number(type) * 100}%`}
                  count={count}
                />
              );
            })}
        </Box>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {Object.entries(rarityBoosts ?? {}).map(([type, count]) => {
            const meta = boostMetaMapRarity[type];
            if (!meta) return null;
            const image = land_default_icon_url_placeholder.replace(
              "__NAME__",
              meta.name.toLowerCase(),
            );
            return (
              <SummaryTile
                key={type}
                type={`Rarity: ${meta.name}`}
                imageUrl={image}
                info={`Boost ${Number(type) * 100}%`}
                count={count}
              />
            );
          })}
        </Box>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {Object.entries(runiBoosts ?? {})
            .filter(([type]) => type !== "0" && type !== "0.0")
            .map(([type, count]) => {
              return (
                <SummaryTile
                  key={type}
                  type="Runi"
                  imageUrl={land_runi_boost_icon_url}
                  info={`Boost ${Number(type) * 100}%`}
                  count={count}
                />
              );
            })}
        </Box>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {Object.entries(totemBoosts ?? {})
            .filter(([type]) => type !== "0" && type !== "0.0")
            .map(([type, count]) => {
              const meta = boostMetaMapTotem[type];

              if (!meta) return null;
              return (
                <SummaryTile
                  key={type}
                  type={`Totem: ${meta.name}`}
                  imageUrl={meta.icon}
                  info={`Boost ${Number(type) * 100}%`}
                  count={count}
                />
              );
            })}
        </Box>
      </Box>
    </Paper>
  );
}
