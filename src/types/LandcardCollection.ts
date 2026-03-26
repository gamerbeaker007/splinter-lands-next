// rarity_level_counts: { "common": { "1": { "regular": 5, "gold": 2 }, "2": { ... } }, "rare": { ... } }
//   outer key = rarity (common, rare, epic, legendary), middle key = card level (as string), inner key = foil type (regular, gold, etc.)
// JSON / JSONB object keys are always strings at runtime, so rarity and level use string keys
// even though their values are numeric.
export type RarityLevelCounts = Record<
  string, // rarity as string
  Record<
    string, // level as string
    Record<string, number> // foil type as string → count
  >
>;
