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

export interface WorksiteActionResult {
  success: boolean;
  txIds: string[];
  error?: string;
}

/** Identifies which button started the running action, so only it spins. */
export const worksiteBusyKey = {
  feed: "feed",
  cancel: "cancel",
  build: (opName: string) => `build:${opName}`,
} as const;

interface UseWorksiteActionReturn {
  busy: boolean;
  /**
   * Key of the action currently running (see `worksiteBusyKey`), or null. Lets a
   * card spin only the button that was pressed while disabling the rest.
   */
  busyKey: string | null;
  phase: ActionPhase;
  result: WorksiteActionResult | null;
  error: string | null;
  clearResult: () => void;
  buildWorksite: (
    username: string,
    regionUid: string,
    deedUid: string,
    opName: string
  ) => Promise<WorksiteActionResult>;
  cancelConstruction: (
    username: string,
    regionUid: string,
    deedUid: string,
    projectId: number
  ) => Promise<WorksiteActionResult>;
  feedWorkers: (
    username: string,
    regionUid: string,
    deedUid: string,
    projectId: number
  ) => Promise<WorksiteActionResult>;
}

export function useWorksiteAction(): UseWorksiteActionReturn {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<ActionPhase>("idle");
  const [result, setResult] = useState<WorksiteActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Broadcast a single op and wait for it to be accepted on chain. All three
   * actions share this so their busy/phase reporting cannot drift apart.
   */
  const run = useCallback(
    async (
      username: string,
      op: [string, object],
      key: string
    ): Promise<WorksiteActionResult> => {
      setBusyKey(key);
      setPhase("broadcasting");
      setError(null);
      try {
        const res = await broadcastOperations(username, [op]);
        if (!res.success) {
          const msg = res.error ?? "Broadcast failed";
          setError(msg);
          const r: WorksiteActionResult = {
            success: false,
            txIds: res.txIds,
            error: msg,
          };
          setResult(r);
          return r;
        }
        setPhase("confirming");
        await waitForTransactions(res.txIds);
        const r: WorksiteActionResult = { success: true, txIds: res.txIds };
        setResult(r);
        return r;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        const r: WorksiteActionResult = {
          success: false,
          txIds: [],
          error: msg,
        };
        setResult(r);
        return r;
      } finally {
        setBusyKey(null);
        setPhase("idle");
      }
    },
    []
  );

  const buildWorksite = useCallback(
    (username: string, regionUid: string, deedUid: string, opName: string) =>
      run(
        username,
        buildWorksiteConstructionOp(username, regionUid, deedUid, opName),
        worksiteBusyKey.build(opName)
      ),
    [run]
  );

  const cancelConstruction = useCallback(
    (username: string, regionUid: string, deedUid: string, projectId: number) =>
      run(
        username,
        buildCancelConstructionOp(username, regionUid, deedUid, projectId),
        worksiteBusyKey.cancel
      ),
    [run]
  );

  const feedWorkers = useCallback(
    (username: string, regionUid: string, deedUid: string, projectId: number) =>
      run(
        username,
        buildUpdateWorksiteOp(username, regionUid, deedUid, projectId),
        worksiteBusyKey.feed
      ),
    [run]
  );

  return {
    busy: busyKey !== null,
    busyKey,
    phase,
    result,
    error,
    clearResult: () => setResult(null),
    buildWorksite,
    cancelConstruction,
    feedWorkers,
  };
}
