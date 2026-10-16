import { parseTrxInfo } from "@/lib/shared/spl/trxLookupParser";
import {
  HARVEST_MYTHICS_PRODUCTION_LOOKUPS,
  HARVEST_MYTHICS_PRODUCTION_OPS_PER_TX,
  HARVEST_MYTHICS_PRODUCTION_TX_IDS,
} from "@/lib/shared/fixtures/harvestMythicsProductionBatch";
import { harvestRewardsFrom } from "@/lib/shared/harvestRewards";
import { splOpTxIds } from "@/lib/shared/splTrxIds";
import { totemFragmentLabel } from "@/lib/utils/totemFragmentUtil";
import type { SplTrxResult } from "@/types/spl/trx";
import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useMemo, useState } from "react";
import { expect, waitFor, within } from "storybook/test";
import HarvestRewardReveal from "./HarvestRewardReveal";

// ── the production run ────────────────────────────────────────────────────────
//
// Harvest Mythics of 2026-10-11: 11 Hive txs × 4 tax_collection ops. The
// captured trx_info envelopes go through the same parser, SPL op-id mapping and
// reward extraction the live flow uses; nothing here hardcodes a reward.
//
//   per-op       → the fix: every op is looked up by its own SPL id
//                  (`<hiveTxId>-N`), as `BroadcastResult.opTxIds` does.
//   hive-tx-only → the original bug: only the Hive tx ids were looked up, so
//                  only op 0 of each batch was ever seen.

type LookupMode = "per-op" | "hive-tx-only";

function replayProductionRun(mode: LookupMode) {
  const lookedUp =
    mode === "per-op"
      ? HARVEST_MYTHICS_PRODUCTION_TX_IDS.flatMap((txId) =>
          splOpTxIds(txId, HARVEST_MYTHICS_PRODUCTION_OPS_PER_TX)
        )
      : HARVEST_MYTHICS_PRODUCTION_TX_IDS;
  const confirmed: (SplTrxResult | null)[] = lookedUp.map((id) => {
    const outcome = parseTrxInfo(HARVEST_MYTHICS_PRODUCTION_LOOKUPS[id]);
    return outcome.status === "success" ? outcome.result : null;
  });
  return { lookedUp, rewards: harvestRewardsFrom(confirmed) };
}

/** The reveal the fix must produce: all 9, sorted common → epic. */
const EXPECTED_SEQUENCE = [
  "Common",
  "Rare",
  "Rare",
  "Rare",
  "Rare",
  "Rare",
  "Rare",
  "Epic",
  "Epic",
].map((r) => `${r} Totem Fragment`);

// ── replay harness ────────────────────────────────────────────────────────────

interface ReplayProps {
  mode: LookupMode;
  /** Animation playback rate: 1 = live speed, 0.25 = four times slower. */
  speed: number;
}

function ProductionReplay({ mode, speed }: ReplayProps) {
  const { lookedUp, rewards } = useMemo(
    () => replayProductionRun(mode),
    [mode]
  );
  const [open, setOpen] = useState(false);
  // A new key remounts the reveal, which restarts every CSS animation.
  const [run, setRun] = useState(0);

  // CSS animations are reachable through the Web Animations API, so the live
  // component can be slowed down without changing it.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      for (const animation of document.getAnimations())
        animation.playbackRate = speed;
    });
    return () => cancelAnimationFrame(frame);
  }, [open, run, speed]);

  const counts = new Map<string, number>();
  for (const r of rewards)
    if (r.kind === "fragment") {
      const label = totemFragmentLabel(r.fragmentType);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

  return (
    <Stack gap={2} alignItems="flex-start" maxWidth={640}>
      <Alert severity={mode === "per-op" ? "success" : "error"}>
        {mode === "per-op"
          ? "Fixed: every op is looked up by its SPL id."
          : "Original bug: only the 11 Hive tx ids were looked up (op 0 of each batch)."}
      </Alert>
      <Typography variant="body2">
        {HARVEST_MYTHICS_PRODUCTION_TX_IDS.length} Hive transactions ·{" "}
        {lookedUp.length} SPL lookups · {rewards.length} fragment rolls
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {[...counts].map(([label, n]) => (
          <Chip key={label} size="small" label={`${label} ×${n}`} />
        ))}
      </Stack>
      <Stack direction="row" gap={1}>
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          disabled={open}
        >
          Start
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setRun((n) => n + 1);
            setOpen(true);
          }}
        >
          Replay
        </Button>
        <Button
          variant="text"
          onClick={() => {
            setOpen(false);
            setRun((n) => n + 1);
          }}
        >
          Reset
        </Button>
      </Stack>
      <HarvestRewardReveal
        key={run}
        open={open}
        rewards={rewards}
        cardDetails={null}
        onClose={() => setOpen(false)}
      />
    </Stack>
  );
}

// ── stories ───────────────────────────────────────────────────────────────────

const meta: Meta<typeof ProductionReplay> = {
  title: "HarvestAnimation/ProductionRegression",
  component: ProductionReplay,
  args: { speed: 1 },
  argTypes: {
    speed: {
      control: { type: "select" },
      options: [1, 0.5, 0.25, 0.1],
      description: "Animation playback rate (slow motion below 1).",
    },
    mode: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof ProductionReplay>;

async function startAndGetDialog(canvasElement: HTMLElement) {
  within(canvasElement).getByRole("button", { name: "Start" }).click();
  return within(document.body).findByRole("dialog");
}

async function waitForRevealToFinish(dialog: HTMLElement) {
  await waitFor(
    () => {
      const running = document
        .getAnimations()
        .filter((a) => {
          const target = (a.effect as KeyframeEffect | null)?.target;
          return target instanceof Node && dialog.contains(target);
        })
        // The autofocused button's focus ripple pulses forever — not part of
        // the reveal.
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .filter((a) => a.playState !== "finished");
      expect(running).toHaveLength(0);
    },
    { timeout: 15_000 }
  );
}

/** What the user should have seen: all 9 fragment rolls (6 R, 2 E, 1 C). */
export const ExpectedBehavior: Story = {
  args: { mode: "per-op" },
  play: async ({ canvasElement }) => {
    const dialog = await startAndGetDialog(canvasElement);
    const reveal = within(dialog);
    await expect(
      reveal.getByText("9 totem fragments found!")
    ).toBeInTheDocument();

    const fragments = reveal
      .getAllByRole("img")
      .map((img) => img.getAttribute("alt"));
    await expect(fragments).toEqual(EXPECTED_SEQUENCE);
    await expect(
      reveal.getAllByRole("img", { name: "Rare Totem Fragment" })
    ).toHaveLength(6);
    await expect(
      reveal.getAllByRole("img", { name: "Epic Totem Fragment" })
    ).toHaveLength(2);
    await expect(
      reveal.getAllByRole("img", { name: "Common Totem Fragment" })
    ).toHaveLength(1);

    await waitForRevealToFinish(dialog);
  },
};

/** What the user actually saw: only the 2 Rare fragments at op 0. */
export const OriginalBugReproduction: Story = {
  args: { mode: "hive-tx-only" },
  play: async ({ canvasElement }) => {
    const dialog = await startAndGetDialog(canvasElement);
    const reveal = within(dialog);
    await expect(
      reveal.getByText("2 totem fragments found!")
    ).toBeInTheDocument();
    await expect(
      reveal.getAllByRole("img").map((img) => img.getAttribute("alt"))
    ).toEqual(["Rare Totem Fragment", "Rare Totem Fragment"]);
    await waitForRevealToFinish(dialog);
  },
};
