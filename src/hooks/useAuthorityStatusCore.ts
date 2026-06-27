"use client";

import { invalidateRentalAuthorityCache } from "@/lib/backend/actions/land-manager/authority-actions";
import { lookupTransaction } from "@/lib/backend/actions/land-manager/overview-actions";
import { formatError } from "@/lib/frontend/errorFormat";
import {
  broadcastOperations,
  KeychainKeyTypes,
} from "@/lib/frontend/splBroadcast";
import { buildSetAuthorityOp } from "@/lib/shared/operations/opBuilders";
import { useCallback, useEffect, useState } from "react";

export interface AuthorityActionResult {
  success: boolean;
  txId?: string;
  error?: string;
  /** True when SPL has reflected the new state by the time we resolved. */
  confirmed?: boolean;
}

/** Normalised authority status, shared by the rental and purchase flows. */
export interface AuthorityCoreStatus {
  /** True when SPL_LAND_SERVICE_ACCOUNT + SPL_LAND_SERVICE_ACTIVE_KEY are set. */
  serviceConfigured: boolean;
  /** Display name of the configured service account (or null when unset). */
  serviceAccount: string | null;
  /** True only when the authenticated user has granted this authority. */
  authorized: boolean;
  /** The username the check was performed for (null when not logged in). */
  player: string | null;
  /** Current full list for this authority kind — used to smart-merge on grant. */
  accounts: string[];
}

export interface UseAuthorityStatus {
  status: AuthorityCoreStatus | null;
  loading: boolean;
  busy: boolean;
  refresh: () => Promise<void>;
  /** Grant this authority to the configured service account. */
  grant: () => Promise<AuthorityActionResult>;
  /** Revoke this authority from the configured service account. */
  revoke: () => Promise<AuthorityActionResult>;
}

interface Config {
  /** Which authority list this hook manages — drives the op field + result read. */
  kind: "rental" | "purchase";
  /** Load the current (possibly cached) status. */
  load: () => Promise<AuthorityCoreStatus>;
  /** Force-refresh the status, bypassing the server cache. */
  reload: () => Promise<AuthorityCoreStatus>;
}

const POLL_INTERVAL_MS = 3_000;
const CONFIRM_TIMEOUT_MS = 30_000;

/**
 * Authority status + grant/revoke for a single authority kind. Grant/revoke:
 * 1. Refresh the live list (prevent stale-cache overwrites).
 * 2. Build and broadcast `sm_set_authority` via Hive Keychain (active key).
 * 3. Poll `/transactions/lookup` until SPL confirms the tx (or 30s elapses).
 * 4. Update local state directly from the confirmed tx result.
 *
 * Rental and purchase share the same cache entry, so invalidating either
 * flushes both.
 */
export function useAuthorityStatusCore({
  kind,
  load,
  reload,
}: Config): UseAuthorityStatus {
  const [status, setStatus] = useState<AuthorityCoreStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const doLoad = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await load());
    } finally {
      setLoading(false);
    }
  }, [load]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await reload());
    } finally {
      setLoading(false);
    }
  }, [reload]);

  useEffect(() => {
    doLoad();
  }, [doLoad]);

  const setAuthority = useCallback(
    async (next: string[]): Promise<AuthorityActionResult> => {
      if (!status?.player) {
        return { success: false, error: "Not signed in." };
      }
      if (!status.serviceAccount) {
        return { success: false, error: "Service account not configured." };
      }
      setBusy(true);
      try {
        const op = buildSetAuthorityOp(status.player, { [kind]: next });
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

        const deadline = Date.now() + CONFIRM_TIMEOUT_MS;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          const outcome = await lookupTransaction(txId);
          if (outcome.status === "failed") {
            return { success: false, txId, error: outcome.error };
          }
          if (
            outcome.status === "success" &&
            outcome.result.op === "set_authority"
          ) {
            const newAccounts = outcome.result.result[kind];
            const newAuthorized = newAccounts
              .map((a) => a.toLowerCase())
              .includes(svc);
            setStatus((prev) =>
              prev
                ? { ...prev, accounts: newAccounts, authorized: newAuthorized }
                : prev
            );
            void invalidateRentalAuthorityCache();
            return { success: true, txId, confirmed: true };
          }
        }

        return { success: true, txId, confirmed: false };
      } catch (err) {
        return { success: false, error: formatError(err) };
      } finally {
        setBusy(false);
      }
    },
    [status, kind]
  );

  const grant = useCallback(async (): Promise<AuthorityActionResult> => {
    if (!status?.serviceAccount) {
      return { success: false, error: "Service account not configured." };
    }
    // Fetch the live list immediately before building the op so we never
    // clobber authorities added after the page loaded (e.g. peakmonsters).
    const fresh = await reload();
    setStatus(fresh);
    const svc = fresh.serviceAccount ?? status.serviceAccount;
    if (!svc)
      return { success: false, error: "Service account not configured." };
    const lowerSet = new Set(fresh.accounts.map((a) => a.toLowerCase()));
    const next = [...fresh.accounts];
    if (!lowerSet.has(svc.toLowerCase())) next.push(svc);
    return setAuthority(next);
  }, [status, reload, setAuthority]);

  const revoke = useCallback(async (): Promise<AuthorityActionResult> => {
    if (!status?.serviceAccount) {
      return { success: false, error: "Service account not configured." };
    }
    const fresh = await reload();
    setStatus(fresh);
    const target = (
      fresh.serviceAccount ?? status.serviceAccount
    ).toLowerCase();
    const next = fresh.accounts.filter((a) => a.toLowerCase() !== target);
    return setAuthority(next);
  }, [status, reload, setAuthority]);

  return { status, loading, busy, refresh, grant, revoke };
}
