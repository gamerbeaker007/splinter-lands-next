import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import Image from "next/image";
import { ResourceWithDEC } from "@/types/productionInfo";
import { CSSSize } from "@/types/cssSize";

type Props = {
  produce?: ResourceWithDEC;
  consume?: ResourceWithDEC[];
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const ConsumeProduceInfo: React.FC<Props> = ({
  produce,
  consume,
  pos = { x: "0px", y: "0px", w: "auto" },
}) => {
  const { x, y, w } = pos;

  const resource = produce?.resource ?? "Undefined";
  const amount = produce?.amount ?? 0;
  const icon = RESOURCE_ICON_MAP[resource];

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
      <Typography fontSize="1.0rem" fontWeight="bold" mb={0.5} color="white">
        Production:
      </Typography>
      <Box display="flex" flexDirection="column" alignItems="flex-start">
        <Box display="flex" alignItems="center" gap={0.5}>
          <Tooltip
            arrow
            placement="top"
            title={
              <Box>
                <Typography fontSize="0.75rem" fontWeight="bold" mb={0.5}>
                  Consumes:
                </Typography>
                {consume &&
                  consume.map((row, idx) => {
                    const icon = RESOURCE_ICON_MAP[row.resource];
                    return (
                      <Box
                        key={idx}
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        mb={0.25}
                      >
                        {icon && (
                          <Image
                            src={icon}
                            alt={row.resource}
                            width={20}
                            height={20}
                          />
                        )}
                        <Typography fontSize="0.75rem">
                          {row.amount.toFixed(1)} /h
                        </Typography>
                      </Box>
                    );
                  })}
              </Box>
            }
          >
            <Box display="flex" alignItems="center" gap={0.5}>
              {icon && (
                <Image src={icon} alt={resource} width={35} height={35} />
              )}
              <Typography fontSize="1.0rem" color="white">
                {amount.toFixed(1)} /h
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        <Typography
          variant="caption"
          color="gray"
          fontSize="0.625rem"
          sx={{ mt: 0.25 }}
        >
          (incl. tax)
        </Typography>
      </Box>
    </Box>
  );
};
