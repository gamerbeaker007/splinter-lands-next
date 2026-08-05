"use client";

import { getCardBloodlineOptions } from "@/lib/backend/actions/card-detail-actions";
import { CardBloodline } from "@/types/planner";
import { useEffect, useState } from "react";

let cachedBloodlineOptions: CardBloodline[] | null = null;
let inFlightBloodlineOptions: Promise<CardBloodline[]> | null = null;

export function useCardBloodlineOptions(): CardBloodline[] {
  const [options, setOptions] = useState<CardBloodline[]>(
    cachedBloodlineOptions ?? []
  );

  useEffect(() => {
    if (cachedBloodlineOptions) {
      return;
    }

    let active = true;

    if (!inFlightBloodlineOptions) {
      inFlightBloodlineOptions = getCardBloodlineOptions();
    }

    void inFlightBloodlineOptions
      .then((bloodlines) => {
        cachedBloodlineOptions = bloodlines;
        if (active) {
          setOptions(bloodlines);
        }
      })
      .catch((error) => {
        console.error("Failed to load bloodline options:", error);
      })
      .finally(() => {
        inFlightBloodlineOptions = null;
      });

    return () => {
      active = false;
    };
  }, []);

  return options;
}
