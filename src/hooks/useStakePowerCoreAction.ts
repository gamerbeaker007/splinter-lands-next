"use client";

import { getPowerCoreInfo } from "@/lib/backend/actions/land-manager/overview-actions";
import {
  broadcastOperations,
  KeychainKeyTypes,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { buildStakePowerCoreOp } from "@/lib/shared/operations/opBuilders";
import { WorkerEligiblePlot } from "@/types/landManager";
import { useCallback, useState } from "react";

interface Params {
  username: string;
  plot: WorkerEligiblePlot;
  onSuccess?: () => void;
}

export interface PowerCoreInfo {
  count: number;
  ids: string[];
}

export interface UseStakePowerCoreAction {
  busy: boolean;
  powerCoreInfo: PowerCoreInfo | null;
  error: string | null;
  loadInfo: () => Promise<void>;
  execute: (itemUid: string) => Promise<void>;
  clearError: () => void;
}

export function useStakePowerCoreAction({
  username,
  plot,
  onSuccess,
}: Params): UseStakePowerCoreAction {
  const [busy, setBusy] = useState(false);
  const [powerCoreInfo, setPowerCoreInfo] = useState<PowerCoreInfo | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const loadInfo = useCallback(async () => {
    setBusy(true);
    setError(null);
    setPowerCoreInfo(null);
    try {
      const info = await getPowerCoreInfo();
      if (info.error) {
        setError(info.error);
      } else {
        setPowerCoreInfo({ count: info.count, ids: info.ids });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch Power Cores"
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const execute = useCallback(
    async (itemUid: string) => {
      if (!username) {
        setError("Not logged in.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const op = buildStakePowerCoreOp(username, plot.deed_uid, itemUid);
        const result = await broadcastOperations(
          username,
          [op],
          KeychainKeyTypes.posting
        );
        if (!result.success) {
          setError(result.error ?? "Broadcast failed");
          return;
        }
        await waitForTransactions(result.txIds);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Staking failed");
      } finally {
        setBusy(false);
      }
    },
    [username, plot.deed_uid, onSuccess]
  );

  return {
    busy,
    powerCoreInfo,
    error,
    loadInfo,
    execute,
    clearError: () => setError(null),
  };
}
