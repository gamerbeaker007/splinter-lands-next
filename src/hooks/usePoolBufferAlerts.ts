"use client";

import {
  getBulkRegionData,
  getLandPools,
  getPlayerPoolPositions,
} from "@/lib/backend/actions/land-manager/overview-actions";
import {
  computePoolHolding,
  computeWeeklyConsumption,
  regionConsumptionPerHour,
} from "@/lib/shared/poolPositionUtils";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import { POOL_BUFFER_WEEKS } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { useEffect, useState } from "react";

export interface PoolBufferRow {
  symbol: string;
  /** Resource consumed per 7 days across the enabled regions. */
  weeklyConsumption: number;
  /** Resource represented by the player's whole pool position. */
  poolResource: number;
  /** Of that, the part already past the 30-day lock (withdrawable tax-free). */
  unlockedResource: number;
  /** Weeks of consumption the full position covers. */
  weeksCovered: number;
  /** True when the position is below the recommended buffer. */
  belowBuffer: boolean;
}

/**
 * Pool reserves versus weekly consumption, for the rolling-buffer warning.
 *
 * The buffer exists so Make Harvestable's `pool` strategy always has matured
 * (tax-free) liquidity to draw on. `POOL_BUFFER_WEEKS` weeks of consumption is
 * the recommended floor: with a weekly top-up, deposits need 30 days to unlock,
 * so a smaller pile risks having nothing unlocked when it's needed.
 *
 * `enabled` is false when the player does not withdraw from the pools at all
 * (the `pool` strategy is off) — the hook then fetches nothing.
 */
export function usePoolBufferAlerts(
  regions: SplProductionOverviewRegion[],
  enabledRegions: number[],
  enabled: boolean,
  refreshKey = 0
): { rows: PoolBufferRow[]; loading: boolean } {
  const [rows, setRows] = useState<PoolBufferRow[]>([]);
  const [loading, setLoading] = useState(enabled);

  const visibleRegions = regions.filter((r) =>
    enabledRegions.includes(r.region_number)
  );
  const regionKey = visibleRegions.map((r) => r.region_uid).join(",");

  useEffect(() => {
    if (!enabled || regionKey === "") {
      setRows([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    const uids = regionKey.split(",");
    const player = regions[0]?.player ?? "";

    (async () => {
      setLoading(true);
      try {
        const [{ harvestable, overviews }, { pools }, positions] =
          await Promise.all([
            getBulkRegionData(uids),
            getLandPools(),
            getPlayerPoolPositions(player, NATURAL_RESOURCES),
          ]);
        if (!mounted) return;

        const visible = regions.filter((r) => uids.includes(r.region_uid));
        const consumptionPerHour = Object.fromEntries(
          visible.map((r) => [
            r.region_uid,
            regionConsumptionPerHour(overviews[r.region_uid] ?? null),
          ])
        );
        const { perResource } = computeWeeklyConsumption(
          visible,
          consumptionPerHour,
          harvestable
        );

        setRows(
          NATURAL_RESOURCES.map((symbol) => {
            const holding = computePoolHolding(positions[symbol], pools);
            const weekly = perResource[symbol] ?? 0;
            const weeksCovered =
              weekly > 0 ? holding.resource / weekly : Infinity;
            return {
              symbol,
              weeklyConsumption: weekly,
              poolResource: holding.resource,
              unlockedResource: holding.unlockedResource,
              weeksCovered,
              belowBuffer: weekly > 0 && weeksCovered < POOL_BUFFER_WEEKS,
            };
          })
        );
      } catch {
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // `regions` is only read for the player name and per-uid lookup, both of
    // which are pinned by regionKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionKey, enabled, refreshKey]);

  return { rows, loading };
}
