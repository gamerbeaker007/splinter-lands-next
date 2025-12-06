"use client";

import { Resource } from "@/constants/resource/resource";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { bountifulResourceIconMap } from "@/types/planner/primitives";
import { Box, capitalize, Paper, Typography } from "@mui/material";
import Image from "next/image";

interface Props {
  totalAbilityBoosts: Partial<Record<Resource, number>>;
}

export default function BountifulPP({ totalAbilityBoosts }: Props) {
  const orderedResources = Object.keys(bountifulResourceIconMap).filter(
    (resource) =>
      totalAbilityBoosts[resource as Resource] &&
      totalAbilityBoosts[resource as Resource]! > 0
  );

  return (
    <>
      {orderedResources &&
        orderedResources.map((resource) => (
          <Paper
            key={resource}
            elevation={2}
            sx={{
              width: 100,
              height: 115,
              p: 1,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            title={"Bountiful PP"}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: 40,
                minHeight: 40,
                mb: 1,
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <Image
                src={bountifulResourceIconMap[resource as Resource]!}
                alt={`Bountiful PP ${resource}`}
                fill
                sizes="100px"
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              fontSize={12}
              sx={{ minHeight: 20 }}
            >
              {formatNumberWithSuffix(
                totalAbilityBoosts[resource as Resource] ?? 0
              )}
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              align="center"
              fontSize={12}
              sx={{ minHeight: 20 }}
            >
              {`Bountiful PP ${capitalize(resource.toLowerCase())}`}
            </Typography>
          </Paper>
        ))}
    </>
  );
}
