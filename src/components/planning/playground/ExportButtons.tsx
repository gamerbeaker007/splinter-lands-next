"use client";

import { DeedChange, PlaygroundCard, PlaygroundDeed } from "@/types/playground";
import DownloadIcon from "@mui/icons-material/Download";
import ListIcon from "@mui/icons-material/List";
import { Box, Button } from "@mui/material";
import { useState } from "react";
import ChangesDialog from "./ChangesDialog";

type ExportButtonsProps = {
  onExportOriginal: () => void;
  onExportNew: () => void;
  changes: DeedChange[];
  deeds: PlaygroundDeed[];
  allCards: PlaygroundCard[];
};

export default function ExportButtons({
  onExportOriginal,
  onExportNew,
  changes,
  deeds,
  allCards,
}: ExportButtonsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Box sx={{ mb: 2, display: "flex", gap: 2, maxWidth: "100%" }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={onExportOriginal}
        >
          Export Original
        </Button>
        <Button
          variant="contained"
          startIcon={<ListIcon />}
          onClick={handleOpenDialog}
          disabled={changes.length === 0}
        >
          View Changes ({changes.length})
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={onExportNew}
        >
          Export Updated
        </Button>
      </Box>

      <ChangesDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        changes={changes}
        deeds={deeds}
        allCards={allCards}
      />
    </>
  );
}
