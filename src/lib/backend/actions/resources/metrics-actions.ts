"use server";

import { ResourceTracking } from "@/generated/prisma/client";
import { getAllResourceTrackingdata } from "@/lib/backend/api/internal/resource-tracking-data";

export async function getResourceMetricsData(): Promise<ResourceTracking[]> {
  return await getAllResourceTrackingdata();
}
