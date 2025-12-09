import PlanningPageSkeleton from "@/app/planning/loading";
import PlanningTabNavigation from "@/app/planning/PlanningTabNavigation";
import PlanningPageContent from "@/components/planning/planner/PlanningPageContent";
import PlayerPlaygroundPage from "@/components/planning/playground/PlayerPlaygroundPage";
import {
  getPlanningCardDetails,
  getPlanningPrices,
  getPlanningRegionTax,
  getPlanningSPSRatio,
  getPlanningTokenPrices,
} from "@/lib/backend/actions/planningData";
import { Container } from "@mui/material";
import { Suspense } from "react";

async function PlanningTab() {
  const [cardDetails, prices, spsRatio, tokenPriceData, regionTax] =
    await Promise.all([
      getPlanningCardDetails(),
      getPlanningPrices(),
      getPlanningSPSRatio(),
      getPlanningTokenPrices(),
      getPlanningRegionTax(),
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

async function PlaygroundTab() {
  return <PlayerPlaygroundPage />;
}

export default function PlanningPage() {
  return (
    <Container maxWidth={false} sx={{ px: { xs: 1, md: 3, lg: 6 } }}>
      <PlanningTabNavigation
        planningTab={
          <Suspense fallback={<PlanningPageSkeleton />}>
            <PlanningTab />
          </Suspense>
        }
        playgroundTab={
          <Suspense fallback={<PlanningPageSkeleton />}>
            <PlaygroundTab />
          </Suspense>
        }
      />
    </Container>
  );
}
