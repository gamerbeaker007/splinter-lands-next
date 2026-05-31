"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import WorksitePlotCard from "@/components/land-manager/worksites/WorksitePlotCard";
import { getPlayerWorksiteData } from "@/lib/backend/actions/land-manager/worksite-actions";
import { filterDeeds } from "@/lib/filters";
import {
  FilterProvider,
  useFilters,
} from "@/lib/frontend/context/FilterContext";
import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
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
}

// ── Collapsible paginated region group ───────────────────────────────────────

interface RegionGroupProps {
  regionUid: string;
  deeds: DeedComplete[];
  username: string;
  onSuccess: () => void;
  pageSize: number;
}

function RegionGroup({
  regionUid,
  deeds,
  username,
  onSuccess,
  pageSize,
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

function WorksiteTabContent({ username, enabledRegions }: Props) {
  const [allDeeds, setAllDeeds] = useState<DeedComplete[]>([]);
  const [loading, setLoading] = useState(true); // true on mount; set back to true in handleRefresh
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grouped">("list");
  const [devFilter, setDevFilter] = useState<
    "all" | "developed" | "undeveloped"
  >("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [regionResetKey, setRegionResetKey] = useState(0);

  const { filters } = useFilters();

  // Derive a stable filter key; when it changes the list page resets to 1 automatically
  const filterKey = useMemo(
    () => JSON.stringify({ filters, devFilter }),
    [filters, devFilter]
  );
  const [listPageByKey, setListPageByKey] = useState<Record<string, number>>(
    {}
  );
  // Effective list page: if no entry for current filterKey, default to 1
  const effectiveListPage = listPageByKey[filterKey] ?? 1;
  const setEffectiveListPage = useCallback(
    (p: number) => setListPageByKey((prev) => ({ ...prev, [filterKey]: p })),
    [filterKey]
  );

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

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    setRefreshKey((k) => k + 1);
  }, []);
  const handleSuccess = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    setRefreshKey((k) => k + 1);
  }, []);

  // Increment regionResetKey when dev-filter or refresh changes so RegionGroups remount
  const handleDevFilterChange = useCallback(
    (v: "all" | "developed" | "undeveloped") => {
      setDevFilter(v);
      setRegionResetKey((k) => k + 1);
    },
    []
  );

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
    // Local developed / undeveloped quick filter — use worksiteDetail.is_construction
    if (devFilter === "developed") {
      result = result.filter(
        (d) => !!d.worksiteDetail && d.worksiteDetail.is_construction === false
      );
    } else if (devFilter === "undeveloped") {
      result = result.filter((d) => !d.worksiteDetail);
    }
    return result;
  }, [allDeeds, filters, devFilter, enabledRegions]);

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
    (effectiveListPage - 1) * pageSize,
    effectiveListPage * pageSize
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
                setRegionResetKey((k) => k + 1);
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
            value={devFilter}
            exclusive
            size="small"
            onChange={(_, v) => {
              if (v) handleDevFilterChange(v);
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="developed">Developed</ToggleButton>
            <ToggleButton value="undeveloped">Undeveloped</ToggleButton>
          </ToggleButtonGroup>

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
            />
          ))}
          {listPageCount > 1 && (
            <Stack direction="row" justifyContent="center" mt={1.5}>
              <Pagination
                count={listPageCount}
                page={effectiveListPage}
                size="small"
                onChange={(_, p) => setEffectiveListPage(p)}
              />
            </Stack>
          )}
        </Box>
      ) : (
        // Grouped by region — collapsible + paginated per region
        <Box>
          {[...groupedByRegion.entries()].map(([regionUid, deeds]) => (
            <RegionGroup
              key={`${regionUid}-${regionResetKey}`}
              regionUid={regionUid}
              deeds={deeds}
              username={username}
              onSuccess={handleSuccess}
              pageSize={pageSize}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── Outer component — provides FilterContext ──────────────────────────────────

export default function WorksiteTab({ username, enabledRegions }: Props) {
  return (
    <FilterProvider>
      <FilterDrawer
        player={username}
        filtersEnabled={{
          regions: true,
          tracts: true,
          plots: true,
          attributes: true,
          player: false,
          sorting: false,
        }}
      />
      <WorksiteTabContent username={username} enabledRegions={enabledRegions} />
    </FilterProvider>
  );
}
