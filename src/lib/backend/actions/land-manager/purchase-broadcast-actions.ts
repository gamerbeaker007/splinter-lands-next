"use server";

import { confirmSplTrx } from "@/lib/backend/api/spl/spl-base-api";
import { requireFreshPlayer } from "@/lib/backend/auth/requireFreshPlayer";
import { broadcastOpsAsService } from "@/lib/backend/services/hiveBroadcastService";
import {
  validateMarketIds,
  validatePrices,
  withServiceBroadcastSlot,
} from "@/lib/backend/services/serviceBroadcastGuard";
import {
  getPurchaseAuthorityInfo,
  getServiceAccount,
  isServiceBroadcastConfigured,
} from "@/lib/backend/services/splAuthorityService";
import { buildMarketPurchaseOnBehalfOp } from "@/lib/shared/operations/opBuilders";
import { MAX_ITEM_SIZE_IN_OPERATION } from "@/types/landManager";
import { Operation } from "@hiveio/dhive";

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export interface PurchaseItem {
  /** Market listing id to buy. */
  market_id: string;
  /** Listing price in DEC — summed per broadcast chunk for the op's `price`. */
  price_dec: number;
}

export interface PurchaseOnBehalfResult {
  success: boolean;
  txIds: string[];
  /** SPL id of every op that landed — see `ServerBroadcastResult.opTxIds`. */
  opTxIds?: string[];
  /** Op ids the server already confirmed — skip them when polling. */
  confirmedOpTxIds?: string[];
  error?: string;
}

/**
 * Broadcasts `sm_market_purchase` ops on behalf of the logged-in player using
 * the configured land-service account's active key. The player must have
 * granted "purchase" authority to that account via SPL Account Security.
 *
 * Each broadcast chunk carries a `price` equal to the summed DEC of the items
 * in that chunk, guarding against listing price changes between plan and
 * broadcast.
 */
export async function purchaseOnBehalfOf(
  items: PurchaseItem[]
): Promise<PurchaseOnBehalfResult> {
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

  if (!Array.isArray(items)) {
    return { success: false, txIds: [], error: "Invalid items." };
  }
  if (items.length === 0) {
    return { success: false, txIds: [], error: "No items to buy." };
  }
  const invalid =
    validateMarketIds(items.map((i) => i?.market_id)) ??
    validatePrices(items.map((i) => i?.price_dec));
  if (invalid) return { success: false, txIds: [], error: invalid };

  const { authorized } = await getPurchaseAuthorityInfo(player);
  if (!authorized) {
    return {
      success: false,
      txIds: [],
      error: `@${service} does not have purchase authority for @${player}. Grant it at https://splinterlands.com/?p=account_security and refresh.`,
    };
  }

  const operations: Operation[] = chunk(items, MAX_ITEM_SIZE_IN_OPERATION).map(
    (group) => {
      const price = group.reduce((s, i) => s + i.price_dec, 0);
      return buildMarketPurchaseOnBehalfOp(
        service,
        player,
        group.map((i) => i.market_id),
        price
      ) as Operation;
    }
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
