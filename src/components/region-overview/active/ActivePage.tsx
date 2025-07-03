"use client";

import ActiveDeedsChart from "@/components/region-overview/active/ActiveDeedsChart";
import ActiveSummary from "@/components/region-overview/active/ActiveSummary";
import ActivityChart from "./ActivityChart";

export function ActivityPage() {
  return (
    <>
      <ActivityChart />
      <ActiveSummary />
      <ActiveDeedsChart />
    </>
  );
}
