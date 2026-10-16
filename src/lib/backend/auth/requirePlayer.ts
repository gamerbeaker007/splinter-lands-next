import { getAuthStatus } from "@/lib/backend/actions/auth-actions";

/**
 * The SPL-verified player of this request, asserting it is the one the client
 * claims. For server actions that take a `player` from the client (the run
 * logs): without this anyone could write rows for any account — e.g. a fake
 * top-up run that shifts another player's top-up window.
 *
 * Throws when not logged in or when `claimed` is someone else; never trust
 * `claimed` itself, use the returned name.
 */
export async function requirePlayer(claimed: string): Promise<string> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    throw new Error("Not authenticated");
  }
  if (claimed.toLowerCase() !== auth.username.toLowerCase()) {
    throw new Error("Player does not match the logged-in account");
  }
  return auth.username;
}
