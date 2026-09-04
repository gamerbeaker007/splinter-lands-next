import { validateCustomPlan } from "@/lib/shared/customPlanValidation";
import { floorSharesOut, MIN_SHARES_OUT } from "@/lib/shared/poolPositionUtils";
import { CustomPlanRowDraft } from "@/types/landManager";
import { SplLandPool, SplPlayerPoolPosition } from "@/types/spl/landPools";
import { describe, expect, it } from "vitest";

// GRAIN pool: 1,000,000 GRAIN / 50,000 DEC across 10,000 shares.
const GRAIN_POOL = {
  token_symbol: "GRAIN",
  resource_quantity: "1000000",
  dec_quantity: "50000",
  total_shares: "10000",
} as SplLandPool;

/** 1,000,000 GRAIN over 10,000 shares. */
const GRAIN_PER_SHARE = 100;

/** Each share is worth 100 GRAIN + 5 DEC; `vestingShares` are still locked. */
const grainPosition = (vestingShares: number, shares = 1_000) =>
  ({ symbol: "GRAIN", shares, vestingShares }) as SplPlayerPoolPosition;

const withdrawRow = (amount: string): CustomPlanRowDraft => ({
  draftId: `d${amount}`,
  action_type: "pool_withdraw",
  from_region_uid: "",
  to_region_uid: "region-a",
  from_resource: "GRAIN",
  to_resource: "",
  amount_type: "abs",
  amount,
});

const validate = (
  rows: CustomPlanRowDraft[],
  vestingShares = 0,
  shares?: number
) =>
  validateCustomPlan(rows, {}, 0, [GRAIN_POOL], {
    poolPositions: { GRAIN: grainPosition(vestingShares, shares) },
  });

describe("validateCustomPlan — pool withdrawals", () => {
  it("reports the shares_out fraction and derives every estimate from it", () => {
    // 10,000 of the 100,000 GRAIN the position represents = 0.1 of it.
    const result = validate([withdrawRow("10000")]);

    expect(result.status).toBe("valid");
    const row = result.rows[0];
    expect(row.poolSharesOut).toBeCloseTo(0.1, 6);
    expect(row.estimatedOutputAmount).toBeCloseTo(10_000, 6);
    expect(row.estimatedOutputSymbol2).toBe("DEC");
    expect(row.estimatedOutputAmount2).toBeCloseTo(500, 6);
  });

  it("rounds shares_out DOWN so a withdrawal never reaches into the lock", () => {
    // 3,000 shares (300,000 GRAIN) with 1,000 vesting: exactly 2/3 is unlocked,
    // i.e. 200,000 GRAIN. Withdrawing all of it needs shares_out 0.6666…, which
    // must truncate rather than round — rounding up would dip into the lock and
    // cost the 10% early-exit penalty.
    const row = validate([withdrawRow("200000")], 1_000, 3_000).rows[0];

    expect(row.valid).toBe(true);
    expect(row.poolSharesOut).toBe(floorSharesOut(2 / 3));
    expect(row.poolSharesOut!).toBeLessThanOrEqual(2 / 3);
  });

  it("truncates an in-between fraction to the chain's precision", () => {
    // 12,345 of the 100,000 GRAIN the position represents = 0.12345 exactly,
    // which is then truncated to whatever precision the chain accepts.
    const expected = floorSharesOut(0.12345);
    const row = validate([withdrawRow("12345")]).rows[0];

    expect(row.poolSharesOut).toBeCloseTo(expected, 9);
    expect(row.poolSharesOut!).toBeLessThanOrEqual(0.12345);
    // Every estimate is derived from the truncated fraction, not the raw one.
    expect(row.estimatedOutputAmount).toBeCloseTo(expected * 100_000, 6);
  });

  it("does not double-spend the same position across rows", () => {
    const result = validate([withdrawRow("60000"), withdrawRow("60000")]);

    expect(result.rows[0].valid).toBe(true);
    expect(result.rows[0].poolSharesOut).toBeCloseTo(0.6, 6);
    // Only 40,000 GRAIN of the position is left, so the second row cannot run.
    expect(result.rows[1].valid).toBe(false);
    expect(result.rows[1].error).toContain("Insufficient unlocked GRAIN");
    expect(result.status).toBe("invalid");
  });

  // A position big enough that one representable shares_out step is still
  // several whole resource units, so "just under a step" is expressible in the
  // integer amount field at any precision setting.
  const BIG_SHARES = 2_000;
  const BIG_RESOURCE = BIG_SHARES * GRAIN_PER_SHARE;
  const stepInResource = MIN_SHARES_OUT * BIG_RESOURCE;

  it("rejects a withdrawal below the chain's shares_out precision", () => {
    const tooSmall = Math.ceil(stepInResource) - 1;
    const row = validate([withdrawRow(String(tooSmall))], 0, BIG_SHARES)
      .rows[0];

    expect(row.valid).toBe(false);
    expect(row.error).toContain("too small for chain precision");
  });

  it("accepts the smallest representable withdrawal", () => {
    const smallest = Math.ceil(stepInResource);
    const row = validate([withdrawRow(String(smallest))], 0, BIG_SHARES)
      .rows[0];

    expect(row.valid).toBe(true);
    expect(row.poolSharesOut).toBeCloseTo(MIN_SHARES_OUT, 9);
  });

  it("rejects a withdrawal when the whole position is still locked", () => {
    const row = validate([withdrawRow("1000")], 1_000).rows[0];

    expect(row.valid).toBe(false);
    expect(row.poolSharesOut).toBeUndefined();
  });
});
