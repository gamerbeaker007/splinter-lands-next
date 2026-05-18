"use client";

import {
  getRegionAlerts,
  getRentalEligibility,
  getRentedCardsList,
  RegionAlertInfo,
  RentedCardsList,
} from "@/lib/backend/actions/land-manager/rental-actions";
import { RentalEligibilityResult } from "@/types/landManager";
import { useEffect, useState } from "react";

interface LandRegionData {
  eligibility: RentalEligibilityResult | null;
  alerts: RegionAlertInfo[];
  rentedCards: RentedCardsList | null;
  loading: boolean;
}

export function useLandManagerRegionData(
  enabledRegions: number[],
  refreshKey: number = 0
): LandRegionData {
  const [eligibility, setEligibility] =
    useState<RentalEligibilityResult | null>(null);
  const [alerts, setAlerts] = useState<RegionAlertInfo[]>([]);
  const [rentedCards, setRentedCards] = useState<RentedCardsList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getRentalEligibility(enabledRegions),
      getRegionAlerts(enabledRegions),
      getRentedCardsList(),
    ]).then(([e, a, r]) => {
      if (!cancelled) {
        setEligibility(e);
        setAlerts(a);
        setRentedCards(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabledRegions, refreshKey]);

  return { eligibility, alerts, rentedCards, loading };
}
