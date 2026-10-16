"use server";

import { verifySplJwt } from "@/lib/backend/api/spl/spl-base-api";
import { getCachedSettings } from "@/lib/backend/services/settingsService";
import {
  getCachedVerification,
  setCachedVerification,
} from "@/lib/backend/cache/authVerificationCache";
import { validateSplJwt } from "@/lib/backend/jwt/splJwtValidation";
import { cookies } from "next/headers";
import { connection } from "next/server";

// ── Authentication ────────────────────────────────────────────────────────────

/** Returns whether Splinterlands is currently in maintenance mode.
 *  Treats a failed /settings fetch as maintenance (API unreachable). */
export async function getSplMaintenanceStatus(): Promise<{
  maintenance: boolean;
}> {
  try {
    const settings = await getCachedSettings();
    return { maintenance: settings?.maintenance_mode ?? false };
  } catch {
    return { maintenance: true };
  }
}

/**
 * Reads the jwt_token cookie, verifies it upstream with Splinterlands, and
 * returns the authenticated player identity. Uses a 30-minute cache to limit
 * SPL API calls. Fails closed on every error path.
 *
 * The player identity returned here is the ONLY trusted source for on-behalf
 * transactions — never use a client-supplied username for that purpose.
 */
export async function getAuthStatus() {
  // Request-time by nature: the token's expiry is checked against the current
  // time (and the verification cache's TTL), which Next forbids during
  // prerendering. Prerendering stops here instead.
  await connection();
  const cookieStore = await cookies();
  const jwtToken = cookieStore.get("jwt_token")?.value;

  if (!jwtToken) {
    return { authenticated: false, username: null };
  }

  try {
    // Structural decode (format + local expiry only — does NOT verify signature).
    const decoded = validateSplJwt(jwtToken);
    if (!decoded.valid) {
      cookieStore.delete("jwt_token");
      return { authenticated: false, username: null };
    }
    const candidateUsername = decoded.username!;

    // Fast path: recently upstream-verified.
    const cached = getCachedVerification(jwtToken);
    if (cached) {
      return { authenticated: true, username: cached.username };
    }

    // Slow path: ask Splinterlands whether this token is genuine.
    const result = await verifySplJwt(candidateUsername, jwtToken);

    if (result === "valid") {
      setCachedVerification(jwtToken, candidateUsername);
      return { authenticated: true, username: candidateUsername };
    }

    if (result === "invalid") {
      // Token is forged, expired, or revoked — purge it.
      cookieStore.delete("jwt_token");
      return { authenticated: false, username: null };
    }

    // "error": transient SPL API failure — fail closed for unverified tokens.
    return { authenticated: false, username: null };
  } catch (error) {
    console.error("Error validating auth status:", error);
    return { authenticated: false, username: null };
  }
}

/**
 * Turns an SPL JWT the browser obtained itself (`splLoginInBrowser`) into a
 * session. The token is verified upstream once — the browser's word is not
 * trusted — then stored in the `jwt_token` cookie that `getAuthStatus` reads,
 * and the verification is cached so the next auth check costs no SPL call.
 *
 * The cookie is deliberately not httpOnly: the browser reads the same token
 * for the JWT reads it sends straight to SPL (lib/frontend/splSession.ts).
 * Trust comes from the upstream verification, never from the cookie itself.
 */
export async function establishSessionAction(
  username: string,
  jwtToken: string
): Promise<
  { success: true; username: string } | { success: false; error: string }
> {
  const decoded = validateSplJwt(jwtToken);
  const player = username.toLowerCase();
  if (!decoded.valid || decoded.username !== player) {
    return { success: false, error: "Invalid token from Splinterlands" };
  }

  const verified = await verifySplJwt(player, jwtToken);
  if (verified !== "valid") {
    return {
      success: false,
      error:
        verified === "error"
          ? "Could not verify the login with Splinterlands, please try again"
          : "Splinterlands rejected the login token",
    };
  }
  setCachedVerification(jwtToken, player);

  const cookieStore = await cookies();
  cookieStore.set("jwt_token", jwtToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return { success: true, username: player };
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("jwt_token");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
