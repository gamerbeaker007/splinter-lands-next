import { Resource, RESOURCES } from "@/constants/resource/resource";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { CSSSize } from "@/types/cssSize";
import { ResourceWithDEC } from "@/types/productionInfo";
import { Box, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";

type Props = {
  resource: Resource;
  produce?: ResourceWithDEC[];
  consume?: ResourceWithDEC[];
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const ConsumeProduceInfo: React.FC<Props> = ({
  produce,
  consume,
  pos = { x: "0px", y: "0px", w: "auto" },
  resource,
}) => {
  const { x, y, w } = pos;

  const isTax = resource === "TAX";

  const suffix = isTax ? "" : "\h";
  const iconSize = isTax ? 25 : 35;
  const fontSize = isTax ? "0.975rem" : "1.0rem";

  (produce ?? []).sort(
    (a, b) => RESOURCES.indexOf(a.resource) - RESOURCES.indexOf(b.resource)
  );

  (consume ?? []).sort(
    (a, b) => RESOURCES.indexOf(a.resource) - RESOURCES.indexOf(b.resource)
  );

  const grainConsumed =
    consume?.reduce(
      (acc, r) => (r.resource === "GRAIN" ? acc + r.amount : acc),
      0
    ) ?? 0;

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
        {isTax ? "Ready to Collect:" : "Production:"}
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
                            width={iconSize}
                            height={iconSize}
                          />
                        )}
                        <Typography fontSize={fontSize}>
                          {row.amount.toFixed(1)} {suffix}
                        </Typography>
                      </Box>
                    );
                  })}
              </Box>
            }
          >
            <Box>
              {produce &&
                produce.map((row, idx) => {
                  const icon = RESOURCE_ICON_MAP[row.resource];
                  return (
                    <Box key={idx} display="flex" alignItems="center" gap={0.5}>
                      <Image
                        src={icon}
                        alt={row.resource}
                        width={iconSize}
                        height={iconSize}
                      />
                      <Box display="flex" flexDirection="column">
                        <Typography fontSize={fontSize} color="white">
                          {row.amount.toFixed(1)} {suffix}
                        </Typography>
                        {row.resource === "GRAIN" && (
                          <Typography
                            variant="caption"
                            fontSize={10}
                            color="white"
                          >
                            {`net: ${(row.amount - grainConsumed).toFixed(1)}`}{" "}
                            {suffix}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
            </Box>
          </Tooltip>
        </Box>

        <Typography
          variant="caption"
          color="gray"
          fontSize="0.625rem"
          sx={{ mt: 0.25 }}
        >
          {isTax ? "" : "(incl. tax)"}
        </Typography>
      </Box>
    </Box>
  );
};
