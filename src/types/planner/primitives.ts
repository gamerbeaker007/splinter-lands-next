export const plotRarityOptions = ["Common", "Rare", "Epic", "Legendary"];
export const plotRarityModifiers: Record<PlotRarity, number> = {
  Common: 0,
  Rare: 0.1,
  Epic: 0.4,
  Legendary: 1,
};
export type PlotRarity = (typeof plotRarityOptions)[number];

export const cardRarityOptions = ["Common", "Rare", "Epic", "Legendary"];
export type CardRarity = (typeof cardRarityOptions)[number];

export const plotStatusOptions = ["Natural", "Magical", "Occupied"];
export type PlotStatus = (typeof plotStatusOptions)[number];

export const magicTypeOptions = [
  "Fire",
  "Water",
  "Life",
  "Death",
  "Earth",
  "Dragon",
];
export type MagicType = (typeof magicTypeOptions)[number];

export const deedTypeOptions = [
  "Badlands",
  "Bog",
  "Caldera",
  "Canyon",
  "Desert",
  "Forest",
  "Hills",
  "Jungle",
  "Lake",
  "Mountain",
  "Plains",
  "River",
  "Swamp",
  "Tundra",
];
export type DeedType = (typeof deedTypeOptions)[number];

export const DEED_BLOCKED: Record<MagicType, readonly DeedType[]> = {
  Fire: ["Bog", "Hills", "Lake", "River", "Swamp", "Tundra"],
  Water: [
    "Caldera",
    "Canyon",
    "Desert",
    "Forest",
    "Hills",
    "Jungle",
    "Mountain",
    "Plains",
  ],
  Life: ["Badlands", "Bog", "Canyon", "Desert", "Swamp"],
  Death: [
    "Caldera",
    "Forest",
    "Hills",
    "Jungle",
    "Lake",
    "Plains",
    "River",
    "Tundra",
  ],
  Earth: ["Badlands", "Bog", "Caldera", "Canyon", "Mountain", "Plains"],
  Dragon: [
    "Badlands",
    "Desert",
    "Forest",
    "Jungle",
    "Lake",
    "Mountain",
    "River",
    "Swamp",
    "Tundra",
  ],
};

export const cardElementOptions = [
  "Fire",
  "Water",
  "Life",
  "Death",
  "Earth",
  "Dragon",
  "Neutral",
];
export type CardElement = (typeof cardElementOptions)[number];

export const titleOptions = ["None", "Rare", "Epic", "Legendary"];
export const titleModifiers: Record<TitleTier, number> = {
  None: 0,
  Rare: 0.1,
  Epic: 0.25,
  Legendary: 0.5,
};
export type TitleTier = (typeof titleOptions)[number];

export const totemOptions = ["None", "Common", "Rare", "Epic", "Legendary"];
export const totemModifiers: Record<TotemTier, number> = {
  None: 0,
  Common: 0.1,
  Rare: 0.25,
  Epic: 0.5,
  Legendary: 1,
};
export type TotemTier = (typeof totemOptions)[number];

export const runiOptions = ["None", "Regular", "Gold"];
export const runiModifiers: Record<RuniTier, number> = {
  None: 0,
  Regular: 1,
  Gold: 1,
};
export type RuniTier = (typeof runiOptions)[number];

export const cardSetOptions = [
  "Alpha",
  "Beta",
  "Untamed",
  "Chaos",
  "Rebellion",
  "Conclave",
];
export const cardSetModifiers: Record<CardSetName, number> = {
  Alpha: 10,
  Beta: 5,
  Untamed: 2,
  Chaos: 1,
  Rebellion: 0.5,
  Conclave: 0.5,
};
export type CardSetName = (typeof cardRarityOptions)[number];

// Note all other variants like Gold arcanes / black / black arcane are treahten as Gold.
export const cardFoilOptions = ["Regular", "Gold"];
export type CardFoil = (typeof cardFoilOptions)[number];

export const basePPMax: Record<CardRarity, Record<CardFoil, number>> = {
  Common: { Regular: 1000, Gold: 2000 },
  Rare: { Regular: 1100, Gold: 4000 },
  Epic: { Regular: 1250, Gold: 6000 },
  Legendary: { Regular: 1500, Gold: 10000 },
};
