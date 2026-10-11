import {
  BroadcastResult,
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { buildTaxCollectionOp } from "@/lib/shared/operations/opBuilders";
import type { SplTrxResult } from "@/types/spl/trx";

export interface MythicHarvestDeed {
  deed_uid: string;
  region_uid: string;
  kingdom_type: "keep" | "castle";
}

export interface MythicHarvestBroadcast extends BroadcastResult {
  /** Confirmed payload of every op, keeps first (same order as `opTxIds`). */
  confirmed: (SplTrxResult | null)[];
}

/**
 * Collects the taxes of every keep, waits until each keep op is confirmed
 * on-chain, and only then collects the castles. Two separate broadcasts — a
 * fixed delay between batches would not guarantee the order, and a batch must
 * never mix keeps and castles.
 *
 * `onPhase` reports when a broadcast (Keychain popup) or a confirmation wait
 * starts, for the busy indicator. Stops at the first rejected broadcast; ids
 * of what did go out are still returned.
 */
export async function broadcastKeepsThenCastles(
  username: string,
  deeds: MythicHarvestDeed[],
  onPhase?: (phase: "running" | "verifying") => void
): Promise<MythicHarvestBroadcast> {
  const out: MythicHarvestBroadcast = {
    success: true,
    txIds: [],
    opTxIds: [],
    confirmed: [],
  };
  for (const kingdom of ["keep", "castle"] as const) {
    const group = deeds.filter((d) => d.kingdom_type === kingdom);
    if (group.length === 0) continue;

    onPhase?.("running");
    const res = await broadcastOperations(
      username,
      group.map((d) => buildTaxCollectionOp(username, d.region_uid, d.deed_uid))
    );
    out.txIds.push(...res.txIds);
    out.opTxIds.push(...res.opTxIds);
    if (!res.success) return { ...out, success: false, error: res.error };

    onPhase?.("verifying");
    out.confirmed.push(...(await waitForTransactions(res.opTxIds)));
  }
  return out;
}
