import { redirect } from "next/navigation";

// Redirect root to conversion page
export default async function ResourcePage() {
  redirect("/resource/conversion");
}
