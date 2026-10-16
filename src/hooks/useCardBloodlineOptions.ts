"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { getCardBloodlineOptions } from "@/lib/backend/actions/card-detail-actions";
import { CardBloodline } from "@/types/planner";

const NO_OPTIONS: CardBloodline[] = [];

// Shared by every mounted picker: one request per page load, retried after a failure.
let bloodlineOptions: Promise<CardBloodline[]> | null = null;

function loadBloodlineOptions(): Promise<CardBloodline[]> {
  bloodlineOptions ??= getCardBloodlineOptions().catch((error) => {
    console.error("Failed to load bloodline options:", error);
    bloodlineOptions = null;
    throw error;
  });
  return bloodlineOptions;
}

export function useCardBloodlineOptions(): CardBloodline[] {
  const { data } = useAsyncData("card-bloodlines", loadBloodlineOptions);
  return data ?? NO_OPTIONS;
}
