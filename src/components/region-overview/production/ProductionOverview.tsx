"use client";

import BaseVsBoostedPPChart from "@/components/region-overview/production/RawVsBoostedPPChart";
import ResourcePPChart from "@/components/region-overview/production/ResourcePPChart";
import TopRegionsByResourceChart from "@/components/region-overview/production/TopRegionsByResourceChart";
import { getRegionProductionData } from "@/lib/backend/actions/region/production-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RegionPP } from "@/types/regionProductionSummary";
import { Skeleton, useMediaQuery, useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import { useEffect, useState, useTransition } from "react";

export function ProductionOverviewPage() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [data, setData] = useState<RegionPP | null>(null);
  const [isPending, startTransition] = useTransition();
  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;

    startTransition(async () => {
      try {
        const result = await getRegionProductionData(filters);
        setData(result);
      } catch (error) {
        console.error("Failed to load production data:", error);
      }
    });
  }, [filters]);

  if (isPending && !data) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton
          variant="rectangular"
          width={200}
          height={40}
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Skeleton variant="rectangular" width={250} height={100} />
          <Skeleton variant="rectangular" width={250} height={100} />
        </Box>

        <Skeleton
          variant="rectangular"
          width="100%"
          height={400}
          sx={{ mb: 4 }}
        />
      </Box>
    );
  } else {
    return (
      <>
        {data && (
          <>
            <Box
              display="flex"
              flexDirection={isSmallScreen ? "column" : "row"}
              mt={2}
              gap={1}
            >
              <Box flex={1} maxWidth={"250px"}>
                <BaseVsBoostedPPChart
                  title="Base vs Boosted PP"
                  totalPP={data.totalPP}
                />
              </Box>
              <Box flex={1} maxWidth={"250px"}>
                <BaseVsBoostedPPChart
                  title="Labor's Luck PP"
                  totalPP={data.laborsLuckPP}
                />
              </Box>
              <Box flex={1}>
                <ResourcePPChart data={data.perResource} />
              </Box>
            </Box>
            <Box>
              <TopRegionsByResourceChart data={data.perResource} />
            </Box>
          </>
        )}
      </>
    );
  }
}
