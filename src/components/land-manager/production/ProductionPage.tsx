"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import BulkActionsAccordion from "@/components/land-manager/production/BulkActionsAccordion";
import ConfigurePanel from "@/components/land-manager/production/ConfigurePanel";
import ConfirmActionDialog, {
  ACTION_META,
} from "@/components/land-manager/production/ConfirmActionDialog";
import ProductionRegionGroup from "@/components/land-manager/production/ProductionRegionGroup";
import ProductionTable from "@/components/land-manager/production/ProductionTable";
import {
  ProductionRow,
  ProductionSortKey,
  SortDirection,
  sortRows,
  toProductionRow,
} from "@/components/land-manager/production/productionTypes";
import WorkerConfirmDialog from "@/components/land-manager/production/rental-actions/WorkerConfirmDialog";
import WorkerActionsAccordions from "@/components/land-manager/production/worker-actions/WorkerActionsAccordions";
import { useLandManagerRegionData } from "@/hooks/useLandManagerRegionData";
import {
  ProductionActionKind,
  useProductionPlotActions,
} from "@/hooks/useProductionPlotActions";
import { usePurchaseAuthorityStatus } from "@/hooks/usePurchaseAuthorityStatus";
import { useRentalAuthorityStatus } from "@/hooks/useRentalAuthorityStatus";
import { useWorkerAction } from "@/hooks/useWorkerAction";
import { getProductionPageData } from "@/lib/backend/actions/land-manager/production-actions";
import { getDailySPSRatio } from "@/lib/backend/actions/region/sps-actions";
import { getActualResourcePrices } from "@/lib/backend/actions/resources/prices-actions";
import { filterDeeds } from "@/lib/filters";
import {
  FilterProvider,
  useFilters,
} from "@/lib/frontend/context/FilterContext";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
import { Prices } from "@/types/price";
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
  Pagination,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 25;

type ParsedLocationQuery = {
  hasAllParams: boolean;
  region: number | null;
  tract: number | null;
  plot: number | null;
};

