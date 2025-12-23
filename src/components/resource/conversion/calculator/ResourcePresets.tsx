"use client";

import {
  resource_auction_mark_icon_url,
  resource_capacity_flux_icon_url,
  resource_fortune_ticket_icon_url,
  resource_midnight_potion_icon_url,
  resource_polymorph_potion_icon_url,
  resource_unbinding_common_icon_url,
  resource_unbinding_epic_icon_url,
  resource_unbinding_legendary_icon_url,
  resource_unbinding_rare_icon_url,
  resource_wagon_kit_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { Clear } from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import Typography from "@mui/material/Typography";
import Image from "next/image";

type PresetName =
  | "wagons"
  | "auction"
  | "fortune"
  | "midnight"
  | "unbinding common"
  | "unbinding rare"
  | "unbinding epic"
  | "unbinding legendary"
  | "polymorph potion"
  | "capacity flux"
  | "clear";

interface Preset {
  name: PresetName;
  label: string;
  iconSrc?: string;
  muiIcon?: React.ReactNode;
}

interface ResourcePresetsProps {
  onSelect: (preset: PresetName) => void;
}

const PRESETS: Preset[] = [
  {
    name: "wagons",
    label: "Wagon Kit",
    iconSrc: resource_wagon_kit_icon_url,
  },
  {
    name: "auction",
    label: "Auction Mark",
    iconSrc: resource_auction_mark_icon_url,
  },
  {
    name: "fortune",
    label: "Fortune Tickets",
    iconSrc: resource_fortune_ticket_icon_url,
  },
  {
    name: "midnight",
    label: "Midnight Potion",
    iconSrc: resource_midnight_potion_icon_url,
  },
  {
    name: "unbinding common",
    label: "Unbinding Common",
    iconSrc: resource_unbinding_common_icon_url,
  },
  {
    name: "unbinding rare",
    label: "Unbinding Rare",
    iconSrc: resource_unbinding_rare_icon_url,
  },
  {
    name: "unbinding epic",
    label: "Unbinding Epic",
    iconSrc: resource_unbinding_epic_icon_url,
  },
  {
    name: "unbinding legendary",
    label: "Unbinding Legendary",
    iconSrc: resource_unbinding_legendary_icon_url,
  },
  {
    name: "polymorph potion",
    label: "Polymorph Potion",
    iconSrc: resource_polymorph_potion_icon_url,
  },
  {
    name: "capacity flux",
    label: "Capacity Flux",
    iconSrc: resource_capacity_flux_icon_url,
  },
  {
    name: "clear",
    label: "Clear",
    muiIcon: <Clear sx={{ color: "error.main", fontSize: 32 }} />,
  },
];

export function ResourcePresets({ onSelect }: ResourcePresetsProps) {
  return (
    <Box
      display="flex"
      gap={2}
      justifyContent="center"
      flexWrap="wrap"
      mt={2}
      justifyItems={"center"}
    >
      <Typography variant={"h5"} mt={1}>
        {" "}
        Presets:
      </Typography>
      {PRESETS.map((preset) => (
        <Tooltip key={preset.name} title={preset.label} placement="top">
          <IconButton onClick={() => onSelect(preset.name)}>
            {preset.iconSrc ? (
              <Image
                src={preset.iconSrc}
                alt={preset.label}
                width={32}
                height={32}
              />
            ) : (
              preset.muiIcon
            )}
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
}
