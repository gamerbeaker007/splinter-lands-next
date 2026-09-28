import ActionCard, {
  ActionCardColumn,
  buildActionStatuses,
} from "@/components/land-manager/harvest/ActionCard";
import type { BroadcastResult } from "@/lib/frontend/splBroadcast";
import { HarvestReward, harvestRewardsFrom } from "@/lib/shared/harvestRewards";
import {
  land_castle_icon_url,
  land_worksite_select_grain_icon_url,
} from "@/lib/shared/statics_icon_urls";
import {
  HarvestAllDeedResult,
  LaborsLuckTreasure,
  SplTrxResult,
} from "@/types/spl/trx";
import { SplCardDetails } from "@/types/splCardDetails";
import {
  Agriculture as HarvestIcon,
  AutoAwesome as MythicIcon,
} from "@mui/icons-material";
import { Alert, CircularProgress, Stack, Typography } from "@mui/material";
import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import HarvestRewardReveal from "./HarvestRewardReveal";

const meta: Meta<typeof HarvestRewardReveal> = {
  title: "Land Manager/Components/LandManager/Harvest/HarvestRewardReveal",
  component: HarvestRewardReveal,
  args: { open: true, onClose: () => {} },
};

export default meta;
type Story = StoryObj<typeof HarvestRewardReveal>;

// ── fixtures ──────────────────────────────────────────────────────────────────
//
// Everything here is static: no server action, hook or context is exercised.
// The simulations feed mocked *confirmed* transaction payloads through the same
// `harvestRewardsFrom` the live harvest hooks use, so what pops up here is what
// the live flow would reveal for those payloads.

// Only the fields the card artwork reads matter; the rest satisfies the type.
const cardDetails: SplCardDetails[] = [
  {
    id: 866,
    name: "Tireless Farmhand",
    color: "Blue",
    type: "Monster",
    sub_type: "",
    rarity: 1,
    is_starter: false,
    editions: "19",
    is_promo: false,
    no_pp: false,
    tier: 19,
  },
  {
    id: 500,
    name: "Fernheart",
    color: "Green",
    type: "Summoner",
    sub_type: "",
    rarity: 3,
    is_starter: false,
    editions: "8",
    is_promo: false,
    no_pp: false,
  },
];

function treasure(uid: string, cardDetailId: number, foil: number) {
  return {
    uid,
    card_detail_id: cardDetailId,
    xp: 1,
    gold: foil > 0,
    tier: 19,
    foil,
    mint: null,
  } satisfies LaborsLuckTreasure;
}

const REGULAR_CARD = treasure("C19-866-1A2B3C4D5E", 866, 0);
const GOLD_CARD = treasure("G19-866-2632A608C0", 866, 1);
const BLACK_ARCANE_CARD = treasure("BA8-500-9F1C77B2D1", 500, 4);

function harvestDeedResult(
  overrides: Partial<HarvestAllDeedResult> = {}
): HarvestAllDeedResult {
  return {
    id: 109512,
    project_number: 2,
    deed_uid: "I-299-2ba36c7a1079f9",
    plot_id: 5800,
    tract_number: 1,
    region_number: 58,
    land_work_type_id: 10,
    resource_amount: 1217664,
    received_amount: 1095897.6,
    tax_amount: 121766.4,
    resource_symbol: "GRAIN",
    result_message: "Successful",
    grain_eaten: 115920,
    grain_rewards_eaten: 0,
    work_efficiency: 1,
    dec_spent: 0,
    is_worksite_transition: false,
    new_worksite_type: "",
    inputs_consumed: [],
    fragment_chance: 0,
    fragment_roll: 0,
    elapsed_hours: 168,
    ...overrides,
  };
}

