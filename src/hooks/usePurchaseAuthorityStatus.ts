"use client";

import {
  getPurchaseAuthorityStatus,
  refreshPurchaseAuthorityStatus,
} from "@/lib/backend/actions/land-manager/authority-actions";
import { useCallback } from "react";
import {
  AuthorityCoreStatus,
  UseAuthorityStatus,
  useAuthorityStatusCore,
} from "./useAuthorityStatusCore";

export type UsePurchaseAuthorityStatus = UseAuthorityStatus;

/** Purchase-authority status + grant/revoke (active-key sm_set_authority). */
export function usePurchaseAuthorityStatus(): UsePurchaseAuthorityStatus {
  const load = useCallback(async (): Promise<AuthorityCoreStatus> => {
    const s = await getPurchaseAuthorityStatus();
    return { ...s, accounts: s.purchase };
  }, []);
  const reload = useCallback(async (): Promise<AuthorityCoreStatus> => {
    const s = await refreshPurchaseAuthorityStatus();
    return { ...s, accounts: s.purchase };
  }, []);
  return useAuthorityStatusCore({ kind: "purchase", load, reload });
}
