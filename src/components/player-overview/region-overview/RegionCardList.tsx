import React from "react";
import { RegionCard, RegionData } from "./RegionCard";
import { RegionSummary } from "@/types/resource";
import { PRODUCING_RESOURCES } from "@/lib/shared/statics";
import { Resource } from "@/constants/resource/resource";
import { Box } from "@mui/material";

type Props = {
  data: RegionSummary[];
};

const RegionCardList: React.FC<Props> = ({ data }) => {
  const regionList: RegionData[] = data.map((region) => ({
    title: `Region: ${String(region.region_uid)}`,
    resources: PRODUCING_RESOURCES.map((res) => ({
      name: String(res),
      count: Number(region.countPlots[res as Resource]) || 0,
      produce: Number(region.production[res as Resource]) || 0,
      consume: Number(region.consumption[res as Resource]) || 0,
      net: Number(region.netAdjustedResource[res as Resource]) || 0,
    })),
  }));

  return (
    <>
      <Box display="flex" flexWrap="wrap" gap={2} justifyContent="flex-start">
        {regionList.map((region, idx) => (
          <RegionCard key={idx} data={region} />
        ))}
      </Box>
    </>
  );
};

export default RegionCardList;
