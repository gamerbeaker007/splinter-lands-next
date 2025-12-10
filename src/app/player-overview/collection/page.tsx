"use client";

import CardFilterDrawer from "@/components/cardFilter/CardFilterDrawer";
import CollectionContent from "@/components/player-overview/collection-overview/CollectionContent";
import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import { usePlayerOverview } from "../layout";

export default function Collection() {
  const { selectedPlayer } = usePlayerOverview();
  const { cardFilters } = useCardFilters();

  return (
    <>
      <CardFilterDrawer />
      <CollectionContent player={selectedPlayer} cardFilters={cardFilters} />
    </>
  );
}
