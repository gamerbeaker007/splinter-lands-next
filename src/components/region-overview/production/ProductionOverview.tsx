"use client";

import Box from "@mui/material/Box";
import { useMediaQuery, useTheme } from "@mui/material";
import { RegionPP } from "@/types/regionProductionSummary";
import RawVsBoostedPPChart from "@/components/region-overview/production/RawVsBoostedPPChart";
import ResourcePPChart from "@/components/region-overview/production/ResourcePPChart";
import TopRegionsByResourceChart from "@/components/region-overview/production/TopRegionsByResourceChart";

type Props = {
  data: RegionPP;
};

export function ProductionOverviewPage({ data }: Props) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <Box
        display="flex"
        flexDirection={isSmallScreen ? "column" : "row"}
        gap={1}
      >
        <Box flex={1} maxWidth={"250px"}>
          <RawVsBoostedPPChart data={data} />
        </Box>
        <Box flex={1}>
          <ResourcePPChart data={data.perResource} />
        </Box>
      </Box>
      <Box>
        <TopRegionsByResourceChart data={data.perResource} />
      </Box>
    </>
  );
}
