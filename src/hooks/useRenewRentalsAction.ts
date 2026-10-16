import { useAsyncData } from "@/hooks/useAsyncData";
import { rentOnBehalfOf } from "@/lib/backend/actions/land-manager/rent-broadcast-actions";
import { invalidatePlayerBrowserCaches } from "@/lib/frontend/browser-cache";
import {
  getRenewRentalPlan,
  getRenewRentalsEligibility,
} from "@/lib/frontend/land-production-data";
import { waitForTransactions } from "@/lib/frontend/splBroadcast";
import { unconfirmedOpTxIds } from "@/lib/shared/splTrxIds";
import { RenewRentalPlan } from "@/types/landManager";
import { useCallback, useState } from "react";

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
  const [plan, setPlan] = useState<RenewRentalPlan | null>(null);
  const [result, setResult] = useState<RenewRentalsExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lightweight eligibility check on mount so the button can be disabled
  // proactively. Uses the memoised card collection — no fresh read. A plan
  // fetched by `open` supersedes it.
  const { data: initialEligibility } = useAsyncData(
    username ? `renew-eligibility|${username}` : null,
    () => getRenewRentalsEligibility()
  );
  const [planEligibility, setPlanEligibility] = useState<{
    eligible: boolean;
    seasonDaysRemaining: number;
  } | null>(null);
  const eligible =
    planEligibility?.eligible ?? initialEligibility?.eligible ?? false;
  const seasonDaysRemaining =
    planEligibility?.seasonDaysRemaining ??
    initialEligibility?.season_days_remaining ??
    99;

  /** Fetches a fresh plan (force-fetch) and shows the confirm dialog. */
  const open = useCallback(async () => {
    setBusy(true);
    setError(null);
    setPlan(null);
    try {
      const fetched = await getRenewRentalPlan();
      setPlan(fetched);
      setPlanEligibility({
        eligible: fetched.season_days_remaining < 7 && fetched.items.length > 0,
        seasonDaysRemaining: fetched.season_days_remaining,
      });
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

        const rentRes = await rentOnBehalfOf(marketIds, true);
        if (!rentRes.success) {
          setError(
            `Renewal failed: ${rentRes.error ?? "unknown error"}.${
              rentRes.txIds.length > 0
                ? " Some chunks may have already broadcast — check your wallet."
                : ""
            }`
          );
          setBusy(false);
          return;
        }

        // The server may already have confirmed some ops (verify-on-throw);
        // only poll the rest.
        await waitForTransactions(
          unconfirmedOpTxIds(
            rentRes.opTxIds ?? rentRes.txIds,
            rentRes.confirmedOpTxIds
          )
        );

        // Drop the memoised card collection so the Rental Overview shows
        // fresh rental_date / rental_days after the on-chain renewal.
        invalidatePlayerBrowserCaches(username);

        setResult({
          success: true,
          txIds: rentRes.txIds,
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
