"use server";

import {
  getServiceAccount,
  invalidateAuthorityCache,
  isServiceBroadcastConfigured,
} from "@/lib/backend/services/splAuthorityService";
import { getAuthStatus } from "../auth-actions";

/**
 * The configured land-service account (server env) — everything the browser
 * needs to compute authority status itself from its own `/players/authorities`
 * read (`getAuthorityStatus` in lib/frontend/land-data.ts). No SPL call.
 */
export async function getAuthorityServiceInfo(): Promise<{
  serviceConfigured: boolean;
  serviceAccount: string | null;
}> {
  return {
    serviceConfigured: isServiceBroadcastConfigured(),
    serviceAccount: getServiceAccount(),
  };
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
