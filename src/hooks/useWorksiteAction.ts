"use client";

import { lookupTransaction } from "@/lib/backend/actions/land-manager/overview-actions";
import {
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import {
  buildCancelConstructionOp,
  buildWorksiteConstructionOp,
} from "@/lib/shared/operations/opBuilders";
import { useCallback, useState } from "react";

export interface WorksiteActionResult {
  success: boolean;
  txIds: string[];
  error?: string;
}

interface UseWorksiteActionReturn {
  busy: boolean;
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
}

export function useWorksiteAction(): UseWorksiteActionReturn {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<WorksiteActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildWorksite = useCallback(
    async (
      username: string,
      regionUid: string,
      deedUid: string,
      opName: string
    ): Promise<WorksiteActionResult> => {
      setBusy(true);
      setError(null);
      try {
        const op = buildWorksiteConstructionOp(
          username,
          regionUid,
          deedUid,
          opName
        );
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
        await waitForTransactions(res.txIds, lookupTransaction);
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
        setBusy(false);
      }
    },
    []
  );

  const cancelConstruction = useCallback(
    async (
      username: string,
      regionUid: string,
      deedUid: string,
      projectId: number
    ): Promise<WorksiteActionResult> => {
      setBusy(true);
      setError(null);
      try {
        const op = buildCancelConstructionOp(
          username,
          regionUid,
          deedUid,
          projectId
        );
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
        await waitForTransactions(res.txIds, lookupTransaction);
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
        setBusy(false);
      }
    },
    []
  );

  return {
    busy,
    result,
    error,
    clearResult: () => setResult(null),
    buildWorksite,
    cancelConstruction,
  };
}
