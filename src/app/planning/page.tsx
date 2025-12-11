import PlanningPageSkeleton from "@/app/planning/loading";
import PlanningPageContent from "@/components/planning/PlanningPageContent";
import { getPlanningTokenPrices } from "@/lib/backend/actions/planningData";
import { getCardDetails } from "@/lib/backend/actions/playerPlanning";
import { getDailySPSRatio } from "@/lib/backend/actions/region/sps-actions";
import { getRegionTax as getDailyRegionTax } from "@/lib/backend/actions/region/tax-actions";
import { getActualResourcePrices } from "@/lib/backend/actions/resources/prices-actions";
import { Container } from "@mui/material";
import { headers } from "next/headers";
import { Suspense } from "react";

async function PlanningTab() {
  await headers(); // Ensure this is a server component
  const [cardDetails, prices, spsRatio, tokenPriceData, regionTax] =
    await Promise.all([
      getCardDetails(),
      getActualResourcePrices(),
      getDailySPSRatio(),
      getPlanningTokenPrices(),
      getDailyRegionTax(),
    ]);

  return (
    <PlanningPageContent
      cardDetails={cardDetails}
      prices={prices}
      spsRatio={spsRatio}
      tokenPriceData={tokenPriceData}
      regionTax={regionTax}
    />
  );
}

export default function PlanningPage() {
  return (
    <Container maxWidth={false} sx={{ px: { xs: 1, md: 3, lg: 6 } }}>
      <Suspense fallback={<PlanningPageSkeleton />}>
        <PlanningTab />
      </Suspense>
    </Container>
  );
}
