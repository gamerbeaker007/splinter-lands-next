import { computeResourceToResource } from "@/lib/shared/landManagerUtils";
import { NATURAL_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { SplHarvestableResource } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { WarningAmber as WarnIcon } from "@mui/icons-material";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import Image from "next/image";

// ── Swap analysis ────────────────────────────────────────────────────────────
// For each natural resource (WOOD, STONE, IRON) checks whether swapping the
// required GRAIN to that resource via the AMM would yield more than harvesting.
// Shows a warning icon with a tooltip when swap is more profitable.

type AnalyzedResource = {
  token: string;
  harvestable: number;
  grainCost: number;
  swapOut: number;
  notProfitable: boolean;
};

function ResIcon({ token, size = 13 }: { token: string; size?: number }) {
  const src = RESOURCE_ICON_MAP[token];
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={token}
      width={size}
      height={size}
      style={{ verticalAlign: "middle", display: "inline-block" }}
    />
  );
}

function ResourceTooltipContent({ r }: { r: AnalyzedResource }) {
  const indicatorColor = r.notProfitable ? "error.main" : "success.main";
  const indicator = r.notProfitable
    ? "(swap is better) ✗"
    : "(harvest is better) ✓";
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
        <Typography variant="caption" fontWeight="bold">
          {r.token}
        </Typography>
        <ResIcon token={r.token} />
      </Stack>
      {/* Harvest line */}
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography variant="caption">Harvest: </Typography>
        <Typography variant="caption">
          {fmt(r.harvestable)} (consumes {fmt(r.grainCost)}
        </Typography>
        <ResIcon token="GRAIN" />
        <Typography variant="caption">)</Typography>
      </Stack>
      {/* Swap line */}
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography variant="caption">Swap: {fmt(r.grainCost)}</Typography>
        <ResIcon token="GRAIN" />
        <Typography variant="caption">→ {fmt(r.swapOut)}</Typography>
        <Typography component="span" variant="caption" color={indicatorColor}>
          {indicator}
        </Typography>
      </Stack>
    </Box>
  );
}

export default function RegionAnalysisCell({
  resources,
  pools,
}: {
  resources: SplHarvestableResource[];
  pools: SplLandPool[];
}) {
  if (resources.length === 0 || pools.length === 0) {
    return <Typography variant="body2">—</Typography>;
  }

  const analyzed = resources
    .filter(
      (r) =>
        NATURAL_RESOURCES.includes(r.token_symbol) &&
        r.token_symbol !== "GRAIN" &&
        r.grain_required_for_food > 0
    )
    .map((r) => {
      const { out_amount_2: swapOut } = computeResourceToResource(
        pools,
        "GRAIN",
        r.token_symbol,
        r.grain_required_for_food
      );
      return {
        token: r.token_symbol,
        harvestable: r.amount_claimable,
        grainCost: r.grain_required_for_food,
        swapOut,
        notProfitable: swapOut > r.amount_claimable,
      };
    });

  const unprofitable = analyzed.filter((r) => r.notProfitable);

  if (unprofitable.length === 0) {
    const tooltipContent =
      analyzed.length === 0 ? (
        <Typography variant="caption">No grain-cost resources</Typography>
      ) : (
        <>
          {analyzed.map((r) => (
            <ResourceTooltipContent key={r.token} r={r} />
          ))}
        </>
      );
    return (
      <Tooltip title={tooltipContent}>
        <Typography
          variant="body2"
          color="success.main"
          sx={{ cursor: "help", display: "inline" }}
        >
          ✓
        </Typography>
      </Tooltip>
    );
  }

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap">
      {unprofitable.map((r) => (
        <Tooltip key={r.token} title={<ResourceTooltipContent r={r} />}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.25}
            sx={{ cursor: "help" }}
          >
            <WarnIcon sx={{ fontSize: 16, color: "warning.main" }} />
            <Typography variant="caption" sx={{ color: "warning.main" }}>
              {r.token}
            </Typography>
          </Stack>
        </Tooltip>
      ))}
    </Stack>
  );
}
