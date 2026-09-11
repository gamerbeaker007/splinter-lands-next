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

const poolRow = (amount: string): CustomPlanRowDraft => ({
  draftId: `p${amount}`,
  action_type: "pool",
  from_region_uid: "region-a",
  to_region_uid: "",
  from_resource: "GRAIN",
  to_resource: "",
  amount_type: "abs",
  amount,
});

const buyRow = (amount: string): CustomPlanRowDraft => ({
  draftId: `b${amount}`,
  action_type: "buy",
  from_region_uid: "",
  to_region_uid: "region-a",
  from_resource: "GRAIN",
  to_resource: "",
  amount_type: "abs",
  amount,
});

const stakeDecRow = (
  amount: string,
  amountType: "abs" | "pct" = "abs"
): CustomPlanRowDraft => ({
  draftId: `sd${amountType}${amount}`,
  action_type: "stake_dec",
  from_region_uid: "",
  to_region_uid: "region-a",
  from_resource: "",
  to_resource: "",
  amount_type: amountType,
  amount,
});

const transferPctRow = (amount: string): CustomPlanRowDraft => ({
  draftId: `t${amount}`,
  action_type: "transfer",
  from_region_uid: "region-a",
  to_region_uid: "region-b",
  from_resource: "GRAIN",
  to_resource: "",
  amount_type: "pct",
  amount,
});

const poolPctRow = (amount: string): CustomPlanRowDraft => ({
  draftId: `pp${amount}`,
  action_type: "pool",
  from_region_uid: "region-a",
  to_region_uid: "",
  from_resource: "GRAIN",
  to_resource: "",
  amount_type: "pct",
  amount,
});

const swapPctRow = (amount: string): CustomPlanRowDraft => ({
  draftId: `s${amount}`,
  action_type: "swap",
  from_region_uid: "region-a",
  to_region_uid: "region-b",
  from_resource: "GRAIN",
  to_resource: "WOOD",
  amount_type: "pct",
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

  it("includes withdrawal DEC output for later DEC-consuming rows", () => {
    const result = validateCustomPlan(
      [withdrawRow("10000"), buyRow("1000")],
      { "region-a": {} },
      0,
      [GRAIN_POOL],
      {
        poolPositions: { GRAIN: grainPosition(0) },
      }
    );

    expect(result.status).toBe("valid");
    expect(result.rows[0].valid).toBe(true);
    expect(result.rows[1].valid).toBe(true);
  });

  it("uses aggregate DEC balance across pool and buy rows", () => {
    const invalidPool = validateCustomPlan(
      [poolRow("3000")],
      { "region-a": { GRAIN: 10_000 } },
      100,
      [GRAIN_POOL]
    );
    expect(invalidPool.status).toBe("invalid");
    expect(invalidPool.rows[0].error).toContain("Insufficient DEC");

    const invalidBuy = validateCustomPlan(
      [buyRow("3000")],
      { "region-a": { GRAIN: 10_000 } },
      100,
      [GRAIN_POOL]
    );
    expect(invalidBuy.status).toBe("invalid");
    expect(invalidBuy.rows[0].error).toContain("Insufficient DEC");

    // 1,000 GRAIN costs ~55.6 DEC and 1,500 GRAIN ~83.5 DEC against this pool.
    // The budget has to sit between the second row's cost and the pair's total
    // (~139 DEC), or the second row is affordable on its own terms and the test
    // proves nothing about the running balance.
    const aggregate = validateCustomPlan(
      [poolRow("1000"), buyRow("1500")],
      { "region-a": { GRAIN: 10_000 } },
      100,
      [GRAIN_POOL]
    );
    expect(aggregate.rows[0].valid).toBe(true);
    expect(aggregate.rows[1].valid).toBe(false);
    expect(aggregate.rows[1].error).toContain("Insufficient DEC");
    expect(aggregate.status).toBe("invalid");
  });

  it("uses pool spot ratio for pool rows", () => {
    const result = validateCustomPlan(
      [poolRow("1000")],
      { "region-a": { GRAIN: 10_000 } },
      1_000,
      [GRAIN_POOL]
    );

    expect(result.status).toBe("valid");
    expect(result.rows[0].valid).toBe(true);
    // Spot ratio is 50,000 / 1,000,000 = 0.05 DEC per GRAIN.
    expect(result.rows[0].estimatedOutputAmount).toBeCloseTo(50, 6);
  });
});

