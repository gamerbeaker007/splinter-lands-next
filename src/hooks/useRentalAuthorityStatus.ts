"use client";

import { getAuthorityStatus } from "@/lib/frontend/land-data";
import { useCallback } from "react";
import {
  UseAuthorityStatus,
  useAuthorityStatusCore,
} from "./useAuthorityStatusCore";

export type UseRentalAuthorityStatus = UseAuthorityStatus;

/** Rental-authority status + grant/revoke (active-key sm_set_authority). */
export function useRentalAuthorityStatus(): UseRentalAuthorityStatus {
  const load = useCallback(() => getAuthorityStatus("rental"), []);
  const reload = useCallback(() => getAuthorityStatus("rental", true), []);
  return useAuthorityStatusCore({ kind: "rental", load, reload });
}
