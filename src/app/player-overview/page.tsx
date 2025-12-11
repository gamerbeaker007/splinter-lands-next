import { redirect } from "next/navigation";

// Redirect root to dashboard page
export default async function PlayerOverviewPage() {
  redirect("/player-overview/dashboard");
}
