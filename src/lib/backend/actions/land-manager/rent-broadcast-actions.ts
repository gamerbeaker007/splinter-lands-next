"use server";

import { broadcastOpsAsService } from "@/lib/backend/services/hiveBroadcastService";
import {
  getRentalAuthorityInfo,
  getServiceAccount,
  isServiceBroadcastConfigured,
} from "@/lib/backend/services/splAuthorityService";
import { Operation } from "@hiveio/dhive";
import { getAuthStatus } from "../auth-actions";
import { generateNonce } from "@/lib/frontend/opBuilders";

const APP = `${process.env.NEXT_PUBLIC_APP_NAME ?? "splinter-lands"}/${process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}`;
// Match the client-side cap in useRentEmptyWorkersAction so plans built for
// either path produce equivalent on-chain shape.
const MAX_ITEMS_PER_RENT_OP = 100;

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export interface RentOnBehalfResult {
  success: boolean;
  txIds: string[];
  error?: string;
}

/**
 * Broadcasts `sm_market_rent` ops on behalf of the logged-in player using the
 * configured land-service account's active key. The player must have granted
 * "purchase" authority to that account via SPL Account Security.
 *
 * Eliminates per-batch active-key Keychain popups on the client.
 */
export async function rentOnBehalfOf(
  marketIds: string[]
): Promise<RentOnBehalfResult> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { success: false, txIds: [], error: "Not authenticated" };
  }
  const player = auth.username;

  if (!isServiceBroadcastConfigured()) {
    return {
      success: false,
      txIds: [],
      error: "Land-service account is not configured on the server.",
    };
  }
  const service = getServiceAccount();
  if (!service) {
    return {
      success: false,
      txIds: [],
      error: "Land-service account is not configured on the server.",
    };
  }

  if (marketIds.length === 0) {
    return { success: false, txIds: [], error: "No market IDs to rent." };
  }

  const { authorized } = await getRentalAuthorityInfo(player);
  if (!authorized) {
    return {
      success: false,
      txIds: [],
      error: `@${service} does not have purchase authority for @${player}. Grant it at https://splinterlands.com/?p=account_security and refresh.`,
    };
  }

  const operations: Operation[] = chunk(marketIds, MAX_ITEMS_PER_RENT_OP).map(
    (ids) => [
      "custom_json",
      {
        required_auths: [service],
        required_posting_auths: [],
        id: "sm_market_rent",
        json: JSON.stringify({
          currency: "DEC",
          items: ids,
          player,
          app: APP,
          n: generateNonce(),
        }),
      },
    ]
  );

  return broadcastOpsAsService(operations);
}