/** One confirmed harvest_all per region; each deed may carry a treasure. */
function harvestAllTx(treasures: (LaborsLuckTreasure | null)[]): SplTrxResult {
  return {
    op: "harvest_all",
    result: {
      success: true,
      message: `${treasures.length} deeds were harvested`,
      results: treasures.map((t, i) =>
        harvestDeedResult({
          id: 109512 + i,
          deed_uid: `I-299-deed-${i}`,
          labors_luck_treasure: t,
        })
      ),
      deeds: [],
      num_worksite_transitions: 0,
    },
  };
}

/** One confirmed tax_collection per keep/castle. */
function taxCollectionTx(
  deedUid: string,
  kingdomType: "keep" | "castle",
  fragmentType: string | null
): SplTrxResult {
  return {
    op: "tax_collection",
    result: {
      deed_uid: deedUid,
      kingdom_type: kingdomType,
      elapsed_hours: 167.413,
      tokens: [
        { token: "SPS", received: "182.983" },
        { token: "GRAIN", received: "32979.353" },
      ],
      fragment_found: fragmentType !== null,
      fragment_chance: 0.17578365,
      fragment_roll: fragmentType !== null ? 0.0394 : 0.6,
      fragment_type: fragmentType,
    },
  };
}

const rewardsOf = (txs: SplTrxResult[]): HarvestReward[] =>
  harvestRewardsFrom(txs);

// ── simulator ─────────────────────────────────────────────────────────────────

interface SimulatorProps {
  kind: "harvest_all" | "harvest_mythics";
  /** The confirmed payloads SPL "returns" once the wait is over. */
  confirmedTxs: SplTrxResult[];
  /** How long the fake on-chain confirmation takes. */
  confirmDelayMs?: number;
}

/**
 * Mimics the live Harvest All / Harvest Mythics card: click → busy while
 * "waiting for the SPL result" → success status, and the reward reveal when the
 * confirmed payloads carry a Labor's Luck card or totem fragment.
 */
function HarvestSimulator({
  kind,
  confirmedTxs,
  confirmDelayMs = 2500,
}: SimulatorProps) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [rewards, setRewards] = useState<HarvestReward[]>([]);
  const [lastRunFound, setLastRunFound] = useState<number | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    setRewards([]);
    await new Promise((r) => setTimeout(r, confirmDelayMs));
    const found = harvestRewardsFrom(confirmedTxs);
    setResult({
      success: true,
      txIds: confirmedTxs.map((_, i) => `sim-tx-${i}`),
    });
    setRewards(found);
    setLastRunFound(found.length);
    setBusy(false);
  }

  const isMythic = kind === "harvest_mythics";

  return (
    <Stack gap={2} alignItems="flex-start">
      <Typography variant="body2" color="text.secondary">
        Click the card to simulate the run. The confirmation takes{" "}
        {confirmDelayMs / 1000}s, then the rewards are read from the mocked
        confirmed transactions.
      </Typography>
      <ActionCardColumn>
        <ActionCard
          title={isMythic ? "3. Harvest Mythics" : "2. Harvest All"}
          tooltip="Simulated — nothing is broadcast"
          backgroundImage={
            isMythic
              ? land_castle_icon_url
              : land_worksite_select_grain_icon_url
          }
          icon={isMythic ? <MythicIcon /> : <HarvestIcon />}
          accentColor={isMythic ? "secondary.main" : "success.main"}
          busy={busy}
          statuses={buildActionStatuses({ result })}
          onClick={run}
        />
        {busy && (
          <Alert severity="info" icon={<CircularProgress size={16} />}>
            Waiting for the SPL result…
          </Alert>
        )}
      </ActionCardColumn>
      {lastRunFound === 0 && (
        <Typography variant="caption" color="text.secondary">
          No special drops this run — no reveal is shown.
        </Typography>
      )}

      <HarvestRewardReveal
        open={rewards.length > 0}
        rewards={rewards}
        cardDetails={cardDetails}
        onClose={() => setRewards([])}
      />
    </Stack>
  );
}

// ── simulated runs ────────────────────────────────────────────────────────────

