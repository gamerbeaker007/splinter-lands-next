import { getSupportDonationsPage } from "@/lib/backend/actions/support/support-actions";
import DirectDonationsSectionClient from "./DirectDonationsSectionClient";

export default async function DirectDonationsSectionServer() {
  const data = await getSupportDonationsPage(1, 10, "created_at", "desc");
  return <DirectDonationsSectionClient initialData={data} />;
}
