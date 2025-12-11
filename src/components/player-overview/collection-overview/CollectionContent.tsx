"use client";

import ErrorComponent from "@/components/ui/ErrorComponent";
import LoadingComponent from "@/components/ui/LoadingComponent";
import { usePlayerCardPP } from "@/hooks/action-based/usePlayerCardPP";
import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import CollectionDisplay from "./CollectionDisplay";

export default function CollectionContent() {
  const { selectedPlayer } = usePlayer();
  const { cardFilters } = useCardFilters();
  const { cardPPResult, loading, error } = usePlayerCardPP(
    selectedPlayer,
    cardFilters
  );

  if (loading) {
    return <LoadingComponent title="Loading card collection..." />;
  }

  if (error) {
    return <ErrorComponent title={`Failed to load collection: ${error}`} />;
  }

  if (!selectedPlayer || !cardPPResult) {
    return null;
  }

  return (
    <CollectionDisplay cardPPResult={cardPPResult} player={selectedPlayer} />
  );
}
