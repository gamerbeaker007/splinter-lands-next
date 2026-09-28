// Type-only: these modules reach server actions (and through them Prisma), so a
// value import would drag the whole server chain into the browser bundle.
import type { PoolBufferRow } from "@/hooks/usePoolBufferAlerts";
import type { WorksiteAlertsData } from "@/hooks/useWorksiteAlerts";
import type { RegionDECInfo } from "@/lib/backend/actions/land-manager/dec-power-actions";
import type { CardAlerts } from "@/types/cardAlerts";
import type { DeedAlertsInfo } from "@/types/deedAlertsInfo";
import type { WorkerEligibilityResult } from "@/types/landManager";

/**
 * Alert severity, mapped onto the MUI Alert severities:
 * - `error` (high): production or PP is being lost right now.
 * - `warning` (medium): something is sub-optimal or waiting on the player.
 * - `info` (low): an optimisation opportunity, nothing is lost.
 */
export type AlertSeverity = "error" | "warning" | "info";

export const ALERT_SEVERITIES: AlertSeverity[] = ["error", "warning", "info"];

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  error: "High",
  warning: "Medium",
  info: "Low",
};

export type LandManagerAlertKey =
  // Land Manager checks
  | "decShortfall"
  | "grainDeficit"
  | "feedWorkers"
  | "lowPoolBuffer"
  | "decImbalance"
  | "decOverStaked"
  | "emptyWorkerSlots"
  | "undeveloped"
  // Player dashboard checks
  | "noPower"
  | "finishedFull"
  | "noWorkers"
  | "missingWorkers"
  | "negativeDecNatural"
  | "negativeDecOther"
  | "negativeTerrainBoost"
  | "doublePower"
  | "missingBloodline"
  | "tooMuchBasePP"
  | "rationingLite"
  | "zeroBoostNonNeutral"
  | "zeroBoostNeutral"
  | "unusedPowerCore";

export interface LandManagerAlert {
  key: LandManagerAlertKey;
  severity: AlertSeverity;
  title: string;
  /** Number of affected items (plots, cards, resources…). */
  count: number;
}

export interface LandManagerAlertsInput {
  /** Pool reserves versus weekly external need, one row per resource. */
  poolBufferRows: PoolBufferRow[];
  eligibility: WorkerEligibilityResult | null;
  /** Per-region DEC rows for all of the player's regions. */
  stakedDEC: RegionDECInfo[];
  totalStaked: number;
  totalRequired: number;
  globalShortfall: number;
  globalExcess: number;
  /** Worksite states blocked on the player — see `useWorksiteAlerts`. */
  worksiteAlerts: WorksiteAlertsData;
  /** Player dashboard card/deed checks; null while loading or on error. */
  cardAlerts: CardAlerts | null;
  /** Player dashboard "Finished building / Full store"; null while loading. */
  deedAlerts: DeedAlertsInfo[] | null;
}

export interface RegionDecGap {
  region: RegionDECInfo;
  /** DEC short (negative side) or over (positive side) for this region. */
  gap: number;
}

export interface DecStatus {
  shortfall: number;
  excess: number;
  regionsWithShortfall: RegionDecGap[];
  regionsOverStaked: RegionDecGap[];
  regionalShortfallTotal: number;
  regionalOverTotal: number;
  hasRegionalImbalance: boolean;
}

/**
 * Whether enough DEC is staked is decided from the GLOBAL pool, not the sum of
 * per-region gaps: while a building is in progress a region's staked DEC can
 * read 0 even though that DEC is still staked overall. Per-region rows are only
 * guidance, and a regional imbalance only counts while the global pool is even.
 */
export function deriveDecStatus(
  stakedDEC: RegionDECInfo[],
  globalShortfall: number,
  globalExcess: number
): DecStatus {
  const shortfall = Math.ceil(globalShortfall);
  const excess = Math.floor(globalExcess);
  const regionsWithShortfall = stakedDEC
    .map((region) => ({
      region,
      gap: Math.max(0, region.dec_stake_needed - region.dec_stake_in_use),
    }))
    .filter((x) => x.gap > 0);
  const regionsOverStaked = stakedDEC
    .map((region) => ({
      region,
      gap: Math.max(0, region.dec_stake_in_use - region.dec_stake_needed),
    }))
    .filter((x) => x.gap > 0);

  return {
    shortfall,
    excess,
    regionsWithShortfall,
    regionsOverStaked,
    regionalShortfallTotal: Math.ceil(
      regionsWithShortfall.reduce((sum, x) => sum + x.gap, 0)
    ),
    regionalOverTotal: Math.floor(
      regionsOverStaked.reduce((sum, x) => sum + x.gap, 0)
    ),
    hasRegionalImbalance:
      shortfall === 0 &&
      excess === 0 &&
      regionsWithShortfall.length > 0 &&
      regionsOverStaked.length > 0,
  };
}

/**
 * Every alert currently present, most severe first. Pure — the same list feeds
 * the Alerts tab counts and the Alerts page, so they cannot disagree.
 *
 * Unpowered plots are reported once, through the player dashboard's "No power"
 * check (which comes with a per-deed view), rather than again from the worker
 * eligibility data.
 */
