"use client";

import { DailyProduceConsumeOverview } from "./daily/DailyProductionConsumeOverview";
import { ProduceConsumeHistoricalOverview } from "./historical/ProduceConsumeHistoricalOverview";

export function SupplyPage() {
  return (
    <>
      <DailyProduceConsumeOverview />
      <ProduceConsumeHistoricalOverview />
    </>
  );
}
