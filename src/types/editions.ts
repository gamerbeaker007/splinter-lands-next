import {
  edition_alpha_icon_url,
  edition_beta_icon_url,
  edition_chaos_icon_url,
  edition_conclave_arcana_icon_url,
  edition_conclave_extra_icon_url,
  edition_conclave_rewards_icon_url,
  edition_dice_icon_url,
  edition_escalation_icon_url,
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
  edition_verico_icon_url,
} from "@/lib/shared/statics_icon_urls";

export const landCardSet = [
  "alpha",
  "beta",
  "untamed",
  "chaos",
  "rebellion",
  "conclave",
  "land",
  "verico",
];

export const cardSetName = [...landCardSet, "gladius", "foundation"] as const;

export type CardSetName = (typeof cardSetName)[number];
export type CardSetNameLandValid = (typeof landCardSet)[number];

export interface EidtionTypeDef {
  displayName: string;
  urlName: string;
  setName?: CardSetName;
  editionIcon?: string;
}

export const editionMap: Record<number, EidtionTypeDef> = {
  0: {
    displayName: "Alpha",
    urlName: "alpha",
    setName: "alpha",
    editionIcon: edition_alpha_icon_url,
  },
  1: {
    displayName: "Beta",
    urlName: "beta",
    setName: "beta",
    editionIcon: edition_beta_icon_url,
  },
  2: {
    displayName: "Promo",
    urlName: "promo",
    editionIcon: edition_promo_icon_url,
  },
  3: {
    displayName: "Reward",
    urlName: "reward",
    editionIcon: edition_reward_icon_url,
  },
  4: {
    displayName: "Untamed",
    urlName: "untamed",
    setName: "untamed",
    editionIcon: edition_untamed_icon_url,
  },
  5: {
    displayName: "Dice",
    urlName: "dice",
    setName: "untamed",
    editionIcon: edition_dice_icon_url,
  },
  6: {
    displayName: "Gladius",
    urlName: "gladius",
    setName: "gladius",
    editionIcon: edition_gladius_icon_url,
  },
  7: {
    displayName: "Chaos",
    urlName: "chaos",
    setName: "chaos",
    editionIcon: edition_chaos_icon_url,
  },
  8: {
    displayName: "Rift",
    urlName: "rift",
    setName: "chaos",
    editionIcon: edition_rift_icon_url,
  },
  9: {
    displayName: "Soulkeep", //mostly ignored in this app
    urlName: "soulkeep",
    editionIcon: edition_soulkeep_icon_url,
  },
  10: {
    displayName: "Soulbound", // Soulbound chaos legion
    urlName: "soulbound",
    setName: "chaos",
    editionIcon: edition_soulbound_icon_url,
  },
  11: {
    displayName: "Soulkeep ?", // also Soulkeep not sure what this is
    urlName: "soulkeep",
    editionIcon: edition_soulkeep_icon_url,
  },
  12: {
    displayName: "Rebellion",
    urlName: "rebellion",
    setName: "rebellion",
    editionIcon: edition_rebellion_icon_url,
  },
  13: {
    displayName: "Soulbound Rebellion",
    urlName: "soulboundrb",
    setName: "rebellion",
    editionIcon: edition_soulbound_rebellion_icon_url,
  },
  14: {
    displayName: "Conclave Arcana",
    urlName: "conclave",
    setName: "conclave",
    editionIcon: edition_conclave_arcana_icon_url,
  },
  15: {
    displayName: "Foundation",
    urlName: "foundations",
    setName: "foundation",
    editionIcon: edition_foundation_icon_url,
  },
  16: {
    displayName: "Soulbound Foundation",
    urlName: "foundations",
    setName: "foundation",
    editionIcon: edition_foundation_icon_url,
  },
  17: {
    displayName: "Conclave Extra",
    urlName: "extra",
    setName: "conclave",
    editionIcon: edition_conclave_extra_icon_url,
  },
  18: {
    displayName: "Conclave Rewards",
    urlName: "reward",
    setName: "conclave",
    editionIcon: edition_conclave_rewards_icon_url,
  },
  19: {
    displayName: "Land",
    urlName: "land",
    setName: "land",
    editionIcon: edition_land_card_icon_url,
  },
  20: {
    displayName: "Escalation",
    urlName: "escalation",
    setName: "escalation",
    editionIcon: edition_escalation_icon_url,
  },
  21: {
    displayName: "Verico",
    urlName: "verico",
    setName: "verico",
    editionIcon: edition_verico_icon_url,
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
  verico: edition_verico_icon_url,
};

export const SOULBOUND_EDITIONS = new Set<number>([10, 13, 16]);

/** Cross-era edition ids shared across sets (set is taken from the card). */
export const CROSS_ERA_EDITIONS = { promo: 2, reward: 3, extra: 17 } as const;
