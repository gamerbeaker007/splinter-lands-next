import { CardFilterOptions } from "@/types/cardFilter";
import {
  cardSetName,
  CardSetNameLandValid,
  editionMap,
  landCardSet,
} from "@/types/editions";
import {
  CardBloodline,
  CardElement,
  cardElementOptions,
  CardFoil,
  cardFoilOptions,
  CardRarity,
  cardRarityOptions,
} from "@/types/planner";

/**
 * Persistence of the card filter (drawer) settings in localStorage.
 *
 * The card filter is reused in several places, each with its own initial
 * configuration, so persistence is scoped per usage ("scope") and every
 * restored value is validated before it is applied:
 *
 * - Each scope gets its own storage key, so one usage never influences another.
 * - Keys a usage does not expose can be omitted; they are neither stored nor
 *   restored, so that usage's initial value keeps winning.
 * - Only values that are still valid options are restored; anything unknown,
 *   malformed or stale (renamed set, removed edition) is dropped and the
 *   usage's initial value is used instead.
 */

/** Bumped when the stored shape changes in a way older payloads can't satisfy. */
export const CARD_FILTER_STORAGE_VERSION = 1;

/** localStorage key for one card-filter usage. */
export function cardFilterStorageKey(scope: string): string {
  return `spl-card-filters:v${CARD_FILTER_STORAGE_VERSION}:${scope}`;
}

/** Keys a usage can exclude from persistence (it does not expose them). */
export type CardFilterOmitKey = keyof CardFilterOptions;

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asPositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value.slice(0, 100) : undefined;
}

/** Keep only the entries that are still known options (deduplicated). */
function asAllowedList<T extends string>(
  value: unknown,
  allowed: readonly string[]
): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const kept = value.filter(
    (entry): entry is T =>
      typeof entry === "string" && allowed.includes(entry as string)
  );
  return [...new Set(kept)];
}

function asEditionList(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const kept = value.filter(
    (entry): entry is number =>
      typeof entry === "number" && editionMap[entry] !== undefined
  );
  return [...new Set(kept)];
}

/** Bloodlines come from the backend, so only the shape can be validated. */
function asBloodlineList(value: unknown): CardBloodline[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const kept = value.filter(
    (entry): entry is CardBloodline =>
      typeof entry === "string" && entry.trim().length > 0
  );
  return [...new Set(kept)];
}

/**
 * Merge a persisted payload onto a usage's initial filter: every value is
 * validated, unknown/invalid values and omitted keys fall back to the initial.
 */
export function sanitizeCardFilters(
  raw: unknown,
  initial: CardFilterOptions,
  omit: readonly CardFilterOmitKey[] = []
): CardFilterOptions {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return initial;
  const stored = raw as Record<string, unknown>;
  const result: CardFilterOptions = { ...initial };

  const take = <K extends keyof CardFilterOptions>(
    key: K,
    parse: (value: unknown) => CardFilterOptions[K] | undefined
  ) => {
    if (omit.includes(key) || !(key in stored)) return;
    const parsed = parse(stored[key as string]);
    if (parsed !== undefined) result[key] = parsed;
  };

  take("cardName", asString);
  take("onWagon", asBoolean);
  take("inSet", asBoolean);
  take("isListed", asBoolean);
  take("owned", asBoolean);
  take("delegated", asBoolean);
  take("landCooldown", asBoolean);
  take("survivalCooldown", asBoolean);
  take("maxLevelOnly", asBoolean);
  take("lastUsedDays", asPositiveNumber);
  take("minPP", asPositiveNumber);
  take("maxPP", asPositiveNumber);
  take("rarities", (v) => asAllowedList<CardRarity>(v, cardRarityOptions));
  take("sets", (v) => asAllowedList<CardSetNameLandValid>(v, landCardSet));
  take("editions", asEditionList);
  take("promoSets", (v) => asAllowedList<string>(v, cardSetName));
  take("rewardSets", (v) => asAllowedList<string>(v, cardSetName));
  take("extraSets", (v) => asAllowedList<string>(v, cardSetName));
  take("elements", (v) => asAllowedList<CardElement>(v, cardElementOptions));
  take("foils", (v) => asAllowedList<CardFoil>(v, cardFoilOptions));
  take("bloodlines", asBloodlineList);

  return result;
}

/** Drop the keys a usage does not expose before writing to localStorage. */
export function stripOmittedCardFilters(
  filters: CardFilterOptions,
  omit: readonly CardFilterOmitKey[] = []
): Partial<CardFilterOptions> {
  if (omit.length === 0) return filters;
  const result: Partial<CardFilterOptions> = { ...filters };
  for (const key of omit) delete result[key];
  return result;
}
