// app/signin/page.tsx — GitHub OAuth removed; admin access uses Keychain/SPL auth.
import { redirect } from "next/navigation";

export default function SignInPage() {
  redirect("/");
}
