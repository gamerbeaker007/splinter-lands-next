import { Box, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";
import Tooltip from "@mui/material/Tooltip";

type Props = {
  icon: string;
  title: string;
  number: number;
  percision?: number;
  creatable?: string;
  fontSize?: number;
  tooltip?: React.ReactNode;
};

export function InfoCreatableItem({
  icon,
  title,
  number,
  percision,
  creatable,
  fontSize = 14,
  tooltip,
}: Props) {
  return (
    <Box mb={1}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Image src={icon} alt={title} width={40} height={40} />{" "}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant="body2"
            fontSize={fontSize}
            sx={{
              fontFamily: "monospace",
              fontWeight: "bold",
              color: `${number >= 0 ? "success.main" : "error.main"}`,
            }}
          >
            {percision ? number.toFixed(percision) : number.toLocaleString()}
          </Typography>
          {creatable && (
            <Tooltip title={tooltip ?? ""} disableHoverListener={!tooltip}>
              <Typography
                variant="body2"
                sx={{ color: "warning.main", fontFamily: "monospace" }}
              >
                ({creatable})
              </Typography>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}
