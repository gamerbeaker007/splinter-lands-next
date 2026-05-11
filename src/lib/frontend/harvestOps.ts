import {
  computeSwapAmounts,
  shouldApplyFee,
} from "@/lib/shared/landManagerUtils";
import { buildFeeTransferOp, buildHarvestOp } from "@/lib/frontend/opBuilders";
import {
  SERVICE_FEE_PCT,
  SERVICE_FEE_RECIPIENT_REGION,
} from "@/types/landManager";
import { SplHarvestableResource } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";

interface HarvestRegion {
  region_uid: string;
  region_number: number;
  name: string;
}

export function buildRegionHarvestOps(
  username: string,
  region: HarvestRegion,
  harvestable: SplHarvestableResource[],
  pools: SplLandPool[]
): { ops: [string, object][]; log: string[] } {
  const ops: [string, object][] = [];
  const log: string[] = [];

  ops.push(buildHarvestOp(username, region.region_uid));
  log.push(`[${region.name}] harvest`);

  if (shouldApplyFee(username, region.region_number)) {
    for (const resource of harvestable) {
      const feeAmount = Number.parseFloat(
        ((resource.amount_claimable * SERVICE_FEE_PCT) / 100).toFixed(3)
      );
      if (feeAmount <= 0) continue;

      const { out_amount_1, out_amount_2 } = computeSwapAmounts(
        pools,
        resource.token_symbol,
        resource.token_symbol,
        feeAmount
      );
      ops.push(
        buildFeeTransferOp(
          username,
          region.region_uid,
          SERVICE_FEE_RECIPIENT_REGION,
          resource.token_symbol,
          feeAmount,
          out_amount_1,
          out_amount_2
        )
      );
      log.push(
        `  fee: ${feeAmount} ${resource.token_symbol} → ${out_amount_2} to beaker007`
      );
    }
  }

  return { ops, log };
}
