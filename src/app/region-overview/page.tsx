import { redirect } from "next/navigation";

// Redirect root to activity page
export default async function RegionOverviewPage() {
  redirect("/region-overview/activity");
}
