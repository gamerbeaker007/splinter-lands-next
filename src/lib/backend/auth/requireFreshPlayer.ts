/**
 * Upstream-fresh player identity — server-side only.
 * Does NOT have the "use server" directive; call from server actions only.
 */
import { verifySplJwt } from "@/lib/backend/api/spl/spl-base-api";
import {
  deleteCachedVerification,
  setCachedVerification,
} from "@/lib/backend/cache/authVerificationCache";
import { validateSplJwt } from "@/lib/backend/jwt/splJwtValidation";
import { cookies } from "next/headers";

/**
 * The logged-in player, verified with Splinterlands on THIS request — the
 * 30-minute verification cache of `getAuthStatus` is skipped. For actions the
 * land-service account signs on the player's behalf (buying, renting): a token
 * Splinterlands has revoked must stop spending at once, not up to 30 minutes
 * later. Returns null when not logged in or not verifiable; fails closed.
 */
export async function requireFreshPlayer(): Promise<string | null> {
  const cookieStore = await cookies();
  const jwtToken = cookieStore.get("jwt_token")?.value;
  if (!jwtToken) return null;

  const decoded = validateSplJwt(jwtToken);
  if (!decoded.valid) return null;
  const player = decoded.username!;

  try {
    const result = await verifySplJwt(player, jwtToken);
    if (result === "valid") {
      setCachedVerification(jwtToken, player);
      return player;
    }
    if (result === "invalid") {
      deleteCachedVerification(jwtToken);
      cookieStore.delete("jwt_token");
    }
    return null;
  } catch (error) {
    console.error("Error verifying player upstream:", error);
    return null;
  }
}
