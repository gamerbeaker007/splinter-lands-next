"use client";

import { UseProductionPlotActions } from "@/hooks/useProductionPlotActions";
import {
  getRegionStakedDEC,
  RegionDECInfo,
} from "@/lib/backend/actions/land-manager/dec-power-actions";
import {
  getPlotConfigureData,
  PlotConfigureData,
} from "@/lib/backend/actions/land-manager/production-actions";
import { getActualResourcePrices } from "@/lib/backend/actions/resources/prices-actions";
import { calcStakedDecNeeded } from "@/lib/frontend/utils/plannerCalcs";
import { DeedComplete } from "@/types/deed";
import { cardFoilOptions, runiModifiers, SlotInput } from "@/types/planner";
import { Prices } from "@/types/price";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const s = Math.abs(n).toLocaleString("en-US");
  return n > 0 ? `+${s}` : n < 0 ? `-${s}` : "0";
}

function deltaColor(n: number, higherIsBetter = true): string {
  if (n === 0) return "text.secondary";
  const good = higherIsBetter ? n > 0 : n < 0;
  return good ? "success.main" : "error.main";
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function fmtPct(n: number): string {
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function fmtPctDelta(n: number): string {
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return n > 0 ? `+${abs}%` : n < 0 ? `-${abs}%` : "0.0%";
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
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
  actions: UseProductionPlotActions;
  /** Called after a successful Save so the page can reload. */
  onSaved: () => void;
}

export default function ConfigurePanel({
  deed,
  username,
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
  // resource prices for the production-impact line (cached server-side)
  const [prices, setPrices] = useState<Prices | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActualResourcePrices()
      .then((p) => {
        if (!cancelled) setPrices(p);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Projected production impact of the staged config vs the current on-chain
  // state (current and staged scored the same way so the delta is meaningful).
  const projection = useMemo(() => {
    if (!data || !staged || !prices) return null;
    const stagedWorkers = staged.workers.filter(Boolean) as SpotCardVM[];
    const current = projectPlot(
      deed,
      data.workers,
      prices,
      boostOverrides({ title: data.title, totem: data.totem, runi: data.runi })
    );
    const next = projectPlot(
      deed,
      stagedWorkers,
      prices,
      boostOverrides({
        title: staged.title,
        totem: staged.totem,
        runi: staged.runi,
      })
    );
    return { current, next };
  }, [deed, data, staged, prices]);

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
  if (!data || !staged) return null;

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

  // Plot total boost should follow staking boost components (total_boost)
  // rather than PP ratio. Keep non-item/runi boosts as baseline and swap in
  // staged title/totem/runi boosts for projection.
  const currentRuniBoost = data.runi
    ? runiModifiers[data.runi.foil > 0 ? "gold" : "regular"]
    : toFiniteNumber(currentStaking?.runi_boost, 0);
  const currentTitleBoost = toFiniteNumber(
    data.title?.boost ?? currentStaking?.title_boost,
    0
  );
  const currentTotemBoost = toFiniteNumber(
    data.totem?.boost ?? currentStaking?.totem_boost,
    0
  );
  const currentTotalBoostFromApi = toFiniteNumber(
    currentStaking?.total_boost,
    Number.NaN
  );
  const currentTotalBoostFromParts =
    toFiniteNumber(currentStaking?.deed_rarity_boost, 0) +
    toFiniteNumber(currentStaking?.card_abilities_boost, 0) +
    toFiniteNumber(currentStaking?.card_bloodlines_boost, 0) +
    toFiniteNumber(currentStaking?.deed_status_token_boost, 0) +
    currentRuniBoost +
    currentTitleBoost +
    currentTotemBoost;
  const currentTotalBoost = Number.isFinite(currentTotalBoostFromApi)
    ? currentTotalBoostFromApi
    : currentTotalBoostFromParts;

  const staticBoostBase = Math.max(
    0,
    currentTotalBoost - currentRuniBoost - currentTitleBoost - currentTotemBoost
  );
  const stagedRuniBoost = staged.runi
    ? runiModifiers[staged.runi.foil > 0 ? "gold" : "regular"]
    : 0;
  const stagedTitleBoost = toFiniteNumber(staged.title?.boost, 0);
  const stagedTotemBoost = toFiniteNumber(staged.totem?.boost, 0);
  const nextTotalBoost = toFiniteNumber(
    staticBoostBase + stagedRuniBoost + stagedTitleBoost + stagedTotemBoost,
    currentTotalBoost
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
        ? `Be aware: you will have a DEC shortage in region R${deed.region_number}. This will trigger an auto-harvest on that region. Projected shortfall: ${fmtInt(
            regionImpact.projectedShortfall
          )} DEC (increase ${fmtInt(regionImpact.shortfallIncrease)} DEC).`
        : `Be aware: you will have a DEC shortage in region R${deed.region_number}. This will trigger an auto-harvest on that region. Projected shortfall: ${fmtInt(
            regionImpact.projectedShortfall
          )} DEC.`
      : null;

  const consumeDeltas: { resource: string; amount: number }[] = projection
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

        {/* Runi */}
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

        {/* Workers */}
        {workerSlots.map((w, i) =>
          w ? (
            <FilledCardSpot
              key={`worker-${i}`}
              label={`Worker ${i + 1}`}
              card={w}
              disabled={busy}
              onClear={() => clearWorker(i)}
            />
          ) : (
            <EmptySpot
              key={`worker-${i}`}
              label={`Worker ${i + 1}`}
              disabled={busy}
              onClick={() => setWorkerOpen(true)}
            />
          )
        )}

        {/* Totem */}
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

        {/* Title */}
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

      {/* Projected impact of the staged change */}
      {dirty && projection && (
        <Stack
          direction="row"
          gap={1.5}
          flexWrap="wrap"
          alignItems="center"
          sx={{ mt: 0.75 }}
        >
          <Typography variant="caption">Projected change:</Typography>
          <Typography variant="caption">
            PP:{" "}
            <Typography variant={"caption"} color={deltaColor(ppDelta)}>
              {fmtDelta(ppDelta)}
            </Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            DEC needed: {fmtInt(currentDecStakeNeeded)} {"->"}{" "}
            {fmtInt(nextDecStakeNeeded)} (
            <Box
              component="span"
              sx={{ color: deltaColor(decStakeNeededDelta, false) }}
            >
              {fmtDelta(Math.round(decStakeNeededDelta))}
            </Box>
            )
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total boost: {fmtPct(currentTotalBoost * 100)} {"->"}{" "}
            {fmtPct(nextTotalBoost * 100)} (
            <Box component="span" sx={{ color: deltaColor(boostDelta * 100) }}>
              {fmtPctDelta(boostDelta * 100)}
            </Box>
            )
          </Typography>
          <Typography variant="caption" color={"text.secondary"}>
            Rewards/hr:{" "}
            <Typography variant={"caption"} color={deltaColor(produceDelta)}>
              {fmtDelta(produceDelta)} {produceResource}
            </Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Consume/hr:{" "}
            {consumeDeltas.length === 0
              ? "no change"
              : consumeDeltas.map((c, i) => (
                  <Box
                    key={c.resource}
                    component="span"
                    sx={{ color: deltaColor(c.amount, false) }}
                  >
                    {i > 0 ? ", " : ""}
                    {fmtDelta(c.amount)} {c.resource}
                  </Box>
                ))}
          </Typography>
          <Typography variant="caption">
            Net{" "}
            <Typography variant={"caption"} color={deltaColor(netDelta)}>
              {fmtDelta(netDelta)} DEC
            </Typography>
          </Typography>
        </Stack>
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
