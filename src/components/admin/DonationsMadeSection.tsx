import { getDonationsPaidByDay } from "@/lib/backend/actions/land-manager/log-actions";
import DonationsMadeSectionClient from "./DonationsMadeSectionClient";

export default async function DonationsMadeSection() {
  const data = await getDonationsPaidByDay(1, 10);
  return <DonationsMadeSectionClient initialData={data} />;
}
