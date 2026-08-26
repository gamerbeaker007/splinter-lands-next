import { formatInt } from "@/lib/formatters";
import { DeedComplete } from "@/types/deed";
import {
  allowedTerrainsByWorksite,
  worksiteConstructionOpName,
  WorksiteType,
} from "@/types/planner";

/**
 * Single source of truth for "what can I do with this worksite right now".
 *
 * Both the per-plot card and the bulk action bar read from here, so the button
 * counts, the enabled/disabled states, the planning step and the ops that are
 * finally broadcast can never disagree.
 *
 * Two kinds of restriction are deliberately kept apart:
 *  • **static** — decided by the plot itself (deed type / mythic kingdom plot).
 *    An option that is statically impossible may be hidden entirely.
 *  • **dynamic** — decided by the current data/state (construction running,
 *    region grain too low, …). These stay visible but disabled, with a reason.
 */

/** Worksite types selectable from the picker (excludes KEEP/CASTLE which are mythic). */
const SELECTABLE_WORKSITES: WorksiteType[] = [
  "Grain Farm",
  "Logging Camp",
  "Ore Mine",
  "Quarry",
  "Research Hut",
  "Aura Lab",
  "Shard Mine",
];

/** Reverse map: op name → WorksiteType, e.g. "worksite_wood_construction" → "Logging Camp" */
const projectTypeToWorksite: Record<string, WorksiteType> = Object.fromEntries(
  Object.entries(worksiteConstructionOpName).map(([ws, op]) => [
    op,
    ws as WorksiteType,
  ])
);

export interface Eligibility {
  eligible: boolean;
  /** Why the action cannot be used — surfaced in the tooltip of a disabled button. */
  reason?: string;
}

const OK: Eligibility = { eligible: true };

export interface WorksitePlotState {
  /** No worksite at all yet. */
  isUndeveloped: boolean;
  /** A construction project exists (building OR finished-but-unfed). */
  isConstruction: boolean;
  /** Construction running and its projected_end is still in the future. */
  isActivelyBuilding: boolean;
  /** Construction whose projected_end has passed — waiting to be fed. */
  constructionFinished: boolean;
  /** Kingdom (KEEP/CASTLE) plot — fixed worksite, no swap possible. */
  isMythic: boolean;
  currentWorksite: WorksiteType | null;
  /** Target of the running construction, or the current worksite when idle. */
  buildingWorksite: WorksiteType | null;
  /** Finished construction waiting for the update_worksite (feed) op. */
  isReadyToFeed: boolean;
  /** Grain the region must hold to feed this worksite (rounded up). */
  grainCost: number;
  projectId: number | null;
}

/**
 * Derives every state flag the worksite actions depend on.
 *
 * `nowMs` is passed in (rather than read from the clock) so renders stay pure
 * and so counting/planning/execution all judge against the same instant.
 */
export function getWorksitePlotState(
  deed: DeedComplete,
  nowMs: number
): WorksitePlotState {
  const wd = deed.worksiteDetail;
  const isUndeveloped = !wd;

  // SPL keeps `is_construction === true` even AFTER the build completes — it only
  // flips to false once the workers have been fed (update_worksite). So a project
  // is "still building" only while its projected_end is in the future; once that
  // moment passes the construction is finished and the plot is waiting to be fed.
  const constructionEndMs = wd?.projected_end
    ? new Date(wd.projected_end).getTime()
    : null;
  const constructionFinished =
    wd?.is_construction === true &&
    constructionEndMs != null &&
    constructionEndMs <= nowMs;

  const isConstruction = wd?.is_construction === true;
  const isActivelyBuilding = isConstruction && !constructionFinished;
  const isMythic = deed.plot_status === "kingdom";

  const currentWorksite =
    (wd?.worksite_type as WorksiteType | null | undefined) ?? null;
  // While a construction project exists (building OR finished-but-unfed),
  // worksiteDetail.worksite_type is empty — derive the target from project_type.
  const buildingWorksite: WorksiteType | null = isConstruction
    ? (projectTypeToWorksite[wd?.project_type ?? ""] ?? null)
    : currentWorksite;

  // A worksite that finished construction must be activated by feeding its
  // workers grain (the update_worksite op). Two ways a plot reaches this state:
  //   • is_construction still true but projected_end has passed
  //   • worksite_type surfaces as "Worksite Ready X"
  // In both cases it needs a project_id and a grain requirement to feed.
  const isReadyToFeed =
    !!wd &&
    (constructionFinished ||
      (wd.worksite_type ?? "").toLowerCase().startsWith("worksite ready")) &&
    wd.project_id != null &&
    (wd.grain_required ?? 0) > 0;

  return {
    isUndeveloped,
    isConstruction,
    isActivelyBuilding,
    constructionFinished,
    isMythic,
    currentWorksite,
    buildingWorksite,
    isReadyToFeed,
    grainCost: Math.ceil(wd?.grain_required ?? 0),
    projectId: wd?.project_id ?? null,
  };
}

