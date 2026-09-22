import {
  harvestPreviewRows,
  makeHarvestablePreviewRows,
  processResourcesPreviewRows,
  topUpPreviewRows,
} from "@/lib/frontend/preview/actionPreviewRows";
import {
  ActionSummary,
  PostHarvestActionSummary,
  TopUpPoolPlan,
  TopUpPoolResourcePlan,
} from "@/types/landManager";
import { describe, expect, it } from "vitest";

// The preview is the only place a player sees what an action costs BEFORE the
// plan dialog spells it out step by step, so these tests pin the two things it
// must never get wrong: which side of the row an amount lands on (spend is red,
// receive is green) and that everything a strategy did in every region is
// summed into one row.

const amount = (
  row: { spend: { symbol: string; amount: number }[] },
  symbol: string
) => row.spend.find((a) => a.symbol === symbol)?.amount;

describe("makeHarvestablePreviewRows", () => {
  const action = (over: Partial<ActionSummary>): ActionSummary => ({
    type: "transfer",
    from_region: "A",
    to_region: "B",
    from_symbol: "GRAIN",
    to_symbol: "GRAIN",
    in_amount: 0,
    out_amount: 0,
    ...over,
  });

  it("sums each strategy over all regions and keeps the strategy order", () => {
    const rows = makeHarvestablePreviewRows([
      action({
        type: "buy_dec",
        from_symbol: "DEC",
        to_symbol: "STONE",
        in_amount: 100,
        out_amount: 20,
      }),
      action({ type: "transfer", out_amount: 300 }),
      action({ type: "transfer", out_amount: 200 }),
      action({
        type: "pool",
        to_symbol: "GRAIN",
        out_amount: 1000,
        dec_amount: 25,
      }),
    ]);

    expect(rows.map((r) => r.key)).toEqual(["pool", "transfer", "buy_dec"]);
    expect(rows[1].receive).toEqual([{ symbol: "GRAIN", amount: 500 }]);
  });

  it("reports both sides of a pool withdrawal as received", () => {
    const [row] = makeHarvestablePreviewRows([
      action({
        type: "pool",
        to_symbol: "GRAIN",
        out_amount: 1000,
        dec_amount: 25,
      }),
    ]);
    expect(row.spend).toEqual([]);
    expect(row.receive).toEqual([
      { symbol: "GRAIN", amount: 1000 },
      { symbol: "DEC", amount: 25 },
    ]);
  });

  it("shows what a buy costs as spent DEC", () => {
    const [row] = makeHarvestablePreviewRows([
      action({
        type: "buy_dec",
        from_symbol: "DEC",
        to_symbol: "STONE",
        in_amount: 1150,
        out_amount: 200,
      }),
    ]);
    expect(row.spend).toEqual([{ symbol: "DEC", amount: 1150 }]);
    expect(row.receive).toEqual([{ symbol: "STONE", amount: 200 }]);
  });

  it("counts only what a transfer delivers — the resource never leaves the player", () => {
    const [row] = makeHarvestablePreviewRows([
      action({ type: "transfer", in_amount: 333, out_amount: 300 }),
    ]);
    expect(row.spend).toEqual([]);
    expect(row.receive).toEqual([{ symbol: "GRAIN", amount: 300 }]);
  });
});

describe("resource ordering", () => {
  it("reads in production order with DEC last, whatever order the plan produced", () => {
    const [row] = harvestPreviewRows({
      DEC: 5,
      SPS: 1,
      IRON: 2,
      GRAIN: 3,
      STONE: 4,
    });
    expect(row.receive.map((a) => a.symbol)).toEqual([
      "GRAIN",
      "STONE",
      "IRON",
      "SPS",
      "DEC",
    ]);
  });

  it("puts an unknown symbol after the known resources but before DEC", () => {
    const [row] = harvestPreviewRows({ DEC: 1, TAX: 2, GRAIN: 3 });
    expect(row.receive.map((a) => a.symbol)).toEqual(["GRAIN", "TAX", "DEC"]);
  });
});

describe("harvestPreviewRows", () => {
  it("splits the harvest from what the donation gives away", () => {
    const rows = harvestPreviewRows({ GRAIN: 1000, WOOD: 500 }, { GRAIN: 20 });
    expect(rows.map((r) => r.key)).toEqual(["harvest", "donation"]);
    expect(rows[0].receive).toEqual([
      { symbol: "GRAIN", amount: 1000 },
      { symbol: "WOOD", amount: 500 },
    ]);
    expect(rows[1].spend).toEqual([{ symbol: "GRAIN", amount: 20 }]);
  });

  it("drops the donation row when nothing is donated", () => {
    const rows = harvestPreviewRows({ GRAIN: 1000 }, {});
    expect(rows.map((r) => r.key)).toEqual(["harvest"]);
  });
});

