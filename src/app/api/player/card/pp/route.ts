import { getCachedPlayerCardCollection } from "@/lib/backend/services/playerService";
import { NextResponse } from "next/server";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";

export type CardPPResult = {
  top100BasePP: GroupedCardRow[];
  top100PPRatio: GroupedCardRow[];
};

// ---- Helper / result types ----
type Tri = "include" | "exclude" | "any";

export type CardFilters = {
  onLand?: Tri; // include: (stake_plot != null && stake_end_date == null)
  inSet?: Tri; // include: (set_id != null)
  onWagon?: Tri; // include: (wagon_uid != null)
};

export type GroupedCardRow = {
  card_detail_id: number;
  bcx: number;
  foil: number;
  base_pp: number; // per-card base PP (parsed from string)
  land_dec_stake_needed: number; // per-card stake DEC
  ratio: number; // base_pp / land_dec_stake_needed
  count: number; // how many identical (detail_id, bcx, foil)
};

export async function POST(req: Request) {
  try {
    const { player, force, filters } = await req.json();

    if (!player) {
      return NextResponse.json(
        { error: "Missing 'player' parameter" },
        { status: 400 },
      );
    }

    const playerCardCollection = await getCachedPlayerCardCollection(
      player,
      force,
    );

    const topByBasePP1 = top100ByBasePP(playerCardCollection, filters);
    const topByPPtoDecRatio = top100ByPPtoDecRatio(
      playerCardCollection,
      filters,
    );

    return NextResponse.json(
      {
        top100BasePP: topByBasePP1,
        top100PPRatio: topByPPtoDecRatio,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    const isNotFound = message.toLowerCase().includes("not found");
    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : 501 },
    );
  }
}

// ---- Core helpers ----
const parsePP = (ppStr: string | number | null | undefined): number => {
  if (ppStr == null) return 0;
  const n = typeof ppStr === "number" ? ppStr : parseFloat(ppStr);
  return Number.isFinite(n) ? n : 0;
};

const boolTest = (cond: boolean, mode: Tri | undefined): boolean => {
  if (!mode || mode === "any") return true;
  return mode === "include" ? cond : !cond;
};

const buildPredicate = (filters?: CardFilters) => {
  const { onLand = "any", inSet = "any", onWagon = "any" } = filters ?? {};
  return (c: SplPlayerCardCollection): boolean => {
    // onLand
    const isOnLand = c.stake_plot != null && c.stake_end_date == null;
    if (!boolTest(isOnLand, onLand)) return false;

    // inSet
    const isInSet = c.set_id != null;
    if (!boolTest(isInSet, inSet)) return false;

    // onWagon
    const hasWagon = c.wagon_uid != null;
    if (!boolTest(hasWagon, onWagon)) return false;

    return true;
  };
};

const groupKey = (c: SplPlayerCardCollection) =>
  `${c.card_detail_id}|${c.bcx}|${c.foil}`;

// We assume identical (detail_id, bcx, foil) share same base_pp/dec_need per card.
const groupCards = (
  cards: SplPlayerCardCollection[],
): Map<string, GroupedCardRow> => {
  const map = new Map<string, GroupedCardRow>();

  for (const c of cards) {
    const key = groupKey(c);
    const base_pp = parsePP(c.land_base_pp);
    const decNeed = c.land_dec_stake_needed ?? 0;

    const ratio =
      decNeed > 0
        ? base_pp / decNeed
        : base_pp > 0
          ? Number.POSITIVE_INFINITY
          : 0;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        card_detail_id: c.card_detail_id,
        bcx: c.bcx,
        foil: c.foil,
        base_pp,
        land_dec_stake_needed: decNeed,
        ratio,
        count: 1,
      });
    } else {
      existing.count += 1;
    }
  }

  return map;
};

/**
 * Top 100 groups by (base_pp / land_dec_stake_needed) DESC.
 * Applies tri-state filters and groups identical (detail_id, bcx, foil).
 */
function top100ByPPtoDecRatio(
  data: SplPlayerCardCollection[],
  filters?: CardFilters,
): GroupedCardRow[] {
  const filtered = data.filter(buildPredicate(filters));

  const grouped = groupCards(filtered);

  return Array.from(grouped.values())
    .sort((a, b) => {
      // DESC by ratio, then DESC by base_pp as tiebreaker, then DESC by count
      if (b.ratio !== a.ratio) return b.ratio - a.ratio;
      if (b.base_pp !== a.base_pp) return b.base_pp - a.base_pp;
      return b.count - a.count;
    })
    .slice(0, 100);
}

/**
 * Top 100 groups by base_pp DESC.
 * Applies tri-state filters and groups identical (detail_id, bcx, foil).
 */
function top100ByBasePP(
  data: SplPlayerCardCollection[],
  filters?: CardFilters,
): GroupedCardRow[] {
  const filtered = data.filter(buildPredicate(filters));

  const grouped = groupCards(filtered);

  return Array.from(grouped.values())
    .sort((a, b) => {
      // DESC by base_pp, then DESC by ratio, then DESC by count
      if (b.base_pp !== a.base_pp) return b.base_pp - a.base_pp;
      if (b.ratio !== a.ratio) return b.ratio - a.ratio;
      return b.count - a.count;
    })
    .slice(0, 100);
}
