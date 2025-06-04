import ActiveDeedsChart from "@/components/region-overview/active/ActiveDeedsChart";
import WorksiteTypeTile from "@/components/region-overview/summary/WorksiteTypeTile";

export default function RegionOverviewPage() {
  return (
    <>
      <div className="text-xl">Region Page</div>
      <div>
        <ActiveDeedsChart />
      </div>
      <div>
        <WorksiteTypeTile />
      </div>
    </>
  );
}
