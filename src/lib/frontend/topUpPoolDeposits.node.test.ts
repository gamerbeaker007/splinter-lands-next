import { buildDepositOps } from "@/lib/frontend/topUpPoolOps";
import {
  SWAP_OUTPUT_HEADROOM,
  TopUpPoolPlan,
  TopUpPoolResourcePlan,
} from "@/types/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { describe, expect, it } from "vitest";

// Phase 2 sizes the deposit against balances read AFTER the funding phase
// settled. The funding swap is quoted at plan time and lands a block later, so
// it can deliver less than planned — depositing the planned amount anyway is
// what the engine rejects with "not enough resource to pool".
//
// The swap is over-sized by SWAP_OUTPUT_HEADROOM, so a shortfall within that
// margin is the surplus failing to appear and is absorbed by depositing what is
// held. A larger gap means something genuinely went wrong and the resource is
// skipped whole. These tests pin both halves.

// 1 GRAIN = 0.02 DEC, so a 1000 GRAIN deposit needs 20 DEC.
const POOLS: SplLandPool[] = [
  {
    token_symbol: "GRAIN",
    resource_quantity: "100000000",
    dec_quantity: "2000000",
  } as SplLandPool,
];

const resourcePlan = (
  symbol: string,
  additions: { region_uid: string; region_name: string; amount: number }[]
): TopUpPoolResourcePlan =>
  ({
    symbol,
    status: "READY",
    additions: additions.map((a) => ({
      region_uid: a.region_uid,
      region_name: a.region_name,
      resource_amount: a.amount,
      dec_amount: 0,
    })),
    funding: [],
  }) as unknown as TopUpPoolResourcePlan;

const planWith = (...resources: TopUpPoolResourcePlan[]): TopUpPoolPlan =>
  ({ resources }) as unknown as TopUpPoolPlan;

const PLAN = planWith(
  resourcePlan("GRAIN", [
    { region_uid: "R1", region_name: "Region One", amount: 1000 },
  ])
);

describe("buildDepositOps resource guard", () => {
  it("deposits when the settled balance covers the planned amount", () => {
    const { ops, dropped } = buildDepositOps("alice", PLAN, POOLS, 10_000, {
      R1: { GRAIN: 1000 },
    });

    expect(dropped).toEqual([]);
    expect(ops).toHaveLength(1);
  });

  it("deposits what is held when the shortfall is within the headroom", () => {
    // 0.5% short — inside SWAP_OUTPUT_HEADROOM, so the deposit shrinks to fit
    // instead of the whole resource being skipped.
    const held = 1000 * (1 - SWAP_OUTPUT_HEADROOM / 2);
    const { ops, actions, dropped } = buildDepositOps(
      "alice",
      PLAN,
      POOLS,
      10_000,
      { R1: { GRAIN: held } }
    );

    expect(dropped).toEqual([]);
    expect(ops).toHaveLength(1);
    expect(actions[0].resource_amount).toBeCloseTo(held, 3);
    // DEC follows the clamped amount, not the planned one (1 GRAIN = 0.02 DEC).
    expect(actions[0].dec_amount).toBeCloseTo(held * 0.02, 2);
  });

  it("drops the resource when the shortfall exceeds the headroom", () => {
    const held = 1000 * (1 - SWAP_OUTPUT_HEADROOM * 2);
    const { ops, dropped } = buildDepositOps("alice", PLAN, POOLS, 10_000, {
      R1: { GRAIN: held },
    });

    expect(ops).toEqual([]);
    expect(dropped).toHaveLength(1);
  });

  it("drops the resource when the swap under-delivered badly", () => {
    const { ops, dropped } = buildDepositOps("alice", PLAN, POOLS, 10_000, {
      R1: { GRAIN: 600 },
    });

    expect(ops).toEqual([]);
    expect(dropped).toHaveLength(1);
    expect(dropped[0]).toContain("GRAIN");
    expect(dropped[0]).toContain("Region One");
  });

  it("treats a region missing from the balances as zero held", () => {
    const { ops, dropped } = buildDepositOps("alice", PLAN, POOLS, 10_000, {});

    expect(ops).toEqual([]);
    expect(dropped).toHaveLength(1);
  });

  it("does not let two legs on one region each claim the whole balance", () => {
    const plan = planWith(
      resourcePlan("GRAIN", [
        { region_uid: "R1", region_name: "Region One", amount: 600 },
        { region_uid: "R1", region_name: "Region One", amount: 600 },
      ])
    );

    // 1000 held covers either leg alone, but not both.
    const { ops, dropped } = buildDepositOps("alice", plan, POOLS, 10_000, {
      R1: { GRAIN: 1000 },
    });

    expect(ops).toEqual([]);
    expect(dropped).toHaveLength(1);
  });

  it("skips the guard when balances are unavailable, rather than dropping", () => {
    // A failed balance read must not cancel a top-up whose funding already
    // went through — the pre-existing DEC guard still applies.
    const { ops, dropped } = buildDepositOps(
      "alice",
      PLAN,
      POOLS,
      10_000,
      null
    );

    expect(dropped).toEqual([]);
    expect(ops).toHaveLength(1);
  });

  it("still drops on insufficient DEC regardless of resource balance", () => {
    const { ops, dropped } = buildDepositOps("alice", PLAN, POOLS, 5, {
      R1: { GRAIN: 1000 },
    });

    expect(ops).toEqual([]);
    expect(dropped[0]).toContain("DEC");
  });
});
