"use client";

import HarvestButton from "@/components/land-manager/harvest/HarvestButton";
import LastHarvestAgeChip from "@/components/land-manager/harvest/LastHarvestAgeChip";
import { renderResourceChip } from "@/components/ui/resource/Resource";
import CustomIconSpinner from "@/components/ui/loaders/CustomIconSpinner";
import ScrollableTableContainer from "@/components/ui/ScrollableTableContainer";
import { Resource } from "@/constants/resource/resource";
import { useLandLiquidityPools } from "@/hooks/useLandLiquidityPools";
import {
  getBulkRegionData,
  invalidatePlayerRegionCaches,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { formatInt } from "@/lib/formatters";
import {
  aggregateCosts,
  effectiveBalance,
} from "@/lib/shared/landManagerUtils";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { land_hammer_icon_url } from "@/lib/shared/statics_icon_urls";
import { getHarvestRegion } from "@/lib/utils/deedUtil";
import { DonationConfig } from "@/types/landManager";
import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
} from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import {
  AgricultureOutlined as HarvestIcon,
  WarningAmber as WarnIcon,
} from "@mui/icons-material";
import {
  Box,
  capitalize,
  IconButton,
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
import Image from "next/image";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import RegionAnalysisCell from "./RegionAnalysisCell";

interface Props {
  username: string;
  regions: SplProductionOverviewRegion[];
  enabledRegions: number[];
  donation: DonationConfig;
  refreshKey?: number;
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
        <Fragment key={r.token_symbol}>
          {renderResourceChip(
            r.token_symbol as Resource,
            r.amount_claimable,
            true
          )}
        </Fragment>
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

  return (
    <Stack spacing={0.25}>
      {costs.map(({ symbol, amount }) => {
        const balance = balances[symbol] ?? 0;
        const enough = balance >= amount;
        const need = amount - balance;
        return (
          <Stack key={symbol} direction="row" alignItems="center" spacing={0.5}>
            <Tooltip
              title={capitalize(symbol.toLowerCase())}
              placement={"top"}
              followCursor={true}
            >
              <Stack
                key={symbol}
                direction={"row"}
                alignItems={"center"}
                spacing={0.5}
              >
                <Image
                  src={RESOURCE_ICON_MAP[symbol] ?? land_hammer_icon_url}
                  alt={capitalize(symbol.toLowerCase())}
                  width={16}
                  height={16}
                />
                <Typography
                  variant="caption"
                  sx={{ color: enough ? "text.primary" : "warning.main" }}
                >
                  {formatInt(amount)}{" "}
                </Typography>
              </Stack>
            </Tooltip>

            {!enough && (
              <Tooltip
                title={`Need ${formatInt(need)} more ${symbol}`}
                placement={"top"}
                followCursor={true}
              >
                <WarnIcon sx={{ fontSize: 16, color: "warning.main" }} />
              </Tooltip>
            )}
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
  donation: DonationConfig;
  /** Harvestable resources for this region, from the table-wide bulk fetch. */
  harvestable: SplHarvestableResource[];
  /** Stored region balance, from the same bulk fetch. */
  regionBalance: Record<string, number>;
  /** Why this region's harvestable list is missing, if it is. */
  error: string | null;
  loading: boolean;
  pools: SplLandPool[];
  /** Ask the table to drop the server cache and refetch every row. */
  onHarvested: () => void;
}

function RegionRow({
  region,
  username,
  donation,
  harvestable,
  regionBalance,
  error,
  loading,
  pools,
  onHarvested,
}: RowProps) {
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

      {/* No per-cell spinners: with ten regions that was thirty of them at
          once. The table paints a single overlay instead (see below). */}
      <TableCell>
        {error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : (
          <ResourceChips resources={harvestable} />
        )}
      </TableCell>

      <TableCell>
        <HarvestCostsCell resources={harvestable} balances={balances} />
      </TableCell>

      <TableCell>
        <RegionAnalysisCell resources={harvestable} pools={pools} />
      </TableCell>

      <TableCell>
        <LastHarvestAgeChip date={region.last_claimed} />
      </TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <HarvestButton
            username={username}
            regionUid={region.region_uid}
            regionNumber={region.region_number}
            regionName={region.name}
            harvestable={harvestable}
            canAfford={canAfford}
            donation={donation}
            onSuccess={onHarvested}
          />
          <Tooltip title="Open harvest page on Splinterlands">
            <IconButton
              size="small"
              component="a"
              href={getHarvestRegion(region.region_number)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <HarvestIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const EMPTY_BALANCE: Record<string, number> = {
  GRAIN: 0,
  WOOD: 0,
  STONE: 0,
  IRON: 0,
  AURA: 0,
};
const NO_RESOURCES: SplHarvestableResource[] = [];

export default function RegionOverview({
  username,
  regions,
  enabledRegions,
  donation,
  refreshKey,
}: Props) {
  const visibleRegions = useMemo(
    () => regions.filter((r) => enabledRegions.includes(r.region_number)),
    [regions, enabledRegions]
  );

  // Pools are global, not per region: fetched once here and passed down, rather
  // than once per row.
  const { landPoolData } = useLandLiquidityPools();

  // One bulk fetch for the whole table. Every row used to fetch its own
  // harvestable list and balance, which cost two server round trips per region
  // and skipped the 30s server cache that getBulkRegionData keeps.
  const [harvestable, setHarvestable] = useState<
    Record<string, SplHarvestableResource[]>
  >({});
  const [balances, setBalances] = useState<
    Record<string, Record<string, number>>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  const uids = visibleRegions.map((r) => r.region_uid);
  const uidKey = [...uids].sort().join(",");

  useEffect(() => {
    if (uidKey === "") {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getBulkRegionData(uidKey.split(","));
        if (cancelled) return;
        setHarvestable(data.harvestable);
        setBalances(data.balances);
        setErrors(
          data.error
            ? Object.fromEntries(uidKey.split(",").map((u) => [u, data.error!]))
            : (data.errors ?? {})
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [uidKey, refreshKey, localRefreshKey]);

  // A single-region harvest leaves the cached snapshot describing pre-harvest
  // state, so drop it before refetching — otherwise the table reads back the
  // numbers it had a moment ago and looks like it never refreshed.
  const handleHarvested = useCallback(async () => {
    await invalidatePlayerRegionCaches().catch(() => {});
    setLocalRefreshKey((k) => k + 1);
  }, []);

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
    <Box sx={{ position: "relative" }} aria-busy={loading}>
      <ScrollableTableContainer>
        <TableContainer component={Paper} sx={{ mt: 2, mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Region</TableCell>
                <TableCell>Harvestable</TableCell>
                <TableCell>Cost to Harvest</TableCell>
                <TableCell>Natural Resource Analysis</TableCell>
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
                  donation={donation}
                  harvestable={harvestable[region.region_uid] ?? NO_RESOURCES}
                  regionBalance={balances[region.region_uid] ?? EMPTY_BALANCE}
                  error={errors[region.region_uid] ?? null}
                  loading={loading}
                  pools={landPoolData}
                  onHarvested={handleHarvested}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </ScrollableTableContainer>

      {/* One overlay for the whole table rather than a spinner in every cell.
          The rows stay in place underneath so the layout does not jump when the
          data lands; they are dimmed and made inert while the fetch runs. */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.paper",
            opacity: 0.85,
            borderRadius: 1,
            zIndex: 2,
          }}
        >
          <CustomIconSpinner label="Loading regions…" size={200} />
        </Box>
      )}
    </Box>
  );
}
