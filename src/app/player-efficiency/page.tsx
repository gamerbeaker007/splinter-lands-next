import { redirect } from "next/navigation";

// Redirect root to rankings page
export default async function PlayerEfficiencyPage() {
  redirect("/player-efficiency/rankings");
}
