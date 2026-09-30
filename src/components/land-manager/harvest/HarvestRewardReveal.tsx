"use client";

import { resolveCardUidArt } from "@/components/ui/CardUidImage";
import type { HarvestReward } from "@/lib/shared/harvestRewards";
import {
  labors_luck_icon_url,
  totem_fragment_icon_url,
} from "@/lib/shared/statics_icon_urls";
import {
  totemFragmentImg,
  totemFragmentLabel,
  totemFragmentRarity,
} from "@/lib/utils/totemFragmentUtil";
import type { CardFoil } from "@/types/planner";
import type { SplCardDetails } from "@/types/splCardDetails";
import { keyframes } from "@emotion/react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
} from "@mui/material";
import Image from "next/image";

/** One reveal, per item: from small to full size while spinning once. */
export const REVEAL_DURATION_MS = 1100;
/** Items land one after another rather than all at once. */
export const REVEAL_STAGGER_MS = 450;

const spinIn = keyframes`
  0%   { transform: scale(0.1) rotate(-360deg); opacity: 0; }
  60%  { opacity: 1; }
  80%  { transform: scale(1.08) rotate(0deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const CARD_WIDTH = 170;
const FRAGMENT_SIZE = 130;

const FOIL_GLOW: Record<CardFoil, string> = {
  regular: "rgba(255,255,255,0.35)",
  gold: "rgba(255,193,7,0.75)",
  "gold arcane": "rgba(255,213,79,0.95)",
  black: "rgba(156,39,176,0.75)",
  "black arcane": "rgba(206,147,216,0.95)",
};

const FRAGMENT_GLOW: Record<string, string> = {
  common: "rgba(255,255,255,0.45)",
  rare: "rgba(33,150,243,0.8)",
  epic: "rgba(156,39,176,0.85)",
  legendary: "rgba(255,193,7,0.9)",
};

export interface HarvestRewardRevealProps {
  open: boolean;
  /** The special drops of the run that just finished. */
  rewards: HarvestReward[];
  /** Needed to turn a Labor's Luck card uid into artwork. */
  cardDetails: SplCardDetails[] | null;
  onClose: () => void;
}

function revealSx(index: number) {
  return {
    animation: `${spinIn} ${REVEAL_DURATION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${index * REVEAL_STAGGER_MS}ms both`,
    "@media (prefers-reduced-motion: reduce)": {
      animation: `${fadeIn} 400ms ease-out ${index * 150}ms both`,
    },
  };
}

function captionSx(index: number) {
  return {
    animation: `${fadeIn} 400ms ease-out ${index * REVEAL_STAGGER_MS + REVEAL_DURATION_MS * 0.8}ms both`,
  };
}

function RewardItem({
  reward,
  index,
  cardDetails,
}: {
  reward: HarvestReward;
  index: number;
  cardDetails: SplCardDetails[] | null;
}) {
  if (reward.kind === "card") {
    const art = resolveCardUidArt(reward.treasure.uid, cardDetails);
    const glow = FOIL_GLOW[art?.foil ?? "regular"];
    return (
      <Stack alignItems="center" gap={1}>
        <Box
          sx={{
            width: CARD_WIDTH,
            aspectRatio: "5 / 7",
            position: "relative",
            borderRadius: 2,
            filter: `drop-shadow(0 0 14px ${glow})`,
            ...revealSx(index),
          }}
        >
          {art ? (
            <Image
              src={art.img}
              alt={art.name}
              fill
              sizes={`${CARD_WIDTH}px`}
              style={{ objectFit: "contain" }}
            />
          ) : (
            // Card details still loading or unknown: the Labor's Luck icon.
            <Image
              src={labors_luck_icon_url}
              alt="Labor's Luck card"
              fill
              sizes={`${CARD_WIDTH}px`}
              style={{ objectFit: "contain", padding: 24 }}
            />
          )}
        </Box>
        <Box textAlign="center" sx={captionSx(index)}>
          <Typography variant="subtitle2" fontWeight={700} color="common.white">
            {art?.name ?? reward.treasure.uid}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.7)", textTransform: "capitalize" }}
          >
            Labor&apos;s Luck · {art?.foil ?? "card"}
          </Typography>
        </Box>
      </Stack>
    );
  }

  const rarity = totemFragmentRarity(reward.fragmentType) ?? "common";
  const img =
    totemFragmentImg(reward.fragmentType) ?? totem_fragment_icon_url(rarity);
  const label = totemFragmentLabel(reward.fragmentType);
  return (
    <Stack alignItems="center" gap={1}>
      <Box
        sx={{
          width: FRAGMENT_SIZE,
          height: FRAGMENT_SIZE,
          position: "relative",
          filter: `drop-shadow(0 0 16px ${FRAGMENT_GLOW[rarity]})`,
          ...revealSx(index),
        }}
      >
        <Image
          src={img}
          alt={label}
          fill
          sizes={`${FRAGMENT_SIZE}px`}
          style={{ objectFit: "contain" }}
        />
      </Box>
      <Box textAlign="center" sx={captionSx(index)}>
        <Typography variant="subtitle2" fontWeight={700} color="common.white">
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
          Totem fragment
        </Typography>
      </Box>
    </Stack>
  );
}

function headline(rewards: HarvestReward[]): string {
  const cards = rewards.filter((r) => r.kind === "card").length;
  const fragments = rewards.length - cards;
  if (cards > 0 && fragments > 0) return "Lucky harvest!";
  if (cards > 0)
    return cards === 1 ? "Labor's Luck!" : `Labor's Luck ×${cards}!`;
  return fragments === 1
    ? "Totem fragment found!"
    : `${fragments} totem fragments found!`;
}

/**
 * Celebrates the special drops of a finished harvest: every Labor's Luck card
 * and totem fragment grows from small to full size while spinning once into
 * place, one after another. Pure props in — the rewards come from the confirmed
 * transactions (see `harvestRewardsFrom`).
 */
export default function HarvestRewardReveal({
  open,
  rewards,
  cardDetails,
  onClose,
}: HarvestRewardRevealProps) {
  return (
    <Dialog
      open={open && rewards.length > 0}
      onClose={onClose}
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            background:
              "radial-gradient(circle at 50% 40%, #3b2a5c 0%, #15101f 70%)",
            color: "common.white",
            borderRadius: 3,
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h5"
          fontWeight={800}
          textAlign="center"
          mb={3}
          sx={{ animation: `${fadeIn} 500ms ease-out both` }}
        >
          {headline(rewards)}
        </Typography>
        <Stack
          direction="row"
          flexWrap="wrap"
          justifyContent="center"
          gap={4}
          sx={{ minHeight: CARD_WIDTH, py: 1 }}
        >
          {rewards.map((reward, i) => (
            <RewardItem
              key={reward.key}
              reward={reward}
              index={i}
              cardDetails={cardDetails}
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2.5 }}>
        <Button size="small" variant="contained" onClick={onClose} autoFocus>
          Nice!
        </Button>
      </DialogActions>
    </Dialog>
  );
}
