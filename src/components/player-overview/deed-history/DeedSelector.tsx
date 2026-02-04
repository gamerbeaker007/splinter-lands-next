"use client";

import { useEnrichedPlayerDeeds } from "@/hooks/useEnrichedPlayerDeeds";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface DeedSelectorProps {
  currentDeedUid: string;
}

export default function DeedSelector({ currentDeedUid }: DeedSelectorProps) {
  const router = useRouter();
  const { selectedPlayer } = usePlayer();
  const { filters } = useFilters();
  const { deeds } = useEnrichedPlayerDeeds(selectedPlayer, filters);

  const deedOptions = useMemo(() => {
    if (!deeds || deeds.length === 0) return [];

    return deeds
      .filter((deed) => deed.deed_uid)
      .map((deed) => ({
        deed_uid: deed.deed_uid!,
        label: `R${deed.region_number} (${deed.region_name}) T${deed.tract_number} P${deed.plot_number} (${deed.worksite_type || "Undeveloped"})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [deeds]);

  const handleChange = (event: SelectChangeEvent) => {
    const newDeedUid = event.target.value;
    router.push(`/player-overview/deed-history/${newDeedUid}`);
  };

  if (!selectedPlayer || deedOptions.length === 0) {
    return null;
  }

  return (
    <FormControl sx={{ minWidth: 300 }} size="small">
      <InputLabel>Select Deed</InputLabel>
      <Select
        value={currentDeedUid}
        label="Select Deed"
        onChange={handleChange}
      >
        {deedOptions.map((option) => (
          <MenuItem key={option.deed_uid} value={option.deed_uid}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
