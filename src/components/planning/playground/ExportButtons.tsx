"use client";

import { DeedChange, PlaygroundCard, PlaygroundDeed } from "@/types/playground";
import DownloadIcon from "@mui/icons-material/Download";
import ListIcon from "@mui/icons-material/List";
import { Box, Button } from "@mui/material";
import { useMemo, useState } from "react";
import ChangesDialog from "./ChangesDialog";

type ExportButtonsProps = {
  onExportOriginal: () => void;
  onExportNew: () => void;
  originalDeeds: PlaygroundDeed[];
  updatedDeeds: PlaygroundDeed[];
  allCards: PlaygroundCard[];
};

export default function ExportButtons({
  onExportOriginal,
  onExportNew,
  originalDeeds,
  updatedDeeds,
  allCards,
}: ExportButtonsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Calculate changes by comparing original and updated deeds
  const changes = useMemo((): DeedChange[] => {
    const changesList: DeedChange[] = [];

    updatedDeeds.forEach((updatedDeed) => {
      const originalDeed = originalDeeds.find(
        (d) => d.deed_uid === updatedDeed.deed_uid
      );
      if (!originalDeed) return;

      type ChangeField =
        | "worksite"
        | "runi"
        | "title"
        | "totem"
        | "worker1"
        | "worker2"
        | "worker3"
        | "worker4"
        | "worker5";

      const fieldMap: Record<
        keyof Pick<
          PlaygroundDeed,
          | "worksiteType"
          | "runi"
          | "titleTier"
          | "totemTier"
          | "worker1Uid"
          | "worker2Uid"
          | "worker3Uid"
          | "worker4Uid"
          | "worker5Uid"
        >,
        ChangeField
      > = {
        worksiteType: "worksite",
        runi: "runi",
        titleTier: "title",
        totemTier: "totem",
        worker1Uid: "worker1",
        worker2Uid: "worker2",
        worker3Uid: "worker3",
        worker4Uid: "worker4",
        worker5Uid: "worker5",
      };

      // Check each field that can change
      (Object.keys(fieldMap) as Array<keyof typeof fieldMap>).forEach(
        (deedField) => {
          const changeField = fieldMap[deedField];
          const oldValue = originalDeed[deedField];
          const newValue = updatedDeed[deedField];

          // Compare values (handle null/undefined/empty string)
          if (oldValue !== newValue) {
            changesList.push({
              deed_uid: updatedDeed.deed_uid,
              field: changeField,
              oldValue: oldValue as string | number | null,
              newValue: newValue as string | number | null,
              timestamp: new Date(),
            });
          }
        }
      );
    });

    return changesList;
  }, [originalDeeds, updatedDeeds]);

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
        deeds={originalDeeds}
        allCards={allCards}
      />
    </>
  );
}
