"use client";

import {
  getBroadcastRun,
  subscribeBroadcastRun,
  type BroadcastRunState,
} from "@/lib/frontend/broadcastProgress";
import { useSyncExternalStore } from "react";

/** The broadcast run active in this tab, or null (see broadcastProgress.ts). */
export function useBroadcastProgress(): BroadcastRunState | null {
  return useSyncExternalStore(
    subscribeBroadcastRun,
    getBroadcastRun,
    () => null
  );
}
