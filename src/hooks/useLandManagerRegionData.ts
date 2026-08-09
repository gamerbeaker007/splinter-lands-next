"use client";
import {
  RegionDECInfo,
  getRegionStakedDEC,
} from "@/lib/backend/actions/land-manager/dec-power-actions";
import { getWorkerEligibility } from "@/lib/backend/actions/land-manager/worker-actions";
import { WorkerEligibilityResult } from "@/types/landManager";
import { useEffect, useState } from "react";

interface LandRegionData {
  eligibility: WorkerEligibilityResult | null;
  /** Per-region DEC rows for all owned regions. */
  stakedDEC: RegionDECInfo[];
  /** Account-wide DEC currently staked (global `dark_energy` pool). */
  totalStaked: number;
  /** Sum of required DEC across ALL of the player's regions. */
  totalRequired: number;
  /** DEC still missing globally: `max(0, totalRequired - totalStaked)`. */
  globalShortfall: number;
  /** DEC staked beyond requirements: `max(0, totalStaked - totalRequired)`. */
  globalExcess: number;
  /** Sum of per-region shortfalls regardless of global net. */
  regionalShortfall: number;
  /** Sum of per-region over-stake regardless of global net. */
  regionalOverStake: number;
  /**
   * Amount that can be staked right now from DEC action buttons.
   * Uses global shortfall when present; otherwise enables rebalancing when
   * global stake is balanced but regions are uneven.
   */
  stakeActionable: number;
  /**
   * Amount that can be unstaked right now from DEC action buttons.
   * Uses global excess when present; otherwise enables rebalancing when
   * global stake is balanced but regions are uneven.
   */
  unstakeActionable: number;
  loading: boolean;
}

export function useLandManagerRegionData(
  enabledRegions: number[],
  refreshKey: number = 0
): LandRegionData {
  const [eligibility, setEligibility] =
    useState<WorkerEligibilityResult | null>(null);
  const [stakedDEC, setStakedDEC] = useState<RegionDECInfo[]>([]);
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalRequired, setTotalRequired] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getWorkerEligibility(enabledRegions),
      getRegionStakedDEC(),
    ]).then(([e, a]) => {
      if (!cancelled) {
        setEligibility(e);
        setStakedDEC(a.regions);
        setTotalStaked(a.totalStaked);
        setTotalRequired(a.totalRequired);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabledRegions, refreshKey]);

  const globalShortfall = Math.max(0, totalRequired - totalStaked);
  const globalExcess = Math.max(0, totalStaked - totalRequired);
  const regionalShortfall = stakedDEC.reduce(
    (sum, r) => sum + Math.max(0, r.dec_stake_needed - r.dec_stake_in_use),
    0
  );
  const regionalOverStake = stakedDEC.reduce(
    (sum, r) => sum + Math.max(0, r.dec_stake_in_use - r.dec_stake_needed),
    0
  );
  const isGloballyBalanced = Math.abs(totalRequired - totalStaked) < 1e-6;
  const rebalanceAmount = isGloballyBalanced
    ? Math.min(regionalShortfall, regionalOverStake)
    : 0;
  const stakeActionable =
    globalShortfall > 0 ? globalShortfall : rebalanceAmount;
  const unstakeActionable = globalExcess > 0 ? globalExcess : rebalanceAmount;

  return {
    eligibility,
    stakedDEC,
    totalStaked,
    totalRequired,
    globalShortfall,
    globalExcess,
    regionalShortfall,
    regionalOverStake,
    stakeActionable,
    unstakeActionable,
    loading,
  };
}
