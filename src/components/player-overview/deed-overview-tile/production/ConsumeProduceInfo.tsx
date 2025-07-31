import React from "react";
import { Box, Typography } from "@mui/material";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import Image from "next/image";
import { ResourceWithDEC } from "@/types/productionInfo";

type Props = {
  consume: ResourceWithDEC[];
  type: "produce" | "consume";
};

export const ConsumeProduceInfo: React.FC<Props> = ({ consume, type }) => {
  return (
    <Box>
      <Typography fontSize="0.8rem" fontWeight="bold" mb={0.5}>
        {type === "consume" ? "Cost" : "Production"}:
      </Typography>
      {consume.map((row, idx) => {
        const resource = row.resource;
        const amount = row.amount;
        const icon = RESOURCE_ICON_MAP[resource];

        return (
          <Box key={idx} mb={0.5}>
            <Box display="flex" flexDirection="column" alignItems="flex-start">
              <Box display="flex" alignItems="center" gap={0.5}>
                {icon && (
                  <Image src={icon} alt={resource} width={20} height={20} />
                )}
                <Typography fontSize="0.625rem">
                  {amount.toFixed(1)} /h
                </Typography>
              </Box>

              {type === "produce" && (
                <Typography
                  variant="caption"
                  color="gray"
                  fontSize="0.625rem"
                  sx={{ mt: 0.25 }} // reduced top spacing
                >
                  (incl. tax)
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
