"use server";

import { confirmSplTrx } from "@/lib/backend/api/spl/spl-base-api";
import { broadcastOpsAsService } from "@/lib/backend/services/hiveBroadcastService";
import {
  getPurchaseAuthorityInfo,
  getServiceAccount,
  isServiceBroadcastConfigured,
} from "@/lib/backend/services/splAuthorityService";
import { buildMarketPurchaseOnBehalfOp } from "@/lib/shared/operations/opBuilders";
import { MAX_ITEM_SIZE_IN_OPERATION } from "@/types/landManager";
import { Operation } from "@hiveio/dhive";
import { getAuthStatus } from "../auth-actions";

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

  if (items.length === 0) {
    return { success: false, txIds: [], error: "No items to buy." };
  }

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

  return broadcastOpsAsService(operations, { verify: confirmSplTrx });
}
