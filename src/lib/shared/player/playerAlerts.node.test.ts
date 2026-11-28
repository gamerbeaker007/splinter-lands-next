import { describe, expect, it } from "vitest";
import type { DeedComplete } from "@/types/deed";
import type { SplInventory } from "@/types/spl/inventory";
import type { SplCardDetails } from "@/types/splCardDetails";
import type { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import {
  countUnassigned,
  findMultipleBloodlineAbilities,
  findUnassignedTitlesAndTotems,
} from "./playerAlerts";

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

describe("findMultipleBloodlineAbilities", () => {
  const deeds = [
    { deed_uid: "deed-1", plot_id: 1 },
    { deed_uid: "deed-2", plot_id: 2 },
    { deed_uid: "deed-3", plot_id: 3 },
  ] as DeedComplete[];
  const baseDetail: Omit<SplCardDetails, "id" | "stats"> = {
    name: "Worker",
    color: "Red",
    type: "Monster",
    sub_type: "",
    rarity: 1,
    is_starter: false,
    editions: "",
    is_promo: false,
    no_pp: false,
  };
  const details: SplCardDetails[] = [
    {
      ...baseDetail,
      id: 1,
      stats: {
        land_abilities: [[], [["BLOODLINE", 0.1, "Elf"]]],
      },
    },
    {
      ...baseDetail,
      id: 2,
      stats: {
        land_abilities: [[["BLOODLINE", 0.1, "Goblin"]]],
      },
    },
  ];
  const card = (
    overrides: Partial<SplPlayerCardCollection> = {}
  ): SplPlayerCardCollection =>
    ({
      uid: "worker",
      card_detail_id: 1,
      card_set: "land",
      level: 2,
      stake_ref_uid: "deed-1",
      ...overrides,
    }) as SplPlayerCardCollection;

  it("reports each plot with two or more abilities, even of different bloodlines", () => {
    const result = findMultipleBloodlineAbilities(
      "player",
      [
        card(),
        card({ uid: "worker-2", card_detail_id: 2, level: 1 }),
        card({ uid: "worker-3" }),
        card({ uid: "worker-4", stake_ref_uid: "deed-2" }),
        card({ uid: "worker-5", stake_ref_uid: "other-deed" }),
        card({ uid: "worker-6", stake_ref_uid: "other-deed" }),
      ],
      deeds,
      details
    );
    expect(result.map((deed) => deed.plotId)).toEqual([1]);
  });

  it("uses the current level and excludes unstaked or delegated-away cards", () => {
    const result = findMultipleBloodlineAbilities(
      "player",
      [
        card(),
        card({ level: 1 }),
        card({ level: 0 }),
        card({ level: 11 }),
        card({ card_detail_id: 999 }),
        card({ card_set: "chaos" }),
        card({ stake_end_date: "2099-01-01T00:00:00.000Z" }),
        card({ delegated_to: "someone-else" }),
        card({ stake_ref_uid: "" }),
        card({ stake_ref_uid: "deed-2", delegated_to: "player" }),
        card({ stake_ref_uid: "deed-2" }),
      ],
      deeds,
      details
    );
    expect(result.map((deed) => deed.plotId)).toEqual([2]);
  });
});