describe("topUpPreviewRows", () => {
  const resource = (
    over: Partial<TopUpPoolResourcePlan>
  ): TopUpPoolResourcePlan => ({
    symbol: "GRAIN",
    weekly_consumption: 0,
    weekly_external_need: 0,
    consumed_per_hour: 0,
    produced_per_hour: 0,
    external_need_per_hour: 0,
    target: 0,
    available_resource: 0,
    dec_available: 0,
    dec_required: 0,
    attempts: [],
    contributing_strategies: [],
    funding: [],
    additions: [],
    total_resource: 0,
    total_dec: 0,
    status: "READY",
    skip_reason: null,
    ...over,
  });

  const plan = (resources: TopUpPoolResourcePlan[]): TopUpPoolPlan => ({
    resources,
    dec_balance: 0,
    production_window_hours: 168,
    production_window_reason: "test",
    production_window_source: "fallback",
    consumption_warnings: [],
    log: [],
  });

  it("shows the deposit as a pure cost, DEC included", () => {
    const rows = topUpPreviewRows(
      plan([
        resource({
          symbol: "GRAIN",
          contributing_strategies: ["use_owned_dec"],
          attempts: [
            {
              strategy: "use_owned_dec",
              ok: true,
              covered: 1000,
              dec_used: 20,
              reason: "",
            },
          ],
          total_resource: 1000,
          total_dec: 20,
        }),
      ])
    );
    const deposit = rows.find((r) => r.key === "deposit");
    expect(deposit?.receive).toEqual([]);
    expect(amount(deposit!, "GRAIN")).toBe(1000);
    expect(amount(deposit!, "DEC")).toBe(20);
  });

  it("shows what `use_owned_dec` spends — the DEC side is its only visible cost", () => {
    const rows = topUpPreviewRows(
      plan([
        resource({
          symbol: "GRAIN",
          contributing_strategies: ["use_owned_dec"],
          attempts: [
            {
              strategy: "use_owned_dec",
              ok: true,
              covered: 600,
              dec_used: 12,
              reason: "",
            },
            {
              strategy: "use_owned_dec",
              ok: true,
              covered: 400,
              dec_used: 8,
              reason: "",
            },
          ],
          total_resource: 1000,
          total_dec: 20,
        }),
      ])
    );
    const owned = rows.find((r) => r.key === "use_owned_dec")!;
    expect(owned.spend).toEqual([
      { symbol: "GRAIN", amount: 1000 },
      { symbol: "DEC", amount: 20 },
    ]);
    expect(owned.receive).toEqual([]);
  });

  it("ignores the DEC of a strategy that failed", () => {
    const rows = topUpPreviewRows(
      plan([
        resource({
          symbol: "GRAIN",
          contributing_strategies: [],
          attempts: [
            {
              strategy: "use_owned_dec",
              ok: false,
              covered: 0,
              dec_used: 0,
              reason: "no wallet DEC",
            },
          ],
        }),
      ])
    );
    expect(rows.find((r) => r.key === "use_owned_dec")).toBeUndefined();
  });

  it("gives every funding strategy its own row with both sides of the trade", () => {
    const rows = topUpPreviewRows(
      plan([
        resource({
          symbol: "GRAIN",
          contributing_strategies: ["swap_resource", "sell_resource"],
          funding: [
            {
              kind: "swap",
              region_uid: "R1",
              region_name: "R1",
              from_symbol: "WOOD",
              in_amount: 500,
              dec_out: 10,
              resource_out: 420,
            },
            {
              kind: "sell",
              region_uid: "R1",
              region_name: "R1",
              from_symbol: "IRON",
              amount: 5,
              dec_out: 30,
            },
          ],
          total_resource: 420,
          total_dec: 8,
        }),
      ])
    );

    const swap = rows.find((r) => r.key === "swap_resource")!;
    expect(swap.spend).toEqual([{ symbol: "WOOD", amount: 500 }]);
    expect(swap.receive).toEqual([{ symbol: "GRAIN", amount: 420 }]);

    const sell = rows.find((r) => r.key === "sell_resource")!;
    expect(sell.spend).toEqual([{ symbol: "IRON", amount: 5 }]);
    expect(sell.receive).toEqual([{ symbol: "DEC", amount: 30 }]);
  });

  it("ignores resources the plan skipped", () => {
    const rows = topUpPreviewRows(
      plan([
        resource({
          symbol: "STONE",
          status: "SKIPPED",
          skip_reason: "not enough DEC",
          total_resource: 999,
          total_dec: 99,
        }),
      ])
    );
    expect(rows).toEqual([]);
  });
});

describe("processResourcesPreviewRows", () => {
  const action = (
    over: Partial<PostHarvestActionSummary>
  ): PostHarvestActionSummary => ({
    type: "sell_for_dec",
    region_uid: "R1",
    symbol: "GRAIN",
    resource_amount: 0,
    dec_amount: 0,
    ...over,
  });

  it("shows a sell as resource out, DEC in", () => {
    const [row] = processResourcesPreviewRows([
      action({ type: "sell_for_dec", resource_amount: 1000, dec_amount: 18 }),
    ]);
    expect(row.spend).toEqual([{ symbol: "GRAIN", amount: 1000 }]);
    expect(row.receive).toEqual([{ symbol: "DEC", amount: 18 }]);
  });

  it("shows a pool addition as both sides spent", () => {
    const [row] = processResourcesPreviewRows([
      action({ type: "add_to_pool", resource_amount: 1000, dec_amount: 20 }),
    ]);
    expect(row.receive).toEqual([]);
    expect(row.spend).toEqual([
      { symbol: "GRAIN", amount: 1000 },
      { symbol: "DEC", amount: 20 },
    ]);
  });

  it("sums actions of the same kind across regions", () => {
    const rows = processResourcesPreviewRows([
      action({ type: "sell_for_dec", resource_amount: 100, dec_amount: 2 }),
      action({
        type: "sell_for_dec",
        region_uid: "R2",
        resource_amount: 400,
        dec_amount: 8,
      }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].spend).toEqual([{ symbol: "GRAIN", amount: 500 }]);
    expect(rows[0].receive).toEqual([{ symbol: "DEC", amount: 10 }]);
  });
});
