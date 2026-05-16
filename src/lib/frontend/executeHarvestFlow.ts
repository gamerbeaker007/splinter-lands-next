import { lookupTransaction } from "@/lib/backend/actions/land-manager/overview-actions";
import { buildRegionHarvestOnlyOp } from "@/lib/frontend/harvestOps";
import {
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";

export interface HarvestBroadcastRegion {
  region_uid: string;
  region_number: number;
  name: string;
}

export interface HarvestBroadcastResult {
  success: boolean;
  txIds: string[];
  log: string[];
  error?: string;
}

/**
 * Phase-1 of the harvest flow: build harvest_all ops for the supplied
 * regions, broadcast under the posting key, and await on-chain confirmation.
 *
 * The caller is responsible for filtering regions (e.g. canHarvestRegion)
 * before calling, and for the phase-2 fee settlement (see usePayFees).
 */
export async function broadcastHarvest(
  username: string,
  regions: HarvestBroadcastRegion[]
): Promise<HarvestBroadcastResult> {
  const log: string[] = [];
  const ops: [string, object][] = [];
  for (const region of regions) {
    const built = buildRegionHarvestOnlyOp(username, region);
    ops.push(...built.ops);
    log.push(...built.log);
  }

  if (ops.length === 0) {
    return {
      success: false,
      txIds: [],
      log,
      error: "No regions are ready to harvest.",
    };
  }

  try {
    const res = await broadcastOperations(username, ops);
    if (!res.success) {
      return {
        success: false,
        txIds: res.txIds,
        log,
        error: res.error ?? "Harvest broadcast rejected",
      };
    }
    await waitForTransactions(res.txIds, lookupTransaction);
    log.push(`✓ Harvest confirmed (${res.txIds.length} tx)`);
    return { success: true, txIds: res.txIds, log };
  } catch (err) {
    return {
      success: false,
      txIds: [],
      log,
      error: err instanceof Error ? err.message : "Harvest broadcast failed",
    };
  }
}
