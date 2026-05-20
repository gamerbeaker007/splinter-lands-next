"use client";

import {
  getRegionStakedDEC,
  getRentalEligibility,
  getRentedCardsList,
  RegionDECInfo,
  RentedCardsList,
} from "@/lib/backend/actions/land-manager/rental-actions";
import { RentalEligibilityResult } from "@/types/landManager";
import { useEffect, useState } from "react";

interface LandRegionData {
  eligibility: RentalEligibilityResult | null;
  stakedDEC: RegionDECInfo[];
  rentedCards: RentedCardsList | null;
  loading: boolean;
}

export function useLandManagerRegionData(
  enabledRegions: number[],
  refreshKey: number = 0
): LandRegionData {
  const [eligibility, setEligibility] =
    useState<RentalEligibilityResult | null>(null);
  const [stakedDEC, setStakedDEC] = useState<RegionDECInfo[]>([]);
  const [rentedCards, setRentedCards] = useState<RentedCardsList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getRentalEligibility(enabledRegions),
      getRegionStakedDEC(enabledRegions),
      getRentedCardsList(),
    ]).then(([e, a, r]) => {
      if (!cancelled) {
        setEligibility(e);
        setStakedDEC(a);
        setRentedCards(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabledRegions, refreshKey]);

  return { eligibility, stakedDEC, rentedCards, loading };
}
