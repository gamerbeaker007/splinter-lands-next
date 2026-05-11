"use client";

import HarvestButton from "@/components/land-manager/HarvestButton";
import {
  getSplHarvestableResources,
  getRegionResourceBalance,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import {
  aggregateCosts,
  effectiveBalance,
} from "@/lib/shared/landManagerUtils";
import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
} from "@/types/spl/landManager";
import { WarningAmber as WarnIcon } from "@mui/icons-material";
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

interface Props {
  username: string;
  regions: SplProductionOverviewRegion[];
  enabledRegions: number[];
}

// ── Harvestable chips ──────────────────────────────────────────────────────

function ResourceChips({ resources }: { resources: SplHarvestableResource[] }) {
  if (resources.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nothing to harvest
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
      {resources.map((r) => (
        <Chip
          key={r.token_symbol}
          label={`${r.token_symbol}: ${r.amount_claimable.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
          size="small"
          sx={{
            bgcolor: RESOURCE_COLOR_MAP[r.token_symbol] ?? "primary.main",
            color: "#fff",
            fontWeight: "bold",
          }}
        />
      ))}
    </Box>
  );
}

// ── Cost breakdown ─────────────────────────────────────────────────────────
// aggregateCosts and CostEntry imported from @/lib/shared/landManagerUtils

function HarvestCostsCell({
  resources,
  balances,
}: {
  resources: SplHarvestableResource[];
  balances: Record<string, number>;
}) {
  const costs = aggregateCosts(resources);
  if (costs.length === 0) return <Typography variant="body2">—</Typography>;

  console.log("Costs: ", costs);
  console.log("Balances: ", balances);
  return (
    <Stack spacing={0.25}>
      {costs.map(({ symbol, amount }) => {
        const balance = balances[symbol] ?? 0;
        const enough = balance >= amount;
        const need = amount - balance;
        return (
          <Stack key={symbol} direction="row" alignItems="center" spacing={0.5}>
            {!enough && (
              <Tooltip
                title={`Need ${need.toLocaleString(undefined, { maximumFractionDigits: 0 })} more ${symbol}`}
              >
                <WarnIcon sx={{ fontSize: 14, color: "warning.main" }} />
              </Tooltip>
            )}
            <Typography
              variant="caption"
              sx={{ color: enough ? "text.primary" : "warning.main" }}
            >
              {amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
              <span style={{ color: RESOURCE_COLOR_MAP[symbol] ?? "inherit" }}>
                {symbol}
              </span>
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

// ── Region row ─────────────────────────────────────────────────────────────

interface RowProps {
  region: SplProductionOverviewRegion;
  username: string;
}

function RegionRow({ region, username }: RowProps) {
  const [harvestable, setHarvestable] = useState<SplHarvestableResource[]>([]);
  const [regionBalance, setRegionBalance] = useState<Record<string, number>>({
    GRAIN: 0,
    WOOD: 0,
    STONE: 0,
    IRON: 0,
    AURA: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [{ data, error: err }, { balance }] = await Promise.all([
          getSplHarvestableResources(region.region_uid),
          getRegionResourceBalance(region.region_uid),
        ]);
        if (cancelled) return;
        if (err) setError(err);
        else setHarvestable(data);
        setRegionBalance(balance);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [region.region_uid, refreshKey]);

  const balances = effectiveBalance(regionBalance, region);
  const costs = aggregateCosts(harvestable);
  const canAfford =
    !loading &&
    (costs.length === 0 ||
      costs.every(({ symbol, amount }) => (balances[symbol] ?? 0) >= amount));

  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2" fontWeight="bold">
          {region.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          #{region.region_number} · {region.plots_owned} plots ·{" "}
          {region.active_worksites} active
        </Typography>
      </TableCell>

      <TableCell>
        {loading ? (
          <CircularProgress size={16} />
        ) : error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : (
          <ResourceChips resources={harvestable} />
        )}
      </TableCell>

      <TableCell>
        {loading ? null : (
          <HarvestCostsCell resources={harvestable} balances={balances} />
        )}
      </TableCell>

      <TableCell>
        <Typography variant="caption" color="text.secondary">
          {region.last_claimed
            ? new Date(region.last_claimed).toLocaleString()
            : "—"}
        </Typography>
      </TableCell>

      <TableCell>
        {!loading && (
          <HarvestButton
            username={username}
            regionUid={region.region_uid}
            regionNumber={region.region_number}
            regionName={region.name}
            harvestable={harvestable}
            canAfford={canAfford}
            onSuccess={() => setRefreshKey((k) => k + 1)}
          />
        )}
      </TableCell>
    </TableRow>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function RegionOverview({
  username,
  regions,
  enabledRegions,
}: Props) {
  const visibleRegions = regions.filter((r) =>
    enabledRegions.includes(r.region_number)
  );

  if (visibleRegions.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography color="text.secondary">
          No regions enabled. Open Config to select your regions.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Region</TableCell>
            <TableCell>Harvestable</TableCell>
            <TableCell>Cost to Harvest</TableCell>
            <TableCell>Last Claimed</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRegions.map((region) => (
            <RegionRow
              key={region.region_uid}
              region={region}
              username={username}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