export function plotLabelOf(deed: DeedComplete): string {
  return `P-${deed.region_number}-${deed.tract_number}-${deed.plot_number}`;
}

// ── Static (plot-type) compatibility ─────────────────────────────────────────

/**
 * Static compatibility only: can this worksite type ever exist on this plot?
 * Decided purely by the deed's terrain (and the mythic kingdom exception).
 * Options failing this check may be hidden from the UI entirely.
 */
function isWorksiteStaticallyAllowed(
  deed: DeedComplete,
  worksite: WorksiteType
): boolean {
  if (deed.plot_status === "kingdom") return false;
  const allowed = allowedTerrainsByWorksite[worksite];
  if (!allowed) return true;
  if (!deed.deed_type) return true;
  return allowed.includes(deed.deed_type.toLowerCase() as (typeof allowed)[0]);
}

/** The worksite options worth rendering for this plot (static filter only). */
export function staticallyAllowedWorksites(deed: DeedComplete): WorksiteType[] {
  return SELECTABLE_WORKSITES.filter((ws) =>
    isWorksiteStaticallyAllowed(deed, ws)
  );
}

// ── Dynamic eligibility ──────────────────────────────────────────────────────

/** Shared pre-checks for the two grain actions (feed / fix deficit). */
function readyToFeedCheck(state: WorksitePlotState): Eligibility | null {
  if (state.isMythic)
    return { eligible: false, reason: "Mythic deed — it has no worksite." };
  if (state.isUndeveloped)
    return {
      eligible: false,
      reason: "Undeveloped plot — build a worksite first.",
    };
  if (state.isActivelyBuilding)
    return {
      eligible: false,
      reason: "Construction is still in progress — no workers to feed yet.",
    };
  if (!state.isReadyToFeed)
    return {
      eligible: false,
      reason: "This worksite has no workers waiting to be fed.",
    };
  return null;
}

/**
 * Can the workers on this plot be fed right now?
 * `regionGrainAvailable` is the grain still unclaimed in the plot's region — in
 * bulk flows that is the *remaining* budget after earlier plots took their share.
 */
export function canFeedWorkers(
  deed: DeedComplete,
  regionGrainAvailable: number,
  nowMs: number,
  state: WorksitePlotState = getWorksitePlotState(deed, nowMs)
): Eligibility {
  const pre = readyToFeedCheck(state);
  if (pre) return pre;
  if (regionGrainAvailable < state.grainCost)
    return {
      eligible: false,
      reason: `Not enough grain in region (have ${formatInt(regionGrainAvailable)} / need ${formatInt(state.grainCost)}) — use Fix grain deficit first.`,
    };
  return OK;
}

/** Can the grain deficit for this plot be fixed (i.e. is there a deficit at all)? */
export function canFixGrainDeficit(
  deed: DeedComplete,
  regionGrainAvailable: number,
  nowMs: number,
  state: WorksitePlotState = getWorksitePlotState(deed, nowMs)
): Eligibility {
  const pre = readyToFeedCheck(state);
  if (pre) return pre;
  if (regionGrainAvailable >= state.grainCost)
    return {
      eligible: false,
      reason: "The region already holds enough grain — use Feed workers.",
    };
  return OK;
}

