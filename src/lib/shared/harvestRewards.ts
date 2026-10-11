import { totemFragmentRarity } from "@/lib/utils/totemFragmentUtil";
import type { LaborsLuckTreasure, SplTrxResult } from "@/types/spl/trx";

/**
 * A special drop from a harvest: a Labor's Luck card (harvest_all and the DEC
 * power-up/down auto-harvest) or a totem fragment (tax_collection on a keep or
 * castle). Only the confirmed transaction payload says whether one dropped —
 * never the plan or the day log.
 */
export type HarvestReward =
  | { kind: "card"; key: string; treasure: LaborsLuckTreasure }
  | {
      kind: "fragment";
      key: string;
      /** Engine fragment code, e.g. "TOTEMFC". */
      fragmentType: string;
      deedUid: string;
    };

type MaybeResult = SplTrxResult | null | undefined;

/**
 * Labor's Luck cards awarded by the given confirmed transactions. Both
 * harvest_all and the DEC power-up/down auto-harvest carry per-deed harvest
 * results, so both can drop a treasure.
 */
export function laborsLuckIn(results: MaybeResult[]): LaborsLuckTreasure[] {
  const treasures: LaborsLuckTreasure[] = [];
  for (const parsed of results) {
    if (!parsed) continue;
    const deedResults =
      parsed.op === "harvest_all"
        ? parsed.result.results
        : parsed.op === "dec_powerup_region" ||
            parsed.op === "dec_powerdown_region"
          ? parsed.result.harvest_results
          : [];
    for (const deed of deedResults) {
      if (deed.labors_luck_treasure) treasures.push(deed.labors_luck_treasure);
    }
  }
  return treasures;
}

/** deed_uid → fragment code, from the confirmed tax_collection results. */
export function fragmentsIn(results: MaybeResult[]): Map<string, string> {
  const found = new Map<string, string>();
  for (const parsed of results) {
    if (parsed?.op !== "tax_collection") continue;
    const { deed_uid, fragment_found, fragment_type } = parsed.result;
    if (fragment_found && fragment_type) found.set(deed_uid, fragment_type);
  }
  return found;
}

/** Every special drop in the given confirmed transactions, cards first. */
export function harvestRewardsFrom(results: MaybeResult[]): HarvestReward[] {
  return [
    ...laborsLuckIn(results).map((treasure): HarvestReward => ({
      kind: "card",
      key: `card:${treasure.uid}`,
      treasure,
    })),
    ...[...fragmentsIn(results)].map(
      ([deedUid, fragmentType]): HarvestReward => ({
        kind: "fragment",
        key: `fragment:${deedUid}`,
        fragmentType,
        deedUid,
      })
    ),
  ];
}

const RARITY_ORDER = ["common", "rare", "epic", "legendary"];

/**
 * Reveal order: Labor's Luck cards first, then fragments from common up to
 * legendary. The sort is stable, so equal rarities keep their harvest order.
 */
export function revealOrder(rewards: HarvestReward[]): HarvestReward[] {
  const rank = (r: HarvestReward) =>
    r.kind === "card"
      ? -1
      : RARITY_ORDER.indexOf(totemFragmentRarity(r.fragmentType) ?? "common");
  return [...rewards].sort((a, b) => rank(a) - rank(b));
}
