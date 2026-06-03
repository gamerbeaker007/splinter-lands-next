"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import WorksitePlotCard from "@/components/land-manager/worksites/WorksitePlotCard";
import { getBulkRegionData } from "@/lib/backend/actions/land-manager/overview-actions";
import { getPlayerWorksiteData } from "@/lib/backend/actions/land-manager/worksite-actions";
import { filterDeeds } from "@/lib/filters";
import {
  FilterProvider,
  useFilters,
} from "@/lib/frontend/context/FilterContext";
import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
import { MakeHarvestableStrategy } from "@/types/landManager";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  FormControl,
  IconButton,
  MenuItem,
  Pagination,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE_OPTIONS = [10, 50, 100] as const;

interface Props {
  username: string;
  /** Region numbers from the land manager config — pre-filters deeds to these regions when set. */
  enabledRegions?: number[];
  /** Configured make-harvestable strategy order — used by the Fix grain deficit proposal. */
  strategies: MakeHarvestableStrategy[];
  /** Bubbled up after any worksite action so page-level panels (e.g. Today) refresh too. */
  onSuccess?: () => void;
}

// ── Collapsible paginated region group ───────────────────────────────────────

interface RegionGroupProps {
  regionUid: string;
  deeds: DeedComplete[];
  username: string;
  onSuccess: () => void;
  pageSize: number;
  /** Grain currently held in this region — gates the Feed workers button. */
  regionGrain?: number;
  strategies: MakeHarvestableStrategy[];
}

