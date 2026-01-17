"use client";

import PlaygroundPageSkeleton from "@/app/planning/playground/loading";
import PlaygroundPageContent from "@/components/planning/playground/PlaygroundPageContent";
import { getCardDetails } from "@/lib/backend/actions/card-detail-actions";
import { getDailySPSRatio } from "@/lib/backend/actions/region/sps-actions";
import { getRegionTax as getDailyRegionTax } from "@/lib/backend/actions/region/tax-actions";
import { Suspense, useEffect, useState } from "react";

export default function PlaygroundPage() {
  const [data, setData] = useState<{
    cardDetails: Awaited<ReturnType<typeof getCardDetails>>;
    regionTax: Awaited<ReturnType<typeof getDailyRegionTax>>;
    spsRatio: Awaited<ReturnType<typeof getDailySPSRatio>>;
  } | null>(null);

  useEffect(() => {
    // Fetch data on client side
    Promise.all([
      getCardDetails(),
      getDailyRegionTax(),
      getDailySPSRatio(),
    ]).then(([cardDetails, regionTax, spsRatio]) => {
      setData({ cardDetails, regionTax, spsRatio });
    });
  }, []);

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
