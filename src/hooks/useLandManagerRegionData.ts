"use client";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  getRegionStakedDEC,
  getWorkerEligibility,
} from "@/lib/frontend/land-production-data";
import { RegionDECInfo } from "@/lib/shared/decPower";
import { WorkerEligibilityResult } from "@/types/landManager";

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

const NO_REGIONS: RegionDECInfo[] = [];

export function useLandManagerRegionData(
  refreshKey: number = 0
): LandRegionData {
  const { data, loading } = useAsyncData(
    `land-region-data|${refreshKey}`,
    async () => {
      const [eligibility, staked] = await Promise.all([
        getWorkerEligibility(),
        getRegionStakedDEC(),
      ]);
      return { eligibility, staked };
    },
    { errorMessage: "Failed to load region data" }
  );
  const eligibility = data?.eligibility ?? null;
  const stakedDEC = data?.staked.regions ?? NO_REGIONS;
  const totalStaked = data?.staked.totalStaked ?? 0;
  const totalRequired = data?.staked.totalRequired ?? 0;

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
