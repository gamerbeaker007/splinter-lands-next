import { totem_fragment_icon_url } from "@/lib/shared/statics_icon_urls";

export type TotemFragmentRarity = "common" | "rare" | "epic" | "legendary";

// The engine reports the drop as a code — "TOTEMFC" (totem fragment, common).
// Only the trailing rarity letter varies, so one map covers every code.
const RARITY_BY_SUFFIX: Record<string, TotemFragmentRarity> = {
  C: "common",
  R: "rare",
  E: "epic",
  L: "legendary",
};

/** "TOTEMFC" → "common". Null for an unknown/absent code. */
export function totemFragmentRarity(
  fragmentType: string | null | undefined
): TotemFragmentRarity | null {
  if (!fragmentType) return null;
  const match = /^TOTEMF?([CREL])$/.exec(fragmentType.trim().toUpperCase());
  return match ? RARITY_BY_SUFFIX[match[1]] : null;
}

/** Artwork for a fragment code, e.g. "TOTEMFC" → fragment_common.png. */
export function totemFragmentImg(
  fragmentType: string | null | undefined
): string | null {
  const rarity = totemFragmentRarity(fragmentType);
  return rarity ? totem_fragment_icon_url(rarity) : null;
}

/** Display name for a fragment code, e.g. "TOTEMFC" → "Common Totem Fragment". */
export function totemFragmentLabel(
  fragmentType: string | null | undefined
): string {
  const rarity = totemFragmentRarity(fragmentType);
  if (!rarity) return fragmentType || "Totem Fragment";
  return `${rarity[0].toUpperCase()}${rarity.slice(1)} Totem Fragment`;
}
