"use client";

import { DeedComplete } from "@/types/deed";
import {
  DeedType,
  MagicType,
  PlotModifiers,
  PlotRarity,
  PlotStatus,
} from "@/types/planner";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { IconButton, Stack, Tooltip } from "@mui/material";
import * as React from "react";
import { ImportDeedDialog } from "../ImportDeedDialog";
import { MagicTypeSelector } from "./DeedMagicTypeSelector";
import { PlotRaritySelector } from "./DeedRaritySelector";
import { PlotStatusSelector } from "./DeedStatusSelector";
import { DeedTypeSelector } from "./DeedTypeSelector";

type Props = {
  value: PlotModifiers;
  magicType: MagicType;
  onRarityChange: (r: PlotRarity) => void;
  onPlotStatusChange: (s: PlotStatus) => void;
  onMagicTypeChange: (m: MagicType) => void;
  onDeedTypeChange: (d: DeedType) => void;
  applyImportedDeed: (d: DeedComplete) => void;
};

export function PlannerControls({
  value,
  magicType,
  onRarityChange,
  onPlotStatusChange,
  onMagicTypeChange,
  onDeedTypeChange,
  applyImportedDeed,
}: Props) {
  const [importOpen, setImportOpen] = React.useState(false);

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ xs: "stretch", sm: "center" }}
    >
      <PlotRaritySelector
        value={value.plotRarity}
        onChange={(e) => onRarityChange(e as PlotRarity)}
      />

      <PlotStatusSelector
        value={value.plotStatus}
        onChange={(e) => onPlotStatusChange(e as PlotStatus)}
      />

      {value.plotStatus === "magical" && (
        <MagicTypeSelector
          value={magicType}
          onChange={(e) => onMagicTypeChange(e as MagicType)}
        />
      )}

      <DeedTypeSelector
        value={value.deedType}
        plotStatus={value.plotStatus}
        magicType={magicType}
        onChange={(e) => onDeedTypeChange(e as DeedType)}
      />

      {/* Right: Import button */}
      <Tooltip title="Import by Plot ID">
        <IconButton
          size="small"
          color="primary"
          aria-label="import plot"
          onClick={() => setImportOpen(true)}
          sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
        >
          <CloudDownloadIcon />
        </IconButton>
      </Tooltip>

      {/* Import dialog */}
      <ImportDeedDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(deed) => {
          applyImportedDeed(deed);
          setImportOpen(false);
        }}
      />
    </Stack>
  );
}
