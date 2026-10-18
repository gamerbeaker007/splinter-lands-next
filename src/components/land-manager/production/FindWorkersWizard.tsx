"use client";

import AuthorityControl from "@/components/land-manager/production/rental-actions/AuthorityControl";
import WorkerPlotResultCard from "@/components/land-manager/production/rental-actions/WorkerPlotResultCard";
import InlineWorkerSettings from "@/components/land-manager/production/InlineWorkerSettings";
import type { UseAuthorityStatus } from "@/hooks/useAuthorityStatusCore";
import type { UseWorkerAction } from "@/hooks/useWorkerAction";
import { formatFixed } from "@/lib/formatters";
import { foilLabel } from "@/lib/utils/cardUtil";
import type { BuyConfig, RentalConfig } from "@/types/landManager";
import {
  BUY_STRATEGY_LABELS,
  normalizeWorkerBatchSize,
  RENTAL_STRATEGY_LABELS,
} from "@/types/landManager";
import type {
  BuyExecutionPlan,
  RentalExecutionPlan,
} from "@/lib/shared/workerPlan";
import { dec_icon_url } from "@/lib/shared/statics_icon_urls";
import type { DeedComplete } from "@/types/deed";
import type { Prices } from "@/types/price";
import type { RegionTax } from "@/types/regionTax";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Pagination,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  ShoppingCart,
  Storefront,
} from "@mui/icons-material";
import { useState } from "react";

type Mode = "rent" | "buy";
const RESULTS_PAGE_SIZE = 10;

function defaultStrategySummary(
  mode: Mode,
  config: RentalConfig | BuyConfig
): string[] {
  const strategy =
    mode === "rent"
      ? RENTAL_STRATEGY_LABELS[(config as RentalConfig).strategy]
      : BUY_STRATEGY_LABELS[(config as BuyConfig).strategy];
  const batchSize = normalizeWorkerBatchSize(
    mode === "rent"
      ? (config as RentalConfig).rental_batch_size
      : (config as BuyConfig).buy_batch_size
  );
  const maxPerWorker =
    mode === "rent"
      ? (config as RentalConfig).max_dec_per_day_per_worker
      : (config as BuyConfig).max_dec_per_worker;

  return [
    strategy,
    `${batchSize} plots/run`,
    config.max_total_dec > 0
      ? `up to ${formatFixed(config.max_total_dec)} DEC total`
      : "no total DEC cap",
    maxPerWorker > 0
      ? `up to ${formatFixed(maxPerWorker)} ${mode === "rent" ? "DEC/day" : "DEC"} per worker`
      : "no per-worker DEC cap",
    config.min_land_base_pp > 0
      ? `minimum ${formatFixed(config.min_land_base_pp)} PP`
      : "no minimum PP",
    `foil ≥ ${foilLabel(config.min_foil)}`,
    config.terrain_boost_only ? "terrain boost required" : "any terrain boost",
  ];
}

interface Props {
  open: boolean;
  onClose: () => void;
  eligibleCount: number | null;
  unpoweredCount: number | null;
  rentalConfig: RentalConfig;
  buyConfig: BuyConfig;
  onOpenConfig: (section: "rental" | "buy") => void;
  rentAction: UseWorkerAction<RentalExecutionPlan>;
  buyAction: UseWorkerAction<BuyExecutionPlan>;
  rentalAuthority: UseAuthorityStatus;
  purchaseAuthority: UseAuthorityStatus;
  deedByUid: ReadonlyMap<string, DeedComplete>;
  prices: Prices | null;
  spsRatio: number;
  regionTax: RegionTax[];
}

