"use client";

import { SplDeedHarvestAction } from "@/types/deedHarvest";
import { SplDeedProject } from "@/types/deedProjects";
import { Box } from "@mui/material";
import FragmentRollsSection from "./FragmentRollsSection";
import HarvestSummarySection from "./HarvestSummarySection";
import WorksiteProgressionSection from "./WorksiteProgressionSection";

interface DeedHistoryDashboardProps {
  projects: SplDeedProject[];
  harvests: SplDeedHarvestAction[];
}

export default function DeedHistoryDashboard({
  projects,
  harvests,
}: DeedHistoryDashboardProps) {
  return (
    <Box sx={{ padding: 2 }}>
      {/* Worksite Progression Section */}
      <Box sx={{ mb: 3 }}>
        <WorksiteProgressionSection projects={projects} />
      </Box>

      {/* Harvest Summary and Fragment Rolls */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <HarvestSummarySection harvests={harvests} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FragmentRollsSection harvests={harvests} />
        </Box>
      </Box>
    </Box>
  );
}
