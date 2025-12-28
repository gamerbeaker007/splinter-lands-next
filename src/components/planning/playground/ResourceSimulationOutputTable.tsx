import { Resource } from "@/constants/resource/resource";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { PRODUCING_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { PlaygroundSummary } from "@/types/playgroundOutput";
import { Box, Paper, Typography } from "@mui/material";
import Image from "next/image";

type OutputTableProps = {
  title: string;
  outputs: PlaygroundSummary;
};

const netColor = (v: number) =>
  v > 0 ? "success.main" : v < 0 ? "error.main" : "text.primary";

export default function ResourceSimulationOutputTable({
  title,
  outputs,
}: OutputTableProps) {
  const minColumnWidth = 80;
  const gridTemplate = `140px repeat(${PRODUCING_RESOURCES.length}, minmax(${minColumnWidth}px, 1fr))`;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
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
          { label: "Produced (/hr)", key: "produced" as const },
          { label: "Consumed (/hr)", key: "consumed" as const },
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
              const data = outputs.perResource[res as Resource] || {
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
                  {formatNumberWithSuffix(value)}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2">
          Total Base PP: {formatNumberWithSuffix(outputs.totalBasePP)}
        </Typography>
        <Typography variant="body2">
          | Total Boosted PP: {formatNumberWithSuffix(outputs.totalBoostedPP)}
        </Typography>
      </Box>
    </Paper>
  );
}
