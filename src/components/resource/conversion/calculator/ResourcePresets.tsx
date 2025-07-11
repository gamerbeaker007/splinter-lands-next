"use client";

import { Box, IconButton, Tooltip } from "@mui/material";
import Image from "next/image";
import {
  resource_auction_mark_icon_url,
  resource_fortune_ticket_icon_url,
  resource_midnight_potion_icon_url,
  resource_wagon_kit_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { Clear } from "@mui/icons-material";
import Typography from "@mui/material/Typography";

type PresetName = "wagons" | "auction" | "fortune" | "midnight" | "clear";

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
