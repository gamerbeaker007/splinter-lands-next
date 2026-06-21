"use client";

import {
  getRentalAuthorityStatus,
  refreshRentalAuthorityStatus,
} from "@/lib/backend/actions/land-manager/authority-actions";
import { useCallback } from "react";
import {
  AuthorityCoreStatus,
  UseAuthorityStatus,
  useAuthorityStatusCore,
} from "./useAuthorityStatusCore";

export type { AuthorityActionResult } from "./useAuthorityStatusCore";
export type UseRentalAuthorityStatus = UseAuthorityStatus;

/** Rental-authority status + grant/revoke (active-key sm_set_authority). */
export function useRentalAuthorityStatus(): UseRentalAuthorityStatus {
  const load = useCallback(async (): Promise<AuthorityCoreStatus> => {
    const s = await getRentalAuthorityStatus();
    return { ...s, accounts: s.rental };
  }, []);
  const reload = useCallback(async (): Promise<AuthorityCoreStatus> => {
    const s = await refreshRentalAuthorityStatus();
    return { ...s, accounts: s.rental };
  }, []);
  return useAuthorityStatusCore({ kind: "rental", load, reload });
}
