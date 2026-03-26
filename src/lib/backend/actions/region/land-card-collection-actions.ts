"use server";

import { RarityLevelCounts } from "@/types/LandcardCollection";
import { getLandCardCollectionRawData } from "../../api/internal/land-card-collection-data";

export type LandCardSetSummary = {
  card_set: string;
  total_cards: number;
  foil_regular: number;
  foil_gold: number;
  foil_gold_arcane: number;
  foil_black: number;
  foil_black_arcane: number;
  land_base_pp: number;
  owned: number;
  rented: number;
  delegated: number;
  player_count: number;
  // rarity name ("common".."legendary") -> level -> foil name ("regular","gold arcane", etc.) -> total count
  rarity_level_counts: RarityLevelCounts;
};

export type LandCardCollectionResult = {
  editionSummary: LandCardSetSummary[];
  lastUpdated: Date | null;
  totalRows: number;
};

export async function getLandCardCollectionData(filters?: {
  filter_players?: string[];
}): Promise<LandCardCollectionResult> {
  const { rows, date } = await getLandCardCollectionRawData(
    filters?.filter_players
  );

  // Aggregate per-player rows into per-card_set summaries in-memory
  const byCardSet = new Map<string, LandCardSetSummary>();

  for (const row of rows) {
    let agg = byCardSet.get(row.card_set);
    if (!agg) {
      agg = {
        card_set: row.card_set,
        total_cards: 0,
        foil_regular: 0,
        foil_gold: 0,
        foil_gold_arcane: 0,
        foil_black: 0,
        foil_black_arcane: 0,
        land_base_pp: 0,
        owned: 0,
        rented: 0,
        delegated: 0,
        player_count: 0,
        rarity_level_counts: {},
      };
      byCardSet.set(row.card_set, agg);
    }

    agg.total_cards += row.total_cards;
    agg.foil_regular += row.foil_regular;
    agg.foil_gold += row.foil_gold;
    agg.foil_gold_arcane += row.foil_gold_arcane;
    agg.foil_black += row.foil_black;
    agg.foil_black_arcane += row.foil_black_arcane;
    agg.land_base_pp += row.land_base_pp;
    agg.owned += row.owned;
    agg.rented += row.rented;
    agg.delegated += row.delegated;
    agg.player_count += 1;

    // Merge rarity_level_counts JSON
    const rlc = row.rarity_level_counts as RarityLevelCounts;
    for (const [rarity, levels] of Object.entries(rlc)) {
      if (!agg.rarity_level_counts[rarity])
        agg.rarity_level_counts[rarity] = {};
      for (const [level, foils] of Object.entries(levels)) {
        if (!agg.rarity_level_counts[rarity][level])
          agg.rarity_level_counts[rarity][level] = {};
        for (const [foilName, count] of Object.entries(foils)) {
          agg.rarity_level_counts[rarity][level][foilName] =
            (agg.rarity_level_counts[rarity][level][foilName] ?? 0) +
            (count ?? 0);
        }
      }
    }
  }

  const editionSummary = Array.from(byCardSet.values()).sort((a, b) =>
    a.card_set.localeCompare(b.card_set)
  );

  return { editionSummary, lastUpdated: date, totalRows: rows.length };
}
