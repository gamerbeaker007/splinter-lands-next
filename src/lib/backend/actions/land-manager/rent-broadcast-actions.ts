"use server";

import { confirmSplTrx } from "@/lib/backend/api/spl/spl-base-api";
import { requireFreshPlayer } from "@/lib/backend/auth/requireFreshPlayer";
import { broadcastOpsAsService } from "@/lib/backend/services/hiveBroadcastService";
import {
  validateMarketIds,
  withServiceBroadcastSlot,
} from "@/lib/backend/services/serviceBroadcastGuard";
import {
  getRentalAuthorityInfo,
  getServiceAccount,
  isServiceBroadcastConfigured,
} from "@/lib/backend/services/splAuthorityService";
import {
  buildRenewRentalOnBehalfOp,
  buildRentOnBehalfOp,
} from "@/lib/shared/operations/opBuilders";
import { MAX_ITEM_SIZE_IN_OPERATION } from "@/types/landManager";
import { Operation } from "@hiveio/dhive";

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export interface RentOnBehalfResult {
  success: boolean;
  txIds: string[];
  /** SPL id of every op that landed — see `ServerBroadcastResult.opTxIds`. */
  opTxIds?: string[];
  /** Op ids the server already confirmed — skip them when polling. */
  confirmedOpTxIds?: string[];
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
  marketIds: string[],
  renew = false
): Promise<RentOnBehalfResult> {
  // Verified upstream on every call: a revoked token must not keep spending.
  const player = await requireFreshPlayer();
  if (!player) {
    return { success: false, txIds: [], error: "Not authenticated" };
  }

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
  const invalid = validateMarketIds(marketIds);
  if (invalid) return { success: false, txIds: [], error: invalid };

  const { authorized } = await getRentalAuthorityInfo(player);
  if (!authorized) {
    return {
      success: false,
      txIds: [],
      error: `@${service} does not have rental authority for @${player}. Grant it at https://splinterlands.com/?p=account_security and refresh.`,
    };
  }

  const operations: Operation[] = chunk(
    marketIds,
    MAX_ITEM_SIZE_IN_OPERATION
  ).map((ids) =>
    renew
      ? (buildRenewRentalOnBehalfOp(service, player, ids) as Operation)
      : (buildRentOnBehalfOp(service, player, ids) as Operation)
  );

  const result = await withServiceBroadcastSlot(player, () =>
    broadcastOpsAsService(operations, { verify: confirmSplTrx })
  );
  return (
    result ?? {
      success: false,
      txIds: [],
      error: "Another buy or rent is still running. Try again shortly.",
    }
  );
}
