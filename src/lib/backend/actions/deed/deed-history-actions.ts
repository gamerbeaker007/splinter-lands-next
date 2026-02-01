"use server";

import {
  fetchAllDeedHarvestActions,
  fetchAllDeedProjects,
} from "@/lib/backend/api/spl/spl-land-api";
import logger from "@/lib/backend/log/logger.server";
import { SplDeedHarvestActionsResponse } from "@/types/deedHarvest";
import { SplDeedProjectsResponse } from "@/types/deedProjects";
import { cacheLife } from "next/cache";

export async function getDeedHistory(deedUid: string): Promise<{
  projects: SplDeedProjectsResponse;
  harvests: SplDeedHarvestActionsResponse;
}> {
  "use cache";
  cacheLife("hours");

  try {
    logger.info(`Fetching deed history for ${deedUid}`);

    const [projects, harvests] = await Promise.all([
      fetchAllDeedProjects(deedUid),
      fetchAllDeedHarvestActions(deedUid),
    ]);

    logger.info(
      `Fetched ${projects.data.length} projects and ${harvests.data.length} harvest actions for ${deedUid}`
    );

    return {
      projects,
      harvests,
    };
  } catch (error) {
    logger.error(`Error fetching deed history for ${deedUid}:`, error);
    throw error;
  }
}
