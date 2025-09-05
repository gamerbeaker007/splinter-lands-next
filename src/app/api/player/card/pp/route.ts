import { filterCardCollection } from "@/lib/backend/helpers/filterPlayerCards";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { getCachedPlayerCardCollection } from "@/lib/backend/services/playerService";
import { GroupedCardRow } from "@/types/GroupedCardRow";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { player, force, cardFilters } = await req.json();

    if (!player) {
      return NextResponse.json(
        { error: "Missing 'player' parameter" },
        { status: 400 },
      );
    }

    console.log("Received Filter: ", cardFilters);

    const playerCardCollection = await getCachedPlayerCardCollection(
      player,
      force,
    );

    const cardDetails = await getCachedCardDetailsData();

    const filtered = filterCardCollection(
      playerCardCollection,
      cardDetails,
      cardFilters,
    );
    const topByBasePP1 = top100ByBasePP(filtered);
    const topByPPtoDecRatio = top100ByPPtoDecRatio(filtered);

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

const parsePP = (ppStr: string | number | null | undefined): number => {
  if (ppStr == null) return 0;
  const n = typeof ppStr === "number" ? ppStr : parseFloat(ppStr);
  return Number.isFinite(n) ? n : 0;
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
): GroupedCardRow[] {
  const grouped = groupCards(data);

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
function top100ByBasePP(data: SplPlayerCardCollection[]): GroupedCardRow[] {
  const grouped = groupCards(data);

  return Array.from(grouped.values())
    .sort((a, b) => {
      // DESC by base_pp, then DESC by ratio, then DESC by count
      if (b.base_pp !== a.base_pp) return b.base_pp - a.base_pp;
      if (b.ratio !== a.ratio) return b.ratio - a.ratio;
      return b.count - a.count;
    })
    .slice(0, 100);
}