export function buildLandManagerAlerts(
  input: LandManagerAlertsInput
): LandManagerAlert[] {
  const dec = deriveDecStatus(
    input.stakedDEC,
    input.globalShortfall,
    input.globalExcess
  );
  const { feedable, shortOnGrain } = input.worksiteAlerts.feedPlan;
  const emptySlots = (input.eligibility?.eligible ?? []).reduce(
    (sum, p) => sum + p.empty_slots,
    0
  );
  const card = input.cardAlerts;

  const candidates: LandManagerAlert[] = [
    // ── High ────────────────────────────────────────────────────────────────
    {
      key: "decShortfall",
      severity: "error",
      title: "DEC stake shortfall",
      count: dec.shortfall > 0 ? 1 : 0,
    },
    {
      key: "grainDeficit",
      severity: "error",
      title: "Finished worksites short on grain",
      count: shortOnGrain.length,
    },
    {
      key: "noPower",
      severity: "error",
      title: "Plots without power",
      count: card?.noPowerSource.length ?? 0,
    },
    // ── Medium ──────────────────────────────────────────────────────────────
    {
      key: "feedWorkers",
      severity: "error",
      title: "Worksites waiting to be fed",
      count: feedable.length,
    },
    {
      key: "finishedFull",
      severity: "error",
      title: "Finished building / full store",
      count: input.deedAlerts?.length ?? 0,
    },
    {
      key: "lowPoolBuffer",
      severity: "warning",
      title: "Pool reserves below buffer",
      count: input.poolBufferRows.filter((r) => r.belowBuffer).length,
    },
    {
      key: "decImbalance",
      severity: "warning",
      title: "Regional DEC imbalance",
      count: dec.hasRegionalImbalance ? 1 : 0,
    },
    {
      key: "noWorkers",
      severity: "warning",
      title: "Plots without workers",
      count: card?.noWorkersAlerts.length ?? 0,
    },
    {
      key: "missingWorkers",
      severity: "warning",
      title: "Plots with missing workers",
      count: card?.assignedWorkersAlerts.length ?? 0,
    },
    {
      key: "negativeDecNatural",
      severity: "warning",
      title: "Negative DEC production (natural resource)",
      count: card?.negativeDECNaturalResourceDeeds.length ?? 0,
    },
    {
      key: "negativeDecOther",
      severity: "warning",
      title: "Negative DEC production (other resource)",
      count: card?.negativeDECOtherResourceDeeds.length ?? 0,
    },
    {
      key: "negativeTerrainBoost",
      severity: "warning",
      title: "Cards on terrain with a negative boost",
      count: card?.terrainBoostAlerts.negative.length ?? 0,
    },
    {
      key: "doublePower",
      severity: "warning",
      title: "Power core on an energized plot",
      count: card?.powerCoreWhileEnergized.length ?? 0,
    },
    {
      key: "missingBloodline",
      severity: "warning",
      title: "Missing bloodline boost",
      count: card?.missingBloodLineBoost.length ?? 0,
    },
    {
      key: "tooMuchBasePP",
      severity: "warning",
      title: "Base PP above the 100K cap",
      count: card?.tooMuchBasePP.length ?? 0,
    },
    {
      key: "rationingLite",
      severity: "warning",
      title: "Rationing Lite on plots above 20K base PP",
      count: card?.rationingLiteAlerts.length ?? 0,
    },
    // ── Low ─────────────────────────────────────────────────────────────────
    {
      key: "decOverStaked",
      severity: "info",
      title: "DEC over-staked",
      count: dec.excess > 0 ? 1 : 0,
    },
    {
      key: "emptyWorkerSlots",
      severity: "info",
      title: "Powered plots with empty worker slots",
      count: emptySlots,
    },
    {
      key: "undeveloped",
      severity: "info",
      title: "Plots without a worksite",
      count: input.worksiteAlerts.undeveloped.length,
    },
    {
      key: "zeroBoostNonNeutral",
      severity: "info",
      title: "Zero terrain boost (not neutral)",
      count: card?.terrainBoostAlerts.zeroNonNeutral.length ?? 0,
    },
    {
      key: "unusedPowerCore",
      severity: "info",
      title: "Unused power cores",
      count: Math.max(0, card?.unusedPowerSource ?? 0),
    },
    {
      key: "zeroBoostNeutral",
      severity: "info",
      title: "Zero terrain boost (neutral)",
      count: card?.terrainBoostAlerts.zeroNeutral.length ?? 0,
    },
  ];

  return candidates.filter((a) => a.count > 0);
}

/** Number of alerts present per severity. */
export function countAlertsBySeverity(
  alerts: LandManagerAlert[]
): Record<AlertSeverity, number> {
  const counts: Record<AlertSeverity, number> = {
    error: 0,
    warning: 0,
    info: 0,
  };
  for (const a of alerts) counts[a.severity] += 1;
  return counts;
}
