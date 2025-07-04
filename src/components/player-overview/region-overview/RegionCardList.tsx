import React from "react";
import { RegionCard, RegionData } from "./RegionCard";
import { RegionSummary } from "@/types/resource";
import Box from "@mui/material/Box";
import { PRODUCING_RESOURCES } from "@/lib/shared/statics";

type Props = {
  data: RegionSummary[];
};

const RegionCardList: React.FC<Props> = ({ data }) => {
  const regionList: RegionData[] = data.map((region) => ({
    title: `Region: ${String(region.region_uid)}`,
    resources: PRODUCING_RESOURCES.map((res) => ({
      name: String(res),
      count: Number(region[res.toLowerCase()]) || 0,
      produce: Number(region[`prod_per_h_${res.toLowerCase()}`]) || 0,
      consume: Number(region[`cost_per_h_${res.toLowerCase()}`]) || 0,
      net: Number(region[`adj_net_${res.toLowerCase()}`]) || 0,
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
