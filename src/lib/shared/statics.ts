import {
  cinder_icon_url,
  dec_icon_url,
  land_aura_lab_icon_url,
  land_castle_icon_url,
  land_grain_farm_icon_url,
  land_hammer_icon_url,
  land_keep_icon_url,
  land_logging_camp_icon_url,
  land_ore_mine_icon_url,
  land_quarry_icon_url,
  land_research_hut_icon_url,
  land_shard_mine_icon_url,
  land_under_construction_icon_url,
  resource_auction_mark_icon_url,
  resource_aura_icon_url,
  resource_capacity_flux_icon_url,
  resource_fortune_ticket_icon_url,
  resource_grain_icon_url,
  resource_iron_icon_url,
  resource_midnight_potion_icon_url,
  resource_polymorph_potion_icon_url,
  resource_research_icon_url,
  resource_stone_icon_url,
  resource_tax_icon_url,
  resource_unbinding_common_icon_url,
  resource_unbinding_epic_icon_url,
  resource_unbinding_legendary_icon_url,
  resource_unbinding_rare_icon_url,
  resource_voucher_icon_url,
  resource_wagon_kit_icon_url,
  resource_wood_icon_url,
  sps_icon_url,
} from "@/lib/shared/statics_icon_urls";

export const NATURAL_RESOURCES = ["GRAIN", "WOOD", "STONE", "IRON"];
export const PRODUCING_RESOURCES = [
  "GRAIN",
  "WOOD",
  "STONE",
  "IRON",
  "RESEARCH",
  "AURA",
  "SPS",
];

export const DEFAULT_GRAIN_COST = 0.01;

export interface ResourceRecipeItem {
  qty: number;
  symbol: string;
}

export const DEFAULT_RECIPE: ResourceRecipeItem[] = [
  { symbol: "WOOD", qty: 0.005 },
  { symbol: "STONE", qty: 0.002 },
  { symbol: "IRON", qty: 0.0005 },
];

export const recipeMap: Record<string, ResourceRecipeItem[]> = {
  RESEARCH: DEFAULT_RECIPE,
  AURA: DEFAULT_RECIPE,
  SPS: DEFAULT_RECIPE,
};

export const PRODUCE_RATES: Record<string, number> = {
  GRAIN: 0.02,
  WOOD: 0.005,
  STONE: 0.002,
  IRON: 0.0005,
  AURA: 0.0005,
  RESEARCH: 0.0001,
};

export const GRAIN_CONVERSION_RATIOS: Record<string, number> = {
  GRAIN: 1,
  WOOD: 4,
  STONE: 10,
  IRON: 40,
};

export const RESOURCE_COLOR_MAP: Record<string, string> = {
  GRAIN: "orange",
  IRON: "olive",
  RESEARCH: "lightblue",
  SPS: "yellow",
  STONE: "gray",
  WOOD: "saddlebrown",
  AURA: "mediumorchid",
  TAX: "purple",
  "TAX CASTLE": "purple",
  "TAX KEEP": "lightsalmon",
};

export const DEFAULT_ORDER_RESOURCES = [
  "GRAIN",
  "WOOD",
  "STONE",
  "IRON",
  "RESEARCH",
  "AURA",
  "SPS",
  "TAX",
  "TAX CASTLE",
  "TAX KEEP",
  "",
];

export const RESOURCE_ICON_MAP: Record<string, string> = {
  GRAIN: resource_grain_icon_url,
  STONE: resource_stone_icon_url,
  WOOD: resource_wood_icon_url,
  IRON: resource_iron_icon_url,
  SPS: sps_icon_url,
  RESEARCH: resource_research_icon_url,
  VOUCHER: resource_voucher_icon_url,
  AURA: resource_aura_icon_url,
  TAX: resource_tax_icon_url,
  DEC: dec_icon_url,
  PP: land_hammer_icon_url,
  WAGONKIT: resource_wagon_kit_icon_url,
  AM: resource_auction_mark_icon_url,
  FT: resource_fortune_ticket_icon_url,
  MIDNIGHTPOT: resource_midnight_potion_icon_url,
  UNBIND_CA_C: resource_unbinding_common_icon_url,
  UNBIND_CA_R: resource_unbinding_rare_icon_url,
  UNBIND_CA_E: resource_unbinding_epic_icon_url,
  UNBIND_CA_L: resource_unbinding_legendary_icon_url,
  CINDER: cinder_icon_url,
  FLUX: resource_capacity_flux_icon_url,
  POLYMORPH: resource_polymorph_potion_icon_url,
  "": land_hammer_icon_url,
};

export const TRADE_HUB_FEE = 0.9;
export const TAX_RATE = 0.1;

export const worksiteTypeMapping: Record<string, string> = {
  "Grain Farm": land_grain_farm_icon_url,
  "Logging Camp": land_logging_camp_icon_url,
  "Ore Mine": land_ore_mine_icon_url,
  Quarry: land_quarry_icon_url,
  "Research Hut": land_research_hut_icon_url,
  "Aura Lab": land_aura_lab_icon_url,
  "Shard Mine": land_shard_mine_icon_url,
  KEEP: land_keep_icon_url,
  CASTLE: land_castle_icon_url,
  Undeveloped: land_under_construction_icon_url,
};
