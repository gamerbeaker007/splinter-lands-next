import { Resource } from "@/constants/resource/resource";

export const plotRarityOptions = ["common", "rare", "epic", "legendary"];
export const plotRarityModifiers: Record<PlotRarity, number> = {
  common: 0,
  rare: 0.1,
  epic: 0.4,
  legendary: 1,
};
export type PlotRarity = (typeof plotRarityOptions)[number];

export const cardRarityOptions = ["common", "rare", "epic", "legendary"];
export type CardRarity = (typeof cardRarityOptions)[number];

export const plotStatusOptions = ["natural", "magical", "occupied"];
export type PlotStatus = (typeof plotStatusOptions)[number];

export const magicTypeOptions = [
  "fire",
  "water",
  "life",
  "death",
  "earth",
  "dragon",
];
export type MagicType = (typeof magicTypeOptions)[number];

export const deedTypeOptions = [
  "badlands",
  "bog",
  "caldera",
  "canyon",
  "desert",
  "forest",
  "hills",
  "jungle",
  "lake",
  "mountain",
  "plains",
  "river",
  "swamp",
  "tundra",
];
export type DeedType = (typeof deedTypeOptions)[number];

export const DEED_BLOCKED: Record<MagicType, readonly DeedType[]> = {
  fire: ["bog", "hills", "lake", "river", "swamp", "tundra"],
  water: [
    "caldera",
    "canyon",
    "desert",
    "forest",
    "hills",
    "jungle",
    "mountain",
    "plains",
  ],
  life: ["badlands", "bog", "canyon", "desert", "swamp"],
  death: [
    "caldera",
    "forest",
    "hills",
    "jungle",
    "lake",
    "plains",
    "river",
    "tundra",
  ],
  earth: ["badlands", "bog", "caldera", "canyon", "mountain", "plains"],
  dragon: [
    "badlands",
    "desert",
    "forest",
    "jungle",
    "lake",
    "mountain",
    "river",
    "swamp",
    "tundra",
  ],
};

export const cardElementOptions = [
  "fire",
  "water",
  "life",
  "death",
  "earth",
  "dragon",
  "neutral",
];

export const cardElementColorMap: Record<string, CardElement> = {
  red: "fire",
  blue: "water",
  white: "life",
  black: "death",
  green: "earth",
  gold: "dragon",
  gray: "neutral",
};

export type CardElement = (typeof cardElementOptions)[number];

export const titleOptions = ["none", "rare", "epic", "legendary"];
export const titleModifiers: Record<TitleTier, number> = {
  none: 0,
  rare: 0.1,
  epic: 0.25,
  legendary: 0.5,
};
export type TitleTier = (typeof titleOptions)[number];

export const totemOptions = ["none", "common", "rare", "epic", "legendary"];
export const totemModifiers: Record<TotemTier, number> = {
  none: 0,
  common: 0.1,
  rare: 0.25,
  epic: 0.5,
  legendary: 1,
};
export type TotemTier = (typeof totemOptions)[number];

export const runiOptions = ["none", "regular", "gold"];
export const runiModifiers: Record<RuniTier, number> = {
  none: 0,
  regular: 1,
  gold: 1,
};
export type RuniTier = (typeof runiOptions)[number];

export const cardSetOptions = [
  "alpha",
  "beta",
  "untamed",
  "chaos",
  "rebellion",
  "conclave",
];
export const cardSetModifiers: Record<CardSetName, number> = {
  alpha: 10,
  beta: 5,
  untamed: 2,
  chaos: 1,
  rebellion: 0.5,
  conclave: 0.5,
};
export type CardSetName = (typeof cardRarityOptions)[number];

// Note all other variants like gold arcanes / black / black arcane are treahten as gold.
export const cardFoilOptions = ["regular", "gold"];
export type CardFoil = (typeof cardFoilOptions)[number];

export const basePPMax: Record<CardRarity, Record<CardFoil, number>> = {
  common: { regular: 1000, gold: 2000 },
  rare: { regular: 1100, gold: 4000 },
  epic: { regular: 1250, gold: 6000 },
  legendary: { regular: 1500, gold: 10000 },
};

export const TERRAIN_BONUS: Record<
  DeedType,
  Partial<Record<CardElement, number>>
> = {
  badlands: { fire: 0.1, life: -0.5, death: 0.1, earth: -0.5 },
  bog: { fire: -0.5, water: 0.1, life: -0.5, death: 0.1 },
  caldera: { fire: 0.1, death: -0.5, earth: -0.5, dragon: 0.1 },
  canyon: {
    fire: 0.1,
    water: -0.5,
    life: -0.5,
    death: 0.1,
    earth: -0.5,
    dragon: 0.1,
  },
  desert: { fire: 0.1, water: -0.5, life: -0.5, dragon: 0.1 },
  forest: { life: 0.1, death: -0.5, earth: 0.1, dragon: -0.5 },
  hills: { water: -0.5, life: 0.1, death: -0.5, dragon: 0.1 },
  jungle: { life: 0.1, death: -0.5, earth: 0.1, dragon: -0.5 },
  lake: { fire: -0.5, water: 0.1, earth: 0.1, dragon: -0.5 },
  mountain: { fire: 0.1, water: -0.5, death: 0.1, earth: -0.5 },
  plains: { water: -0.5, life: 0.1, earth: -0.5, dragon: 0.1 },
  river: { fire: -0.5, water: 0.1, earth: 0.1, dragon: -0.5 },
  swamp: { fire: -0.5, water: 0.1, life: -0.5, death: 0.1 },
  tundra: {
    fire: -0.5,
    water: 0.1,
    life: 0.1,
    death: -0.5,
    earth: 0.1,
    dragon: -0.5,
  },
};

export const TERRAIN_OPTIONS: DeedType[] = Object.keys(
  TERRAIN_BONUS,
) as DeedType[];

export const worksiteTypeOptions = [
  "Grain Farm",
  "Logging Camp",
  "Ore Mine",
  "Quarry",
  "Research Hut",
  "Aura Lab",
  "Shard Mine",
];

export type WorksiteType = (typeof worksiteTypeOptions)[number];

export const resourceWorksiteMap: Record<
  WorksiteType,
  Exclude<Resource, "VOUCHER" | "TAX" | "DEC">
> = {
  "Grain Farm": "GRAIN",
  "Logging Camp": "WOOD",
  "Ore Mine": "IRON",
  Quarry: "STONE",
  "Research Hut": "RESEARCH",
  "Aura Lab": "AURA",
  "Shard Mine": "SPS",
};

export const resourceOptions = [
  "grain",
  "wood",
  "iron",
  "stone",
  "research",
  "aura",
  "sps",
];

export type resource = (typeof resourceOptions)[number];
