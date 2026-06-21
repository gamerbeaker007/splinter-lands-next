"use client";

import {
  getRentedCardsList,
  RentedCardsList,
} from "@/lib/backend/actions/land-manager/rental-actions";
import {
  RegionDECInfo,
  getRegionStakedDEC,
} from "@/lib/backend/actions/land-manager/stake-dec-actions";
import { getWorkerEligibility } from "@/lib/backend/actions/land-manager/worker-actions";
import { WorkerEligibilityResult } from "@/types/landManager";
import { useEffect, useState } from "react";

interface LandRegionData {
  eligibility: WorkerEligibilityResult | null;
  /** Per-region DEC rows for the enabled regions. */
  stakedDEC: RegionDECInfo[];
  /** Account-wide DEC currently staked (global `dark_energy` pool). */
  totalStaked: number;
  /** Sum of required DEC across ALL of the player's regions. */
  totalRequired: number;
  /** DEC still missing globally: `max(0, totalRequired - totalStaked)`. */
  globalShortfall: number;
  /** DEC staked beyond requirements: `max(0, totalStaked - totalRequired)`. */
  globalExcess: number;
  rentedCards: RentedCardsList | null;
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
  const [rentedCards, setRentedCards] = useState<RentedCardsList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getWorkerEligibility(enabledRegions),
      getRegionStakedDEC(enabledRegions),
      getRentedCardsList(),
    ]).then(([e, a, r]) => {
      if (!cancelled) {
        setEligibility(e);
        setStakedDEC(a.regions);
        setTotalStaked(a.totalStaked);
        setTotalRequired(a.totalRequired);
        setRentedCards(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabledRegions, refreshKey]);

  const globalShortfall = Math.max(0, totalRequired - totalStaked);
  const globalExcess = Math.max(0, totalStaked - totalRequired);

  return {
    eligibility,
    stakedDEC,
    totalStaked,
    totalRequired,
    globalShortfall,
    globalExcess,
    rentedCards,
    loading,
  };
}
