import { redirect } from "next/navigation";

export const instant = false;

export default function LandManagerIndex() {
  redirect("/land-manager/harvest");
}
