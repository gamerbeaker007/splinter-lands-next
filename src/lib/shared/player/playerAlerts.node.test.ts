import { describe, expect, it } from "vitest";
import type { SplInventory } from "@/types/spl/inventory";
import { countUnassigned, findUnassignedTitlesAndTotems } from "./playerAlerts";

function item(overrides: Partial<SplInventory>): SplInventory {
  return {
    name: "Common Totem",
    type: "Land",
    sub_type: "Totem",
    listed: false,
    quantity: 1,
    stake_start_date: null,
    stake_end_date: null,
    ...overrides,
  } as SplInventory;
}

const STAKED = { stake_start_date: "2026-09-20T14:55:36.000Z" };

describe("findUnassignedTitlesAndTotems", () => {
  it("counts titles and totems without an active stake, grouped by name", () => {
    const result = findUnassignedTitlesAndTotems([
      item({}),
      item({}),
      item({ ...STAKED }),
      item({ name: "Rare Totem" }),
      item({ name: "The Proven", type: "Title", sub_type: null }),
      item({ name: "The Emergent", type: "Title", sub_type: null, ...STAKED }),
    ]);
    expect(result).toEqual({
      unassignedTitles: [{ name: "The Proven", count: 1 }],
      unassignedTotems: [
        { name: "Common Totem", count: 2 },
        { name: "Rare Totem", count: 1 },
      ],
    });
  });

  it("treats an ended stake as unassigned", () => {
    const result = findUnassignedTitlesAndTotems([
      item({ ...STAKED, stake_end_date: "2026-10-01T00:00:00.000Z" }),
    ]);
    expect(result.unassignedTotems).toEqual([
      { name: "Common Totem", count: 1 },
    ]);
  });

  it("ignores market listings, totem fragments and other items", () => {
    const result = findUnassignedTitlesAndTotems([
      item({ listed: true }),
      item({ name: "Common Totem Fragment", type: "Token", sub_type: "Land" }),
      item({ name: "Mage Wagon", type: "Conflicts", sub_type: "Vehicle" }),
    ]);
    expect(result).toEqual({ unassignedTitles: [], unassignedTotems: [] });
  });
});

describe("countUnassigned", () => {
  it("sums the items across groups", () => {
    expect(
      countUnassigned([
        { name: "Common Totem", count: 2 },
        { name: "Rare Totem", count: 1 },
      ])
    ).toBe(3);
    expect(countUnassigned([])).toBe(0);
  });
});
