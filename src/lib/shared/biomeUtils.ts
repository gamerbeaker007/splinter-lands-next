import {
  death_element_icon_url,
  dragon_element_icon_url,
  earth_element_icon_url,
  fire_element_icon_url,
  life_element_icon_url,
  water_element_icon_url,
} from "@/lib/shared/statics_icon_urls";

export const BIOME_KEYS = [
  "red",
  "blue",
  "white",
  "black",
  "green",
  "gold",
] as const;
export type BiomeKey = (typeof BIOME_KEYS)[number];

export const biomeColorMap: Record<BiomeKey, string> = {
  red: "red",
  blue: "blue",
  white: "gray",
  black: "purple",
  green: "green",
  gold: "gold",
};
export const biomeIconMap: Record<BiomeKey, string> = {
  red: fire_element_icon_url,
  blue: water_element_icon_url,
  white: life_element_icon_url,
  black: death_element_icon_url,
  green: earth_element_icon_url,
  gold: dragon_element_icon_url,
};

export const biomeLabelMap: Record<BiomeKey, string> = {
  red: "Fire",
  blue: "Water",
  white: "Life",
  black: "Death",
  green: "Earth",
  gold: "Dragon",
};

const BIOME_SET: ReadonlySet<string> = new Set(BIOME_KEYS);

/**
 * Maps a card's `color` (from the SPL card details API, e.g. "Red", "Blue",
 * "Gray") to the corresponding biome modifier key. Returns null for neutral
 * cards or unknown colors.
 */
export function biomeKeyForCardColor(
  color: string | undefined | null
): BiomeKey | null {
  if (!color) return null;
  const k = color.toLowerCase();
  return BIOME_SET.has(k) ? (k as BiomeKey) : null;
}
