"use client";

import { refreshCardCollection } from "@/lib/backend/actions/land-manager/renew-rental-actions";
import {
  broadcastOperations,
  KeychainKeyTypes,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { buildCancelRentalOp } from "@/lib/shared/operations/opBuilders";
import { useCallback, useState } from "react";

interface Params {
  username: string;
  onSuccess?: () => void;
}

export interface UseCancelRentalAction {
  busy: boolean;
  error: string | null;
  clearError: () => void;
  execute: (marketId: string) => Promise<void>;
}

export function useCancelRentalAction({
  username,
  onSuccess,
}: Params): UseCancelRentalAction {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (marketId: string) => {
      if (!username) {
        setError("Not logged in.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const op = buildCancelRentalOp(username, [marketId]);
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
        await refreshCardCollection();
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Cancel rental failed");
      } finally {
        setBusy(false);
      }
    },
    [username, onSuccess]
  );

  return {
    busy,
    error,
    clearError: () => setError(null),
    execute,
  };
}