/** Harvest All where one deed wins the Labor's Luck roll. */
export const SimulateHarvestAllOneCard: Story = {
  render: () => (
    <HarvestSimulator
      kind="harvest_all"
      confirmedTxs={[harvestAllTx([null, GOLD_CARD, null])]}
    />
  ),
};

/** Harvest All across two regions with three Labor's Luck cards. */
export const SimulateHarvestAllMultipleCards: Story = {
  render: () => (
    <HarvestSimulator
      kind="harvest_all"
      confirmedTxs={[
        harvestAllTx([REGULAR_CARD, null, GOLD_CARD]),
        harvestAllTx([null, BLACK_ARCANE_CARD]),
      ]}
    />
  ),
};

/** Harvest All without luck — only the success status, no reveal. */
export const SimulateHarvestAllNoLuck: Story = {
  render: () => (
    <HarvestSimulator
      kind="harvest_all"
      confirmedTxs={[harvestAllTx([null, null, null])]}
    />
  ),
};

/** Harvest Mythics where one keep drops a fragment. */
export const SimulateHarvestMythicsOneFragment: Story = {
  render: () => (
    <HarvestSimulator
      kind="harvest_mythics"
      confirmedTxs={[
        taxCollectionTx("I-295-keep-1", "keep", "TOTEMFC"),
        taxCollectionTx("I-295-keep-2", "keep", null),
      ]}
    />
  ),
};

/** Harvest Mythics with a fragment of every rarity. */
export const SimulateHarvestMythicsMultipleFragments: Story = {
  render: () => (
    <HarvestSimulator
      kind="harvest_mythics"
      confirmedTxs={[
        taxCollectionTx("I-295-keep-1", "keep", "TOTEMFC"),
        taxCollectionTx("I-295-keep-2", "keep", "TOTEMFR"),
        taxCollectionTx("I-295-keep-3", "keep", "TOTEMFE"),
        taxCollectionTx("I-295-castle-1", "castle", "TOTEMFL"),
      ]}
    />
  ),
};

/** Harvest Mythics without luck — only the success status, no reveal. */
export const SimulateHarvestMythicsNoLuck: Story = {
  render: () => (
    <HarvestSimulator
      kind="harvest_mythics"
      confirmedTxs={[
        taxCollectionTx("I-295-keep-1", "keep", null),
        taxCollectionTx("I-295-castle-1", "castle", null),
      ]}
    />
  ),
};

// ── the reveal on its own ─────────────────────────────────────────────────────

/** A single Labor's Luck card. */
export const SingleCard: Story = {
  args: {
    rewards: rewardsOf([harvestAllTx([GOLD_CARD])]),
    cardDetails,
  },
};

/** Several cards of different foils — the glow follows the foil. */
export const MultipleCards: Story = {
  args: {
    rewards: rewardsOf([
      harvestAllTx([REGULAR_CARD, GOLD_CARD, BLACK_ARCANE_CARD]),
    ]),
    cardDetails,
  },
};

/** Card details still loading: the Labor's Luck icon stands in. */
export const CardDetailsLoading: Story = {
  args: {
    rewards: rewardsOf([harvestAllTx([GOLD_CARD])]),
    cardDetails: null,
  },
};

/** One fragment of each rarity. */
export const TotemFragments: Story = {
  args: {
    rewards: rewardsOf([
      taxCollectionTx("a", "keep", "TOTEMFC"),
      taxCollectionTx("b", "keep", "TOTEMFR"),
      taxCollectionTx("c", "keep", "TOTEMFE"),
      taxCollectionTx("d", "castle", "TOTEMFL"),
    ]),
    cardDetails,
  },
};

/** Cards and fragments together (e.g. a DEC power-up auto-harvest + taxes). */
export const Mixed: Story = {
  args: {
    rewards: rewardsOf([
      harvestAllTx([GOLD_CARD]),
      taxCollectionTx("a", "castle", "TOTEMFL"),
    ]),
    cardDetails,
  },
};
