"use client";

import {
  getPowerCoreInfo,
  lookupTransaction,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { getPlotStakeAssets } from "@/lib/backend/actions/land-manager/production-actions";
import { refreshCardCollection } from "@/lib/backend/actions/land-manager/renew-rental-actions";
import {
  broadcastOperations,
  KeychainKeyTypes,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import {
  buildEmptyPlotOp,
  buildStakeChangeOp,
  buildStakePowerCoreOp,
  buildUnstakePowerCoreOp,
  buildUnstakeWorkersOp,
  StakeChangeInput,
} from "@/lib/shared/operations/opBuilders";
import { MAX_OPS_PER_BROADCAST } from "@/types/landManager";
import { useCallback, useState } from "react";

export type ProductionActionKind =
  | "powerOn"
  | "unpower"
  | "removeWorkers"
  | "empty";

export interface ProductionSkip {
  deedUid: string;
  reason: string;
}

export interface ProductionActionResult {
  kind: ProductionActionKind;
  txIds: string[];
  /** Deeds whose op was broadcast successfully. */
  succeeded: string[];
  /** Deeds whose op was attempted but the broadcast failed/was rejected. */
  failed: string[];
  /** Deeds with nothing to do (e.g. no power core staked, no cores available). */
  skipped: ProductionSkip[];
  error: string | null;
}

interface Params {
  username: string;
  onSuccess?: () => void;
}

interface PlannedOp {
  deedUid: string;
  op: [string, object];
}

interface PlannedWork {
  ops: PlannedOp[];
  skipped: ProductionSkip[];
}

export interface UseProductionPlotActions {
  busy: boolean;
  result: ProductionActionResult | null;
  error: string | null;
  clearResult: () => void;
  clearError: () => void;
  /** Run an action over one or more deeds (single-plot = a one-element array). */
  run: (
    kind: ProductionActionKind,
    deedUids: string[]
  ) => Promise<ProductionActionResult | null>;
  /** Broadcast a combined stake/unstake change for one plot (Configure → Save). */
  saveStakeChange: (
    deedUid: string,
    input: StakeChangeInput
  ) => Promise<{ success: boolean; error?: string }>;
}

export function useProductionPlotActions({
  username,
  onSuccess,
}: Params): UseProductionPlotActions {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProductionActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const planWork = useCallback(
    async (
      kind: ProductionActionKind,
      deedUids: string[]
    ): Promise<PlannedWork> => {
      const ops: PlannedOp[] = [];
      const skipped: ProductionSkip[] = [];

      if (kind === "powerOn") {
        const info = await getPowerCoreInfo();
        if (info.error) throw new Error(info.error);
        const cores = info.ids;
        let coreIdx = 0;
        for (const deedUid of deedUids) {
          if (coreIdx < cores.length) {
            ops.push({
              deedUid,
              op: buildStakePowerCoreOp(username, deedUid, cores[coreIdx++]),
            });
          } else {
            skipped.push({ deedUid, reason: "No Power Core available" });
          }
        }
        return { ops, skipped };
      }

      // unpower / removeWorkers / empty all need the deed's staked UIDs.
      const assetsMap = await getPlotStakeAssets(deedUids);
      for (const deedUid of deedUids) {
        const a = assetsMap[deedUid];
        if (!a) {
          skipped.push({ deedUid, reason: "Could not load staked assets" });
          continue;
        }
        if (kind === "unpower") {
          if (!a.powerCoreItemUid) {
            skipped.push({ deedUid, reason: "No power core staked" });
            continue;
          }
          ops.push({
            deedUid,
            op: buildUnstakePowerCoreOp(username, deedUid, a.powerCoreItemUid),
          });
        } else if (kind === "removeWorkers") {
          if (a.cardUids.length === 0) {
            skipped.push({ deedUid, reason: "No workers staked" });
            continue;
          }
          // `cardUids` includes the Runi (it is a staked card). Unstaking it
          // alongside the workers is intentional — see the Confirm dialog copy.
          ops.push({
            deedUid,
            op: buildUnstakeWorkersOp(username, deedUid, a.cardUids),
          });
        } else {
          // empty
          if (a.cardUids.length === 0 && a.itemUids.length === 0) {
            skipped.push({ deedUid, reason: "Already empty" });
            continue;
          }
          ops.push({
            deedUid,
            op: buildEmptyPlotOp(username, deedUid, a.cardUids, a.itemUids),
          });
        }
      }
      return { ops, skipped };
    },
    [username]
  );

  const run = useCallback(
    async (
      kind: ProductionActionKind,
      deedUids: string[]
    ): Promise<ProductionActionResult | null> => {
      if (!username) {
        setError("Not logged in.");
        return null;
      }
      setBusy(true);
      setError(null);
      setResult(null);

      try {
        const { ops, skipped } = await planWork(kind, deedUids);

        // Nothing actionable — report the skips and stop (no Keychain popup).
        if (ops.length === 0) {
          const res: ProductionActionResult = {
            kind,
            txIds: [],
            succeeded: [],
            failed: [],
            skipped,
            error: null,
          };
          setResult(res);
          return res;
        }

        const broadcast = await broadcastOperations(
          username,
          ops.map((o) => o.op),
          KeychainKeyTypes.posting
        );

        // Each broadcast batch (MAX_OPS_PER_BROADCAST ops) is atomic and
        // broadcastOperations stops at the first rejected batch. A successful
        // broadcast means every batch landed — we can't key off txIds.length
        // there, because a batch can succeed without the node returning a txId
        // (broadcastOperations only records ids it actually gets back). On
        // failure we fall back to the count of returned txIds.
        const succeededBatches = broadcast.success
          ? Math.ceil(ops.length / MAX_OPS_PER_BROADCAST)
          : broadcast.txIds.length;
        const succeeded: string[] = [];
        const failed: string[] = [];
        ops.forEach((o, i) => {
          const batchIdx = Math.floor(i / MAX_OPS_PER_BROADCAST);
          if (batchIdx < succeededBatches) succeeded.push(o.deedUid);
          else failed.push(o.deedUid);
        });

        let phaseError: string | null = broadcast.success
          ? null
          : (broadcast.error ?? "Broadcast failed");

        if (broadcast.txIds.length > 0) {
          try {
            await waitForTransactions(broadcast.txIds, lookupTransaction);
          } catch (verifyErr) {
            phaseError =
              verifyErr instanceof Error
                ? verifyErr.message
                : "Transaction verification failed";
          }
          await refreshCardCollection();
        }

        const res: ProductionActionResult = {
          kind,
          txIds: broadcast.txIds,
          succeeded,
          failed,
          skipped,
          error: phaseError,
        };
        setResult(res);
        if (phaseError) setError(phaseError);
        else if (succeeded.length > 0) onSuccess?.();
        return res;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [username, planWork, onSuccess]
  );

  const saveStakeChange = useCallback(
    async (
      deedUid: string,
      input: StakeChangeInput
    ): Promise<{ success: boolean; error?: string }> => {
      if (!username) return { success: false, error: "Not logged in." };
      setBusy(true);
      setError(null);
      try {
        const op = buildStakeChangeOp(username, deedUid, input);
        const broadcast = await broadcastOperations(
          username,
          [op],
          KeychainKeyTypes.posting
        );
        if (!broadcast.success) {
          const msg = broadcast.error ?? "Broadcast failed";
          setError(msg);
          return { success: false, error: msg };
        }
        try {
          await waitForTransactions(broadcast.txIds, lookupTransaction);
        } catch (verifyErr) {
          const msg =
            verifyErr instanceof Error
              ? verifyErr.message
              : "Transaction verification failed";
          setError(msg);
          return { success: false, error: msg };
        }
        await refreshCardCollection();
        onSuccess?.();
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Save failed";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setBusy(false);
      }
    },
    [username, onSuccess]
  );

  return {
    busy,
    result,
    error,
    clearResult: () => setResult(null),
    clearError: () => setError(null),
    run,
    saveStakeChange,
  };
}
