// components/ItemBoosts.tsx
import React from "react";
import { Box, Typography, Avatar, Stack } from "@mui/material";
import {
  land_hammer_icon_url,
  title_burninator_icon_url,
  title_dawnbringer_icon_url,
  title_defiant_icon_url,
  title_emissary_icon_url,
  title_explorer_icon_url,
  title_fable_scout_icon_url,
  title_gambler_icon_url,
  title_grandmaster_icon_url,
  title_high_roller_icon_url,
  title_incinerator_icon_url,
  title_legionnaire_icon_url,
  title_myth_hunter_icon_url,
  title_praetorian_icon_url,
  title_proven_icon_url,
  title_rebel_icon_url,
  title_renowned_icon_url,
  title_saga_seeker_icon_url,
  title_scorcher_icon_url,
  title_tower_mage_icon_url,
  title_untamed_icon_url,
  title_veteran_icon_url,
  title_watcher_icon_url,
  WEB_URL,
} from "@/lib/shared/statics_icon_urls";
import { Item } from "@/types/stakedAssets";

export type ItemBoostsProps = {
  items: Item[];
};

const defaultTotemMap: Record<string, string> = {
  "Common Totem": "1_common",
  "Rare Totem": "2_rare",
  "Epic Totem": "3_epic",
  "Legendary Totem": "4_legendary",
};

const titleIconMap: Record<string, string> = {
  untamed: title_untamed_icon_url,
  praetorian: title_praetorian_icon_url,
  explorer: title_explorer_icon_url,
  grandmaster: title_grandmaster_icon_url,
  legionnaire: title_legionnaire_icon_url,
  watcher: title_watcher_icon_url,
  gambler: title_gambler_icon_url,
  high_roller: title_high_roller_icon_url,
  burninator: title_burninator_icon_url,
  incinerator: title_incinerator_icon_url,
  scorcher: title_scorcher_icon_url,
  rebel: title_rebel_icon_url,
  defiant: title_defiant_icon_url,
  dawnbringer: title_dawnbringer_icon_url,
  tower_mage: title_tower_mage_icon_url,
  renowned: title_renowned_icon_url,
  veteran: title_veteran_icon_url,
  proven: title_proven_icon_url,
  myth_hunter: title_myth_hunter_icon_url,
  fable_scout: title_fable_scout_icon_url,
  saga_seeker: title_saga_seeker_icon_url,
  emissary: title_emissary_icon_url,
};

const fallbackTitleUrl = land_hammer_icon_url;

export const ItemBoosts: React.FC<ItemBoostsProps> = ({ items }) => {
  const findTitleIcon = (name: string): { url: string; label: string } => {
    const label = name;
    const normalized = name.toLowerCase().startsWith("the ")
      ? name.slice(4).toLowerCase()
      : name.toLowerCase();
    const imageName = normalized.replace(/ /g, "_");
    const url = titleIconMap[imageName] ?? fallbackTitleUrl;
    return { url, label };
  };

  const renderItem = (item: Item, index: number) => {
    const boostPercent = item.boost * 100;
    let url = "";
    let label = item.name;

    if (item.stake_type_uid === "STK-LND-TTL") {
      const result = findTitleIcon(item.name);
      url = result.url;
      label = result.label;
    } else if (item.stake_type_uid === "STK-LND-TOT") {
      const imageName =
        defaultTotemMap[item.name] ??
        item.name.toLowerCase().replace(/ /g, "_");
      url = `${WEB_URL}website/icons/icon_totem_${imageName}_300.png`;
    } else {
      return null; // skip unknown types
    }

    return (
      <Box key={`${item.stake_type_uid}-${index}`} textAlign="center">
        <Typography fontWeight="bold" fontFamily="monospace" fontSize="14px">
          {boostPercent.toFixed(0)}%
        </Typography>
        <Avatar
          variant="square"
          src={url}
          alt={label}
          sx={{ width: 50, height: 50, mt: 0.5 }}
        />
      </Box>
    );
  };

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      alignItems="flex-start"
      sx={{ ml: 1 }}
    >
      {items.map(renderItem)}
    </Stack>
  );
};
