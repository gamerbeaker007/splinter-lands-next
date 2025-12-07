import { PlayerTradeHubPosition } from "@/generated/prisma";
import { getPlayerTradeHubPositionData } from "@/lib/backend/api/internal/player-trade-hub-data";
import { logError } from "@/lib/backend/log/logUtils";
import { NextResponse } from "next/server";

export type groupedPlayerTradeHubPosition = {
  date: Date | null;
  tokens: Record<string, PlayerTradeHubPosition[]>;
};

export async function GET() {
  try {
    const data = await getPlayerTradeHubPositionData();

    const result = groupByToken(data);
    result.date = getDate(data);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logError("Failed to load data", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 501 });
  }
}

function groupByToken(
  rows: PlayerTradeHubPosition[]
): groupedPlayerTradeHubPosition {
  return rows.reduce<groupedPlayerTradeHubPosition>(
    (acc, row) => {
      if (!acc.tokens[row.token]) {
        acc.tokens[row.token] = [];
      }
      acc.tokens[row.token].push(row);
      return acc;
    },
    { date: null, tokens: {} }
  );
}
function getDate(data: PlayerTradeHubPosition[]): Date | null {
  if (data.length > 0 && data[0].date) {
    return new Date(data[0].date);
  }
  return null; // fallback
}
