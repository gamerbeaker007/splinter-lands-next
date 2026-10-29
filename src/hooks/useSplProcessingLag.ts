"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { getChainStatusAction } from "@/lib/backend/actions/land-manager/chain-status-actions";
import {
  splLagOf,
  type SplProcessingLag,
} from "@/lib/shared/hive/sequencedBroadcast";
import { useEffect } from "react";

const REFRESH_MS = 15_000;

/**
 * How far Splinterlands' block processing trails the Hive head, refreshed
 * every 15 s while `enabled`. Each broadcast batch waits for SPL to confirm
 * it, so this is roughly the extra wait per batch.
 */
export function useSplProcessingLag(
  enabled: boolean
): SplProcessingLag | undefined {
  const { data, refetch } = useAsyncData(
    enabled ? "spl-processing-lag" : null,
    async () => splLagOf(await getChainStatusAction()),
    { errorMessage: "Could not check Splinterlands processing" }
  );

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => refetch({ silent: true }), REFRESH_MS);
    return () => clearInterval(timer);
  }, [enabled, refetch]);

  return data ?? undefined;
}
