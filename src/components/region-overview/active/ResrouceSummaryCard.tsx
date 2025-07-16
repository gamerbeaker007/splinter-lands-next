"use client";

import { Avatar, Box, Card, CardContent, Typography } from "@mui/material";
import { RegionActiveSummary } from "@/types/regionActiveSummary";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";

type Props = {
  resource: string;
  summary: RegionActiveSummary;
};

export function ResourceActiveSummaryCard({ resource, summary }: Props) {
  const iconUrl = RESOURCE_ICON_MAP[resource] || "";

  const resourceName = resource === "" ? "Unkown Resource" : resource;

  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        width: 250,
        height: 210,
        overflow: "hidden",
        borderRadius: "50px 0px 50px 0px", // top-left and bottom-right rounded more
      }}
    >
      {/* Background Image Overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${iconUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.08,
          zIndex: 0,
        }}
      />

      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            src={iconUrl}
            alt={resourceName}
            sx={{ width: 35, height: 35, mr: 1 }}
          />
          <Typography variant="h6">{resourceName}</Typography>
        </Box>

        {/* Deeds Active */}
        <Box mb={1}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" noWrap>
              <strong>Deeds active</strong>
            </Typography>
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontFamily: "monospace",
                fontWeight: "bold",
                color: "success.main",
              }}
            >
              {summary.totalActiveDeeds}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            active no worksite type: {summary.activeEmpty} <br /> is
            construction: {summary.totalConstruction}
          </Typography>
          <Typography variant="caption" color="text.secondary"></Typography>
        </Box>

        {/* Boosted PP */}
        <Box mb={1}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2">
              <strong>Boosted PP</strong>
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
                fontWeight: "bold",
                color: "success.main",
              }}
            >
              {formatNumberWithSuffix(summary.productionPoints.boostedPP)}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Raw PP: {formatNumberWithSuffix(summary.productionPoints.rawPP)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