/** Can the running construction on this plot be cancelled? */
export function canCancelConstruction(
  deed: DeedComplete,
  nowMs: number,
  state: WorksitePlotState = getWorksitePlotState(deed, nowMs)
): Eligibility {
  if (!state.isActivelyBuilding)
    return {
      eligible: false,
      reason: "No construction is running on this plot.",
    };
  if (state.projectId == null)
    return {
      eligible: false,
      reason: "No construction project id available for this plot.",
    };
  return OK;
}

/**
 * Can this plot be switched to `worksite` right now?
 * Assumes static compatibility was already checked (statically impossible
 * options are hidden rather than disabled).
 */
export function canChangeWorksite(
  deed: DeedComplete,
  worksite: WorksiteType,
  nowMs: number,
  state: WorksitePlotState = getWorksitePlotState(deed, nowMs)
): Eligibility {
  if (!isWorksiteStaticallyAllowed(deed, worksite))
    return {
      eligible: false,
      reason: `A ${worksite} cannot be built on ${deed.deed_type ?? "this plot type"}.`,
    };
  if (state.isConstruction)
    return {
      eligible: false,
      reason: state.isActivelyBuilding
        ? "A construction project is running — cancel it first."
        : "Construction finished — feed the workers before switching.",
    };
  if (state.currentWorksite === worksite)
    return {
      eligible: false,
      reason: `${worksite} is already built on this plot.`,
    };
  if (!worksiteConstructionOpName[worksite])
    return {
      eligible: false,
      reason: `${worksite} cannot be constructed.`,
    };
  return OK;
}

// ── Bulk helpers ─────────────────────────────────────────────────────────────

export interface CancelCandidate {
  deed: DeedComplete;
  plotLabel: string;
  regionUid: string;
  deedUid: string;
  projectId: number;
  /** Worksite the cancelled project was building — shown in the confirm dialog. */
  targetWorksite: WorksiteType | null;
}

/**
 * The selected plots whose running construction can be cancelled.
 *
 * Only *actively* building projects qualify — a project past its projected_end
 * is finished and must be fed, not cancelled (`canCancelConstruction`).
 */
export function planBulkCancelConstruction(
  deeds: DeedComplete[],
  nowMs: number
): CancelCandidate[] {
  const candidates: CancelCandidate[] = [];
  for (const deed of deeds) {
    const state = getWorksitePlotState(deed, nowMs);
    if (!canCancelConstruction(deed, nowMs, state).eligible) continue;
    if (state.projectId == null) continue;
    candidates.push({
      deed,
      plotLabel: plotLabelOf(deed),
      regionUid: deed.region_uid,
      deedUid: deed.deed_uid,
      projectId: state.projectId,
      targetWorksite: state.buildingWorksite,
    });
  }
  return candidates;
}

export interface FeedCandidate {
  deed: DeedComplete;
  plotLabel: string;
  regionUid: string;
  regionName?: string | null;
  grainCost: number;
  projectId: number;
}

export interface BulkFeedPlan {
  /** Plots that can be fed straight away from the grain their region holds. */
  feedable: FeedCandidate[];
  /** Ready plots whose region runs out of grain — candidates for Fix grain deficit. */
  shortOnGrain: FeedCandidate[];
  /** Grain the feedable set consumes, per region_uid. */
  grainSpentByRegion: Record<string, number>;
  /** Extra grain each region still needs to feed *all* of its ready plots. */
  grainNeededByRegion: Record<string, number>;
}

/**
 * Allocates each region's grain over its ready-to-feed plots.
 *
 * Several ready plots in one region draw from the same pot, so eligibility can
 * only be judged per region rather than per plot. Cheapest plots go first, which
 * maximises how many worksites a given amount of grain activates.
 */
