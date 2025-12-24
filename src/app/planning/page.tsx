import PlanningPageSkeleton from "@/app/planning/loading";
import PlanningPageContent from "@/components/planning/PlanningPageContent";
import { getCardDetails } from "@/lib/backend/actions/card-detail-actions";
import { getMarketData } from "@/lib/backend/actions/market-actions";
import { getDailySPSRatio } from "@/lib/backend/actions/region/sps-actions";
import { getRegionTax as getDailyRegionTax } from "@/lib/backend/actions/region/tax-actions";
import {
  getActualResourcePrices,
  getTokenPrices,
} from "@/lib/backend/actions/resources/prices-actions";
import { headers } from "next/headers";
import { Suspense } from "react";

async function PlanningTab() {
  await headers(); // Ensure this is a server component
  const [cardDetails, prices, spsRatio, tokenPriceData, regionTax, marketData] =
    await Promise.all([
      getCardDetails(),
      getActualResourcePrices(),
      getDailySPSRatio(),
      getTokenPrices(),
      getDailyRegionTax(),
      getMarketData(),
    ]);

  return (
    <PlanningPageContent
      cardDetails={cardDetails}
      prices={prices}
      spsRatio={spsRatio}
      tokenPriceData={tokenPriceData}
      regionTax={regionTax}
      marketData={marketData}
    />
  );
}

export default function PlanningPage() {
  return (
    <Suspense fallback={<PlanningPageSkeleton />}>
      <PlanningTab />
    </Suspense>
  );
}
