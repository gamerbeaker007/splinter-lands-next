"use client";

import FoilIcon from "@/components/ui/FoilIcon";
import { land_default_element_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import { cardSetIconMap, SlotInput } from "@/types/planner";
import { DeedChange, PlaygroundCard, PlaygroundDeed } from "@/types/playground";
import DownloadIcon from "@mui/icons-material/Download";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useMemo, useState } from "react";

type WorkerMovement = {
  cardUid: string;
  fromPlot: string;
  toPlot: string;
  hasCooldown: boolean;
};

type ChangesDialogProps = {
  open: boolean;
  onClose: () => void;
  changes: DeedChange[];
  deeds: PlaygroundDeed[];
  allCards: PlaygroundCard[];
};

export default function ChangesDialog({
  open,
  onClose,
  changes,
  deeds,
  allCards,
}: ChangesDialogProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const getElementIcon = (element: string) => {
    return land_default_element_icon_url_placeholder.replace(
      "__NAME__",
      element.toLowerCase()
    );
  };

  const getCardByUid = (uid: string): PlaygroundCard | undefined => {
    return allCards.find((c) => c.uid === uid);
  };

  const { workerMovements, groupedChanges } = useMemo(() => {
    // Create a map of deed UIDs to plot identifiers
    const deedMap = new Map<string, string>();
    deeds.forEach((deed) => {
      deedMap.set(
        deed.deed_uid,
        `Region ${deed.region_number} / Tract ${deed.tract_number} / Plot ${deed.plot_number}`
      );
    });

    // Track worker movements
    const workerTracker = new Map<string, { from: string[]; to: string[] }>();

    changes.forEach((change) => {
      const isWorkerField = change.field.startsWith("worker");
      if (!isWorkerField) return;

      const plotId = deedMap.get(change.deed_uid) || change.deed_uid;

      // Extract card UID from SlotInput or string
      const getCardUid = (
        value: number | string | SlotInput | null
      ): string | null => {
        if (!value) return null;
        if (typeof value === "string") return value;
        if (typeof value === "number") return String(value);
        // It's a SlotInput
        const slotInput = value as SlotInput;
        return slotInput.uid || null;
      };

      const oldCardUid = getCardUid(change.oldValue);
      const newCardUid = getCardUid(change.newValue);

      // Worker removed (or replaced)
      if (oldCardUid) {
        if (!workerTracker.has(oldCardUid)) {
          workerTracker.set(oldCardUid, { from: [], to: [] });
        }
        workerTracker.get(oldCardUid)!.from.push(plotId);
      }

      // Worker added (or replaced)
      if (newCardUid) {
        if (!workerTracker.has(newCardUid)) {
          workerTracker.set(newCardUid, { from: [], to: [] });
        }
        workerTracker.get(newCardUid)!.to.push(plotId);
      }
    });

    // Identify movements (removed from one plot and added to another)
    const movements: WorkerMovement[] = [];
    workerTracker.forEach((tracking, cardUid) => {
      if (tracking.from.length > 0 && tracking.to.length > 0) {
        tracking.from.forEach((fromPlot) => {
          tracking.to.forEach((toPlot) => {
            movements.push({
              cardUid,
              fromPlot,
              toPlot,
              hasCooldown: true,
            });
          });
        });
      }
    });

    // Group changes by deed
    const grouped = new Map<string, DeedChange[]>();
    changes.forEach((change) => {
      const plotId = deedMap.get(change.deed_uid) || change.deed_uid;
      if (!grouped.has(plotId)) {
        grouped.set(plotId, []);
      }
      grouped.get(plotId)!.push(change);
    });

    return { workerMovements: movements, groupedChanges: grouped };
  }, [changes, deeds]);

  const handleToggle = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  const handleExport = () => {
    const content = generateTodoListText(
      groupedChanges,
      workerMovements,
      checkedItems,
      formatValueForText
    );
    downloadTextFile(content, "deed_changes_todo_list.txt");
  };

  const formatValue = (
    value: number | string | SlotInput | null
  ): React.ReactNode => {
    if (value === null || value === undefined) return "None";
    if (typeof value === "string" || typeof value === "number")
      return String(value);

    // It's a SlotInput (worker card)
    const slotInput = value as SlotInput;
    const card = slotInput.uid ? getCardByUid(slotInput.uid) : null;

    if (!card) {
      return `Card ${slotInput.uid || "Unknown"}`;
    }

    const elementIcon = getElementIcon(card.element);
    const setIcon = cardSetIconMap[card.set] || cardSetIconMap["chaos"];

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="caption" component="span" fontWeight="bold">
          {card.name}
        </Typography>
        <Typography variant="caption" component="span">
          -
        </Typography>
        <Typography variant="caption" component="span">
          Lvl {card.level}
        </Typography>
        <Typography variant="caption" component="span">
          -
        </Typography>
        <Image
          src={setIcon}
          alt="set"
          width={14}
          height={14}
          style={{ objectFit: "contain" }}
        />
        <Image
          src={elementIcon}
          alt="element"
          width={14}
          height={14}
          style={{ objectFit: "contain" }}
        />
        <FoilIcon foil={card.foil} size={14} />
        <Typography variant="caption" component="span" color="text.secondary">
          ({card.uid})
        </Typography>
      </Box>
    );
  };

  const formatValueForText = (
    value: number | string | SlotInput | null
  ): string => {
    if (value === null || value === undefined) return "None";
    if (typeof value === "string" || typeof value === "number")
      return String(value);

    // It's a SlotInput (worker card)
    const slotInput = value as SlotInput;
    const card = slotInput.uid ? getCardByUid(slotInput.uid) : null;

    if (!card) {
      return `Card ${slotInput.uid || "Unknown"}`;
    }

    const foilName =
      card.foil === "regular" ? "" : ` - ${card.foil.toUpperCase()}`;
    return `${card.name} - Lvl ${card.level} - ${card.set.toUpperCase()} - ${card.element.toUpperCase()}${foilName} (${card.uid})`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            maxHeight: "80vh",
          },
        },
      }}
    >
      <DialogTitle>
        <Box>
          <Box component="span" sx={{ fontSize: "1.25rem", fontWeight: 500 }}>
            Deed Changes Todo List
          </Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Review and export your planned changes
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Changes List */}
        <Typography variant="h6" gutterBottom>
          Changes by Plot ({groupedChanges.size} plots affected)
        </Typography>

        {Array.from(groupedChanges.entries()).map(
          ([plotId, plotChanges], plotIndex) => (
            <Box key={plotId} sx={{ mb: 2 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color="primary"
                gutterBottom
              >
                {plotId}
              </Typography>
              <List dense>
                {plotChanges.map((change, changeIndex) => {
                  const globalIndex = plotIndex * 100 + changeIndex; // Simple unique index

                  // Check if this change involves a worker with cooldown
                  const getCardUidFromValue = (
                    value: number | string | SlotInput | null
                  ): string | null => {
                    if (!value) return null;
                    if (typeof value === "string") return value;
                    if (typeof value === "number") return String(value);
                    const slotInput = value as SlotInput;
                    return slotInput.uid || null;
                  };

                  const newCardUid = getCardUidFromValue(change.newValue);

                  // Only show cooldown warning when worker is being added (To field)
                  const hasCooldown = newCardUid
                    ? workerMovements.some((m) => m.cardUid === newCardUid)
                    : false;

                  return (
                    <ListItem
                      key={globalIndex}
                      sx={{
                        bgcolor: "background.default",
                        mb: 0.5,
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        ...(hasCooldown && {
                          borderLeft: 3,
                          borderColor: "warning.main",
                        }),
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {changeIndex + 1}.
                        </Typography>
                      </ListItemIcon>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            Update {change.field}
                          </Typography>
                          {hasCooldown && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                bgcolor: "warning.main",
                                color: "warning.contrastText",
                                px: 0.75,
                                py: 0.25,
                                borderRadius: 1,
                                fontSize: "0.7rem",
                              }}
                            >
                              <WarningIcon sx={{ fontSize: 12 }} />
                              <Typography variant="caption" fontSize="0.7rem">
                                3-day cooldown
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                            fontSize: "0.75rem",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ minWidth: 40 }}
                            >
                              From:
                            </Typography>
                            {formatValue(change.oldValue)}
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ minWidth: 40 }}
                            >
                              To:
                            </Typography>
                            {formatValue(change.newValue)}
                          </Box>
                        </Box>
                      </Box>
                      <Checkbox
                        edge="end"
                        checked={checkedItems.has(globalIndex)}
                        onChange={() => handleToggle(globalIndex)}
                        sx={{ mt: 0.5 }}
                      />
                    </ListItem>
                  );
                })}
              </List>
              {plotIndex < groupedChanges.size - 1 && (
                <Divider sx={{ my: 1 }} />
              )}
            </Box>
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<DownloadIcon />}
        >
          Export as Text File
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function generateTodoListText(
  groupedChanges: Map<string, DeedChange[]>,
  workerMovements: WorkerMovement[],
  checkedItems: Set<number>,
  formatValue: (value: number | string | SlotInput | null) => string
): string {
  let content = "SPLINTERLANDS DEED CHANGES TODO LIST\n";
  content += "=====================================\n";
  content += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Add changes by plot
  content += "CHANGES BY PLOT\n";
  content += "===============\n\n";

  let plotNumber = 1;
  Array.from(groupedChanges.entries()).forEach(([plotId, plotChanges]) => {
    content += `Plot ${plotNumber}: ${plotId}\n`;
    content += "-".repeat(plotId.length + 8) + "\n";

    plotChanges.forEach((change, idx) => {
      const globalIndex = (plotNumber - 1) * 100 + idx;
      const checkbox = checkedItems.has(globalIndex) ? "[✓]" : "[ ]";
      const oldVal = formatValue(change.oldValue);
      const newVal = formatValue(change.newValue);

      // Check if this change involves a worker with cooldown
      const getCardUidFromValue = (
        value: number | string | SlotInput | null
      ): string | null => {
        if (!value) return null;
        if (typeof value === "string") return value;
        if (typeof value === "number") return String(value);
        const slotInput = value as SlotInput;
        return slotInput.uid || null;
      };

      const newCardUid = getCardUidFromValue(change.newValue);

      // Only show cooldown warning when worker is being added (To field)
      const hasCooldown = newCardUid
        ? workerMovements.some((m) => m.cardUid === newCardUid)
        : false;

      const cooldownWarning = hasCooldown ? " ⚠️ [3-DAY COOLDOWN]" : "";

      content += `${checkbox} ${idx + 1}. Update ${change.field}: ${oldVal} → ${newVal}${cooldownWarning}\n`;
    });

    content += "\n";
    plotNumber++;
  });

  content += "\n";
  content += `Total Changes: ${Array.from(groupedChanges.values()).reduce((sum, changes) => sum + changes.length, 0)}\n`;
  content += `Completed: ${checkedItems.size}\n`;

  return content;
}

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
