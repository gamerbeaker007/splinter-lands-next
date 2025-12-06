import { Resource } from "@/constants/resource/resource";
import {
  bountiful_aura_icon_url,
  bountiful_grain_icon_url,
  bountiful_iron_icon_url,
  bountiful_stone_icon_url,
  bountiful_wood_icon_url,
  card_rarity_common_icon_url,
  card_rarity_epic_icon_url,
  card_rarity_legendary_icon_url,
  card_rarity_rare_icon_url,
  edition_alpha_icon_url,
  edition_beta_icon_url,
  edition_chaos_icon_url,
  edition_conclave_arcana_icon_url,
  edition_land_card_icon_url,
  edition_rebellion_icon_url,
  edition_untamed_icon_url,
  land_aura_lab_icon_url,
  land_castle_icon_url,
  land_grain_farm_icon_url,
  land_keep_icon_url,
  land_logging_camp_icon_url,
  land_ore_mine_icon_url,
  land_quarry_icon_url,
  land_research_hut_icon_url,
  land_shard_mine_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CardSetNameLandValid } from "../editions";
import { PlotPlannerData } from "./domain";

export const plotRarityOptions = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];
export const plotRarityModifiers: Record<PlotRarity, number> = {
  common: 0,
  rare: 0.1,
  epic: 0.4,
  legendary: 1,
  mythic: 0,
};
export type PlotRarity = (typeof plotRarityOptions)[number];

export const cardRarityOptions = ["common", "rare", "epic", "legendary"];
export type CardRarity = (typeof cardRarityOptions)[number];

export type TotemRarity = (typeof cardRarityOptions)[number]; //same as card rarity

export const RarityColor: Record<CardRarity, string> = {
  common: "grey",
  rare: "blue",
  epic: "purple",
  legendary: "gold",
};

export const cardIconMap: Record<CardRarity, string> = {
  common: card_rarity_common_icon_url,
  rare: card_rarity_rare_icon_url,
  epic: card_rarity_epic_icon_url,
  legendary: card_rarity_legendary_icon_url,
};

export const plotStatusOptions = ["natural", "magical", "occupied", "kingdom"];
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

//source: https://discord.com/channels/447924793048825866/1248769576586580070/1408441757217329345
export const TERRAIN_ALLOWED: Record<string, string[]> = {
  badlands: ["death", "fire", "water"],
  bog: ["water", "death", "dragon"],
  caldera: ["dragon", "fire", "life"],
  canyon: ["fire", "dragon", "death"],
  desert: ["death", "fire", "earth"],
  forest: ["earth", "life", "fire"],
  hills: ["dragon", "life", "earth"],
  jungle: ["life", "earth", "fire"],
  lake: ["water", "earth", "life"],
  mountain: ["fire", "death", "life"],
  plains: ["life", "dragon", "fire"],
  river: ["earth", "water", "life"],
  swamp: ["death", "water", "earth"],
  tundra: ["water", "earth", "life"],
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

// Runi flat base PP bonus
export const RUNI_FLAT_ADD: Record<PlotPlannerData["runi"], number> = {
  none: 0,
  regular: 1500, // +1.5k base PP
  gold: 10000, // +10k base PP
};

export const cardSetModifiers: Record<CardSetNameLandValid, number> = {
  alpha: 10,
  beta: 5,
  untamed: 2,
  chaos: 1,
  rebellion: 0.5,
  conclave: 0.5,
  land: 1,
};

export const cardSetIconMap: Record<CardSetNameLandValid, string> = {
  alpha: edition_alpha_icon_url,
  beta: edition_beta_icon_url,
  untamed: edition_untamed_icon_url,
  chaos: edition_chaos_icon_url,
  rebellion: edition_rebellion_icon_url,
  conclave: edition_conclave_arcana_icon_url,
  land: edition_land_card_icon_url,
};

export const cardFoilOptions = [
  "regular",
  "gold",
  "gold arcane",
  "black",
  "black arcane",
];
export type CardFoil = (typeof cardFoilOptions)[number];

export const cardFoilModifiers: Record<CardFoil, number> = {
  regular: 1,
  gold: 1,
  "gold arcane": 5,
  black: 5,
  "black arcane": 5,
};

export const cardFoilModifiersLandCard: Record<CardFoil, number> = {
  regular: 2,
  gold: 1.25,
  "gold arcane": 1.25,
  black: 2.5,
  "black arcane": 2.5,
};

export const cardFoilSuffixMap: Record<CardFoil, string> = {
  regular: "",
  gold: "_gold",
  "gold arcane": "_gold",
  black: "_blk",
  "black arcane": "_blk",
};

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
  TERRAIN_BONUS
) as DeedType[];

