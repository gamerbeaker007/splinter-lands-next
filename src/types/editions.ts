import {
  edition_alpha_icon_url,
  edition_beta_icon_url,
  edition_chaos_icon_url,
  edition_conclave_arcana_icon_url,
  edition_conclave_extra_icon_url,
  edition_conclave_rewards_icon_url,
  edition_foundation_icon_url,
  edition_gladius_icon_url,
  edition_land_card_icon_url,
  edition_promo_icon_url,
  edition_rebellion_icon_url,
  edition_reward_icon_url,
  edition_rift_icon_url,
  edition_soulbound_icon_url,
  edition_soulbound_rebellion_icon_url,
  edition_soulkeep_icon_url,
  edition_untamed_icon_url,
} from "@/lib/shared/statics_icon_urls";

export const landCardSet = [
  "alpha",
  "beta",
  "untamed",
  "chaos",
  "rebellion",
  "conclave",
  "land",
];

export const cardSetName = [...landCardSet, "gladius", "foundation"] as const;

export type CardSetName = (typeof cardSetName)[number];
export type CardSetNameLandValid = (typeof landCardSet)[number];

export interface EidtionTypeDef {
  displayName: string;
  urlName: string;
  setName?: CardSetName;
  setIcon?: string;
}

export const editionMap: Record<number, EidtionTypeDef> = {
  0: {
    displayName: "Alpha",
    urlName: "alpha",
    setName: "alpha",
    setIcon: edition_alpha_icon_url,
  },
  1: {
    displayName: "Beta",
    urlName: "beta",
    setName: "beta",
    setIcon: edition_beta_icon_url,
  },
  2: {
    displayName: "Promo",
    urlName: "promo",
    setIcon: edition_promo_icon_url,
  },
  3: {
    displayName: "Reward",
    urlName: "reward",
    setIcon: edition_reward_icon_url,
  },
  4: {
    displayName: "Untamed",
    urlName: "untamed",
    setName: "untamed",
    setIcon: edition_untamed_icon_url,
  },
  5: {
    displayName: "Dice",
    urlName: "dice",
    setName: "untamed",
  },
  6: {
    displayName: "Gladius",
    urlName: "gladius",
    setName: "gladius",
    setIcon: edition_gladius_icon_url,
  },
  7: {
    displayName: "Chaos",
    urlName: "chaos",
    setName: "chaos",
    setIcon: edition_chaos_icon_url,
  },
  8: {
    displayName: "Rift",
    urlName: "rift",
    setName: "chaos",
    setIcon: edition_rift_icon_url,
  },
  9: {
    displayName: "Soulkeep", //mostly ignored in this app
    urlName: "soulkeep",
    setIcon: edition_soulkeep_icon_url,
  },
  10: {
    displayName: "Soulbound", // Soulbound chaos legion
    urlName: "soulbound",
    setName: "chaos",
    setIcon: edition_soulbound_icon_url,
  },
  11: {
    displayName: "Soulkeep ?", // also Soulkeep not sure what this is
    urlName: "soulkeep",
    setIcon: edition_soulkeep_icon_url,
  },
  12: {
    displayName: "Rebellion",
    urlName: "rebellion",
    setName: "rebellion",
    setIcon: edition_rebellion_icon_url,
  },
  13: {
    displayName: "Soulbound Rebellion",
    urlName: "soulboundrb",
    setName: "rebellion",
    setIcon: edition_soulbound_rebellion_icon_url,
  },
  14: {
    displayName: "Conclave Arcana",
    urlName: "conclave",
    setName: "conclave",
    setIcon: edition_conclave_arcana_icon_url,
  },
  15: {
    displayName: "Foundation",
    urlName: "foundations",
    setName: "foundation",
    setIcon: edition_foundation_icon_url,
  },
  16: {
    displayName: "Soulbound Foundation",
    urlName: "foundations",
    setName: "foundation",
    setIcon: edition_foundation_icon_url,
  },
  17: {
    displayName: "Conclave Extra",
    urlName: "extra",
    setName: "conclave",
    setIcon: edition_conclave_extra_icon_url,
  },
  18: {
    displayName: "Conclave Rewards",
    urlName: "reward",
    setName: "conclave",
    setIcon: edition_conclave_rewards_icon_url,
  },
  19: {
    displayName: "Land",
    urlName: "land",
    setName: "land",
    setIcon: edition_land_card_icon_url,
  },
} as const;

export const cardSetIconMap: Record<CardSetName, string> = {
  alpha: edition_alpha_icon_url,
  beta: edition_beta_icon_url,
  untamed: edition_untamed_icon_url,
  chaos: edition_chaos_icon_url,
  rebellion: edition_rebellion_icon_url,
  conclave: edition_conclave_arcana_icon_url,
  foundation: edition_foundation_icon_url,
  land: edition_land_card_icon_url,
};

export const SOULBOUND_EDITIONS = new Set<number>([10, 13, 16]);
