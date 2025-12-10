"use client";

import ErrorComponent from "@/components/ui/ErrorComponent";
import LoadingComponent from "@/components/ui/LoadingComponent";
import { usePlayerCardPP } from "@/hooks/action-based/usePlayerCardPP";
import { CardFilterInput } from "@/types/filters";
import CollectionDisplay from "./CollectionDisplay";

type Props = {
  player: string;
  cardFilters: CardFilterInput;
};

export default function CollectionContent({ player, cardFilters }: Props) {
  const { cardPPResult, loading, error } = usePlayerCardPP(player, cardFilters);

  if (loading) {
    return <LoadingComponent title="Loading card collection..." />;
  }

  if (error) {
    return <ErrorComponent title={`Failed to load collection: ${error}`} />;
  }

  if (!player || !cardPPResult) {
    return null;
  }

  return <CollectionDisplay cardPPResult={cardPPResult} player={player} />;
}
