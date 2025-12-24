"use client";

import { DeedChange, PlaygroundCard, PlaygroundDeed } from "@/types/playground";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box, Paper } from "@mui/material";
import { useMemo } from "react";
import DeedGridRow from "./DeedGridRow";

type PlaygroundDeedGridProps = {
  deeds: PlaygroundDeed[]; // Filtered deeds for display
  allDeeds: PlaygroundDeed[]; // All deeds for calculating available cards
  cards: PlaygroundCard[];
  cardDetails: SplCardDetails[];
  changes: DeedChange[];
  onDeedChange: (change: DeedChange) => void;
  itemsPerPage: number;
  currentPage: number;
};

export default function PlaygroundDeedGrid({
  deeds,
  allDeeds,
  cards,
  cardDetails,
  changes,
  onDeedChange,
  itemsPerPage,
  currentPage,
}: PlaygroundDeedGridProps) {
  // Get paginated deeds
  const paginatedDeeds = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return deeds.slice(start, end);
  }, [deeds, currentPage, itemsPerPage]);

  // Get available cards (not currently assigned to any deed)
  // Build final state of each deed (initial + pending changes), then collect assigned cards
  // Uses ALL deeds (not just filtered ones) to ensure filtered-out deeds still mark cards as unavailable
  const availableCards = useMemo(() => {
    // Create a map of deed_uid -> current worker assignments
    const deedWorkers = new Map<string, Set<string>>();

    // Initialize with persisted deed assignments from ALL deeds
    allDeeds.forEach((deed) => {
      const workers = new Set<string>();
      [
        deed.worker1Uid,
        deed.worker2Uid,
        deed.worker3Uid,
        deed.worker4Uid,
        deed.worker5Uid,
      ].forEach((slotInput) => {
        if (slotInput?.uid) {
          workers.add(slotInput.uid);
        }
      });
      deedWorkers.set(deed.deed_uid, workers);
    });

    // Apply pending changes to get final state
    changes.forEach((change) => {
      if (change.field.startsWith("worker")) {
        const workers = deedWorkers.get(change.deed_uid);
        if (workers) {
          // Remove old card from this deed
          if (change.oldValue && typeof change.oldValue === "string") {
            workers.delete(change.oldValue);
          }
          // Add new card to this deed
          if (change.newValue && typeof change.newValue === "string") {
            workers.add(change.newValue);
          }
        }
      }
    });

    // Collect all assigned cards from final state
    const assignedCardIds = new Set<string>();
    deedWorkers.forEach((workers) => {
      workers.forEach((uid) => assignedCardIds.add(uid));
    });

    return cards.filter((card) => !assignedCardIds.has(card.uid));
  }, [cards, allDeeds, changes]);

  const girdColumnsSizes =
    "120px 80px 80px 80px 120px 120px 100px 100px 100px 190px 190px 190px 190px 190px 250px";

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: 2100 }}>
          {/* Header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: girdColumnsSizes,
              bgcolor: "action.hover",
              p: 1,
              fontWeight: "bold",
              borderBottom: 1,
              borderColor: "divider",
              fontSize: "0.75rem",
            }}
          >
            <div>Tract/Region/Plot</div>
            <div>Rarity</div>
            <div>Geography</div>
            <div>Status</div>
            <div>Terrain Boosts</div>
            <div>Worksite</div>
            <div>Runi</div>
            <div>Title</div>
            <div>Totem</div>
            <div>Worker 1</div>
            <div>Worker 2</div>
            <div>Worker 3</div>
            <div>Worker 4</div>
            <div>Worker 5</div>
            <div>Output (Produce/Consume)</div>
          </Box>

          {/* Rows */}
          {paginatedDeeds.map((deed) => (
            <DeedGridRow
              key={deed.deed_uid}
              deed={deed}
              availableCards={availableCards.slice(0, 20)}
              allCards={cards}
              cardDetails={cardDetails}
              onChange={onDeedChange}
              girdColumnsSizes={girdColumnsSizes}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