describe("validateCustomPlan — tiny percentage rows", () => {
  it("marks tiny percentage transfer/pool/swap rows as skipped, not invalid", () => {
    const result = validateCustomPlan(
      [transferPctRow("1"), poolPctRow("1"), swapPctRow("1")],
      {
        "region-a": { GRAIN: 5, WOOD: 0 },
        "region-b": { GRAIN: 0, WOOD: 0 },
      },
      10_000,
      [GRAIN_POOL]
    );

    expect(result.status).toBe("valid");
    expect(result.rows[0].skipped).toBe(true);
    expect(result.rows[1].skipped).toBe(true);
    expect(result.rows[2].skipped).toBe(true);
    expect(result.rows[0].error).toBeNull();
    expect(result.rows[1].error).toBeNull();
    expect(result.rows[2].error).toBeNull();
  });

  it("keeps truly invalid rows invalid while allowing skipped ones", () => {
    const result = validateCustomPlan(
      [transferPctRow("1"), poolRow("9999")],
      {
        "region-a": { GRAIN: 5 },
        "region-b": { GRAIN: 0 },
      },
      10_000,
      [GRAIN_POOL]
    );

    expect(result.rows[0].skipped).toBe(true);
    expect(result.rows[1].valid).toBe(false);
    expect(result.status).toBe("invalid");
  });

  it("skips transfer/pool/swap rows when resolved amount is below 10", () => {
    const transferAbs: CustomPlanRowDraft = {
      draftId: "ta",
      action_type: "transfer",
      from_region_uid: "region-a",
      to_region_uid: "region-b",
      from_resource: "GRAIN",
      to_resource: "",
      amount_type: "abs",
      amount: "9",
    };
    const poolAbs: CustomPlanRowDraft = {
      draftId: "pa",
      action_type: "pool",
      from_region_uid: "region-a",
      to_region_uid: "",
      from_resource: "GRAIN",
      to_resource: "",
      amount_type: "abs",
      amount: "9",
    };
    const swapAbs: CustomPlanRowDraft = {
      draftId: "sa",
      action_type: "swap",
      from_region_uid: "region-a",
      to_region_uid: "region-b",
      from_resource: "GRAIN",
      to_resource: "WOOD",
      amount_type: "abs",
      amount: "9",
    };

    const result = validateCustomPlan(
      [transferAbs, poolAbs, swapAbs],
      {
        "region-a": { GRAIN: 1_000, WOOD: 0 },
        "region-b": { GRAIN: 0, WOOD: 0 },
      },
      10_000,
      [GRAIN_POOL]
    );

    expect(result.status).toBe("valid");
    expect(result.rows[0].skipped).toBe(true);
    expect(result.rows[1].skipped).toBe(true);
    expect(result.rows[2].skipped).toBe(true);
  });

  it("accepts decimal abs input for pool_withdraw (not incomplete)", () => {
    const row: CustomPlanRowDraft = {
      draftId: "w01",
      action_type: "pool_withdraw",
      from_region_uid: "",
      to_region_uid: "region-a",
      from_resource: "GRAIN",
      to_resource: "",
      amount_type: "abs",
      amount: "0.1",
    };

    const result = validateCustomPlan(
      [row],
      { "region-a": {} },
      0,
      [GRAIN_POOL],
      {
        poolPositions: { GRAIN: grainPosition(0) },
      }
    );

    expect(result.rows[0].error).not.toBe("Row is incomplete");
  });

  it("resolves stake_dec pct from wallet DEC total, not running DEC", () => {
    const result = validateCustomPlan(
      [buyRow("1000"), stakeDecRow("50", "pct")],
      { "region-a": { GRAIN: 10_000 } },
      1_000,
      [GRAIN_POOL]
    );

    expect(result.rows[0].valid).toBe(true);
    // 50% of wallet DEC (1000) is 500, independent of prior row's DEC spend.
    expect(result.rows[1].resolvedAmount).toBe(500);
    expect(result.rows[1].valid).toBe(true);
  });

  it("marks stake_dec pct row invalid when running DEC drops below resolved amount", () => {
    const result = validateCustomPlan(
      [buyRow("12000"), stakeDecRow("50", "pct")],
      { "region-a": { GRAIN: 10_000 } },
      1_000,
      [GRAIN_POOL]
    );

    expect(result.rows[0].valid).toBe(true);
    expect(result.rows[1].valid).toBe(false);
    expect(result.rows[1].error).toContain("Insufficient DEC");
  });
});
