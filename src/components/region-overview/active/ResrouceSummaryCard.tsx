"use client";

import { resourceIconMap } from "@/components/player-overview/deed-overview-tile/production/ProductionCard";
import { Avatar, Box, Card, CardContent, Typography } from "@mui/material";
import { RegionActiveSummary } from "@/types/regionActiveSummary";
import { formatNumberWithSuffix } from "@/lib/formatters";

type Props = {
  resource: string;
  summary: RegionActiveSummary;
};

export function ResourceActiveSummaryCard({ resource, summary }: Props) {
  const iconUrl = resourceIconMap[resource] || "";

  const resourceName = resource === "" ? "Unkown Resource" : resource;

  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        maxWidth: 250,
        minWidth: 250,
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

      <CardContent sx={{ position: "relative", zIndex: 1 }}>
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
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2">
              <strong>Deeds active</strong>
            </Typography>
            <Typography
              variant="body2"
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
          <Box display="flex" justifyContent="space-between" mb={0.5}>
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
              {formatNumberWithSuffix(summary.totalBoostedPP)}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Raw PP: {formatNumberWithSuffix(summary.totalRawPP)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
