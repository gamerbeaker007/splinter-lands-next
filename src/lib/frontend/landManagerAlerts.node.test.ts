import {
  buildLandManagerAlerts,
  countAlertsBySeverity,
  deriveDecStatus,
  LandManagerAlertsInput,
} from "@/lib/frontend/landManagerAlerts";
import type { RegionDECInfo } from "@/lib/backend/actions/land-manager/dec-power-actions";
import type { CardAlerts, DeedInfo } from "@/types/cardAlerts";
import { describe, expect, it } from "vitest";

function decRegion(n: number, needed: number, inUse: number): RegionDECInfo {
  return {
    region_number: n,
    region_uid: `R-${n}`,
    total_plot_count: 25,
    dec_stake_needed: needed,
    dec_stake_in_use: inUse,
  };
}

const HEALTHY: LandManagerAlertsInput = {
  poolBufferRows: [],
  eligibility: { eligible: [], unpoweredSkipped: [] },
  stakedDEC: [decRegion(1, 100, 100)],
  totalStaked: 100,
  totalRequired: 100,
  globalShortfall: 0,
  globalExcess: 0,
  worksiteAlerts: {
    loading: false,
    feedPlan: {
      feedable: [],
      shortOnGrain: [],
      grainSpentByRegion: {},
      grainNeededByRegion: {},
    },
    fixTargets: [],
    undeveloped: [],
    hasPending: false,
  },
  cardAlerts: null,
  deedAlerts: null,
};

const DEED = { plotNumber: 1 } as DeedInfo;

const NO_CARD_ALERTS: CardAlerts = {
  assignedWorkersAlerts: [],
  noWorkersAlerts: [],
  terrainBoostAlerts: { negative: [], zeroNeutral: [], zeroNonNeutral: [] },
  negativeDECNaturalResourceDeeds: [],
  negativeDECOtherResourceDeeds: [],
  tooMuchBasePP: [],
  unusedPowerSource: 0,
  noPowerSource: [],
  powerCoreWhileEnergized: [],
  missingBloodLineBoost: [],
  rationingLiteAlerts: [],
};

describe("buildLandManagerAlerts", () => {
  it("reports nothing for a healthy account", () => {
    const alerts = buildLandManagerAlerts(HEALTHY);
    expect(alerts).toEqual([]);
    expect(countAlertsBySeverity(alerts)).toEqual({
      error: 0,
      warning: 0,
      info: 0,
    });
  });

  it("classifies a global DEC shortfall as high and over-stake as low", () => {
    const short = buildLandManagerAlerts({
      ...HEALTHY,
      globalShortfall: 10.2,
    });
    expect(short.map((a) => [a.key, a.severity])).toEqual([
      ["decShortfall", "error"],
    ]);

    const over = buildLandManagerAlerts({ ...HEALTHY, globalExcess: 50 });
    expect(over.map((a) => [a.key, a.severity])).toEqual([
      ["decOverStaked", "info"],
    ]);
  });

  it("flags a regional imbalance only while the global pool is even", () => {
    const stakedDEC = [decRegion(1, 100, 50), decRegion(2, 100, 150)];
    expect(
      buildLandManagerAlerts({ ...HEALTHY, stakedDEC }).map((a) => a.key)
    ).toEqual(["decImbalance"]);
    // With a global shortfall the imbalance is folded into the shortfall.
    expect(
      buildLandManagerAlerts({
        ...HEALTHY,
        stakedDEC,
        globalShortfall: 5,
      }).map((a) => a.key)
    ).toEqual(["decShortfall"]);
  });

  it("includes player dashboard alerts and counts alert types per severity", () => {
    const alerts = buildLandManagerAlerts({
      ...HEALTHY,
      cardAlerts: {
        ...NO_CARD_ALERTS,
        noPowerSource: [DEED, DEED],
        noWorkersAlerts: [DEED],
        unusedPowerSource: 3,
        terrainBoostAlerts: {
          negative: [],
          zeroNeutral: [],
          zeroNonNeutral: [],
        },
      },
      deedAlerts: [],
    });
    expect(alerts.map((a) => [a.key, a.count])).toEqual([
      ["noPower", 2],
      ["noWorkers", 1],
      ["unusedPowerCore", 3],
    ]);
    expect(countAlertsBySeverity(alerts)).toEqual({
      error: 1,
      warning: 1,
      info: 1,
    });
  });

  it("never reports a negative unused power core count", () => {
    const alerts = buildLandManagerAlerts({
      ...HEALTHY,
      cardAlerts: { ...NO_CARD_ALERTS, unusedPowerSource: -2 },
    });
    expect(alerts).toEqual([]);
  });
});

describe("deriveDecStatus", () => {
  it("rounds the global gaps and lists per-region gaps", () => {
    const status = deriveDecStatus(
      [decRegion(1, 100, 40), decRegion(2, 100, 100)],
      59.1,
      0
    );
    expect(status.shortfall).toBe(60);
    expect(status.regionsWithShortfall).toHaveLength(1);
    expect(status.regionsWithShortfall[0].gap).toBe(60);
    expect(status.hasRegionalImbalance).toBe(false);
  });
});
