import { CardSetName } from "./editions";
import { CardElement, CardFoil, CardRarity, LandBoost } from "./planner";

/**
 * A player's land-eligible card, normalized for display and scoring.
 *
 * Intentionally feature-neutral: consumed by both the planning Playground and
 * the Land Manager Production tab. Do not couple this to either feature — the
 * Playground may be removed in a future release.
 */
export type PlayerLandCard = {
  uid: string;
  cardDetailId: number;
  name: string;
  edition: number;
  set: CardSetName;
  rarity: CardRarity;
  element: CardElement;
  /** Secondary element for dual-element cards; null when single-color. */
  subElement: CardElement | null;
  landBasePP: number;
  lastUsedDate: string | null;
  bcx: number;
  bcxUnbound: number;
  foil: CardFoil;
  level: number;
  landBoost: LandBoost | null;
  inSet: boolean;
  onWagon: boolean;
  /** Currently staked on a land plot. */
  onLand: boolean;
  /** Owned by the player (not delegated in from another account). */
  owned: boolean;
  /** is listed on the market */
  isListed: boolean;
  /** Delegated out to another account. */
  delegated: boolean;
  /** Land (unstake) cooldown end date, if any. */
  landCooldownDate: string | null;
  /** Survival cooldown end date, if any. */
  survivalDate: string | null;
};