export default function FindWorkersWizard({
  open,
  onClose,
  eligibleCount,
  unpoweredCount,
  rentalConfig,
  buyConfig,
  onOpenConfig,
  rentAction,
  buyAction,
  rentalAuthority,
  purchaseAuthority,
  deedByUid,
  prices,
  spsRatio,
  regionTax,
}: Readonly<Props>) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsPage, setResultsPage] = useState(1);
  const [rentalOverride, setRentalOverride] =
    useState<RentalConfig>(rentalConfig);
  const [buyOverride, setBuyOverride] = useState<BuyConfig>(buyConfig);
  const activeAction = mode === "rent" ? rentAction : buyAction;
  const executionPlan =
    mode === "rent"
      ? rentAction.executionPlan
      : mode === "buy"
        ? buyAction.executionPlan
        : null;
  const plan = executionPlan?.plan ?? null;
  const selectedItems =
    plan?.items.filter((item) => item.picks.length > 0) ?? [];
  const totalPicks = plan?.totals.slots_filled ?? 0;
  const insufficientDec =
    executionPlan != null &&
    activeAction.decBalance != null &&
    executionPlan.plan.totals.total_dec > activeAction.decBalance;
  const slotShortageCount =
    executionPlan?.plan.items.filter(
      (item) =>
        item.picks.length > 0 &&
        (executionPlan.emptySlotsByDeed[item.plot.deed_uid]?.length ?? 0) <
          item.picks.length
    ).length ?? 0;

  const showResults = async (
    selectedMode: Mode,
    config: RentalConfig | BuyConfig
  ) => {
    setMode(selectedMode);
    setResultsOpen(true);
    setResultsPage(1);
    if (selectedMode === "rent") {
      const normalized = {
        ...(config as RentalConfig),
        rental_batch_size: normalizeWorkerBatchSize(
          (config as RentalConfig).rental_batch_size
        ),
      };
      setRentalOverride(normalized);
      rentAction.clearError();
      rentAction.clearResult();
      await rentAction.prepareExecution(normalized);
    } else {
      const normalized = {
        ...(config as BuyConfig),
        buy_batch_size: normalizeWorkerBatchSize(
          (config as BuyConfig).buy_batch_size
        ),
      };
      setBuyOverride(normalized);
      buyAction.clearError();
      buyAction.clearResult();
      await buyAction.prepareExecution(normalized);
    }
  };

  const searchAgain = async () => {
    setResultsPage(1);
    activeAction.clearResult();
    if (mode === "rent") {
      await rentAction.prepareExecution(rentalOverride);
    } else if (mode === "buy") {
      await buyAction.prepareExecution(buyOverride);
    }
  };

  const confirm = async () => {
    if (mode === "rent") await rentAction.execute(rentalOverride);
    else if (mode === "buy") await buyAction.execute(buyOverride);
  };

  const back = () => {
    setResultsOpen(false);
    if (mode === "rent") rentAction.clearExecutionPlan();
    if (mode === "buy") buyAction.clearExecutionPlan();
  };

  const close = () => {
    if (activeAction.busy) return;
    setMode(null);
    setResultsOpen(false);
    if (mode === "rent") rentAction.clearExecutionPlan();
    if (mode === "buy") buyAction.clearExecutionPlan();
    onClose();
  };

  const rentAuthorized = Boolean(
    rentalAuthority.status?.serviceConfigured &&
    rentalAuthority.status.authorized
  );
  const buyAuthorized = Boolean(
    purchaseAuthority.status?.serviceConfigured &&
    purchaseAuthority.status.authorized
  );
  const pageCount = Math.ceil(selectedItems.length / RESULTS_PAGE_SIZE);
  // A refreshed plan (on confirm) can have fewer plots than the page shown.
  const page = Math.min(resultsPage, Math.max(pageCount, 1));
  const visibleItems = selectedItems.slice(
    (page - 1) * RESULTS_PAGE_SIZE,
    page * RESULTS_PAGE_SIZE
  );
  const activeConfig = mode === "buy" ? buyOverride : rentalOverride;
  const needsNewSearch =
    executionPlan != null && !activeAction.isPlanConfirmable(activeConfig);

  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="xl"
      fullWidth
      PaperProps={{ sx: { minHeight: { xs: "100%", md: "82vh" } } }}
    >
      <DialogTitle>
        {resultsOpen
          ? `Find Workers to ${mode === "rent" ? "Rent" : "Buy"} - Results`
          : "Find Workers"}
      </DialogTitle>
      <DialogContent dividers>
        {!resultsOpen ? (
          <Stack spacing={2}>
            <Alert severity={eligibleCount === 0 ? "warning" : "info"}>
              <Typography variant="body2" fontWeight={700}>
                {eligibleCount === null
                  ? "Checking plot eligibility…"
                  : eligibleCount === 0
                    ? "No plots have fewer workers than their allowed capacity and are eligible for this flow."
                    : `${eligibleCount} ${eligibleCount === 1 ? "plot has" : "plots have"} fewer workers than ${eligibleCount === 1 ? "its" : "their"} allowed capacity and ${eligibleCount === 1 ? "is" : "are"} eligible for this flow.`}
              </Typography>
              <Typography variant="body2">
                Only powered-on plots with empty worker slots are eligible.
                {unpoweredCount != null &&
                  unpoweredCount > 0 &&
                  ` ${unpoweredCount} matching ${unpoweredCount === 1 ? "plot is" : "plots are"} excluded because they are not powered on.`}
              </Typography>
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h6">Rent workers</Typography>
                    <AuthorityControl
                      authority={rentalAuthority}
                      label="Rental authorization"
                      actionNoun="rental"
                      opName="sm_market_rent"
                    />
                    <Button
                      fullWidth
                      size="large"
                      variant="contained"
                      color="info"
                      startIcon={<Storefront />}
                      disabled={
                        eligibleCount === null ||
                        eligibleCount === 0 ||
                        !rentAuthorized ||
                        rentAction.busy
                      }
                      onClick={() => void showResults("rent", rentalConfig)}
                      sx={{ py: 1.5, fontWeight: 800 }}
                    >
                      Find Workers to Rent
                    </Button>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <Typography variant="subtitle2">
                        Save Default Strategy
                      </Typography>
                      <Tooltip title="Edit and save the default rental strategy">
                        <IconButton
                          size="small"
                          aria-label="Edit default rental strategy"
                          onClick={() => onOpenConfig("rental")}
                        >
                          <SettingsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Stored strategy
                      </Typography>
                      <Stack direction="row" gap={0.5} flexWrap="wrap">
                        {defaultStrategySummary("rent", rentalConfig).map(
                          (setting) => (
                            <Chip
                              key={setting}
                              size="small"
                              variant="outlined"
                              label={setting}
                            />
                          )
                        )}
                      </Stack>
                    </Stack>
                    {rentAction.error && (
                      <Alert severity="error">{rentAction.error}</Alert>
                    )}
                  </Stack>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h6">Buy workers</Typography>
                    <AuthorityControl
                      authority={purchaseAuthority}
                      label="Purchase authorization"
                      actionNoun="purchase"
                      opName="sm_market_purchase"
                    />
                    <Button
                      fullWidth
                      size="large"
                      variant="contained"
                      color="secondary"
                      startIcon={<ShoppingCart />}
                      disabled={
                        eligibleCount === null ||
                        eligibleCount === 0 ||
                        !buyAuthorized ||
                        buyAction.busy
                      }
                      onClick={() => void showResults("buy", buyConfig)}
                      sx={{ py: 1.5, fontWeight: 800 }}
                    >
                      Find Workers to Buy
                    </Button>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <Typography variant="subtitle2">
                        Save Default Strategy
                      </Typography>
                      <Tooltip title="Edit and save the default purchase strategy">
                        <IconButton
                          size="small"
                          aria-label="Edit default purchase strategy"
                          onClick={() => onOpenConfig("buy")}
                        >
                          <SettingsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Stored strategy
                      </Typography>
                      <Stack direction="row" gap={0.5} flexWrap="wrap">
                        {defaultStrategySummary("buy", buyConfig).map(
                          (setting) => (
                            <Chip
                              key={setting}
                              size="small"
                              variant="outlined"
                              label={setting}
                            />
                          )
                        )}
                      </Stack>
                    </Stack>
                    {buyAction.error && (
                      <Alert severity="error">{buyAction.error}</Alert>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                alignItems={{ md: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Search settings
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                    sx={{ mb: 0.75 }}
                  >
                    Temporary changes are local to this wizard and never change
                    the saved default.
                  </Typography>
                  <InlineWorkerSettings
                    mode={mode ?? "rent"}
                    config={mode === "rent" ? rentalOverride : buyOverride}
                    savedDefault={mode === "rent" ? rentalConfig : buyConfig}
                    onChange={(value) =>
                      mode === "rent"
                        ? setRentalOverride(value as RentalConfig)
                        : setBuyOverride(value as BuyConfig)
                    }
                  />
                </Box>
                <Stack direction="row" gap={1} alignItems="center">
                  <Button
                    variant="contained"
                    onClick={() => void searchAgain()}
                    disabled={activeAction.busy}
                    startIcon={
                      activeAction.busy ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : undefined
                    }
                  >
                    Search Again
                  </Button>
                  {needsNewSearch && !activeAction.busy && (
                    <Typography variant="caption" color="warning.main">
                      Search again to see the plan for these settings before
                      confirming.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Paper>

            {activeAction.error && (
              <Alert severity="error">{activeAction.error}</Alert>
            )}
            {activeAction.result?.success && (
              <Alert severity="success">
                {mode === "rent" ? "Rent" : "Buy"} and stake completed:{" "}
                {activeAction.result.stakedCount} of {activeAction.result.count}{" "}
                workers staked; {formatFixed(activeAction.result.totalDec)} DEC
                spent.
              </Alert>
            )}
            {activeAction.busy && (
              <Stack direction="row" gap={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography>Searching live market listings…</Typography>
              </Stack>
            )}
            {plan && (
              <>
                <Stack
                  direction="row"
                  gap={1.25}
                  alignItems="center"
                  flexWrap="wrap"
                  aria-label="Selected plots, workers, and DEC cost"
                >
                  <Typography variant="body2" fontWeight={700}>
                    {plan.totals.plots_with_picks} plot
                    {plan.totals.plots_with_picks === 1 ? "" : "s"} with workers
                  </Typography>
                  <Divider orientation="vertical" flexItem />
                  <Typography variant="body2" fontWeight={700}>
                    {totalPicks} worker{totalPicks === 1 ? "" : "s"} selected
                  </Typography>
                  <Divider orientation="vertical" flexItem />
                  <Tooltip title="Selected cost / available DEC balance">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography
                        variant="body2"
                        fontWeight={800}
                        color={insufficientDec ? "error.main" : "success.main"}
                      >
                        {formatFixed(plan.totals.total_dec)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        /
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activeAction.decBalance == null
                          ? "—"
                          : formatFixed(activeAction.decBalance)}
                      </Typography>
                      <Box
                        component="img"
                        src={dec_icon_url}
                        alt="DEC"
                        sx={{ width: 18, height: 18, objectFit: "contain" }}
                      />
                    </Stack>
                  </Tooltip>
                  <Typography variant="caption" color="text.secondary">
                    selected / available
                  </Typography>
                  {mode === "rent" && "rental_days" in plan && (
                    <Chip
                      label={
                        plan.rental_days
                          ? `${plan.rental_days}-day listing term`
                          : "Per-listing rental terms"
                      }
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Stack>

                {plan.warnings.map((warning) => (
                  <Alert key={warning} severity="warning">
                    {warning}
                  </Alert>
                ))}
                {insufficientDec && (
                  <Alert severity="error">
                    Insufficient DEC for the current search estimate. Top up
                    before confirming.
                  </Alert>
                )}
                {slotShortageCount > 0 && (
                  <Alert severity="warning">
                    {slotShortageCount} plot
                    {slotShortageCount === 1 ? " has" : "s have"} fewer free
                    slots than selected workers. Those plots will be skipped
                    during staking; acquired cards can be staked manually.
                  </Alert>
                )}
                {totalPicks === 0 ? (
                  <Alert severity="info">
                    No workers matched the current strategy and market
                    availability.
                  </Alert>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
                      alignItems: "start",
                      gap: 1.5,
                    }}
                  >
                    {visibleItems.map((item) => (
                      <WorkerPlotResultCard
                        key={item.plot.deed_uid}
                        item={item}
                        mode={mode ?? "rent"}
                        deed={deedByUid.get(item.plot.deed_uid) ?? item.plot}
                        currentWorkers={
                          executionPlan?.plotWorkersByDeed[item.plot.deed_uid]
                        }
                        emptySlots={
                          executionPlan?.emptySlotsByDeed[item.plot.deed_uid] ??
                          []
                        }
                        prices={prices}
                        spsRatio={spsRatio}
                        regionTax={regionTax}
                      />
                    ))}
                    {pageCount > 1 && (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                        sx={{ gridColumn: "1 / -1" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Showing {(page - 1) * RESULTS_PAGE_SIZE + 1}–
                          {Math.min(
                            page * RESULTS_PAGE_SIZE,
                            selectedItems.length
                          )}{" "}
                          of {selectedItems.length} plots
                        </Typography>
                        <Pagination
                          count={pageCount}
                          page={page}
                          onChange={(_, nextPage) => setResultsPage(nextPage)}
                          size="small"
                          showFirstButton
                          showLastButton
                          aria-label="Worker result pages"
                        />
                      </Stack>
                    )}
                  </Box>
                )}
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 1.5, justifyContent: "space-between" }}>
        {resultsOpen ? (
          <>
            <Button onClick={back} disabled={activeAction.busy}>
              Back
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => void confirm()}
              disabled={
                activeAction.busy ||
                !executionPlan ||
                totalPicks === 0 ||
                insufficientDec ||
                needsNewSearch
              }
              startIcon={
                activeAction.busy ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              {activeAction.busy
                ? mode === "rent"
                  ? "Renting and staking…"
                  : "Buying and staking…"
                : `Confirm ${mode === "rent" ? "Rent" : "Buy"} & Stake — ${formatFixed(plan?.totals.total_dec ?? 0)} DEC${mode === "rent" && plan && "rental_days" in plan ? (plan.rental_days ? ` (${plan.rental_days} days)` : " (per-listing terms)") : ""}`}
            </Button>
          </>
        ) : (
          <Box sx={{ flex: 1 }} />
        )}
        <Button onClick={close} disabled={activeAction.busy}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
