"use client";

import {
  getSplSession,
  subscribeSplSession,
  type SplSession,
} from "@/lib/frontend/splSession";
import { useSyncExternalStore } from "react";

/**
 * The browser's SPL session (username + JWT copy), or null when logged out.
 * `null` on the server and during hydration.
 */
export function useSplSession(): SplSession | null {
  return useSyncExternalStore(subscribeSplSession, getSplSession, () => null);
}
