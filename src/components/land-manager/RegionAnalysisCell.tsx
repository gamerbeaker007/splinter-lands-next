import { computeResourceToResource } from "@/lib/shared/landManagerUtils";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import { SplHarvestableResource } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { WarningAmber as WarnIcon } from "@mui/icons-material";
import { Stack, Tooltip, Typography } from "@mui/material";

// ── Swap analysis ────────────────────────────────────────────────────────────
// For each natural resource (WOOD, STONE, IRON) checks whether swapping the
// required GRAIN to that resource via the AMM would yield more than harvesting.
// Shows a warning icon with a tooltip when swap is more profitable.
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
            <Typography key={r.token} variant="caption" display="block">
              {r.token}: harvest{" "}
              {r.harvestable.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{" "}
              vs swap{" "}
              {r.swapOut.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{" "}
              (costs{" "}
              {r.grainCost.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{" "}
              GRAIN) ✓
            </Typography>
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
        <Tooltip
          key={r.token}
          title={
            <>
              <Typography variant="caption" display="block">
                Harvest {r.token}:{" "}
                {r.harvestable.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                (consumes{" "}
                {r.grainCost.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                GRAIN)
              </Typography>
              <Typography variant="caption" display="block">
                Swap{" "}
                {r.grainCost.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                GRAIN →{" "}
                {r.swapOut.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                {r.token} (swap is better)
              </Typography>
            </>
          }
        >
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
