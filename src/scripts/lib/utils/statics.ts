import {
  resource_grain_icon_url,
  resource_stone_icon_url,
  resource_wood_icon_url,
  resource_iron_icon_url,
  resource_aura_icon_url,
  resource_research_icon_url,
  resource_tax_icon_url,
  resource_sps_icon_url,
} from "@/scripts/statics_icon_urls";

export const NATURAL_RESOURCES = ["GRAIN", "WOOD", "STONE", "IRON"];
export const MULTIPLE_CONSUMING_RESOURCES = new Set([
  "RESEARCH",
  "AURA",
  "SPS",
]);
export const CONSUMES_ONLY_GRAIN = new Set(NATURAL_RESOURCES);
export const PRODUCING_RESOURCES = [
  "GRAIN",
  "WOOD",
  "STONE",
  "IRON",
  "RESEARCH",
  "AURA",
  "SPS",
];

export const CONSUME_RATES: Record<string, number> = {
  GRAIN: 0.01,
  WOOD: 0.005,
  STONE: 0.002,
  IRON: 0.0005,
};

export const GRAIN_CONVERSION_RATIOS: Record<string, number> = {
  GRAIN: 1,
  WOOD: 4,
  STONE: 10,
  IRON: 40,
};

export const resourceIconMapping: Record<string, string> = {
  grain: resource_grain_icon_url,
  stone: resource_stone_icon_url,
  wood: resource_wood_icon_url,
  iron: resource_iron_icon_url,
  aura: resource_aura_icon_url,
  research: resource_research_icon_url,
  tax: resource_tax_icon_url,
  sps: resource_sps_icon_url,
};

export const RESOURCE_COLOR_MAP: Record<string, string> = {
  GRAIN: "orange",
  IRON: "olive",
  RESEARCH: "lightblue",
  SPS: "yellow",
  STONE: "gray",
  WOOD: "saddlebrown",
  AURA: "mediumorchid",
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
