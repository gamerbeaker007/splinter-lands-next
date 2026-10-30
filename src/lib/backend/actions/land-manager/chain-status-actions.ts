"use server";

import { getChainStatus } from "@/lib/backend/services/chainStatusService";

/** Hive head and SPL's processing position (public, server-cached 5 s). */
export async function getChainStatusAction() {
  return getChainStatus();
}
