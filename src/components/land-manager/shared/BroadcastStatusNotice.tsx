"use client";

import { useBroadcastProgress } from "@/hooks/useBroadcastProgress";
import {
  estimateRunSeconds,
  splConfirmSeconds,
  type SplProcessingLag,
} from "@/lib/shared/hive/splCatchUp";
import { MAX_OPS_PER_BROADCAST } from "@/types/landManager";
import { Alert, LinearProgress, Typography } from "@mui/material";

/** Above this, SPL is noticeably slower than usual (~20-30 s is normal). */
const SPL_LAG_WARN_SECONDS = 120;

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

/** "57 seconds", "5 minutes 20 seconds" — past a minute rounded to 10 s. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(1, Math.round(totalSeconds));
  if (s < 60) return plural(s, "second");
  const rounded = Math.round(s / 10) * 10;
  const min = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest > 0
    ? `${plural(min, "minute")} ${plural(rest, "second")}`
    : plural(min, "minute");
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

  // Normal lag and a single batch: nothing worth interrupting the player for.
  if (!slow && (batches === undefined || batches <= 1)) return null;

  return (
    <Alert severity={slow ? "warning" : "info"} sx={{ mb: 1.5 }}>
      <Typography variant="body2">
        {`Splinterlands is ${formatDuration(lag.seconds)} behind Hive. `}
        {batches !== undefined
          ? `Current estimated runtime is ${formatDuration(estimateRunSeconds(batches, lag.blocksBehind))}${batches > 1 ? ` (${batches} batches)` : ""}.`
          : `Confirming the result takes about ${formatDuration(splConfirmSeconds(lag.blocksBehind))}.`}
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

  let text: string;
  let done: number;
  if (run.phase === "confirming") {
    const ops =
      run.totalOps !== undefined && run.totalOps > 1
        ? ` (${run.settledOps ?? 0} of ${run.totalOps} confirmed)`
        : "";
    text =
      `All batches sent — waiting for Splinterlands to confirm them${ops}.` +
      (behind > 0
        ? ` It is ${behind} blocks behind, about ${formatDuration(splConfirmSeconds(behind))}.`
        : "");
    done = run.totalOps ? (run.settledOps ?? 0) / run.totalOps : 0;
  } else {
    text =
      run.phase === "including"
        ? `Batch${of} sent — waiting for it to be in a Hive block.`
        : run.phase === "retrying"
          ? `Batch${of}: Hive's limit of 5 operations per block was reached — sign it once more.`
          : `Batch${of} — waiting for your signature in Keychain.`;
    done = (batch - 1) / run.totalBatches;
  }
  const determinate = run.phase === "confirming" || run.totalBatches > 1;

  return (
    <Alert severity="info" sx={{ mb: 1.5 }}>
      <Typography variant="body2">{text}</Typography>
      <Typography variant="caption" color="text.secondary">
        Keep this tab open until the run finishes; switching tabs is fine.
      </Typography>
      <LinearProgress
        variant={determinate ? "determinate" : "indeterminate"}
        value={done * 100}
        sx={{ mt: 1 }}
      />
    </Alert>
  );
}
