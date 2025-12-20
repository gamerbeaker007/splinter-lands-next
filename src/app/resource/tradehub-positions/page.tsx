import TradeHubPositionPage from "@/components/resource/trade-hub-positions/TradeHubPositionsPage";
import { getPlayerTradeHubPosition } from "@/lib/backend/actions/resources/trade-hub-actions";
import { headers } from "next/headers";
import { Suspense } from "react";

async function TradeHubPositionsContent() {
  // Make this route dynamic by accessing connection
  await headers();

  const groupedPlayerTradeHubPosition = await getPlayerTradeHubPosition(false);

  return (
    <TradeHubPositionPage
      groupedPlayerTradeHubPosition={groupedPlayerTradeHubPosition}
    />
  );
}

export default async function TradeHubPositions() {
  return (
    <Suspense fallback={<div>Loading Trade Hub Positions...</div>}>
      <TradeHubPositionsContent />
    </Suspense>
  );
}