function parsePositiveInt(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

/** Rows a given bulk action can act on. */
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

// ── Inner component — uses FilterContext ─────────────────────────────────────

function ProductionPageContent() {
  const {
    auth,
    config,
    refreshKey: ctxRefreshKey,
    triggerRefresh,
  } = useLandManagerContext();
  const username = auth.username ?? "";
  const enabledRegions = config.enabled_regions;

  // Single shared call for DEC/rental/purchase eligibility data
  const regionData = useLandManagerRegionData(enabledRegions, ctxRefreshKey);

  const rentalAuthorityHook = useRentalAuthorityStatus();
  const purchaseAuthorityHook = usePurchaseAuthorityStatus();

  // ── Production table state ───────────────────────────────────────────────
  const [allDeeds, setAllDeeds] = useState<DeedComplete[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const [sort, setSort] = useState<{
    key: ProductionSortKey;
    dir: SortDirection;
  }>({ key: "netDEC", dir: "desc" });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grouped">("list");
  const [expandedDeedUids, setExpandedDeedUids] = useState<Set<string>>(
    new Set()
  );
  const [confirm, setConfirm] = useState<{
    kind: ProductionActionKind;
    rows: ProductionRow[];
  } | null>(null);

  // DEC row busy flags
  const [stakeBusy, setStakeBusy] = useState(false);
  const [unstakeBusy, setUnstakeBusy] = useState(false);

  const { filters, setFilters, setLocationOverride } = useFilters();
  const searchParams = useSearchParams();
  const appliedLocationQueryRef = useRef<string | null>(null);
  const pendingAutoOpenDeedUidRef = useRef<string | null>(null);

  // resource prices for the production-impact line (cached server-side)
  const [prices, setPrices] = useState<Prices | null>(null);
  const [spsRatio, setSpsRatio] = useState(0);

  const parsedLocationQuery = useMemo<ParsedLocationQuery>(() => {
    const regionRaw = searchParams.get("region");
    const tractRaw = searchParams.get("tract");
    const plotRaw = searchParams.get("plot");
    return {
      hasAllParams: regionRaw !== null && tractRaw !== null && plotRaw !== null,
      region: parsePositiveInt(regionRaw),
      tract: parsePositiveInt(tractRaw),
      plot: parsePositiveInt(plotRaw),
    };
  }, [searchParams]);

  const deedByUid = useMemo(() => {
    const map = new Map<string, DeedComplete>();
    for (const d of allDeeds) map.set(d.deed_uid, d);
    return map;
  }, [allDeeds]);

  const availableLocations = useMemo(() => {
    const regions = new Set<number>();
    const tracts = new Set<number>();
    const plots = new Set<number>();
    for (const d of allDeeds) {
      regions.add(d.region_number);
      tracts.add(d.tract_number);
      plots.add(d.plot_number);
    }
    return { regions, tracts, plots };
  }, [allDeeds]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    setLocalRefreshKey((k) => k + 1);
  }, []);

  const handleSuccess = useCallback(() => {
    handleRefresh();
    triggerRefresh();
  }, [handleRefresh, triggerRefresh]);

  const actions = useProductionPlotActions({
    username,
    onSuccess: handleSuccess,
  });

  useEffect(() => {
    let cancelled = false;
    getProductionPageData().then(({ deeds, error }) => {
      if (cancelled) return;
      if (error) setFetchError(error);
      setAllDeeds(deeds);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [localRefreshKey]);

  // Production-impact supporting data — load once
  useEffect(() => {
    let cancelled = false;

    Promise.all([getActualResourcePrices(), getDailySPSRatio()]).then(
      ([prices, ratio]) => {
        if (cancelled) return;

        setPrices(prices);
        setSpsRatio(ratio);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Feed this player's live region/tract/plot lists into FilterDrawer.
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

  useEffect(() => {
    if (loading) return;

    const queryKey = [
      parsedLocationQuery.region ?? "",
      parsedLocationQuery.tract ?? "",
      parsedLocationQuery.plot ?? "",
      parsedLocationQuery.hasAllParams ? "all" : "partial",
    ].join("|");

    if (appliedLocationQueryRef.current === queryKey) return;
    appliedLocationQueryRef.current = queryKey;

    if (allDeeds.length === 0) {
      pendingAutoOpenDeedUidRef.current = null;
      return;
    }

    const next: Partial<FilterInput> = {};
    let hasAnyValid = false;

    if (
      parsedLocationQuery.region !== null &&
      availableLocations.regions.has(parsedLocationQuery.region)
    ) {
      next.filter_regions = [parsedLocationQuery.region];
      hasAnyValid = true;
    }
    if (
      parsedLocationQuery.tract !== null &&
      availableLocations.tracts.has(parsedLocationQuery.tract)
    ) {
      next.filter_tracts = [parsedLocationQuery.tract];
      hasAnyValid = true;
    }
    if (
      parsedLocationQuery.plot !== null &&
      availableLocations.plots.has(parsedLocationQuery.plot)
    ) {
      next.filter_plots = [parsedLocationQuery.plot];
      hasAnyValid = true;
    }

    // Apply URL location filters deterministically and clear stale location keys.
    setFilters((prev) => {
      const merged: FilterInput = { ...prev };
      delete merged.filter_regions;
      delete merged.filter_tracts;
      delete merged.filter_plots;
      if (hasAnyValid) {
        Object.assign(merged, next);
      }
      return merged;
    });

    if (
      parsedLocationQuery.hasAllParams &&
      next.filter_regions?.length === 1 &&
      next.filter_tracts?.length === 1 &&
      next.filter_plots?.length === 1
    ) {
      const matches = allDeeds.filter(
        (d) =>
          d.region_number === next.filter_regions?.[0] &&
          d.tract_number === next.filter_tracts?.[0] &&
          d.plot_number === next.filter_plots?.[0]
      );
      pendingAutoOpenDeedUidRef.current =
        matches.length === 1 ? matches[0].deed_uid : null;
    } else {
      pendingAutoOpenDeedUidRef.current = null;
    }
  }, [loading, allDeeds, parsedLocationQuery, availableLocations, setFilters]);

  // Deeds after FilterDrawer filters (which now include powered/workers) + region pre-filter.
  const filteredDeeds = useMemo<DeedComplete[]>(() => {
    if (allDeeds.length === 0) return [];
    const f: FilterInput = { ...filters };
    delete f.filter_players;
    let result = filterDeeds(allDeeds, f);
    if (enabledRegions.length > 0) {
      result = result.filter((d) => enabledRegions.includes(d.region_number));
    }
    return result;
  }, [allDeeds, filters, enabledRegions]);

  const allRows = useMemo(
    () => filteredDeeds.map(toProductionRow),
    [filteredDeeds]
  );

  const filteredRows = useMemo(
    () => sortRows(allRows, sort.key, sort.dir),
    [allRows, sort]
  );

  // Reset pagination when filtered set changes (render-phase reset).
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
      const key = r.regionName || String(r.regionNumber);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [filteredRows]);

  useEffect(() => {
    const pendingAutoOpenDeedUid = pendingAutoOpenDeedUidRef.current;
    if (!pendingAutoOpenDeedUid || loading) return;
    // Wait until URL filters have propagated: the exact target deed must be
    // the sole visible row. Using the pre-filter count guards against opening
    // at the wrong page when filteredRows still contains all deeds.
    if (
      filteredRows.length !== 1 ||
      filteredRows[0].deedUid !== pendingAutoOpenDeedUid
    )
      return;
    pendingAutoOpenDeedUidRef.current = null;
    setTimeout(() => {
      setViewMode("list");
      setPage(1);
      setExpandedDeedUids(new Set([pendingAutoOpenDeedUid]));
    }, 0);
  }, [loading, filteredRows]);

  // ── Rental / Purchase filtering ──────────────────────────────────────────
  const filteredDeedUids = useMemo(
    () => filteredDeeds.map((d) => d.deed_uid),
    [filteredDeeds]
  );

  const filteredEligibleCount = useMemo(() => {
    if (!regionData.eligibility) return null;
    const set = new Set(filteredDeedUids);
    return regionData.eligibility.eligible.filter((p) => set.has(p.deed_uid))
      .length;
  }, [regionData.eligibility, filteredDeedUids]);

  // ── Worker action hooks ──────────────────────────────────────────────────
  const rentAction = useWorkerAction({
    mode: "rent",
    username,
    rental: config.rental,
    enabledRegions,
    eligiblePlotCount: filteredEligibleCount,
    filteredDeedUids,
    onSuccess: handleSuccess,
  });
  const buyAction = useWorkerAction({
    mode: "buy",
    username,
    buy: config.buy,
    enabledRegions,
    eligiblePlotCount: filteredEligibleCount,
    filteredDeedUids,
    onSuccess: handleSuccess,
  });

  // ── Sort handler ─────────────────────────────────────────────────────────
  const handleSort = useCallback((key: ProductionSortKey) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
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
          spsRatio={spsRatio}
          prices={prices}
          username={username}
          actions={actions}
          onSaved={handleRefresh}
        />
      );
    },
    [deedByUid, username, actions, spsRatio, prices, handleRefresh]
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
  const decAnyBusy = stakeBusy || unstakeBusy;

  return (
    <Box>
      <WorkerActionsAccordions
        rentalConfig={config.rental}
        buyConfig={config.buy}
        filteredEligibleCount={filteredEligibleCount}
        rentAction={rentAction}
        buyAction={buyAction}
        rentalAuthority={rentalAuthorityHook}
        purchaseAuthority={purchaseAuthorityHook}
      />

      <BulkActionsAccordion
        username={username}
        filteredRows={filteredRows}
        loading={loading}
        busy={actions.busy}
        regionData={regionData}
        decAnyBusy={decAnyBusy}
        onStakeBusy={setStakeBusy}
        onUnstakeBusy={setUnstakeBusy}
        onSuccess={handleSuccess}
        onOpenBulkConfirm={openConfirm}
        actionableRows={actionableRows}
      />

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mt={1.5}
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

      {/* ── Feedback alerts ───────────────────────────────────────────────── */}
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

      {/* ── Table ─────────────────────────────────────────────────────────── */}
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

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
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

      {rentAction.executionPlan && (
        <WorkerConfirmDialog
          exec={rentAction.executionPlan}
          busy={rentAction.busy}
          decBalance={rentAction.decBalance}
          onConfirm={() => rentAction.execute()}
          onCancel={() => rentAction.clearExecutionPlan()}
        />
      )}

      {buyAction.executionPlan && (
        <WorkerConfirmDialog
          exec={buyAction.executionPlan}
          busy={buyAction.busy}
          decBalance={buyAction.decBalance}
          onConfirm={() => buyAction.execute()}
          onCancel={() => buyAction.clearExecutionPlan()}
        />
      )}
    </Box>
  );
}

// ── Outer component — provides FilterContext ──────────────────────────────────

export default function ProductionPage() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  // FilterDrawer auto-opens from 1024px up; match that threshold so content
  // shifts whenever the persistent drawer is visible.
  const isDrawerDesktop = useMediaQuery("(min-width:1024px)");

  return (
    <FilterProvider>
      <FilterDrawer
        player={null}
        onOpenChange={setDrawerOpen}
        filtersEnabled={{
          regions: true,
          tracts: true,
          plots: true,
          attributes: true,
          player: false,
          sorting: false,
          poweredWorkers: true,
        }}
      />
      <Box
        sx={{
          transition: "margin-right 0.2s ease",
          mr: isDrawerDesktop && drawerOpen ? "330px" : 0,
        }}
      >
        <ProductionPageContent />
      </Box>
    </FilterProvider>
  );
}
