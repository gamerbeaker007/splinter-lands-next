"use client";

import {
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { ActionPhase } from "@/lib/shared/actionPhase";
import {
  buildCancelConstructionOp,
  buildUpdateWorksiteOp,
  buildWorksiteConstructionOp,
} from "@/lib/shared/operations/opBuilders";
import { useCallback, useState } from "react";

export interface BulkWorksiteActionResult {
  success: boolean;
  txIds: string[];
  /** Number of plots included in the broadcast. */
  processed: number;
  error?: string;
}

export interface BulkFeedItem {
  regionUid: string;
  deedUid: string;
  projectId: number;
}

export interface BulkCancelItem {
  regionUid: string;
  deedUid: string;
  projectId: number;
}

export interface BulkBuildItem {
  regionUid: string;
  deedUid: string;
}

/** Identifies which bulk button started the running action, so only it spins. */
export const bulkBusyKey = {
  feed: "feed",
  cancel: "cancel",
  build: (opName: string) => `build:${opName}`,
} as const;

interface UseBulkWorksiteActionReturn {
  busy: boolean;
  /** Key of the running bulk action (see `bulkBusyKey`), or null. */
  busyKey: string | null;
  phase: ActionPhase;
  /**
   * Transactions confirmed so far / total in this run. Bulk ops are split into
   * several transactions, so a single spinner would otherwise sit still for
   * minutes on a large selection.
   */
  progress: { done: number; total: number } | null;
  result: BulkWorksiteActionResult | null;
  error: string | null;
  clearResult: () => void;
  /** Feed the workers on every listed plot (update_worksite). */
  feedWorkers: (
    username: string,
    items: BulkFeedItem[]
  ) => Promise<BulkWorksiteActionResult>;
  /** Start the same worksite construction on every listed plot. */
  buildWorksites: (
    username: string,
    items: BulkBuildItem[],
    opName: string
  ) => Promise<BulkWorksiteActionResult>;
  /** Cancel the running construction on every listed plot. */
  cancelConstructions: (
    username: string,
    items: BulkCancelItem[]
  ) => Promise<BulkWorksiteActionResult>;
}

/**
 * Bulk counterpart of `useWorksiteAction`.
 *
 * All ops for a run are handed to `broadcastOperations` in one go, which packs
 * them into the fewest possible transactions (MAX_OPS_PER_BROADCAST per tx) —
 * the same batching the other bulk actions (e.g. Power on plot) rely on.
 */
export function useBulkWorksiteAction(): UseBulkWorksiteActionReturn {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<ActionPhase>("idle");
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [result, setResult] = useState<BulkWorksiteActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (
      username: string,
      ops: [string, object][],
      processed: number,
      key: string
    ): Promise<BulkWorksiteActionResult> => {
      if (ops.length === 0) {
        const r: BulkWorksiteActionResult = {
          success: false,
          txIds: [],
          processed: 0,
          error: "Nothing to do — no eligible plots.",
        };
        setError(r.error!);
        setResult(r);
        return r;
      }
      setBusyKey(key);
      setPhase("broadcasting");
      setProgress(null);
      setError(null);
      try {
        const res = await broadcastOperations(username, ops);
        if (!res.success) {
          const msg = res.error ?? "Broadcast failed";
          setError(msg);
          const r: BulkWorksiteActionResult = {
            success: false,
            txIds: res.txIds,
            processed,
            error: msg,
          };
          setResult(r);
          return r;
        }
        // Confirm one transaction at a time so the button can count them off —
        // a bulk run spans several transactions and a static spinner would look
        // stuck for the whole wait.
        setPhase("confirming");
        setProgress({ done: 0, total: res.txIds.length });
        for (let i = 0; i < res.txIds.length; i++) {
          await waitForTransactions([res.txIds[i]]);
          setProgress({ done: i + 1, total: res.txIds.length });
        }
        const r: BulkWorksiteActionResult = {
          success: true,
          txIds: res.txIds,
          processed,
        };
        setResult(r);
        return r;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        const r: BulkWorksiteActionResult = {
          success: false,
          txIds: [],
          processed,
          error: msg,
        };
        setResult(r);
        return r;
      } finally {
        setBusyKey(null);
        setPhase("idle");
        setProgress(null);
      }
    },
    []
  );

  const feedWorkers = useCallback(
    (username: string, items: BulkFeedItem[]) =>
      run(
        username,
        items.map((i) =>
          buildUpdateWorksiteOp(username, i.regionUid, i.deedUid, i.projectId)
        ),
        items.length,
        bulkBusyKey.feed
      ),
    [run]
  );

  const buildWorksites = useCallback(
    (username: string, items: BulkBuildItem[], opName: string) =>
      run(
        username,
        items.map((i) =>
          buildWorksiteConstructionOp(username, i.regionUid, i.deedUid, opName)
        ),
        items.length,
        bulkBusyKey.build(opName)
      ),
    [run]
  );

  const cancelConstructions = useCallback(
    (username: string, items: BulkCancelItem[]) =>
      run(
        username,
        items.map((i) =>
          buildCancelConstructionOp(
            username,
            i.regionUid,
            i.deedUid,
            i.projectId
          )
        ),
        items.length,
        bulkBusyKey.cancel
      ),
    [run]
  );

  return {
    busy: busyKey !== null,
    busyKey,
    phase,
    progress,
    result,
    error,
    clearResult: () => setResult(null),
    feedWorkers,
    buildWorksites,
    cancelConstructions,
  };
}
