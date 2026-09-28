"use client";

import { useCardDetailsAction } from "@/hooks/useCardDetails";
import type { HarvestReward } from "@/lib/shared/harvestRewards";
import HarvestRewardReveal from "./HarvestRewardReveal";

/**
 * Container for the reward reveal: loads the card details the card artwork
 * needs. Mount it only when there is something to reveal, so a run without
 * special drops costs no extra fetch.
 */
export default function HarvestRewardDialog({
  rewards,
  onClose,
}: {
  rewards: HarvestReward[];
  onClose: () => void;
}) {
  const { cardDetails } = useCardDetailsAction();
  return (
    <HarvestRewardReveal
      open
      rewards={rewards}
      cardDetails={cardDetails}
      onClose={onClose}
    />
  );
}