function RegionGroup({
  regionUid,
  deeds,
  username,
  onSuccess,
  pageSize,
  regionGrain,
  strategies,
}: RegionGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState(1);

  const pageCount = Math.ceil(deeds.length / pageSize);
  const pageDeeds = deeds.slice((page - 1) * pageSize, page * pageSize);
  const regionName = deeds[0]?.region_name;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={0.5}
        sx={{
          cursor: "pointer",
          pb: 0.5,
          borderBottom: 1,
          borderColor: "divider",
          mb: 0.5,
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <IconButton size="small" sx={{ p: 0.25 }}>
          {collapsed ? (
            <ExpandMoreIcon fontSize="small" />
          ) : (
            <ExpandLessIcon fontSize="small" />
          )}
        </IconButton>
        <Typography variant="subtitle2" fontWeight={700}>
          {regionName ? `${regionName} (${regionUid})` : regionUid}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          · {deeds.length} plot{deeds.length !== 1 ? "s" : ""}
        </Typography>
      </Stack>

      <Collapse in={!collapsed}>
        <Box>
          {pageDeeds.map((deed) => (
            <WorksitePlotCard
              key={deed.deed_uid}
              deed={deed}
              username={username}
              onSuccess={onSuccess}
              regionGrain={regionGrain}
              strategies={strategies}
            />
          ))}
          {pageCount > 1 && (
            <Stack direction="row" justifyContent="center" mt={0.75}>
              <Pagination
                count={pageCount}
                page={page}
                size="small"
                onChange={(_, p) => setPage(p)}
              />
            </Stack>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// ── Inner component (uses FilterContext) ─────────────────────────────────────

function WorksiteTabContent({
  username,
  enabledRegions,
  strategies,
  onSuccess,
}: Props) {
  const [allDeeds, setAllDeeds] = useState<DeedComplete[]>([]);
  // Grain held per region_uid — gates the Feed workers button on each plot.
  const [regionGrain, setRegionGrain] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true); // true on mount; set back to true in handleRefresh
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grouped">("list");
  const [refreshKey, setRefreshKey] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [listPage, setListPage] = useState(1);

  const { filters, setLocationOverride } = useFilters();

  // Fetch fresh data on mount and on refresh
  useEffect(() => {
    let cancelled = false;

    getPlayerWorksiteData().then(({ deeds, error }) => {
      if (cancelled) return;
      if (error) setFetchError(error);
      setAllDeeds(deeds);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Fetch current grain per region (gates the Feed workers button). Forced so it
  // reflects grain consumed after a feed action; re-runs whenever deeds reload.
  useEffect(() => {
    if (allDeeds.length === 0) return;
    const regionUids = [...new Set(allDeeds.map((d) => d.region_uid))];
    let cancelled = false;
    getBulkRegionData(regionUids, true).then(({ balances }) => {
      if (cancelled) return;
      const grain: Record<string, number> = {};
      for (const uid of regionUids) grain[uid] = balances[uid]?.GRAIN ?? 0;
      setRegionGrain(grain);
    });
    return () => {
      cancelled = true;
    };
  }, [allDeeds]);

  // Push live region/tract/plot lists into the FilterDrawer so the location
  // filter reflects this player's plots (rather than the global DB cache).
  useEffect(() => {
    if (allDeeds.length === 0) return;
    const regions = new Set<number>();
    const tracts = new Set<number>();
    const plots = new Set<number>();
    for (const d of allDeeds) {
      regions.add(d.region_number);
      tracts.add(d.tract_number);
      plots.add(d.plot_number);
    }
    setLocationOverride({
      filter_regions: [...regions].sort((a, b) => a - b),
      filter_tracts: [...tracts].sort((a, b) => a - b),
      filter_plots: [...plots].sort((a, b) => a - b),
    });
  }, [allDeeds, setLocationOverride]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    setRefreshKey((k) => k + 1);
  }, []);
  const handleSuccess = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    setRefreshKey((k) => k + 1);
    // Bubble up so page-level panels (Today log, alerts) reflect grain moves /
    // feeds too — they don't share this tab's local refresh key.
    onSuccess?.();
  }, [onSuccess]);

  // Apply filter client-side
  const filteredDeeds = useMemo<DeedComplete[]>(() => {
    if (allDeeds.length === 0) return [];
    const f: FilterInput = { ...filters };
    // Player filter not applicable — data is always for the current user
    delete f.filter_players;
    let result = filterDeeds(allDeeds, f);
    // Pre-filter by configured regions when provided
    if (enabledRegions && enabledRegions.length > 0) {
      result = result.filter((d) => enabledRegions.includes(d.region_number));
    }
    return result;
  }, [allDeeds, filters, enabledRegions]);

  // Reset list pagination when the filtered set changes (render-phase reset:
  // React.dev/reference/react/useState#resetting-state).
  const [lastFilteredLen, setLastFilteredLen] = useState(filteredDeeds.length);
  if (lastFilteredLen !== filteredDeeds.length) {
    setLastFilteredLen(filteredDeeds.length);
    setListPage(1);
  }

  // Group by region for grouped view
  const groupedByRegion = useMemo<Map<string, DeedComplete[]>>(() => {
    const map = new Map<string, DeedComplete[]>();
    for (const deed of filteredDeeds) {
      const key = deed.region_uid;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(deed);
    }
    return map;
  }, [filteredDeeds]);

  const listPageCount = Math.ceil(filteredDeeds.length / pageSize);
  const listPageDeeds = filteredDeeds.slice(
    (listPage - 1) * pageSize,
    listPage * pageSize
  );

  return (
    <Box>
      {/* Toolbar */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? "Loading…"
              : `${filteredDeeds.length} / ${allDeeds.length} plots`}
          </Typography>
          <Button
            size="small"
            startIcon={
              loading ? <CircularProgress size={14} /> : <RefreshIcon />
            }
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          {/* Per-page selector */}
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setListPage(1);
              }}
              sx={{ fontSize: "0.8rem" }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n} / page
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            size="small"
            onChange={(_, v) => {
              if (v) setViewMode(v);
            }}
          >
            <ToggleButton value="list">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="grouped">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {/* Error */}
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {fetchError}
        </Alert>
      )}

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filteredDeeds.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          {allDeeds.length === 0
            ? "No plot data found."
            : "No plots match the current filters."}
        </Typography>
      ) : viewMode === "list" ? (
        // Flat paginated list view
        <Box>
          {listPageDeeds.map((deed) => (
            <WorksitePlotCard
              key={deed.deed_uid}
              deed={deed}
              username={username}
              onSuccess={handleSuccess}
              regionGrain={regionGrain[deed.region_uid] ?? 0}
              strategies={strategies}
            />
          ))}
          {listPageCount > 1 && (
            <Stack direction="row" justifyContent="center" mt={1.5}>
              <Pagination
                count={listPageCount}
                page={listPage}
                size="small"
                onChange={(_, p) => setListPage(p)}
              />
            </Stack>
          )}
        </Box>
      ) : (
        // Grouped by region — collapsible + paginated per region
        <Box>
          {[...groupedByRegion.entries()].map(([regionUid, deeds]) => (
            <RegionGroup
              key={regionUid}
              regionUid={regionUid}
              deeds={deeds}
              username={username}
              onSuccess={handleSuccess}
              pageSize={pageSize}
              regionGrain={regionGrain[regionUid] ?? 0}
              strategies={strategies}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── Outer component — provides FilterContext ──────────────────────────────────

export default function WorksiteTab({
  username,
  enabledRegions,
  strategies,
  onSuccess,
}: Props) {
  return (
    <FilterProvider>
      {/* player=null → categorical filters show site-wide options;
          WorksiteTabContent narrows regions/tracts/plots via locationOverride. */}
      <FilterDrawer
        player={null}
        filtersEnabled={{
          regions: true,
          tracts: true,
          plots: true,
          attributes: true,
          player: false,
          sorting: false,
        }}
      />
      <WorksiteTabContent
        username={username}
        enabledRegions={enabledRegions}
        strategies={strategies}
        onSuccess={onSuccess}
      />
    </FilterProvider>
  );
}
