"use client";

import { getAuthorityStatus } from "@/lib/frontend/land-data";
import { useCallback } from "react";
import {
  UseAuthorityStatus,
  useAuthorityStatusCore,
} from "./useAuthorityStatusCore";

export type UsePurchaseAuthorityStatus = UseAuthorityStatus;

/** Purchase-authority status + grant/revoke (active-key sm_set_authority). */
export function usePurchaseAuthorityStatus(): UsePurchaseAuthorityStatus {
  const load = useCallback(() => getAuthorityStatus("purchase"), []);
  const reload = useCallback(() => getAuthorityStatus("purchase", true), []);
  return useAuthorityStatusCore({ kind: "purchase", load, reload });
}
