"use client";

import PlaygroundPageSkeleton from "@/app/planning/playground/loading";
import PlaygroundPageContent from "@/components/planning/playground/PlaygroundPageContent";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getCardDetails } from "@/lib/backend/actions/card-detail-actions";
import { getDailySPSRatio } from "@/lib/backend/actions/region/sps-actions";
import { getRegionTax as getDailyRegionTax } from "@/lib/backend/actions/region/tax-actions";
import { Suspense } from "react";

export default function PlaygroundPage() {
  // Fetched on the client side
  const { data } = useAsyncData("playground-page", async () => {
    const [cardDetails, regionTax, spsRatio] = await Promise.all([
      getCardDetails(),
      getDailyRegionTax(),
      getDailySPSRatio(),
    ]);
    return { cardDetails, regionTax, spsRatio };
  });

  if (!data) {
    return <PlaygroundPageSkeleton />;
  }

  return (
    <Suspense fallback={<PlaygroundPageSkeleton />}>
      <PlaygroundPageContent
        cardDetails={data.cardDetails}
        regionTax={data.regionTax}
        spsRatio={data.spsRatio}
      />
    </Suspense>
  );
}
