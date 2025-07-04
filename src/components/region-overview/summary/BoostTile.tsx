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
} from "@/lib/shared/statics_icon_urls";
import { Box, Paper, Typography } from "@mui/material";

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

interface BoostProps {
  titleBoosts: Partial<Record<string, number>>;
  runiBoosts: Partial<Record<string, number>>;
  totemBoosts: Partial<Record<string, number>>;
  rarityBoosts: Partial<Record<string, number>>;
}

const filterValidBoosts = ([type, count]: [string, number | undefined]) =>
  type !== "0" && type !== "0.0" && typeof count === "number";

export default function BoostTile({
  titleBoosts,
  runiBoosts,
  totemBoosts,
  rarityBoosts,
}: BoostProps) {
  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Boosts:
      </Typography>

      <Box
        py={2}
        mx="auto"
        display="flex"
        flexWrap="wrap"
        gap={2}
        justifyContent="center"
      >
        <SectionBox title="Titles">
          {Object.entries(titleBoosts)
            .filter(filterValidBoosts)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([type, count]) => {
              const meta = boostMetaMapTitle[type];
              return (
                meta && (
                  <SummaryTile
                    key={`title-${type}`}
                    type={meta.name}
                    imageUrl={meta.icon}
                    info={`Boost ${Number(type) * 100}%`}
                    count={Number(count)}
                  />
                )
              );
            })}
        </SectionBox>

        <SectionBox title="Rarity:">
          {Object.entries(rarityBoosts)
            .filter(filterValidBoosts)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([type, count]) => {
              const meta = boostMetaMapRarity[type];
              if (!meta) return null;
              const image = land_default_icon_url_placeholder.replace(
                "__NAME__",
                meta.name.toLowerCase(),
              );
              return (
                <SummaryTile
                  key={`rarity-${type}`}
                  type={meta.name}
                  imageUrl={image}
                  info={`Boost ${Number(type) * 100}%`}
                  count={Number(count)}
                />
              );
            })}
        </SectionBox>

        <SectionBox title="Runi:">
          {Object.entries(runiBoosts)
            .filter(filterValidBoosts)
            .map(([type, count]) => (
              <SummaryTile
                key={`runi-${type}`}
                type="Runi"
                imageUrl={land_runi_boost_icon_url}
                info={`Boost ${Number(type) * 100}%`}
                count={Number(count)}
              />
            ))}
        </SectionBox>

        <SectionBox title="Totems:">
          {Object.entries(totemBoosts)
            .filter(filterValidBoosts)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([type, count]) => {
              const meta = boostMetaMapTotem[type];
              return (
                meta && (
                  <SummaryTile
                    key={`totem-${type}`}
                    type={meta.name}
                    imageUrl={meta.icon}
                    info={`Boost ${Number(type) * 100}%`}
                    count={Number(count)}
                  />
                )
              );
            })}
        </SectionBox>
      </Box>
    </Paper>
  );
}

// Title Box Wrapper
function SectionBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      border={1}
      borderColor="grey.400"
      borderRadius={2}
      p={1}
      position="relative"
      sx={{
        flex: "1 1 300px", // Minimum 300px width, will grow if space allows
        maxWidth: "100%",
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold">
        {title}
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {children}
      </Box>
    </Box>
  );
}
