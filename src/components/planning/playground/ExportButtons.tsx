"use client";

import DownloadIcon from "@mui/icons-material/Download";
import { Box, Button } from "@mui/material";

type ExportButtonsProps = {
  onExportOriginal: () => void;
  onExportChanges: () => void;
  onExportNew: () => void;
  changesCount: number;
};

export default function ExportButtons({
  onExportOriginal,
  onExportChanges,
  onExportNew,
  changesCount,
}: ExportButtonsProps) {
  return (
    <Box sx={{ mb: 2, display: "flex", gap: 2, maxWidth: "100%" }}>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={onExportOriginal}
      >
        Export Original
      </Button>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={onExportChanges}
        disabled={changesCount === 0}
      >
        Export Changes ({changesCount})
      </Button>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={onExportNew}
      >
        Export Updated
      </Button>
    </Box>
  );
}
