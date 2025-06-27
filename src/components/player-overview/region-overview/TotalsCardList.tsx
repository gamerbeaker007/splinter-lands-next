import React from "react";
import { RegionCard } from "./RegionCard";
import Box from "@mui/material/Box";
import { PRODUCING_RESOURCES } from "@/scripts/lib/utils/statics";

type Props = {
  data: Record<string, number>;
};

const TotalsCardList: React.FC<Props> = ({ data }) => {
  const totals = {
    title: "Totals Overview",
    totals: true,
    resources: PRODUCING_RESOURCES.map((res) => ({
      name: String(res),
      count: Number(data[`res_count`]) || 0,
      produce: Number(data[`${res.toLowerCase()}`]) || 0,
      net: Number(data[`dec_${res.toLowerCase()}`]) || 0,
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
