"use client";

import { DeedComplete } from "@/types/deed";
import {
  DeedType,
  MagicType,
  PlotPlannerData,
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
import { NumberSelection } from "@/components/planning/planner/deed-editor/NumberSelector";

type Props = {
  value: PlotPlannerData;
  onRarityChange: (r: PlotRarity) => void;
  onPlotStatusChange: (s: PlotStatus) => void;
  onMagicTypeChange: (m: MagicType) => void;
  onDeedTypeChange: (d: DeedType) => void;
  onRegionChange: (n: number) => void;
  onTractChange: (n: number) => void;
  applyImportedDeed: (d: DeedComplete) => void;
};

export function PlannerControls({
  value,
  onRarityChange,
  onPlotStatusChange,
  onMagicTypeChange,
  onDeedTypeChange,
  onRegionChange,
  onTractChange,
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
        rarity={value.plotRarity}
        worksiteType={value.worksiteType}
        onChange={(e) => onPlotStatusChange(e as PlotStatus)}
      />

      {value.plotStatus === "magical" && (
        <MagicTypeSelector
          value={value.magicType}
          onChange={(e) => onMagicTypeChange(e as MagicType)}
        />
      )}

      <DeedTypeSelector
        value={value.deedType}
        plotStatus={value.plotStatus}
        magicType={value.magicType}
        onChange={(e) => onDeedTypeChange(e as DeedType)}
      />
      {value.plotStatus === "kingdom" && value.worksiteType === "KEEP" && (
        <>
          <NumberSelection
            text={"Region"}
            value={value.regionNumber}
            range={150}
            onChange={onRegionChange}
          />
          <NumberSelection
            text={"Tract"}
            value={value.tractNumber}
            range={100}
            onChange={onTractChange}
          />
        </>
      )}
      {value.plotStatus === "kingdom" && value.worksiteType === "CASTLE" && (
        <>
          <NumberSelection
            text={"Region"}
            value={value.regionNumber}
            range={150}
            onChange={onRegionChange}
          />
        </>
      )}

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
