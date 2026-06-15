"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import {
  ProductionActionKind,
  useProductionPlotActions,
} from "@/hooks/useProductionPlotActions";
import { getProductionTabData } from "@/lib/backend/actions/land-manager/production-actions";
import { filterDeeds } from "@/lib/filters";
import {
  FilterProvider,
  useFilters,
} from "@/lib/frontend/context/FilterContext";
import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
import {
  Refresh as RefreshIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import ConfigurePanel from "./ConfigurePanel";
import ConfirmActionDialog, { ACTION_META } from "./ConfirmActionDialog";
import ProductionRegionGroup from "./ProductionRegionGroup";
import ProductionTable from "./ProductionTable";
import {
  DEFAULT_PRODUCTION_FILTERS,
  filterRows,
  PoweredFilter,
  ProductionFilterState,
  ProductionRow,
  ProductionSortKey,
  SortDirection,
  sortRows,
  toProductionRow,
  WorkerFilter,
} from "./productionTypes";

const PAGE_SIZE = 25;

interface Props {
  username: string;
  /** Region numbers from the land manager config — pre-filters to these regions when set. */
  enabledRegions?: number[];
  /** Bubbled up after any action so page-level panels refresh too. */
  onSuccess?: () => void;
}

/** Rows a given bulk action can actually act on (matches the hook's own skips). */
function actionableRows(
  kind: ProductionActionKind,
  rows: ProductionRow[]
): ProductionRow[] {
  switch (kind) {
    case "powerOn":
      return rows.filter((r) => !r.powered && !r.listed);
    case "unpower":
      return rows.filter((r) => r.powered && !r.listed);
    case "removeWorkers":
      return rows.filter((r) => r.workerCount > 0 && !r.listed);
    case "empty":
      return rows.filter((r) => r.hasStakedItems && !r.listed);
  }
}

function ProductionTabContent({ username, enabledRegions, onSuccess }: Props) {
  const [allDeeds, setAllDeeds] = useState<DeedComplete[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Only the powered + worker toggles live here; region/terrain/worksite/etc.
  // come from the shared FilterDrawer below.
  const [statusFilter, setStatusFilter] = useState<{
    powered: PoweredFilter;
    workers: WorkerFilter;
  }>({ powered: "all", workers: "all" });
  // Combined sort state — kept as one object so toggling direction is a single
  // pure update (a nested setState here double-toggles under StrictMode).
  const [sort, setSort] = useState<{
    key: ProductionSortKey;
    dir: SortDirection;
  }>({ key: "netDEC", dir: "desc" });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grouped">("list");

  const [confirm, setConfirm] = useState<{
    kind: ProductionActionKind;
    rows: ProductionRow[];
  } | null>(null);
  // Multiple plots can have their Configure panel open at once.
  const [expandedDeedUids, setExpandedDeedUids] = useState<Set<string>>(
    new Set()
  );

  const { filters, setLocationOverride } = useFilters();

  const deedByUid = useMemo(() => {
    const map = new Map<string, DeedComplete>();
    for (const d of allDeeds) map.set(d.deed_uid, d);
    return map;
  }, [allDeeds]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    setRefreshKey((k) => k + 1);
  }, []);

  const actions = useProductionPlotActions({
    username,
    onSuccess: () => {
      handleRefresh();
      onSuccess?.();
    },
  });

  // Load (and reload) the player's deeds enriched with production info.
  useEffect(() => {
    let cancelled = false;
    getProductionTabData().then(({ deeds, error }) => {
      if (cancelled) return;
      if (error) setFetchError(error);
      setAllDeeds(deeds);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Feed this player's live region/tract/plot lists into the FilterDrawer.
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

  // Deeds after the shared FilterDrawer + configured-region prefilter.
  const filteredDeeds = useMemo<DeedComplete[]>(() => {
    if (allDeeds.length === 0) return [];
    const f: FilterInput = { ...filters };
    delete f.filter_players; // data is always the current user
    let result = filterDeeds(allDeeds, f);
    if (enabledRegions && enabledRegions.length > 0) {
      result = result.filter((d) => enabledRegions.includes(d.region_number));
    }
    return result;
  }, [allDeeds, filters, enabledRegions]);

  const allRows = useMemo(
    () => filteredDeeds.map(toProductionRow),
    [filteredDeeds]
  );

  // Apply the powered/worker toggles (region/worksite already handled above).
  const filteredRows = useMemo(() => {
    const f: ProductionFilterState = {
      ...DEFAULT_PRODUCTION_FILTERS,
      powered: statusFilter.powered,
      workers: statusFilter.workers,
    };
    return sortRows(filterRows(allRows, f), sort.key, sort.dir);
  }, [allRows, statusFilter, sort]);

  // Reset pagination when the filtered set changes (render-phase reset).
  const [lastLen, setLastLen] = useState(filteredRows.length);
  if (lastLen !== filteredRows.length) {
    setLastLen(filteredRows.length);
    setPage(1);
  }

  const pageCount = Math.ceil(filteredRows.length / PAGE_SIZE);
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const groupedByRegion = useMemo(() => {
    const map = new Map<string, ProductionRow[]>();
    for (const r of filteredRows) {
      const key = `${r.regionName || r.regionNumber}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [filteredRows]);

  const handleSort = useCallback((key: ProductionSortKey) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      // Text columns default to ascending, numeric columns to descending.
      const numeric = key !== "label" && key !== "worksiteType";
      return { key, dir: numeric ? "desc" : "asc" };
    });
  }, []);

  const openConfirm = useCallback(
    (kind: ProductionActionKind, rows: ProductionRow[]) => {
      if (rows.length === 0) return;
      setConfirm({ kind, rows });
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!confirm) return;
    const deedUids = confirm.rows.map((r) => r.deedUid);
    const kind = confirm.kind;
    setConfirm(null);
    await actions.run(kind, deedUids);
  }, [confirm, actions]);

  const renderConfigure = useCallback(
    (deedUid: string) => {
      const deed = deedByUid.get(deedUid);
      if (!deed) return null;
      return (
        <ConfigurePanel
          deed={deed}
          username={username}
          actions={actions}
          onSaved={handleRefresh}
        />
      );
    },
    [deedByUid, username, actions, handleRefresh]
  );

  const tableProps = {
    sortKey: sort.key,
    sortDir: sort.dir,
    busy: actions.busy,
    expandedDeedUids,
    onSort: handleSort,
    onAction: (kind: ProductionActionKind, row: ProductionRow) =>
      openConfirm(kind, [row]),
    onToggleConfigure: (deedUid: string) =>
      setExpandedDeedUids((cur) => {
        const next = new Set(cur);
        if (next.has(deedUid)) next.delete(deedUid);
        else next.add(deedUid);
        return next;
      }),
    renderConfigure,
  };

  const result = actions.result;

  return (
    <Box>
      {/* Toolbar */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
        flexWrap="wrap"
        gap={1}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? "Loading…"
              : `${filteredRows.length} / ${allDeeds.length} plots`}
          </Typography>
          <Button
            size="small"
            startIcon={
              loading ? <CircularProgress size={14} /> : <RefreshIcon />
            }
            onClick={handleRefresh}
            disabled={loading || actions.busy}
          >
            Refresh
          </Button>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Powered</InputLabel>
            <Select
              value={statusFilter.powered}
              label="Powered"
              onChange={(e) =>
                setStatusFilter((s) => ({
                  ...s,
                  powered: e.target.value as PoweredFilter,
                }))
              }
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="powered">Powered</MenuItem>
              <MenuItem value="unpowered">Unpowered</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Workers</InputLabel>
            <Select
              value={statusFilter.workers}
              label="Workers"
              onChange={(e) =>
                setStatusFilter((s) => ({
                  ...s,
                  workers: e.target.value as WorkerFilter,
                }))
              }
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="hasWorkers">Has workers</MenuItem>
              <MenuItem value="hasEmptySlots">Has empty slots</MenuItem>
              <MenuItem value="fullyEmpty">Fully empty</MenuItem>
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

      {/* Bulk actions over the filtered list */}
      <Stack
        direction="row"
        gap={1}
        flexWrap="wrap"
        alignItems="center"
        mb={1.5}
      >
        <Typography variant="caption" color="text.secondary">
          Bulk ({filteredRows.length} filtered):
        </Typography>
        {(
          [
            "powerOn",
            "unpower",
            "removeWorkers",
            "empty",
          ] as ProductionActionKind[]
        ).map((kind) => {
          const targets = actionableRows(kind, filteredRows);
          const meta = ACTION_META[kind];
          return (
            <Button
              key={kind}
              size="small"
              variant="outlined"
              color={meta.destructive ? "error" : "success"}
              disabled={loading || actions.busy || targets.length === 0}
              onClick={() => openConfirm(kind, targets)}
            >
              {meta.title} ({targets.length})
            </Button>
          );
        })}
      </Stack>

      {/* Result / error feedback */}
      {actions.error && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={actions.clearError}>
          {actions.error}
        </Alert>
      )}
      {result && (
        <Alert
          severity={
            result.failed.length > 0
              ? "warning"
              : result.succeeded.length > 0
                ? "success"
                : "info"
          }
          sx={{ mb: 1.5 }}
          onClose={actions.clearResult}
        >
          {ACTION_META[result.kind].title}:{" "}
          {result.succeeded.length > 0 && (
            <Chip
              size="small"
              color="success"
              label={`${result.succeeded.length} done`}
              sx={{ mr: 0.5 }}
            />
          )}
          {result.failed.length > 0 && (
            <Chip
              size="small"
              color="error"
              label={`${result.failed.length} failed`}
              sx={{ mr: 0.5 }}
            />
          )}
          {result.skipped.length > 0 && (
            <Chip size="small" label={`${result.skipped.length} skipped`} />
          )}
        </Alert>
      )}

      {fetchError && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {fetchError}
        </Alert>
      )}

      {/* Table(s) */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filteredRows.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          {allDeeds.length === 0
            ? "No plot data found."
            : "No plots match the current filters."}
        </Typography>
      ) : viewMode === "list" ? (
        <>
          <ProductionTable rows={pageRows} {...tableProps} />
          {pageCount > 1 && (
            <Stack direction="row" justifyContent="center" mt={1.5}>
              <Pagination
                count={pageCount}
                page={page}
                size="small"
                onChange={(_, p) => setPage(p)}
              />
            </Stack>
          )}
        </>
      ) : (
        <Box>
          {[...groupedByRegion.entries()].map(([region, rows]) => (
            <ProductionRegionGroup
              key={region}
              region={region}
              rows={rows}
              pageSize={PAGE_SIZE}
              tableProps={tableProps}
            />
          ))}
        </Box>
      )}

      {confirm && (
        <ConfirmActionDialog
          open
          kind={confirm.kind}
          rows={confirm.rows}
          busy={actions.busy}
          onClose={() => setConfirm(null)}
          onConfirm={handleConfirm}
        />
      )}
    </Box>
  );
}

export default function ProductionTab({
  username,
  enabledRegions,
  onSuccess,
}: Props) {
  return (
    <FilterProvider>
      {/* player=null → categorical filters show site-wide options;
          ProductionTabContent narrows regions/tracts/plots via locationOverride. */}
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
      <ProductionTabContent
        username={username}
        enabledRegions={enabledRegions}
        onSuccess={onSuccess}
      />
    </FilterProvider>
  );
}
