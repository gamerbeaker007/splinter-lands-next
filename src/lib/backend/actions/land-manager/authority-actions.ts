"use server";

import {
  getRentalAuthorityInfo,
  getServiceAccount,
  invalidateAuthorityCache,
  isServiceBroadcastConfigured,
} from "@/lib/backend/services/splAuthorityService";
import { getAuthStatus } from "../auth-actions";

export interface RentalAuthorityStatus {
  /** True when SPL_LAND_SERVICE_ACCOUNT + SPL_LAND_SERVICE_ACTIVE_KEY are set. */
  serviceConfigured: boolean;
  /** Display name of the configured service account (or null when unset). */
  serviceAccount: string | null;
  /** True only when the authenticated user has granted rental authority. */
  authorized: boolean;
  /** The username the check was performed for (null when not logged in). */
  player: string | null;
  /** Current full rental authorities list — used by the UI to smart-merge. */
  rental: string[];
}

/**
 * Resolves whether the logged-in user has granted rental authority to the
 * configured service account, plus the full current rental list so the UI
 * can build a grant/revoke op without clobbering other authorities.
 */
export async function getRentalAuthorityStatus(): Promise<RentalAuthorityStatus> {
  const serviceConfigured = isServiceBroadcastConfigured();
  const serviceAccount = getServiceAccount();
  const auth = await getAuthStatus();
  const player = auth.authenticated && auth.username ? auth.username : null;
  if (!player || !serviceConfigured) {
    return {
      serviceConfigured,
      serviceAccount,
      authorized: false,
      player,
      rental: [],
    };
  }
  const info = await getRentalAuthorityInfo(player);
  return {
    serviceConfigured,
    serviceAccount,
    authorized: info.authorized,
    player,
    rental: info.rental,
  };
}

/** Force a fresh check next time. Call after a grant/revoke broadcast. */
export async function refreshRentalAuthorityStatus(): Promise<RentalAuthorityStatus> {
  const auth = await getAuthStatus();
  if (auth.authenticated && auth.username) {
    invalidateAuthorityCache(auth.username);
  }
  return getRentalAuthorityStatus();
}

/**
 * Invalidates the server-side authority cache for the logged-in player without
 * triggering a re-fetch. Use this after a tx is confirmed and the UI has
 * already updated from the tx result — ensures the next server-side check
 * goes to SPL rather than returning stale cached data.
 */
export async function invalidateRentalAuthorityCache(): Promise<void> {
  const auth = await getAuthStatus();
  if (auth.authenticated && auth.username) {
    invalidateAuthorityCache(auth.username);
  }
}
