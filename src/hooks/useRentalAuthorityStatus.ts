"use client";

import {
  getRentalAuthorityStatus,
  invalidateRentalAuthorityCache,
  refreshRentalAuthorityStatus,
  RentalAuthorityStatus,
} from "@/lib/backend/actions/land-manager/authority-actions";
import { lookupTransaction } from "@/lib/backend/actions/land-manager/overview-actions";
import { formatError } from "@/lib/frontend/errorFormat";
import { buildSetAuthorityOp } from "@/lib/shared/operations/opBuilders";
import {
  broadcastOperations,
  KeychainKeyTypes,
} from "@/lib/frontend/splBroadcast";
import { useCallback, useEffect, useState } from "react";

export interface AuthorityActionResult {
  success: boolean;
  txId?: string;
  error?: string;
  /** True when SPL has reflected the new state by the time we resolved. */
  confirmed?: boolean;
}

export interface UseRentalAuthorityStatus {
  status: RentalAuthorityStatus | null;
  loading: boolean;
  busy: boolean;
  refresh: () => Promise<void>;
  /** Grant rental authority to the configured service account. */
  grant: () => Promise<AuthorityActionResult>;
  /** Revoke rental authority from the configured service account. */
  revoke: () => Promise<AuthorityActionResult>;
}

// Poll the SPL /transactions/lookup endpoint every POLL_INTERVAL_MS until the
// set_authority tx resolves or CONFIRM_TIMEOUT_MS elapses.
const POLL_INTERVAL_MS = 3_000;
const CONFIRM_TIMEOUT_MS = 30_000;

/**
 * Authority status + grant/revoke actions. Grant/revoke:
 * 1. Refresh the live rental list (prevent stale-cache overwrites).
 * 2. Build and broadcast `sm_set_authority` via Hive Keychain (active key).
 * 3. Poll `/transactions/lookup` until SPL confirms the tx (or 30s elapses).
 * 4. Update local state directly from the confirmed tx result.
 */
export function useRentalAuthorityStatus(): UseRentalAuthorityStatus {
  const [status, setStatus] = useState<RentalAuthorityStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await getRentalAuthorityStatus());
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await refreshRentalAuthorityStatus());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setAuthority = useCallback(
    async (nextRental: string[]): Promise<AuthorityActionResult> => {
      if (!status?.player) {
        return { success: false, error: "Not signed in." };
      }
      if (!status.serviceAccount) {
        return { success: false, error: "Service account not configured." };
      }
      setBusy(true);
      try {
        const op = buildSetAuthorityOp(status.player, nextRental);
        const res = await broadcastOperations(
          status.player,
          [op],
          KeychainKeyTypes.active
        );
        if (!res.success) {
          return {
            success: false,
            error: res.error ?? "Keychain rejected the broadcast.",
          };
        }
        const txId = res.txIds[0];
        const svc = status.serviceAccount.toLowerCase();

        // Poll the tx lookup until SPL confirms the set_authority result.
        const deadline = Date.now() + CONFIRM_TIMEOUT_MS;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          const outcome = await lookupTransaction(txId);
          if (outcome.status === "failed") {
            return { success: false, txId, error: outcome.error };
          }
          if (
            outcome.status === "success" &&
            outcome.result.type === "set_authority"
          ) {
            const newRental = outcome.result.data.rental;
            const newAuthorized = newRental
              .map((a) => a.toLowerCase())
              .includes(svc);
            // Update local state directly from the confirmed tx result.
            setStatus((prev) =>
              prev
                ? { ...prev, rental: newRental, authorized: newAuthorized }
                : prev
            );
            // Flush server cache so the next getRentalAuthorityStatus() hits SPL.
            void invalidateRentalAuthorityCache();
            return { success: true, txId, confirmed: true };
          }
        }

        return { success: true, txId, confirmed: false };
      } catch (err) {
        // Keychain SDK may throw plain objects (e.g. `{message:"user_cancel"}`),
        // not Error instances — formatError unwraps both.
        return { success: false, error: formatError(err) };
      } finally {
        setBusy(false);
      }
    },
    [status]
  );

  const grant = useCallback(async (): Promise<AuthorityActionResult> => {
    if (!status?.serviceAccount) {
      return { success: false, error: "Service account not configured." };
    }
    // Fetch the live rental list immediately before building the op so we
    // never clobber authorities added after the page loaded (e.g. peakmonsters).
    const fresh = await refreshRentalAuthorityStatus();
    setStatus(fresh);
    const svc = fresh.serviceAccount ?? status.serviceAccount;
    if (!svc)
      return { success: false, error: "Service account not configured." };
    const lowerSet = new Set(fresh.rental.map((a) => a.toLowerCase()));
    const next = [...fresh.rental];
    if (!lowerSet.has(svc.toLowerCase())) next.push(svc);
    return setAuthority(next);
  }, [status, setAuthority]);

  const revoke = useCallback(async (): Promise<AuthorityActionResult> => {
    if (!status?.serviceAccount) {
      return { success: false, error: "Service account not configured." };
    }
    // Fetch the live rental list immediately before building the op.
    const fresh = await refreshRentalAuthorityStatus();
    setStatus(fresh);
    const target = (
      fresh.serviceAccount ?? status.serviceAccount
    ).toLowerCase();
    const next = fresh.rental.filter((a) => a.toLowerCase() !== target);
    return setAuthority(next);
  }, [status, setAuthority]);

  return { status, loading, busy, refresh, grant, revoke };
}
