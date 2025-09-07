import { filterCardCollection } from "@/lib/backend/helpers/filterPlayerCards";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { getCachedPlayerCardCollection } from "@/lib/backend/services/playerService";
import { determineCardInfo } from "@/lib/utils/cardUtil";
import { GroupedCardRow } from "@/types/groupedCardRow";
import { SplCardDetails } from "@/types/splCardDetails";
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
    const grouped = groupCards(filtered, cardDetails);
    return NextResponse.json(
      {
        cards: Array.from(grouped.values()),
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
  cardDetails: SplCardDetails[],
): Map<string, GroupedCardRow> => {
  const map = new Map<string, GroupedCardRow>();

  for (const c of cards) {
    const key = groupKey(c);
    const basePP = parsePP(c.land_base_pp);
    const decNeed = c.land_dec_stake_needed ?? 0;
    const { name, rarity } = determineCardInfo(c.card_detail_id, cardDetails);

    const ratio =
      decNeed > 0
        ? basePP / decNeed
        : basePP > 0
          ? Number.POSITIVE_INFINITY
          : 0;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        uid: c.uid, // unique id of first card in group
        card_detail_id: c.card_detail_id,
        set: c.card_set,
        name: name,
        level: c.level,
        rarity: rarity,
        edition: c.edition,
        bcx: c.bcx,
        foil: c.foil,
        basePP: basePP,
        landDecStakeNeeded: decNeed,
        ratio,
        count: 1,
      });
    } else {
      existing.count += 1;
    }
  }

  return map;
};
