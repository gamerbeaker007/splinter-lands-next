"use server";

import {
  fetchSettings,
  splLogin,
  verifySplJwt,
} from "@/lib/backend/api/spl/spl-base-api";
import {
  getCachedVerification,
  setCachedVerification,
} from "@/lib/backend/cache/authVerificationCache";
import { validateSplJwt } from "@/lib/backend/jwt/splJwtValidation";
import { cookies } from "next/headers";
import { invalidatePlayerCaches } from "../services/playerService";

// ── Authentication ────────────────────────────────────────────────────────────

/** Returns whether Splinterlands is currently in maintenance mode.
 *  Treats a failed /settings fetch as maintenance (API unreachable). */
export async function getSplMaintenanceStatus(): Promise<{
  maintenance: boolean;
}> {
  try {
    const settings = await fetchSettings();
    return { maintenance: settings?.maintenance_mode ?? false };
  } catch {
    return { maintenance: true };
  }
}

/**
 * Reads the jwt_token cookie, verifies it upstream with Splinterlands, and
 * returns the authenticated player identity. Uses a 5-minute cache to limit
 * SPL API calls. Fails closed on every error path.
 *
 * The player identity returned here is the ONLY trusted source for on-behalf
 * transactions — never use a client-supplied username for that purpose.
 */
export async function getAuthStatus() {
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

export async function loginAction(
  username: string,
  timestamp: number,
  signature: string
) {
  try {
    const result = await splLogin(username.toLowerCase(), timestamp, signature);

    if (!result.jwt_token) {
      return { success: false, error: "No token received from Splinterlands" };
    }

    // Set JWT token in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("jwt_token", result.jwt_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // clear previous player caches upon login
    await invalidatePlayerCaches(username.toLowerCase());

    return { success: true, username: result.name };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
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
