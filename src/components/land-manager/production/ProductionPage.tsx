"use client";

import LandFilterDrawer from "@/components/filter/LandFilterDrawer";
import BulkOperationsMenu from "@/components/land-manager/production/BulkOperationsMenu";
import ChangeWorksiteDialog from "@/components/land-manager/production/ChangeWorksiteDialog";
import ConfigurePanel from "@/components/land-manager/production/ConfigurePanel";
import ConfirmActionDialog, {
  ACTION_META,
} from "@/components/land-manager/production/ConfirmActionDialog";
import FloatingFeedback from "@/components/ui/FloatingFeedback";
import DecPowerControls from "@/components/land-manager/production/DecPowerControls";
import FindWorkersWizard from "@/components/land-manager/production/FindWorkersWizard";
import ProductionRegionGroup from "@/components/land-manager/production/ProductionRegionGroup";
import ProductionTable from "@/components/land-manager/production/ProductionTable";
import WorksiteBulkActions from "@/components/land-manager/worksites/WorksiteBulkActions";
import {
  ProductionRow,
  ProductionSortKey,
  SortDirection,
  sortRows,
  toProductionRow,
} from "@/components/land-manager/production/productionTypes";
import CustomIconSpinner from "@/components/ui/loaders/CustomIconSpinner";
import { useLandManagerRegionData } from "@/hooks/useLandManagerRegionData";
import {
  ProductionActionKind,
  useProductionPlotActions,
} from "@/hooks/useProductionPlotActions";
import { usePurchaseAuthorityStatus } from "@/hooks/usePurchaseAuthorityStatus";
import { useRentalAuthorityStatus } from "@/hooks/useRentalAuthorityStatus";
import { useWorkerAction } from "@/hooks/useWorkerAction";
import { getDailySPSRatio } from "@/lib/backend/actions/region/sps-actions";
import { getActualResourcePrices } from "@/lib/backend/actions/resources/prices-actions";
import { getProductionPageData } from "@/lib/frontend/land-production-data";
import { getRegionGrain } from "@/lib/frontend/land-data";
import { formatFixed } from "@/lib/formatters";
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
  PersonSearch as FindWorkersIcon,
  Refresh as RefreshIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Pagination,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 25;
const NO_GRAIN: Record<string, number> = {};

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

const NO_DEEDS: DeedComplete[] = [];

