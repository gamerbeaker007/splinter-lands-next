"use client";

import { usePlayerInventory } from "@/hooks/usePlayerInventory";
import { PlaygroundCard, PlaygroundDeed } from "@/types/playground";
import { PlaygroundSummary } from "@/types/playgroundOutput";
import { Box } from "@mui/material";
import InventoryOverviewOutput from "./InventoryOverviewOutput";
import ResourceSimulationOutputTable from "./ResourceSimulationOutputTable";

type PlaygroundOverviewProps = {
  deeds: PlaygroundDeed[];
  originalOutputs: PlaygroundSummary;
  updatedOutputs: PlaygroundSummary;
  playerName: string | null;
  allCards: PlaygroundCard[];
};

export default function PlaygroundOverview({
  deeds,
  originalOutputs,
  updatedOutputs,
  playerName,
  allCards,
}: PlaygroundOverviewProps) {
  const { inventory, loadingInventory } = usePlayerInventory(playerName);

  return (
    <Box sx={{ mb: 2 }} gap={2}>
      <InventoryOverviewOutput
        deeds={deeds}
        inventory={inventory}
        loadingInventory={loadingInventory}
        allCards={allCards}
      />

      <ResourceSimulationOutputTable
        title="Original Output"
        outputs={originalOutputs}
      />

      <ResourceSimulationOutputTable
        title="Updated Output (with changes)"
        outputs={updatedOutputs}
      />
    </Box>
  );
}
