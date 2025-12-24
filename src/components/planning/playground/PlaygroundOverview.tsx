"use client";

import { Resource } from "@/constants/resource/resource";
import { PRODUCING_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { PlaygroundDeed } from "@/types/playground";
import { PlaygroundSummary } from "@/types/playgroundOutput";
import { Box, Paper, Typography } from "@mui/material";
import Image from "next/image";

type PlaygroundOverviewProps = {
  deeds: PlaygroundDeed[];
  originalOutputs: PlaygroundSummary;
  updatedOutputs: PlaygroundSummary;
};

const fmt = (n: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);

const netColor = (v: number) =>
  v > 0 ? "success.main" : v < 0 ? "error.main" : "text.primary";

export default function PlaygroundOverview({
  deeds,
  originalOutputs,
  updatedOutputs,
}: PlaygroundOverviewProps) {
  const totalDeeds = deeds.length;

  const minColumnWidth = 80;
  const gridTemplate = `140px repeat(${PRODUCING_RESOURCES.length}, minmax(${minColumnWidth}px, 1fr))`;

  return (
    <Box sx={{ mb: 2 }}>
      {/* Basic Stats */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Overview
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 2,
            mt: 2,
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Deeds
            </Typography>
            <Typography variant="h6">{totalDeeds}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Original Output Table */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Original Output
        </Typography>
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflowX: "auto",
            mt: 2,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              bgcolor: "action.hover",
              px: 1,
              py: 0.75,
              borderBottom: "1px solid",
              borderColor: "divider",
              gap: 1,
            }}
          >
            <Typography fontWeight={600}>Metric</Typography>
            {PRODUCING_RESOURCES.map((res) => (
              <Box
                key={res}
                display="flex"
                justifyContent="left"
                alignItems="center"
              >
                <Image
                  src={RESOURCE_ICON_MAP[res]}
                  alt={res}
                  width={25}
                  height={25}
                  style={{ display: "block" }}
                />
              </Box>
            ))}
          </Box>

          {/* Rows */}
          {[
            { label: "PP", key: "pp" as const },
            { label: "Produced", key: "produced" as const },
            { label: "Consumed", key: "consumed" as const },
            { label: "Net (P − C)", key: "net" as const },
          ].map(({ label, key }) => (
            <Box
              key={label}
              sx={{
                display: "grid",
                gridTemplateColumns: gridTemplate,
                px: 1,
                py: 0.75,
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:last-of-type": { borderBottom: "none" },
                gap: 1,
              }}
            >
              <Typography fontWeight={key === "net" ? 700 : 500}>
                {label}
              </Typography>

              {PRODUCING_RESOURCES.map((res) => {
                const data = originalOutputs.perResource[res as Resource] || {
                  pp: 0,
                  produced: 0,
                  consumed: 0,
                  net: 0,
                };
                const value =
                  key === "pp"
                    ? data.pp
                    : key === "produced"
                      ? data.produced
                      : key === "consumed"
                        ? data.consumed
                        : data.net;
                return (
                  <Box
                    key={res}
                    sx={
                      key === "net"
                        ? {
                            color: netColor(value),
                            fontWeight: 700,
                            textAlign: "left",
                          }
                        : { textAlign: "left" }
                    }
                  >
                    {fmt(value)}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2">
            Total Base PP: {fmt(originalOutputs.totalBasePP)}
          </Typography>
          <Typography variant="body2">
            | Total Boosted PP: {fmt(originalOutputs.totalBoostedPP)}
          </Typography>
        </Box>
      </Paper>

      {/* Updated Output Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Updated Output (with changes)
        </Typography>
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflowX: "auto",
            mt: 2,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              bgcolor: "action.hover",
              px: 1,
              py: 0.75,
              borderBottom: "1px solid",
              borderColor: "divider",
              gap: 1,
            }}
          >
            <Typography fontWeight={600}>Metric</Typography>
            {PRODUCING_RESOURCES.map((res) => (
              <Box
                key={res}
                display="flex"
                justifyContent="left"
                alignItems="center"
              >
                <Image
                  src={RESOURCE_ICON_MAP[res]}
                  alt={res}
                  width={25}
                  height={25}
                  style={{ display: "block" }}
                />
              </Box>
            ))}
          </Box>

          {/* Rows */}
          {[
            { label: "PP", key: "pp" as const },
            { label: "Produced", key: "produced" as const },
            { label: "Consumed", key: "consumed" as const },
            { label: "Net (P − C)", key: "net" as const },
          ].map(({ label, key }) => (
            <Box
              key={label}
              sx={{
                display: "grid",
                gridTemplateColumns: gridTemplate,
                px: 1,
                py: 0.75,
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:last-of-type": { borderBottom: "none" },
                gap: 1,
              }}
            >
              <Typography fontWeight={key === "net" ? 700 : 500}>
                {label}
              </Typography>

              {PRODUCING_RESOURCES.map((res) => {
                const data = updatedOutputs.perResource[res as Resource] || {
                  pp: 0,
                  produced: 0,
                  consumed: 0,
                  net: 0,
                };
                const value =
                  key === "pp"
                    ? data.pp
                    : key === "produced"
                      ? data.produced
                      : key === "consumed"
                        ? data.consumed
                        : data.net;
                return (
                  <Box
                    key={res}
                    sx={
                      key === "net"
                        ? {
                            color: netColor(value),
                            fontWeight: 700,
                            textAlign: "left",
                          }
                        : { textAlign: "left" }
                    }
                  >
                    {fmt(value)}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2">
            Total Base PP: {fmt(updatedOutputs.totalBasePP)}
          </Typography>
          <Typography variant="body2">
            | Total Boosted PP: {fmt(updatedOutputs.totalBoostedPP)}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
