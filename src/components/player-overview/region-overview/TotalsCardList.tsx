import React from "react";
import { RegionCard } from "./RegionCard";
import Box from "@mui/material/Box";
import { PRODUCING_RESOURCES } from "@/lib/shared/statics";
import { RegionTotals } from "@/types/resource";
import { Resource } from "@/constants/resource/resource";

type Props = {
  regionTotals: RegionTotals;
};

const TotalsCardList: React.FC<Props> = ({ regionTotals }) => {
  const totals = {
    title: "Totals Overview",
    totals: true,
    resources: PRODUCING_RESOURCES.map((res) => ({
      name: String(res),
      count: Number(regionTotals.resourceCounts[res as Resource]) || 0,
      produce: Number(regionTotals.netAdjustedResource[res as Resource]) || 0,
      net: Number(regionTotals.dec[res as Resource]) || 0,
    })),
  };

  return (
    <>
      <Box display="flex" flexWrap="wrap" gap={2} justifyContent="flex-start">
        <RegionCard data={totals} />
      </Box>
    </>
  );
};

export default TotalsCardList;
