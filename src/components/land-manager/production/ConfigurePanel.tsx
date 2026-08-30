"use client";

import { renderResourceIcon } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import { UseProductionPlotActions } from "@/hooks/useProductionPlotActions";
import {
  getRegionStakedDEC,
  RegionDECInfo,
} from "@/lib/backend/actions/land-manager/dec-power-actions";
import {
  getPlotConfigureData,
  PlotConfigureData,
} from "@/lib/backend/actions/land-manager/production-actions";
import { formatFixed, formatInt, formatNumber } from "@/lib/formatters";
import { deedToPlotPlannerData } from "@/lib/frontend/utils/deedToPlotPlanner";
import {
  calcStakedDecNeeded,
  determineBloodlineBoost,
  determineDeedResourceBoost,
  determineProductionBoost,
} from "@/lib/frontend/utils/plannerCalcs";
import { DeedComplete } from "@/types/deed";
import {
  cardFoilOptions,
  plotRarityModifiers,
  resourceWorksiteMap,
  runiModifiers,
  SlotInput,
  titleModifiers,
  totemModifiers,
} from "@/types/planner";
import { Prices } from "@/types/price";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MdInfo } from "react-icons/md";
import AssetPickerDialog, {
  PickerKind,
  PickerResult,
} from "./AssetPickerDialog";
import {
  boostOverrides,
  diffStagedConfig,
  initStagedConfig,
  MAX_WORKER_SLOTS,
  SpotCardVM,
  StagedConfig,
  stagedHasChanges,
} from "./productionConfigTypes";
import { EmptySpot, FilledCardSpot, FilledItemSpot } from "./SpotTile";
import { projectPlot } from "./worker-actions/workerScoring";
import WorkerSelectDialog from "./worker-actions/WorkerSelectDialog";

/** Format a signed delta like "+1,234" / "-1,234" / "0". */
function fmtDelta(n: number): string {
  const s = formatNumber(Math.abs(n));
  return n > 0 ? `+${s}` : n < 0 ? `-${s}` : "0";
}

function deltaColor(n: number, higherIsBetter = true): string {
  if (n === 0) return "text.secondary";
  const good = higherIsBetter ? n > 0 : n < 0;
  return good ? "success.main" : "error.main";
}

function fmtPct(n: number): string {
  return `${formatFixed(n, 1)}%`;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function sameUid(
  a: { uid: string } | null | undefined,
  b: { uid: string } | null | undefined
): boolean {
  return (a?.uid ?? null) === (b?.uid ?? null);
}

const IMPACT_ROW_TRANSITION_MS = 1000;

type ResourceRate = { resource: string; amount: number };

/** Render one or more resource consumption rates, optionally with their change. */
function renderConsume(rates: ResourceRate[], deltas: ResourceRate[] = []) {
  const amountByResource = new Map(
    rates.map((rate) => [rate.resource, rate.amount])
  );
  const deltaByResource = new Map(
    deltas.map((delta) => [delta.resource, delta.amount])
  );

  // Include resources that were removed from the staged configuration as zero.
  for (const { resource } of deltas) {
    if (!amountByResource.has(resource)) amountByResource.set(resource, 0);
  }

  const rows = [...amountByResource.entries()].map(([resource, amount]) => ({
    resource,
    amount,
    delta: deltaByResource.get(resource),
  }));

  const renderRate = (row: (typeof rows)[number]) => (
    <>
      {renderResourceIcon(row.resource as Resource)}
      <Typography variant="caption">{row.amount.toFixed(1)}</Typography>
      {row.delta !== undefined && (
        <Typography variant="caption" color="text.secondary">
          (
          <Box component="span" sx={{ color: deltaColor(row.delta) }}>
            {fmtDelta(row.delta)}
          </Box>
          )
        </Typography>
      )}
    </>
  );

  return (
    <Tooltip
      arrow
      placement="top"
      title={
        <Box>
          <Typography fontSize={12} fontWeight="bold" mb={0.5}>
            Consumes:
          </Typography>
          {rows.length === 0 ? (
            <Typography fontSize={12}>None</Typography>
          ) : (
            rows.map((row) => (
              <Box
                key={row.resource}
                display="flex"
                alignItems="center"
                gap={0.5}
                mb={0.25}
              >
                {renderRate(row)}
              </Box>
            ))
          )}
        </Box>
      }
    >
      <Box display="flex" gap={0.5} minWidth={0}>
        {rows.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            none
          </Typography>
        ) : rows.length === 1 ? (
          renderRate(rows[0])
        ) : (
          <>
            <MdInfo size={15} />
          </>
        )}
      </Box>
    </Tooltip>
  );
}

