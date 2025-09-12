import { DECInfo } from "@/components/player-overview/deed-overview/land-deed-card/info-sections/DECInfo";
import { CSSSize } from "@/types/cssSize";
import { resourceWorksiteMap, WorksiteType } from "@/types/planner";
import { ProductionInfo } from "@/types/productionInfo";
import { Box } from "@mui/material";
import React from "react";

type Props = {
  worksiteType: WorksiteType;
  productionInfo: ProductionInfo;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const DECOutput: React.FC<Props> = ({
  worksiteType,
  productionInfo,
  pos,
}) => {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};
  const resource = resourceWorksiteMap[worksiteType];

  return (
    <Box
      borderRadius={1}
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        p: 1,
        zIndex: 2,
      }}
    >
      <Box display="flex" flexDirection="column" mt={0.5} minWidth="100px">
        <DECInfo
          productionInfo={productionInfo}
          resource={resource}
          includeFee={false}
        />
      </Box>
    </Box>
  );
};
