import { buildPostHarvestOps } from "@/lib/frontend/postHarvestOps";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { describe, expect, it } from "vitest";

const pool = (symbol: string): SplLandPool =>
  ({
    id: 1,
    token_symbol: symbol,
    dec_quantity: "40256520",
    resource_quantity: "4945943948",
    total_shares: "1000000",
  }) as SplLandPool;

const POOLS = [pool("GRAIN"), pool("WOOD"), pool("STONE"), pool("IRON")];

const region = (uid: string): SplProductionOverviewRegion =>
  ({ region_uid: uid, name: `Region ${uid}` }) as SplProductionOverviewRegion;

const REGIONS = [region("R-1"), region("R-2"), region("R-3")];

/** The custom_json payload of an op, parsed back into an object. */
const payload = (op: [string, object]) =>
  JSON.parse((op[1] as { json: string }).json);

describe("buildPostHarvestOps — transfer_to_region", () => {
  const balances = {
    "R-1": { GRAIN: 1000, WOOD: 500 },
    "R-2": { GRAIN: 200 },
    "R-3": { GRAIN: 4000, TAX: 900 },
  };

  it("moves every other region's resources into the destination", () => {
    const { transferOps, actions } = buildPostHarvestOps(
      REGIONS,
      "player",
      balances,
      POOLS,
      "transfer_to_region",
      [],
      0,
      100,
      "R-3"
    );

    const moves = transferOps.map(payload);
    expect(moves).toHaveLength(3); // R-1 GRAIN + R-1 WOOD + R-2 GRAIN
    expect(moves.every((m) => m.to_region_uid === "R-3")).toBe(true);
    // The destination keeps what it already holds.
    expect(moves.some((m) => m.from_region_uid === "R-3")).toBe(false);
    // Same-symbol move: the trade-hub fee is the only loss.
    const grainFromR1 = moves.find(
      (m) => m.from_region_uid === "R-1" && m.from_symbol === "GRAIN"
    );
    expect(grainFromR1.in_amount).toBe(1000);
    expect(grainFromR1.out_amount_2).toBe(900);
    expect(actions).toHaveLength(3);
  });

  it("does not transfer excluded resources", () => {
    const { transferOps } = buildPostHarvestOps(
      REGIONS,
      "player",
      balances,
      POOLS,
      "transfer_to_region",
      ["WOOD"],
      0,
      100,
      "R-3"
    );

    expect(transferOps.map(payload).some((m) => m.from_symbol === "WOOD")).toBe(
      false
    );
  });

  it("builds nothing and explains itself when no destination is configured", () => {
    const result = buildPostHarvestOps(
      REGIONS,
      "player",
      balances,
      POOLS,
      "transfer_to_region",
      [],
      0,
      100,
      null
    );

    expect(result.transferOps).toHaveLength(0);
    expect(result.log.join(" ")).toContain("No destination region configured");
  });

  it("never builds ops for custom_plan — the plan defines its own rows", () => {
    const result = buildPostHarvestOps(
      REGIONS,
      "player",
      balances,
      POOLS,
      "custom_plan",
      [],
      0,
      100,
      "R-3"
    );

    expect(result.ops).toHaveLength(0);
  });
});