function toPlannerSlotInput(
  card: {
    set: string;
    rarity: SpotCardVM["rarity"];
    bcx: number;
    foil: number;
    element: SpotCardVM["element"];
    secondaryElement: SpotCardVM["secondaryElement"];
    bloodline?: string;
    landBoosts?: SlotInput["landBoosts"] | null;
  },
  id: number
): SlotInput {
  return {
    id,
    set: card.set as SlotInput["set"],
    rarity: card.rarity,
    bcx: card.bcx,
    foil: cardFoilOptions[card.foil] ?? "regular",
    element: card.element,
    secondaryElement: card.secondaryElement,
    bloodline: (card.bloodline ?? "Unknown") as SlotInput["bloodline"],
    landBoosts: card.landBoosts ?? undefined,
  };
}

interface Props {
  deed: DeedComplete;
  username: string;
  spsRatio: number;
  prices: Prices | null;
  actions: UseProductionPlotActions;
  /** Called after a successful Save so the page can reload. */
  onSaved: () => void;
}

export default function ConfigurePanel({
  deed,
  username,
  spsRatio,
  prices,
  actions,
  onSaved,
}: Props) {
  const [data, setData] = useState<PlotConfigureData | null>(null);
  const [staged, setStaged] = useState<StagedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regionDEC, setRegionDEC] = useState<RegionDECInfo | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Bumping reloadKey re-runs the loader; this flips the spinner back on
  // without calling setState synchronously inside the effect.
  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  // item/runi picker
  const [picker, setPicker] = useState<PickerKind | null>(null);
  // worker selection modal
  const [workerOpen, setWorkerOpen] = useState(false);

  // Projected production impact of the staged config vs the current on-chain
  // state (current and staged scored the same way so the delta is meaningful).
  const projection = useMemo(() => {
    if (!data || !staged || !prices) return null;
    const stagedWorkers = staged.workers.filter(Boolean) as SpotCardVM[];
    const current = projectPlot(
      deed,
      data.workers,
      prices,
      spsRatio,
      boostOverrides({ title: data.title, totem: data.totem, runi: data.runi })
    );
    const next = projectPlot(
      deed,
      stagedWorkers,
      prices,
      spsRatio,
      boostOverrides({
        title: staged.title,
        totem: staged.totem,
        runi: staged.runi,
      })
    );
    return { current, next };
  }, [deed, data, staged, prices, spsRatio]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [plotData, regionData] = await Promise.all([
          getPlotConfigureData(deed.deed_uid),
          getRegionStakedDEC().catch(() => null),
        ]);
        if (cancelled) return;
        setData(plotData);
        setStaged(initStagedConfig(plotData));
        setRegionDEC(
          regionData?.regions.find(
            (r) => r.region_number === deed.region_number
          ) ?? null
        );
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load plot");
          setRegionDEC(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deed.deed_uid, deed.region_number, reloadKey]);

  const handlePick = useCallback(
    (result: PickerResult) => {
      setStaged((prev) => {
        if (!prev || !picker) return prev;
        if (result.kind === "runi") return { ...prev, runi: result.runi };
        // item kinds map 1:1 to a spot
        if (picker === "powerCore") return { ...prev, powerCore: result.item };
        if (picker === "totem") return { ...prev, totem: result.item };
        if (picker === "title") return { ...prev, title: result.item };
        return prev;
      });
      setPicker(null);
    },
    [picker]
  );

  const handleWorkerConfirm = useCallback((picks: SpotCardVM[]) => {
    setStaged((prev) => {
      if (!prev) return prev;
      const workers = [...prev.workers];
      const empties = workers
        .map((w, i) => (w === null ? i : -1))
        .filter((i) => i >= 0);
      picks.forEach((p, k) => {
        if (k < empties.length) workers[empties[k]] = p;
      });
      return { ...prev, workers };
    });
    setWorkerOpen(false);
  }, []);

  const clearWorker = (idx: number) =>
    setStaged((prev) => {
      if (!prev) return prev;
      const workers = [...prev.workers];
      workers[idx] = null;
      return { ...prev, workers };
    });

  const handleSave = async () => {
    if (!data || !staged) return;
    const input = diffStagedConfig(data, staged);
    if (!stagedHasChanges(input)) return;

    if (shortfallWarningMessage) {
      if (!window.confirm(`${shortfallWarningMessage}\n\nSave anyway?`)) {
        return;
      }
    }

    const res = await actions.saveStakeChange(deed.deed_uid, input);
    if (res.success) {
      reload();
      onSaved();
    }
  };

  const originalStaged = useMemo(
    () => (data ? initStagedConfig(data) : null),
    [data]
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 1 }}>
        {error}
      </Alert>
    );
  }
  if (!data || !staged || !originalStaged) return null;

  // Worksites cap at MAX_WORKER_SLOTS workers. We intentionally do NOT use
  // `deed.stakingDetail.max_workers_allowed` here: it reports 0 while a plot is
  // unpowered, which would hide the slots. (This will need revisiting once
  // buildings ship, as those allow a different worker count.)
  const workerSlots = staged.workers.slice(0, MAX_WORKER_SLOTS);

  const emptyWorkerSlots = workerSlots.filter((w) => w === null).length;
  const excludeUids = [
    ...workerSlots.filter(Boolean).map((w) => (w as SpotCardVM).uid),
    ...(staged.runi ? [staged.runi.uid] : []),
  ];
  const changeInput = diffStagedConfig(data, staged);
  const dirty = stagedHasChanges(changeInput);
  const busy = actions.busy;

  const powerCoreChanged = !sameUid(staged.powerCore, originalStaged.powerCore);
  const runiChanged = !sameUid(staged.runi, originalStaged.runi);
  const totemChanged = !sameUid(staged.totem, originalStaged.totem);
  const titleChanged = !sameUid(staged.title, originalStaged.title);
  const workerChangedByIndex = workerSlots.map(
    (worker, idx) => !sameUid(worker, originalStaged.workers[idx])
  );

  const resetPowerCore = () =>
    setStaged((prev) =>
      prev ? { ...prev, powerCore: originalStaged.powerCore } : prev
    );
  const resetRuni = () =>
    setStaged((prev) => (prev ? { ...prev, runi: originalStaged.runi } : prev));
  const resetWorker = (idx: number) =>
    setStaged((prev) => {
      if (!prev) return prev;
      const workers = [...prev.workers];
      workers[idx] = originalStaged.workers[idx] ?? null;
      return { ...prev, workers };
    });
  const resetTotem = () =>
    setStaged((prev) =>
      prev ? { ...prev, totem: originalStaged.totem } : prev
    );
  const resetTitle = () =>
    setStaged((prev) =>
      prev ? { ...prev, title: originalStaged.title } : prev
    );

  // Projected deltas (staged − current). Consume is per-resource (GRAIN/IRON/…).
  const ppDelta = projection
    ? projection.next.boostedPP - projection.current.boostedPP
    : 0;
  const produceResource =
    projection?.next.produce[0]?.resource ??
    projection?.current.produce[0]?.resource ??
    "";
  const produceDelta = projection
    ? (projection.next.produce[0]?.amount ?? 0) -
      (projection.current.produce[0]?.amount ?? 0)
    : 0;
  const netDelta = projection
    ? projection.next.netDEC - projection.current.netDEC
    : 0;

  // Estimate plot DEC needed using the same planner formula as PriceOutput,
  // then anchor to the live current staking value for stable deltas.
  const currentStaking = deed.stakingDetail;
  const stagedWorkers = staged.workers.filter(Boolean) as SpotCardVM[];
  const currentSlotsForDec = data.workers.map((w, i) =>
    toPlannerSlotInput(w, i + 1)
  );
  const nextSlotsForDec = stagedWorkers.map((w, i) =>
    toPlannerSlotInput(w, i + 1)
  );

  const currentPlotPlannerData = deedToPlotPlannerData(
    deed,
    currentSlotsForDec,
    boostOverrides({ title: data.title, totem: data.totem, runi: data.runi })
  );
  const nextPlotPlannerData = deedToPlotPlannerData(
    deed,
    nextSlotsForDec,
    boostOverrides({
      title: staged.title,
      totem: staged.totem,
      runi: staged.runi,
    })
  );

  const currentDecProjection = calcStakedDecNeeded(
    currentSlotsForDec,
    Boolean(data.runi)
  );
  const nextDecProjection = calcStakedDecNeeded(
    nextSlotsForDec,
    Boolean(staged.runi)
  );
  const currentObservedDecNeeded = toFiniteNumber(
    currentStaking?.total_dec_stake_needed,
    0
  );
  const projectionScale =
    currentDecProjection.decNeeded > 0
      ? toFiniteNumber(
          currentObservedDecNeeded / currentDecProjection.decNeeded
        )
      : 1;

  const currentDecStakeNeeded = currentObservedDecNeeded;
  const nextDecStakeNeeded = toFiniteNumber(
    nextDecProjection.decNeeded * projectionScale,
    currentDecStakeNeeded
  );
  const decStakeNeededDelta = nextDecStakeNeeded - currentDecStakeNeeded;

  const calcPlannerTotalBoost = (
    cardInput: SlotInput[],
    plotRarity: keyof typeof plotRarityModifiers,
    plotStatus: typeof currentPlotPlannerData.plotStatus,
    worksiteType: typeof currentPlotPlannerData.worksiteType,
    title: keyof typeof titleModifiers,
    totem: keyof typeof totemModifiers,
    runi: keyof typeof runiModifiers
  ) => {
    const productionBoost = determineProductionBoost(
      resourceWorksiteMap[worksiteType],
      cardInput
    );
    const deedResourceBoost = determineDeedResourceBoost(
      plotStatus,
      worksiteType
    );
    const bloodlineBoost =
      determineBloodlineBoost(cardInput).totalBloodlineBoost;
    return (
      plotRarityModifiers[plotRarity] +
      titleModifiers[title] +
      totemModifiers[totem] +
      runiModifiers[runi] +
      deedResourceBoost +
      productionBoost +
      bloodlineBoost
    );
  };

  const currentTotalBoost = calcPlannerTotalBoost(
    currentPlotPlannerData.cardInput,
    currentPlotPlannerData.plotRarity,
    currentPlotPlannerData.plotStatus,
    currentPlotPlannerData.worksiteType,
    currentPlotPlannerData.title,
    currentPlotPlannerData.totem,
    currentPlotPlannerData.runi
  );
  const nextTotalBoost = calcPlannerTotalBoost(
    nextPlotPlannerData.cardInput,
    nextPlotPlannerData.plotRarity,
    nextPlotPlannerData.plotStatus,
    nextPlotPlannerData.worksiteType,
    nextPlotPlannerData.title,
    nextPlotPlannerData.totem,
    nextPlotPlannerData.runi
  );
  const boostDelta = nextTotalBoost - currentTotalBoost;

  const regionImpact =
    regionDEC && projection
      ? (() => {
          const currentRequired = toFiniteNumber(regionDEC.dec_stake_needed, 0);
          const inUse = toFiniteNumber(regionDEC.dec_stake_in_use, 0);
          const projectedRequired = currentRequired + decStakeNeededDelta;
          const currentShortfall = Math.max(0, currentRequired - inUse);
          const projectedShortfall = Math.max(0, projectedRequired - inUse);
          return {
            currentShortfall,
            projectedShortfall,
            shortfallIncrease: Math.max(
              0,
              projectedShortfall - currentShortfall
            ),
          };
        })()
      : null;

  const shortfallWarningMessage =
    dirty && regionImpact && regionImpact.projectedShortfall > 0
      ? regionImpact.shortfallIncrease > 0
        ? `Be aware: you will have a DEC shortage in region R${deed.region_number}. This will trigger an auto-harvest on that region. Projected shortfall: ${formatInt(
            regionImpact.projectedShortfall
          )} DEC (increase ${formatInt(regionImpact.shortfallIncrease)} DEC).`
        : `Be aware: you will have a DEC shortage in region R${deed.region_number}. This will trigger an auto-harvest on that region. Projected shortfall: ${formatInt(
            regionImpact.projectedShortfall
          )} DEC.`
      : null;

  const consumeDeltas: ResourceRate[] = projection
    ? (() => {
        const m = new Map<string, number>();
        for (const c of projection.current.consume)
          m.set(c.resource, (m.get(c.resource) ?? 0) - c.amount);
        for (const c of projection.next.consume)
          m.set(c.resource, (m.get(c.resource) ?? 0) + c.amount);
        return [...m.entries()]
          .filter(([, a]) => Math.round(a) !== 0)
          .map(([resource, amount]) => ({ resource, amount }));
      })()
    : [];

  return (
    <Box sx={{ py: 1.5, px: 1 }}>
      <Stack
        direction="row"
        gap={1.5}
        flexWrap="wrap"
        alignItems="flex-start"
        sx={{ mb: 1.5 }}
      >
        {/* Power Core */}
        <Stack spacing={0.35} alignItems="center">
          {staged.powerCore ? (
            <FilledItemSpot
              label="Power Core"
              item={staged.powerCore}
              disabled={busy}
              onClear={() => setStaged({ ...staged, powerCore: null })}
            />
          ) : (
            <EmptySpot
              label="Power Core"
              disabled={busy}
              onClick={() => setPicker("powerCore")}
            />
          )}
          {powerCoreChanged && (
            <Button
              size="small"
              variant="text"
              color="inherit"
              disabled={busy}
              onClick={resetPowerCore}
              sx={{
                minWidth: 0,
                px: 0.5,
                py: 0,
                fontSize: 11,
                textTransform: "none",
              }}
            >
              Reset
            </Button>
          )}
        </Stack>

        {/* Runi */}
        <Stack spacing={0.35} alignItems="center">
          {staged.runi ? (
            <FilledCardSpot
              label="Runi"
              card={staged.runi}
              disabled={busy}
              onClear={() => setStaged({ ...staged, runi: null })}
            />
          ) : (
            <EmptySpot
              label="Runi"
              disabled={busy}
              onClick={() => setPicker("runi")}
            />
          )}
          {runiChanged && (
            <Button
              size="small"
              variant="text"
              color="inherit"
              disabled={busy}
              onClick={resetRuni}
              sx={{
                minWidth: 0,
                px: 0.5,
                py: 0,
                fontSize: 11,
                textTransform: "none",
              }}
            >
              Reset
            </Button>
          )}
        </Stack>

        {/* Workers */}
        {workerSlots.map((w, i) => (
          <Stack key={`worker-${i}`} spacing={0.35} alignItems="center">
            {w ? (
              <FilledCardSpot
                label={`Worker ${i + 1}`}
                card={w}
                disabled={busy}
                onClear={() => clearWorker(i)}
              />
            ) : (
              <EmptySpot
                label={`Worker ${i + 1}`}
                disabled={busy}
                onClick={() => setWorkerOpen(true)}
              />
            )}
            {workerChangedByIndex[i] && (
              <Button
                size="small"
                variant="text"
                color="inherit"
                disabled={busy}
                onClick={() => resetWorker(i)}
                sx={{
                  minWidth: 0,
                  px: 0.5,
                  py: 0,
                  fontSize: 11,
                  textTransform: "none",
                }}
              >
                Reset
              </Button>
            )}
          </Stack>
        ))}

        {/* Totem */}
        <Stack spacing={0.35} alignItems="center">
          {staged.totem ? (
            <FilledItemSpot
              label="Totem"
              item={staged.totem}
              disabled={busy}
              onClear={() => setStaged({ ...staged, totem: null })}
            />
          ) : (
            <EmptySpot
              label="Totem"
              disabled={busy}
              onClick={() => setPicker("totem")}
            />
          )}
          {totemChanged && (
            <Button
              size="small"
              variant="text"
              color="inherit"
              disabled={busy}
              onClick={resetTotem}
              sx={{
                minWidth: 0,
                px: 0.5,
                py: 0,
                fontSize: 11,
                textTransform: "none",
              }}
            >
              Reset
            </Button>
          )}
        </Stack>

        {/* Title */}
        <Stack spacing={0.35} alignItems="center">
          {staged.title ? (
            <FilledItemSpot
              label="Title"
              item={staged.title}
              disabled={busy}
              onClear={() => setStaged({ ...staged, title: null })}
            />
          ) : (
            <EmptySpot
              label="Title"
              disabled={busy}
              onClick={() => setPicker("title")}
            />
          )}
          {titleChanged && (
            <Button
              size="small"
              variant="text"
              color="inherit"
              disabled={busy}
              onClick={resetTitle}
              sx={{
                minWidth: 0,
                px: 0.5,
                py: 0,
                fontSize: 11,
                textTransform: "none",
              }}
            >
              Reset
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" gap={1} alignItems="center">
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          disabled={!dirty || busy}
        >
          {busy ? "Saving…" : "Save"}
        </Button>
        <Button
          size="small"
          onClick={() => setStaged(initStagedConfig(data))}
          disabled={!dirty || busy}
        >
          Reset
        </Button>
        {dirty && (
          <Typography variant="caption" color="text.secondary">
            Unsaved changes
          </Typography>
        )}
      </Stack>

      {shortfallWarningMessage && (
        <Alert severity="warning" sx={{ mt: 0.75 }}>
          {shortfallWarningMessage}
        </Alert>
      )}

      {projection && (
        <Paper variant="outlined" sx={{ mt: 0.75, p: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Configure summary
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "auto minmax(0, 1fr)",
                md: "auto repeat(6, minmax(0, 1fr))",
              },
              columnGap: 1.5,
              rowGap: 0.75,
              alignItems: "center",
            }}
          >
            {/* Current row */}
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              minWidth="50px"
            >
              Current:
            </Typography>

            <Typography variant="caption" color="text.secondary">
              PP: {formatInt(projection.current.boostedPP)}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              DEC needed: {formatInt(currentDecStakeNeeded)}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Total boost: {fmtPct(currentTotalBoost * 100)}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              Rewards/hr:
              {renderResourceIcon(produceResource as Resource)}
              {formatFixed(projection.current.produce[0]?.amount ?? 0, 3)}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Net: {formatFixed(projection.current.netDEC, 3)} DEC
            </Typography>

            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="caption" color="text.secondary">
                Consume/hr:
              </Typography>
              {renderConsume(projection.current.consume)}
            </Box>

            {/* New row with transition */}
            <Collapse
              in={dirty}
              timeout={IMPACT_ROW_TRANSITION_MS}
              sx={{
                gridColumn: "1 / -1",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "auto minmax(0, 1fr)",
                    md: "auto repeat(6, minmax(0, 1fr))",
                  },
                  columnGap: 1.5,
                  alignItems: "top",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  minWidth="50px"
                >
                  New:
                </Typography>

                <Stack direction="column">
                  <Typography variant="caption" color="text.secondary">
                    PP: {formatInt(projection.next.boostedPP)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (
                    <Box component="span" sx={{ color: deltaColor(ppDelta) }}>
                      {fmtDelta(ppDelta)}
                    </Box>
                    )
                  </Typography>
                </Stack>

                <Stack direction="column">
                  <Typography variant="caption" color="text.secondary">
                    DEC needed: {formatInt(nextDecStakeNeeded)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (
                    <Box
                      component="span"
                      sx={{ color: deltaColor(decStakeNeededDelta, false) }}
                    >
                      {fmtDelta(Math.round(decStakeNeededDelta))}
                    </Box>
                    )
                  </Typography>
                </Stack>

                <Stack direction="column">
                  <Typography variant="caption" color="text.secondary">
                    Total boost: {fmtPct(nextTotalBoost * 100)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (
                    <Box
                      component="span"
                      sx={{ color: deltaColor(boostDelta) }}
                    >
                      {fmtDelta(Math.round(boostDelta * 100))}%
                    </Box>
                    )
                  </Typography>
                </Stack>

                <Stack direction="column">
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    Rewards/hr:{" "}
                    {renderResourceIcon(produceResource as Resource)}
                    {formatFixed(projection.next.produce[0]?.amount ?? 0, 3)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (
                    <Box
                      component="span"
                      sx={{ color: deltaColor(produceDelta) }}
                    >
                      {fmtDelta(produceDelta)}
                    </Box>
                    )
                  </Typography>
                </Stack>

                <Stack direction="column">
                  <Typography variant="caption" color="text.secondary">
                    Net: {formatFixed(projection.next.netDEC, 3)} DEC
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (
                    <Box component="span" sx={{ color: deltaColor(netDelta) }}>
                      {fmtDelta(netDelta)}
                    </Box>
                    )
                  </Typography>
                </Stack>

                <Box display="flex" gap={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Consume/hr:
                  </Typography>
                  {renderConsume(projection.next.consume, consumeDeltas)}
                </Box>
              </Box>
            </Collapse>
          </Box>{" "}
        </Paper>
      )}

      {picker && (
        <AssetPickerDialog
          key={picker}
          open
          kind={picker}
          deedUid={deed.deed_uid}
          onClose={() => setPicker(null)}
          onPick={handlePick}
        />
      )}

      {workerOpen && (
        <WorkerSelectDialog
          open
          deed={deed}
          username={username}
          emptySlots={emptyWorkerSlots}
          excludeUids={excludeUids}
          onClose={() => setWorkerOpen(false)}
          onConfirm={handleWorkerConfirm}
        />
      )}
    </Box>
  );
}
