import React from "react";
import Box from "@mui/material/Box";
import {
  TaxCard,
  TaxData,
} from "@/components/player-overview/region-overview/TaxCard";
import { PRODUCING_RESOURCES } from "@/lib/shared/statics";
import { RegionTaxSummary } from "@/types/resource";

type Props = {
  data: RegionTaxSummary[];
};

const TaxCardList: React.FC<Props> = ({ data }) => {
  const regionList: TaxData[] = data.map((region) => {
    const resourceMap = Object.fromEntries(
      region.resources.map((res) => [String(res.token).toLowerCase(), res])
    );
    return {
      region_uid: region.region_uid,
      tract_number: region.tract_number,
      type: region.type,
      capture_rate: region.capture_rate,
      resources: PRODUCING_RESOURCES.map((res) => {
        const r = resourceMap[res.toLowerCase()] || {};
        return {
          token: res.toLowerCase(),
          total_rewards_per_hour: Number(r.total_rewards_per_hour ?? 0),
          total_tax: Number(r.total_tax ?? 0),
          captured: Number(r.captured ?? 0),
          dec: Number(r.dec ?? 0),
        };
      }),
    };
  });

  const sortedRegions = [...regionList].sort((a, b) => {
    // Extract the number from region_uid (assumes format like "PR-PNW-9")
    const getRegionEndNumber = (uid: string) => {
      const parts = uid.split("-");
      return parseInt(parts[parts.length - 1], 10);
    };

    const aRegionNum = getRegionEndNumber(a.region_uid);
    const bRegionNum = getRegionEndNumber(b.region_uid);

    if (aRegionNum !== bRegionNum) {
      return aRegionNum - bRegionNum;
    }

    // Secondary sort: tract_number
    return a.tract_number - b.tract_number;
  });

  return (
    <>
      <Box display="flex" flexWrap="wrap" gap={2} justifyContent="flex-start">
        {sortedRegions.map((region, idx) => (
          <TaxCard key={idx} data={region} />
        ))}
      </Box>
    </>
  );
};

export default TaxCardList;
