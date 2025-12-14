import { worksiteTypeMapping } from "@/lib/shared/statics";
import { land_under_construction_icon_url } from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { Box } from "@mui/material";
import React from "react";

type Props = {
  worksiteType: string;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const WorksiteInfo: React.FC<Props> = ({
  worksiteType,
  pos = { x: "0px", y: "0px", w: "auto" },
}) => {
  const { x, y, w } = pos;

  const worksiteImage =
    worksiteTypeMapping[worksiteType] ?? land_under_construction_icon_url;

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: "left",
      }}
    >
      <Box borderRadius={1} bgcolor="rgba(70, 71, 70, 0.9)" minHeight={100}>
        <Box
          sx={{
            width: 110,
            height: 110,
            backgroundImage: `url(${worksiteImage})`,
            backgroundSize: "95%",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
          }}
        />
      </Box>
    </Box>
  );
};
