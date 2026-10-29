"use client";

import { useBroadcastProgress } from "@/hooks/useBroadcastProgress";
import {
  HIVE_BLOCK_SECONDS,
  type SplProcessingLag,
} from "@/lib/shared/hive/sequencedBroadcast";
import { MAX_OPS_PER_BROADCAST } from "@/types/landManager";
import { Alert, LinearProgress, Typography } from "@mui/material";

/** Above this, SPL is noticeably slower than usual (~20-30 s is normal). */
const SPL_LAG_WARN_SECONDS = 60;
/** Per batch on top of SPL's lag: inclusion in a block plus the next-block guard. */
const BATCH_OVERHEAD_SECONDS = 6;

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(1, Math.round(totalSeconds));
  if (s < 60) return `${s} s`;
  const min = Math.floor(s / 60);
  const rest = s % 60;
  // Round to 10 s past a minute — these are estimates.
  const restRounded = Math.round(rest / 10) * 10;
  return restRounded > 0 && restRounded < 60
    ? `${min} min ${restRounded} s`
    : `${min + (restRounded === 60 ? 1 : 0)} min`;
}

interface Props {
  /** SPL's current lag (`useSplProcessingLag`); nothing is shown before a run without it. */
  lag?: SplProcessingLag;
  /** Ops about to be broadcast, when known — enables a total estimate. */
  opCount?: number;
}

/**
 * Before a run: how far Splinterlands is behind and what that means for this
 * run's duration. During a run: which batch is where, live.
 */
export default function BroadcastStatusNotice({ lag, opCount }: Props) {
  const run = useBroadcastProgress();

  if (run) return <RunProgress />;
  if (!lag) return null;

  const slow = lag.seconds >= SPL_LAG_WARN_SECONDS;
  const batches =
    opCount !== undefined
      ? Math.ceil(opCount / MAX_OPS_PER_BROADCAST)
      : undefined;
  const perBatch = lag.seconds + BATCH_OVERHEAD_SECONDS;

  // Normal lag and a single batch: nothing worth interrupting the player for.
  if (!slow && (batches === undefined || batches <= 1)) return null;

  return (
    <Alert severity={slow ? "warning" : "info"} sx={{ mb: 1.5 }}>
      <Typography variant="body2">
        {slow
          ? `Splinterlands is processing slowly: about ${formatDuration(lag.seconds)} (${lag.blocksBehind} blocks) behind Hive. `
          : `Splinterlands is about ${formatDuration(lag.seconds)} behind Hive. `}
        {batches !== undefined && batches > 1
          ? `Each of the ${batches} batches is confirmed before the next is sent, so this takes about ${formatDuration(batches * perBatch)} plus signing.`
          : `Each batch waits about ${formatDuration(perBatch)} for confirmation before the next is sent.`}
        {slow &&
          " You can switch tabs while it runs, but keep this tab open until it finishes."}
      </Typography>
    </Alert>
  );
}

function RunProgress() {
  const run = useBroadcastProgress();
  if (!run) return null;

  const batch = run.batch ?? 1;
  const of = run.totalBatches > 1 ? ` ${batch} of ${run.totalBatches}` : "";
  const behind = run.splBlocksBehind ?? 0;
  const text =
    run.phase === "confirming"
      ? `Batch${of} sent — waiting for Splinterlands to confirm it${behind > 0 ? ` (${behind} blocks behind, about ${formatDuration(behind * HIVE_BLOCK_SECONDS)})` : ""}.`
      : run.phase === "retrying"
        ? `Batch${of}: Hive's limit of 5 operations per block was reached — sign it once more.`
        : `Batch${of} — waiting for your signature in Keychain.`;
  const done = (batch - 1) / run.totalBatches;

  return (
    <Alert severity="info" sx={{ mb: 1.5 }}>
      <Typography variant="body2">{text}</Typography>
      <Typography variant="caption" color="text.secondary">
        Keep this tab open until the run finishes; switching tabs is fine.
      </Typography>
      <LinearProgress
        variant={run.totalBatches > 1 ? "determinate" : "indeterminate"}
        value={done * 100}
        sx={{ mt: 1 }}
      />
    </Alert>
  );
}
