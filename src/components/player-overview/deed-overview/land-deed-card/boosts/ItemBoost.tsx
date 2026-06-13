// components/ItemBoosts.tsx
import React from "react";
import { Box, Typography, Avatar, Stack, Tooltip } from "@mui/material";
import {
  land_hammer_icon_url,
  land_runi_power_core_icon_url,
  WEB_URL,
} from "@/lib/shared/statics_icon_urls";
import { Item } from "@/types/stakedAssets";
import { getTitleIcon } from "@/lib/utils/deedUtil";

export type ItemBoostsProps = {
  items: Item[];
};

const defaultTotemMap: Record<string, string> = {
  "Common Totem": "1_common",
  "Rare Totem": "2_rare",
  "Epic Totem": "3_epic",
  "Legendary Totem": "4_legendary",
};

/** Resolve the icon URL for a staked land item (power core / totem / title). */
export function landItemIconUrl(stakeTypeUid: string, name: string): string {
  if (stakeTypeUid === "STK-LND-PCR") return land_runi_power_core_icon_url;
  if (stakeTypeUid === "STK-LND-TTL") {
    return getTitleIcon(name);
  }
  if (stakeTypeUid === "STK-LND-TOT") {
    const imageName =
      defaultTotemMap[name] ?? name.toLowerCase().replaceAll(" ", "_");
    return `${WEB_URL}website/icons/icon_totem_${imageName}_300.png`;
  }
  return land_hammer_icon_url;
}

export const ItemBoosts: React.FC<ItemBoostsProps> = ({ items }) => {
  const renderItem = (item: Item, index: number) => {
    const boostPercent = item.boost * 100;
    let url = "";
    let label = "";

    if (item.stake_type_uid === "STK-LND-TTL") {
      url = getTitleIcon(item.name);
      label = `Title: ${item.name}`;
    } else if (item.stake_type_uid === "STK-LND-TOT") {
      const imageName =
        defaultTotemMap[item.name] ??
        item.name.toLowerCase().replaceAll(" ", "_");
      url = `${WEB_URL}website/icons/icon_totem_${imageName}_300.png`;
      label = `${item.name}`;
    } else {
      return null; // skip unknown types
    }

    return (
      <Tooltip key={`${item.stake_type_uid}-${index}`} title={label}>
        <Box textAlign="center">
          <Typography fontWeight="bold" fontFamily="monospace" fontSize="14px">
            {boostPercent.toFixed(0)}%
          </Typography>
          <Avatar
            variant="square"
            src={url}
            alt={label}
            sx={{ width: 55, height: 55, mt: 0.5 }}
          />
        </Box>
      </Tooltip>
    );
  };

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      alignItems="flex-start"
    >
      {items.map(renderItem)}
    </Stack>
  );
};
