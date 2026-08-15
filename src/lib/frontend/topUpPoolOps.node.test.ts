import {
  buildTopUpPoolPlan,
  TopUpPoolParams,
} from "@/lib/frontend/topUpPoolOps";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { describe, expect, it } from "vitest";

// The `swap_resource` strategy is the only one that spends a resource other than
// the one it funds, so these tests pin the invariant that makes it safe: a donor
// never gives up the resource its OWN top-up needs.

const pool = (
  symbol: string,
  resourceQty: number,
  decQty: number
): SplLandPool =>
  ({
    id: 1,
    token_symbol: symbol,
    resource_quantity: String(resourceQty),
    dec_quantity: String(decQty),
    total_shares: "1000000",
  }) as SplLandPool;

// Deep pools, so price impact stays small enough for the arithmetic to be easy
// to reason about while still being real AMM math.
const POOLS = [
  pool("GRAIN", 100_000_000, 2_000_000),
  pool("WOOD", 20_000_000, 1_000_000),
  pool("STONE", 5_000_000, 500_000),
  pool("IRON", 1_000_000, 300_000),
];

const region = (uid: string, name: string): SplProductionOverviewRegion =>
  ({ region_uid: uid, name }) as SplProductionOverviewRegion;

const REGIONS = [region("R1", "Region One")];

/** GRAIN is short, WOOD is abundant — the case the strategy exists for. */
function params(overrides: Partial<TopUpPoolParams> = {}): TopUpPoolParams {
  return {
    regions: REGIONS,
    balances: { R1: { GRAIN: 0, WOOD: 500_000, STONE: 0, IRON: 0 } },
    pools: POOLS,
    decBalance: 0,
    strategies: ["swap_resource"],
    weeklyConsumption: { GRAIN: 100_000, WOOD: 50_000, STONE: 0, IRON: 0 },
    ...overrides,
  };
}

const forSymbol = (plan: ReturnType<typeof buildTopUpPoolPlan>, sym: string) =>
  plan.resources.find((r) => r.symbol === sym)!;

describe("Top Up Pools — swap_resource", () => {
  it("covers a GRAIN target from surplus WOOD with an empty wallet", () => {
    const plan = buildTopUpPoolPlan(params());
    const grain = forSymbol(plan, "GRAIN");

    expect(grain.status).toBe("READY");
    expect(grain.total_resource).toBeGreaterThanOrEqual(grain.target - 0.001);

    // One swap for the resource side, one sale for the DEC side (wallet is 0).
    const swap = grain.funding.find((f) => f.kind === "swap")!;
    const sell = grain.funding.find((f) => f.kind === "sell")!;
    expect(swap.from_symbol).toBe("WOOD");
    expect(swap.resource_out).toBeGreaterThanOrEqual(grain.target - 0.001);
    expect(sell.from_symbol).toBe("WOOD");
    expect(sell.dec_out).toBeGreaterThanOrEqual(grain.total_dec);
  });

  it("leaves the donor's own top-up intact", () => {
    // WOOD funds itself from what it holds, so this is the case where GRAIN's
    // swap could plausibly starve it.
    const plan = buildTopUpPoolPlan(
      params({
        strategies: ["use_owned_dec", "swap_resource"],
        decBalance: 100_000,
      })
    );
    const grain = forSymbol(plan, "GRAIN");
    const wood = forSymbol(plan, "WOOD");

    expect(grain.status).toBe("READY");
    expect(
      grain.funding.some((f) => f.kind === "swap" && f.from_symbol === "WOOD")
    ).toBe(true);

    // WOOD is planned after GRAIN, against the balance GRAIN's swap left behind.
    expect(wood.status).toBe("READY");
    expect(wood.available_resource).toBeGreaterThanOrEqual(wood.target);
  });

  it("never spends the donor's reserve, even when the target is huge", () => {
    // 105k WOOD reserved (50k/week × 1.1 target + 50k consumed), so at most
    // 395k of the 500k stored may ever be swapped away — nowhere near enough
    // for this GRAIN target.
    const plan = buildTopUpPoolPlan(
      params({
        strategies: ["use_owned_dec", "swap_resource"],
        decBalance: 100_000,
        weeklyConsumption: { GRAIN: 10_000_000, WOOD: 50_000 },
      })
    );
    const grain = forSymbol(plan, "GRAIN");
    const wood = forSymbol(plan, "WOOD");

    // The target is unreachable, so GRAIN is skipped whole rather than eating
    // into WOOD — and the attempt says why.
    expect(grain.status).toBe("SKIPPED");
    expect(grain.attempts.some((a) => a.strategy === "swap_resource")).toBe(
      true
    );
    expect(wood.status).toBe("READY");
    expect(wood.available_resource).toBe(500_000);
  });

  it("is never used unless it is in the strategy list", () => {
    const plan = buildTopUpPoolPlan(params({ strategies: ["use_owned_dec"] }));
    const grain = forSymbol(plan, "GRAIN");

    expect(grain.status).toBe("SKIPPED");
    expect(grain.funding).toEqual([]);
  });
});
