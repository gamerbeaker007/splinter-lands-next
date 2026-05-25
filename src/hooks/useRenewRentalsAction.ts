import { lookupTransaction } from "@/lib/backend/actions/land-manager/overview-actions";
import {
  getRenewRentalPlan,
  getRenewRentalsEligibility,
  refreshCardCollection,
} from "@/lib/backend/actions/land-manager/renew-rental-actions";
import { buildRenewRentalOp } from "@/lib/frontend/opBuilders";
import {
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { RenewRentalPlan } from "@/types/landManager";
import { KeychainKeyTypes } from "keychain-sdk";
import { useCallback, useEffect, useState } from "react";

interface Params {
  username: string;
  onSuccess?: () => void;
}

export interface RenewRentalsExecuteResult {
  success: boolean;
  txIds: string[];
  renewedCount: number;
  totalDec: number;
}

export interface UseRenewRentalsAction {
  busy: boolean;
  eligible: boolean;
  seasonDaysRemaining: number;
  plan: RenewRentalPlan | null;
  result: RenewRentalsExecuteResult | null;
  error: string | null;
  clearPlan: () => void;
  clearResult: () => void;
  clearError: () => void;
  /** Fetches the renewal plan and opens the confirm dialog. */
  open: () => Promise<void>;
  /** Broadcasts the renewal using the already-fetched plan. */
  execute: (plan: RenewRentalPlan) => Promise<void>;
}

export function useRenewRentalsAction({
  username,
  onSuccess,
}: Params): UseRenewRentalsAction {
  const [busy, setBusy] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [seasonDaysRemaining, setSeasonDaysRemaining] = useState(99);
  const [plan, setPlan] = useState<RenewRentalPlan | null>(null);
  const [result, setResult] = useState<RenewRentalsExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lightweight eligibility check on mount so the button can be disabled
  // proactively. Uses cached card collection — no force-fetch.
  useEffect(() => {
    if (!username) return;
    getRenewRentalsEligibility().then((e) => {
      setEligible(e.eligible);
      setSeasonDaysRemaining(e.season_days_remaining);
    });
  }, [username]);

  /** Fetches a fresh plan (force-fetch) and shows the confirm dialog. */
  const open = useCallback(async () => {
    setBusy(true);
    setError(null);
    setPlan(null);
    try {
      const fetched = await getRenewRentalPlan();
      setPlan(fetched);
      setEligible(
        fetched.season_days_remaining < 7 && fetched.items.length > 0
      );
      setSeasonDaysRemaining(fetched.season_days_remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, []);

  /** Broadcasts the renewal using the plan already shown in the dialog. */
  const execute = useCallback(
    async (currentPlan: RenewRentalPlan) => {
      if (!username) {
        setError("Not logged in.");
        return;
      }
      if (currentPlan.items.length === 0) {
        setError("Nothing to renew.");
        return;
      }
      if (!currentPlan.sufficient_balance) {
        setError(
          `Insufficient DEC: need ${currentPlan.total_dec.toFixed(3)} but have ${currentPlan.dec_balance.toFixed(3)}.`
        );
        return;
      }

      setBusy(true);
      setError(null);

      try {
        const marketIds = currentPlan.items.map((i) => i.market_id);

        const BATCH_SIZE = 4;
        const ops: [string, object][] = [];
        for (let i = 0; i < marketIds.length; i += BATCH_SIZE) {
          ops.push(
            buildRenewRentalOp(username, marketIds.slice(i, i + BATCH_SIZE))
          );
        }

        const broadcastRes = await broadcastOperations(
          username,
          ops,
          KeychainKeyTypes.active
        );

        if (!broadcastRes.success) {
          setError(
            `Renewal failed: ${broadcastRes.error ?? "unknown error"}.${
              broadcastRes.txIds.length > 0
                ? " Some chunks may have already broadcast — check your wallet."
                : ""
            }`
          );
          setBusy(false);
          return;
        }

        await waitForTransactions(broadcastRes.txIds, lookupTransaction);

        // Force-bust the card collection cache so the Rental Overview shows
        // fresh rental_date / rental_days after the on-chain renewal.
        await refreshCardCollection();

        setResult({
          success: true,
          txIds: broadcastRes.txIds,
          renewedCount: marketIds.length,
          totalDec: currentPlan.total_dec,
        });
        setPlan(null);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setBusy(false);
      }
    },
    [username, onSuccess]
  );

  return {
    busy,
    eligible,
    seasonDaysRemaining,
    plan,
    result,
    error,
    clearPlan: () => setPlan(null),
    clearResult: () => setResult(null),
    clearError: () => setError(null),
    open,
    execute,
  };
}
