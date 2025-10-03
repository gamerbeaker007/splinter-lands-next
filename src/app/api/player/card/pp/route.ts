import { validateCsrfToken } from "@/lib/backend/csrf";
import { filterCardCollection } from "@/lib/backend/helpers/filterPlayerCards";
import { validateSplJwt } from "@/lib/backend/jwt/splJwtValidation";
import { logError } from "@/lib/backend/log/logUtils";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { getCachedPlayerCardCollection } from "@/lib/backend/services/playerService";
import { determineCardInfo } from "@/lib/utils/cardUtil";
import { GroupedCardRow } from "@/types/groupedCardRow";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    let player, force, cardFilters, requestBody;
    try {
      requestBody = await request.json();
      player = requestBody.player;
      force = requestBody.force || false;
      cardFilters = requestBody.cardFilters || {};
    } catch (err) {
      logError("Failed to parse JSON body in login request", err);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }
    // Validate CSRF token
    const csrfValidation = await validateCsrfToken(request, requestBody);
    if (!csrfValidation.isValid) {
      return NextResponse.json(
        { error: csrfValidation.error },
        { status: 403 },
      );
    }

    // Validate JWT token if present (for authenticated requests)
    const jwtToken = request.cookies.get("jwt_token")?.value;
    if (jwtToken) {
      const jwtValidation = await validateSplJwt(jwtToken);
      if (!jwtValidation.valid) {
        // Clear expired JWT token (the other cookies are just convenience)
        const response = NextResponse.json(
          {
            error: "Authentication expired. Please log in again.",
            expired: true,
          },
          { status: 401 },
        );

        response.cookies.delete("jwt_token");
        return response;
      }
    }

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
      player,
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

    const landUsedDate = c.last_used_date;
    const stakeEndDate = c.stake_end_date;
    const survivalDate = c.survival_date;

    if (!existing) {
      map.set(key, {
        name: name,
        card_detail_id: c.card_detail_id,
        set: c.card_set,
        level: c.level,
        rarity: rarity,
        edition: c.edition,
        bcx: c.bcx,
        foil: c.foil,
        basePP: basePP,
        landDecStakeNeeded: decNeed,
        ratio,
        count: 1,
        lastUsedDate: landUsedDate
          ? { [c.uid]: new Date(landUsedDate) }
          : undefined,
        stakeEndDate: stakeEndDate
          ? { [c.uid]: new Date(stakeEndDate) }
          : undefined,
        survivalDate: survivalDate
          ? { [c.uid]: new Date(survivalDate) }
          : undefined,
      });
    } else {
      existing.count += 1;
      if (landUsedDate) {
        if (!existing.lastUsedDate) existing.lastUsedDate = {};
        existing.lastUsedDate[c.uid] = new Date(landUsedDate);
      }
      if (stakeEndDate) {
        if (!existing.stakeEndDate) existing.stakeEndDate = {};
        existing.stakeEndDate[c.uid] = new Date(stakeEndDate);
      }
      if (survivalDate) {
        if (!existing.survivalDate) existing.survivalDate = {};
        existing.survivalDate[c.uid] = new Date(survivalDate);
      }
    }
  }

  return map;
};
