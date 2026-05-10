"use client";

import HarvestButton from "@/components/land-manager/HarvestButton";
import {
  getHarvestableResources,
  getRegionResourceBalance,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import {
  aggregateCosts,
  computeEffectiveBalances,
} from "@/lib/shared/landManagerUtils";
import {
  HarvestableResource,
  RegionResourceBalance,
  ProductionOverviewRegion,
} from "@/types/landManager";
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
  regions: ProductionOverviewRegion[];
  enabledRegions: number[];
}

// ── Harvestable chips ──────────────────────────────────────────────────────

function ResourceChips({ resources }: { resources: HarvestableResource[] }) {
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
  resources: HarvestableResource[];
  balances: Record<string, number>;
}) {
  const costs = aggregateCosts(resources);
  if (costs.length === 0) return <Typography variant="body2">—</Typography>;

  return (
    <Stack spacing={0.25}>
      {costs.map(({ symbol, amount }) => {
        const balance = balances[symbol] ?? 0;
        const enough = balance >= amount;
        return (
          <Stack key={symbol} direction="row" alignItems="center" spacing={0.5}>
            {!enough && (
              <Tooltip
                title={`Only ${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${symbol} available`}
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

// ── Effective balance ──────────────────────────────────────────────────────
//
// Splinterlands processes natural resources (GRAIN, WOOD, STONE, IRON) before
// derived resources (SPS, RESEARCH, AURA). This means the amount you are about
// to harvest for a natural resource is immediately available to cover costs
// in that same harvest, so we add it to the current region stock.
// computeEffectiveBalances imported from @/lib/shared/landManagerUtils

// ── Region row ─────────────────────────────────────────────────────────────

interface RowProps {
  region: ProductionOverviewRegion;
  username: string;
}

function RegionRow({ region, username }: RowProps) {
  const [harvestable, setHarvestable] = useState<HarvestableResource[]>([]);
  const [regionBalance, setRegionBalance] = useState<RegionResourceBalance>({
    grain: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    aura: 0,
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
          getHarvestableResources(region.region_uid),
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

  // Effective balances: natural resources being harvested count as available
  // because Splinterlands processes them before SPS/RESEARCH/AURA costs.
  const balances = computeEffectiveBalances(regionBalance, harvestable);

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