export const worksiteTypeOptions = [
  "Grain Farm",
  "Logging Camp",
  "Ore Mine",
  "Quarry",
  "Research Hut",
  "Aura Lab",
  "Shard Mine",
  "KEEP",
  "CASTLE",
];

export type WorksiteType = (typeof worksiteTypeOptions)[number];

export const resourceWorksiteMap: Record<
  WorksiteType,
  Exclude<Resource, "VOUCHER" | "DEC">
> = {
  "Grain Farm": "GRAIN",
  "Logging Camp": "WOOD",
  "Ore Mine": "IRON",
  Quarry: "STONE",
  "Research Hut": "RESEARCH",
  "Aura Lab": "AURA",
  "Shard Mine": "SPS",
  KEEP: "TAX",
  CASTLE: "TAX",
};

export const worksiteIconMap: Record<WorksiteType, string> = {
  "Grain Farm": land_grain_farm_icon_url,
  "Logging Camp": land_logging_camp_icon_url,
  "Ore Mine": land_ore_mine_icon_url,
  Quarry: land_quarry_icon_url,
  "Research Hut": land_research_hut_icon_url,
  "Aura Lab": land_aura_lab_icon_url,
  "Shard Mine": land_shard_mine_icon_url,
  KEEP: land_keep_icon_url,
  CASTLE: land_castle_icon_url,
};

export const allowedTerrainsByWorksite: Partial<
  Record<WorksiteType, DeedType[]>
> = {
  "Grain Farm": ["plains", "river", "bog", "lake"],
  "Logging Camp": ["swamp", "forest", "tundra", "jungle"],
  Quarry: ["desert", "canyon", "hills"],
  "Ore Mine": ["mountain", "badlands", "caldera"],
  // not restricting these by terrain per spec:
  "Research Hut": undefined,
  "Aura Lab": undefined,
  "Shard Mine": undefined,
  // CASTLE/KEEP handled via plotStatus rule below
  CASTLE: undefined,
  KEEP: undefined,
};

export const deedResourceBoostRules: Record<PlotStatus, WorksiteType[]> = {
  magical: ["Research Hut", "Aura Lab"],
  occupied: ["Shard Mine"],
};

export const CARD_BLOODLINES = [
  "Avian",
  "Awakened Beast",
  "Bruteborn",
  "Canisan",
  "Celestial",
  "Chimeric Beast",
  "Corrupted",
  "Dhampir",
  "Divine Construct",
  "Djinn",
  "Dragon",
  "Dragonkin",
  "Drakoshan",
  "Dwarf",
  "Elemental",
  "Elf",
  "Feliform",
  "Fey",
  "Fiend",
  "Fungoid",
  "Giant",
  "Gnome",
  "Goblin",
  "Golem",
  "Halfling",
  "Human",
  "Leonine",
  "Llamataur",
  "Lycanthrope",
  "Materran",
  "Minotaur",
  "Mundane Beast",
  "Orc",
  "Plant",
  "Rodentian",
  "Saurian",
  "Skitterkin",
  "Suidae",
  "Tideborn",
  "Tortisian",
  "Treefolk",
  "Ulund",
  "Undead",
] as const;

export type CardBloodline = (typeof CARD_BLOODLINES)[number];
export const cardBloodlineOptions = [...CARD_BLOODLINES];

export const bountifulResourceIconMap: Partial<Record<Resource, string>> = {
  GRAIN: bountiful_grain_icon_url,
  WOOD: bountiful_wood_icon_url,
  IRON: bountiful_iron_icon_url,
  STONE: bountiful_stone_icon_url,
  AURA: bountiful_aura_icon_url,
};
