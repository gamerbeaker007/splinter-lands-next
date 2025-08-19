import { CSSSize } from "@/types/cssSize";
import { Box, Tooltip, Typography } from "@mui/material";
import React from "react";

type InfoItemProps = {
  icon: React.ReactNode;
  title: string;
  text: string;
  tooltip?: React.ReactNode;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const InfoItem: React.FC<InfoItemProps> = ({
  icon,
  title,
  text,
  tooltip,
  pos,
}) => {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};

  const content = (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="left"
      color="white"
      gap={1}
    >
      {icon}
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        sx={{ minWidth: "220px" }} // adjust to your preferred width
      >
        <Box minWidth={"100px"}>
          <Typography fontSize="0.9rem" fontWeight="bold">
            {title}:
          </Typography>
        </Box>
        <Box>
          <Typography fontSize="0.85rem">{text}</Typography>
        </Box>
      </Box>
    </Box>
  );

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
      {tooltip ? <Tooltip title={tooltip}>{content}</Tooltip> : content}
    </Box>
  );
};
