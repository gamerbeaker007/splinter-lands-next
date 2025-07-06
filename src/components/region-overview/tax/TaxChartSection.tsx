import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { TaxIncomeChart } from "./TaxIncomeChart";
import { RegionTax } from "@/types/regionTax";
import { useState } from "react";
import { ResourceSelector } from "../ResourceSelector";
import { PRODUCING_RESOURCES } from "@/lib/shared/statics";

type TaxChartsWrapperProps = {
  data: RegionTax[];
};

export const TaxChartsWrapper = ({ data }: TaxChartsWrapperProps) => {
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const resourceTypes = PRODUCING_RESOURCES;

  return (
    <>
      <ResourceSelector
        resourceTypes={resourceTypes}
        selectedResource={selectedResource}
        onSelect={setSelectedResource}
      />

      <Typography variant="h6" sx={{ mt: 2 }}>
        Resource Income by captured tax
      </Typography>

      <Box
        display="flex"
        flexDirection={isSmallScreen ? "column" : "row"}
        flexWrap="wrap"
        gap={2}
        mt={2}
      >
        <Box flex={1} minWidth={250}>
          <TaxIncomeChart
            title="Castle Tax Income"
            data={data}
            type="castle"
            income="resource"
            resourceFilter={selectedResource}
          />
        </Box>
        <Box flex={1} minWidth={250}>
          <TaxIncomeChart
            title="Keep Tax Income"
            data={data}
            type="keep"
            income="resource"
            resourceFilter={selectedResource}
          />
        </Box>
      </Box>

      <Typography variant="h6" sx={{ mt: 4 }}>
        DEC Income by captured tax
      </Typography>

      <Box
        display="flex"
        flexDirection={isSmallScreen ? "column" : "row"}
        flexWrap="wrap"
        gap={2}
        mt={2}
      >
        <Box flex={1} minWidth={250}>
          <TaxIncomeChart
            title="Castle Tax Income"
            data={data}
            type="castle"
            income="dec"
            resourceFilter={selectedResource}
          />
        </Box>
        <Box flex={1} minWidth={250}>
          <TaxIncomeChart
            title="Keep Tax Income"
            data={data}
            type="keep"
            income="dec"
            resourceFilter={selectedResource}
          />
        </Box>
      </Box>
    </>
  );
};
