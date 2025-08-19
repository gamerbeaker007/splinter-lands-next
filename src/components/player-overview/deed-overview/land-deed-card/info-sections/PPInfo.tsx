import { formatLargeNumber } from "@/lib/formatters";
import { land_hammer_icon_url } from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { Box, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";

type Props = {
  basePP: number;
  boostedPP: number;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const PPInfo: React.FC<Props> = ({
  basePP,
  boostedPP,
  pos = { x: "0px", y: "0px", w: "auto" },
}) => {
  const { x, y, w } = pos;

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
      <Tooltip
        title={
          <>
            <strong>Total Production Power (PP):</strong>
            <br />
            Base: {formatLargeNumber(Number(basePP))}
            <br />
            Boosted: {formatLargeNumber(Number(boostedPP))}
          </>
        }
      >
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent={"left"}
          // bgcolor="rgba(70, 71, 70, 0.9)"
          color="white"
          // borderRadius={"0px 0px 10px 10px"}
          gap={1}
        >
          <Image
            src={land_hammer_icon_url}
            alt="hammer"
            width={25}
            height={25}
          />
          <Typography fontSize="1.0rem">
            Total PP:{formatLargeNumber(Number(boostedPP.toFixed(0)))}
          </Typography>
        </Box>
      </Tooltip>
    </Box>
  );
};