export function planBulkFeed(
  deeds: DeedComplete[],
  regionGrain: Record<string, number>,
  nowMs: number
): BulkFeedPlan {
  const byRegion = new Map<string, FeedCandidate[]>();

  for (const deed of deeds) {
    const state = getWorksitePlotState(deed, nowMs);
    if (readyToFeedCheck(state)) continue;
    if (state.projectId == null) continue;
    const candidate: FeedCandidate = {
      deed,
      plotLabel: plotLabelOf(deed),
      regionUid: deed.region_uid,
      regionName: deed.region_name,
      grainCost: state.grainCost,
      projectId: state.projectId,
    };
    const list = byRegion.get(deed.region_uid);
    if (list) list.push(candidate);
    else byRegion.set(deed.region_uid, [candidate]);
  }

  const feedable: FeedCandidate[] = [];
  const shortOnGrain: FeedCandidate[] = [];
  const grainSpentByRegion: Record<string, number> = {};
  const grainNeededByRegion: Record<string, number> = {};

  for (const [regionUid, candidates] of byRegion) {
    let budget = regionGrain[regionUid] ?? 0;
    const totalCost = candidates.reduce((sum, c) => sum + c.grainCost, 0);
    const deficit = Math.max(0, totalCost - budget);
    if (deficit > 0) grainNeededByRegion[regionUid] = totalCost;

    // Cheapest first — activates the most worksites for the grain on hand.
    const ordered = [...candidates].sort((a, b) => a.grainCost - b.grainCost);
    for (const candidate of ordered) {
      if (budget >= candidate.grainCost) {
        budget -= candidate.grainCost;
        grainSpentByRegion[regionUid] =
          (grainSpentByRegion[regionUid] ?? 0) + candidate.grainCost;
        feedable.push(candidate);
      } else {
        shortOnGrain.push(candidate);
      }
    }
  }

  return { feedable, shortOnGrain, grainSpentByRegion, grainNeededByRegion };
}

export interface ChangeWorksiteCandidate {
  deed: DeedComplete;
  plotLabel: string;
  regionUid: string;
  deedUid: string;
  currentWorksite: WorksiteType | null;
}

export interface BulkChangeWorksiteOption {
  worksite: WorksiteType;
  /** Plots in the selection that can be switched to this worksite right now. */
  candidates: ChangeWorksiteCandidate[];
  /** Plots whose deed type allows this worksite at all (static compatibility). */
  compatibleCount: number;
  /** Why the option is unusable for the whole selection (null when usable). */
  blockedReason: string | null;
}

/**
 * Per target worksite: how many of the selected plots can actually be switched.
 *
 * Static incompatibility (wrong terrain / mythic) never counts, dynamic blockers
 * (construction running, already built) are reported as the disabled reason.
 */
export function planBulkChangeWorksite(
  deeds: DeedComplete[],
  nowMs: number
): BulkChangeWorksiteOption[] {
  const states = deeds.map(
    (deed) => [deed, getWorksitePlotState(deed, nowMs)] as const
  );

  return SELECTABLE_WORKSITES.map((worksite) => {
    const candidates: ChangeWorksiteCandidate[] = [];
    let compatibleCount = 0;
    let alreadyBuilt = 0;
    let underConstruction = 0;

    for (const [deed, state] of states) {
      if (!isWorksiteStaticallyAllowed(deed, worksite)) continue;
      compatibleCount++;
      const check = canChangeWorksite(deed, worksite, nowMs, state);
      if (check.eligible) {
        candidates.push({
          deed,
          plotLabel: plotLabelOf(deed),
          regionUid: deed.region_uid,
          deedUid: deed.deed_uid,
          currentWorksite: state.currentWorksite,
        });
      } else if (state.isConstruction) {
        underConstruction++;
      } else {
        alreadyBuilt++;
      }
    }

    let blockedReason: string | null = null;
    if (candidates.length === 0) {
      if (compatibleCount === 0)
        blockedReason = `None of the selected plots have a deed type that allows a ${worksite}.`;
      else if (underConstruction > 0 && alreadyBuilt > 0)
        blockedReason = `All ${compatibleCount} compatible plots are busy building (${underConstruction}) or already have a ${worksite} (${alreadyBuilt}).`;
      else if (underConstruction > 0)
        blockedReason = `All ${compatibleCount} compatible plots have a construction project running.`;
      else
        blockedReason = `All ${compatibleCount} compatible plots already have a ${worksite}.`;
    }

    return { worksite, candidates, compatibleCount, blockedReason };
  });
}
