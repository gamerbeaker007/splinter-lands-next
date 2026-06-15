import { CardSetNameLandValid } from "./editions";
import { CardElement, CardFoil, CardRarity } from "./planner";

export type CardFilterOptions = {
  onWagon?: boolean;
  inSet?: boolean;
  /** Card is listed on the market */
  isListed?: boolean;
  /** Owned by the player (vs delegated in). */
  owned?: boolean;
  /** Delegated out to another account. */
  delegated?: boolean;
  /** Has an active land (unstake) cooldown. */
  landCooldown?: boolean;
  /** Has an active survival cooldown. */
  survivalCooldown?: boolean;
  /** Only cards not used in at least this many days (0 = no filter). */
  lastUsedDays?: number;
  rarities: CardRarity[];
  sets: CardSetNameLandValid[];
  /** Selected native edition ids (empty = all). Driven by the edition/set filter. */
  editions: number[];
  /** Set names whose cross-era Promo (edition 2) cards are selected. */
  promoSets: string[];
  /** Set names whose cross-era Reward (edition 3) cards are selected. */
  rewardSets: string[];
  /** Set names whose cross-era Extra (edition 17) cards are selected. */
  extraSets: string[];
  elements: CardElement[];
  foils: CardFoil[];
  minPP: number;
};