function ProductionPageContent() {
  const {
    auth,
    config,
    refreshKey: ctxRefreshKey,
    triggerRefresh,
    openConfigDialog,
  } = useLandManagerContext();
  const username = auth.username ?? "";

  // Single shared call for DEC/rental/purchase eligibility data
  const regionData = useLandManagerRegionData(ctxRefreshKey);

  const rentalAuthorityHook = useRentalAuthorityStatus();
  const purchaseAuthorityHook = usePurchaseAuthorityStatus();

  // ── Production table state ───────────────────────────────────────────────
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const { data: pageData, loading } = useAsyncData(
    `production|${localRefreshKey}`,
    async () => ({ ...(await getProductionPageData()), loadedAt: Date.now() }),
    { errorMessage: "Failed to load production data" }
  );
  const allDeeds = pageData?.deeds ?? NO_DEEDS;
  const fetchError = loading ? null : (pageData?.error ?? null);
  // One "now" for the page so the table's construction badges and the Change
  // worksite dialog judge against the same instant. Re-stamped on every reload,
  // so a finished construction becomes actionable after Refresh.
  const [mountedAtMs] = useState(() => Date.now());
  const nowMs = pageData?.loadedAt ?? mountedAtMs;
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
  /** deed_uid whose Change worksite dialog is open. */
  const [changeWorksiteUid, setChangeWorksiteUid] = useState<string | null>(
    null
  );

  // DEC row busy flags
  const [stakeBusy, setStakeBusy] = useState(false);
  const [unstakeBusy, setUnstakeBusy] = useState(false);
  const [findWorkersOpen, setFindWorkersOpen] = useState(false);

  const { filters, setFilters, setLocationOverride } = useFilters();
  const searchParams = useSearchParams();
  const appliedLocationQueryRef = useRef<string | null>(null);
  const pendingAutoOpenDeedUidRef = useRef<string | null>(null);

  // resource prices for the production-impact line (cached server-side) —
  // loaded once
  const { data: impactData } = useAsyncData(
    "production-impact",
    async () => {
      const [prices, ratio] = await Promise.all([
        getActualResourcePrices(),
        getDailySPSRatio(),
      ]);
      return { prices, ratio };
    },
    { errorMessage: "Failed to load prices" }
  );
  const prices: Prices | null = impactData?.prices ?? null;
  const spsRatio = impactData?.ratio ?? 0;

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

  // Feed this player's live region/tract/plot lists into LandFilterDrawer.
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

  // Deeds after LandFilterDrawer filters (which now include powered/workers) + region pre-filter.
  const filteredDeeds = useMemo<DeedComplete[]>(() => {
    if (allDeeds.length === 0) return [];
    const f: FilterInput = { ...filters };
    delete f.filter_players;
    return filterDeeds(allDeeds, f);
  }, [allDeeds, filters]);

  const allRows = useMemo(
    () => filteredDeeds.map((deed) => toProductionRow(deed, nowMs)),
    [filteredDeeds, nowMs]
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

  const filteredUnpoweredCount = useMemo(() => {
    if (!regionData.eligibility) return null;
    const set = new Set(filteredDeedUids);
    return regionData.eligibility.unpoweredSkipped.filter((plot) =>
      set.has(plot.deed_uid)
    ).length;
  }, [regionData.eligibility, filteredDeedUids]);

  const grainRegionKey = useMemo(
    () => [...new Set(filteredDeeds.map((deed) => deed.region_uid))].join(","),
    [filteredDeeds]
  );
  const { data: regionGrain = NO_GRAIN, error: regionGrainError } =
    useAsyncData(
      grainRegionKey
        ? `production-grain|${ctxRefreshKey}|${grainRegionKey}`
        : null,
      // Memoised read: broadcasts clear the memo and ctxRefreshKey refetches,
      // so forcing it would only add a JWT read per region on every load.
      () => getRegionGrain(grainRegionKey.split(",")),
      { errorMessage: "Failed to load region grain" }
    );

  // ── Worker action hooks ──────────────────────────────────────────────────
  const rentAction = useWorkerAction({
    mode: "rent",
    username,
    rental: config.rental,
    eligiblePlotCount: filteredEligibleCount,
    filteredDeedUids,
    onSuccess: handleSuccess,
  });
  const buyAction = useWorkerAction({
    mode: "buy",
    username,
    buy: config.buy,
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
    const result = await actions.run(kind, deedUids);
    if (result && !result.error) setConfirm(null);
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
    nowMs,
    onSort: handleSort,
    onAction: (kind: ProductionActionKind, row: ProductionRow) =>
      openConfirm(kind, [row]),
    onChangeWorksite: (row: ProductionRow) => setChangeWorksiteUid(row.deedUid),
    onToggleConfigure: (deedUid: string) =>
      setExpandedDeedUids((cur) => {
        const next = new Set(cur);
        if (next.has(deedUid)) next.delete(deedUid);
        else next.add(deedUid);
        return next;
      }),
    renderConfigure,
  };

  const changeWorksiteDeed = changeWorksiteUid
    ? (deedByUid.get(changeWorksiteUid) ?? null)
    : null;

  const result = actions.result;
  const decAnyBusy = stakeBusy || unstakeBusy;
  const hasLoadedRows = allDeeds.length > 0;
  const showInitialLoading = loading && !hasLoadedRows;
  const showLoadingOverlay = loading && hasLoadedRows;

  return (
    <Box>
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ width: "100%", maxWidth: 560, alignItems: "stretch" }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <BulkOperationsMenu
              username={username}
              filteredRows={filteredRows}
              loading={loading}
              busy={actions.busy}
              onSuccess={handleSuccess}
              onOpenBulkConfirm={openConfirm}
              actionableRows={actionableRows}
              renderWorksiteActions={(closeMenu) => (
                <WorksiteBulkActions
                  deeds={filteredDeeds}
                  username={username}
                  regionGrain={regionGrain}
                  strategies={config.make_harvestable_strategies}
                  nowMs={nowMs}
                  onSuccess={handleSuccess}
                  menuMode
                  onMenuAction={closeMenu}
                />
              )}
              renderDecActions={(closeMenu) => (
                <DecPowerControls
                  username={username}
                  stakeActionable={regionData.stakeActionable}
                  unstakeActionable={regionData.unstakeActionable}
                  busy={decAnyBusy}
                  onStakeBusy={setStakeBusy}
                  onUnstakeBusy={setUnstakeBusy}
                  onSuccess={handleSuccess}
                  menuItem
                  onMenuAction={closeMenu}
                />
              )}
            />
          </Box>
          <Button
            variant="contained"
            size="medium"
            color="primary"
            startIcon={<FindWorkersIcon />}
            onClick={() => setFindWorkersOpen(true)}
            sx={{
              flex: 1,
              minWidth: 0,
              whiteSpace: "nowrap",
              fontWeight: 700,
            }}
          >
            Find Workers
          </Button>
        </Stack>
        {regionGrainError && <Alert severity="error">{regionGrainError}</Alert>}
      </Stack>

      {rentAction.result && (
        <Alert
          severity={rentAction.result.success ? "success" : "warning"}
          sx={{ mb: 1.5 }}
          onClose={rentAction.clearResult}
        >
          Rented {rentAction.result.count} card
          {rentAction.result.count === 1 ? "" : "s"} · staked{" "}
          {rentAction.result.stakedCount} · spent{" "}
          {formatFixed(rentAction.result.totalDec)} DEC
        </Alert>
      )}
      {buyAction.result && (
        <Alert
          severity={buyAction.result.success ? "success" : "warning"}
          sx={{ mb: 1.5 }}
          onClose={buyAction.clearResult}
        >
          Bought {buyAction.result.count} card
          {buyAction.result.count === 1 ? "" : "s"} · staked{" "}
          {buyAction.result.stakedCount} · spent{" "}
          {formatFixed(buyAction.result.totalDec)} DEC
        </Alert>
      )}
      {rentAction.error && !findWorkersOpen && (
        <Alert
          severity="error"
          sx={{ mb: 1.5 }}
          onClose={rentAction.clearError}
        >
          {rentAction.error}
        </Alert>
      )}
      {buyAction.error && !findWorkersOpen && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={buyAction.clearError}>
          {buyAction.error}
        </Alert>
      )}

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
          <Button
            size="small"
            startIcon={<RefreshIcon />}
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
      <FloatingFeedback floating feedbackKey={result ?? actions.error}>
        {actions.error && (
          <Alert severity="error" onClose={actions.clearError}>
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
      </FloatingFeedback>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {fetchError}
        </Alert>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {showInitialLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CustomIconSpinner
            label={"Loading plots…"}
            iconType={"Worksite"}
            size={200}
          />
        </Box>
      ) : (
        <Box sx={{ position: "relative" }}>
          {filteredRows.length === 0 ? (
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

          {showLoadingOverlay && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(17, 24, 39, 0.28)",
                backdropFilter: "blur(1px)",
                zIndex: 2,
              }}
            >
              <CustomIconSpinner
                label={"Refreshing plots…"}
                iconType={"Worksite"}
                size={180}
              />
            </Box>
          )}
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

      {changeWorksiteDeed && (
        <ChangeWorksiteDialog
          open
          deed={changeWorksiteDeed}
          username={username}
          nowMs={nowMs}
          onClose={() => setChangeWorksiteUid(null)}
          onSuccess={() => {
            setChangeWorksiteUid(null);
            handleSuccess();
          }}
        />
      )}

      <FindWorkersWizard
        open={findWorkersOpen}
        onClose={() => setFindWorkersOpen(false)}
        eligibleCount={filteredEligibleCount}
        unpoweredCount={filteredUnpoweredCount}
        rentalConfig={config.rental}
        buyConfig={config.buy}
        onOpenConfig={(section) => openConfigDialog(section)}
        rentAction={rentAction}
        buyAction={buyAction}
        rentalAuthority={rentalAuthorityHook}
        purchaseAuthority={purchaseAuthorityHook}
        deedByUid={deedByUid}
        prices={prices}
        spsRatio={spsRatio}
        regionTax={Object.values(pageData?.regionTax ?? {})}
      />
    </Box>
  );
}

// ── Outer component — provides FilterContext ──────────────────────────────────

export default function ProductionPage() {
  return (
    <FilterProvider>
      {/* The panel reserves its own room in the main layout — no offset here. */}
      <LandFilterDrawer
        player={null}
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
      <ProductionPageContent />
    </FilterProvider>
  );
}
