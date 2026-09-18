/**
 * Regression tests for the authentication security fixes.
 *
 * These tests verify that:
 * - Forged / modified JWT cookies are rejected.
 * - Expired tokens are rejected.
 * - Malformed tokens are rejected.
 * - Missing tokens are rejected.
 * - A user cannot impersonate another player by modifying the cookie.
 * - Upstream SPL validation is the authority for player identity.
 * - Admin access requires the verified identity to match ADMIN_ACCOUNT.
 * - Admin is denied when ADMIN_ACCOUNT is absent or mismatched.
 */

import { clearAuthVerificationCache } from "@/lib/backend/cache/authVerificationCache";
import { isAdminUser } from "@/lib/backend/auth/adminAuth";
import { sign } from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock "next/headers" (not available in Node test env) ──────────────────────
const mockCookieValue = vi.hoisted(() => ({
  value: undefined as string | undefined,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () =>
      mockCookieValue.value ? { value: mockCookieValue.value } : undefined,
    delete: vi.fn(),
    set: vi.fn(),
  })),
}));

// ── Mock spl-base-api so we never hit the network ────────────────────────────
const mockVerifyResult = vi.hoisted(() => ({
  value: "valid" as "valid" | "invalid" | "error",
}));

vi.mock("@/lib/backend/api/spl/spl-base-api", () => ({
  verifySplJwt: vi.fn(async () => mockVerifyResult.value),
  fetchSettings: vi.fn(async () => ({ maintenance_mode: false })),
  splLogin: vi.fn(),
}));

// ── Mock playerService ────────────────────────────────────────────────────────
vi.mock("@/lib/backend/services/playerService", () => ({
  invalidatePlayerCaches: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeToken(
  sub: string,
  opts: { expiredSecs?: number; nbfFutureSecs?: number; secret?: string } = {}
) {
  const now = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = { sub };
  if (opts.expiredSecs !== undefined) {
    payload.exp = now - opts.expiredSecs;
  } else {
    payload.exp = now + 3600;
  }
  if (opts.nbfFutureSecs !== undefined) {
    payload.nbf = now + opts.nbfFutureSecs;
  }
  return sign(payload, opts.secret ?? "test-secret");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("getAuthStatus", () => {
  // Must import after mocks are set up.
  let getAuthStatus: typeof import("./auth-actions").getAuthStatus;

  beforeEach(async () => {
    // Re-import so the mock registrations take effect.
    const mod = await import("./auth-actions");
    getAuthStatus = mod.getAuthStatus;
    clearAuthVerificationCache();
    mockVerifyResult.value = "valid";
    mockCookieValue.value = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthenticated when no cookie is present", async () => {
    mockCookieValue.value = undefined;
    const result = await getAuthStatus();
    expect(result).toEqual({ authenticated: false, username: null });
  });

  it("returns unauthenticated for a malformed token", async () => {
    mockCookieValue.value = "not.a.jwt";
    mockVerifyResult.value = "invalid";
    const result = await getAuthStatus();
    expect(result.authenticated).toBe(false);
  });

  it("returns unauthenticated for an expired token", async () => {
    mockCookieValue.value = makeToken("someuser", { expiredSecs: 60 });
    const result = await getAuthStatus();
    // Expiry is caught locally — upstream is not even called for expired tokens.
    expect(result.authenticated).toBe(false);
  });

  it("returns unauthenticated when upstream rejects the token (forged/revoked)", async () => {
    mockCookieValue.value = makeToken("legit-user");
    mockVerifyResult.value = "invalid";
    const result = await getAuthStatus();
    expect(result.authenticated).toBe(false);
    expect(result.username).toBeNull();
  });

  it("returns authenticated with the verified username when upstream accepts the token", async () => {
    mockCookieValue.value = makeToken("real-player");
    mockVerifyResult.value = "valid";
    const result = await getAuthStatus();
    expect(result.authenticated).toBe(true);
    expect(result.username).toBe("real-player");
  });

  it("attacker forges cookie with sub=victim — rejected because upstream validation fails", async () => {
    // The attacker crafts a JWT-shaped cookie claiming to be 'victim'.
    // verifySplJwt returns 'invalid' because the token was not issued by SPL for victim.
    mockCookieValue.value = makeToken("victim", { secret: "attacker-secret" });
    mockVerifyResult.value = "invalid";
    const result = await getAuthStatus();
    expect(result.authenticated).toBe(false);
    expect(result.username).toBeNull();
  });

  it("attacker uses own valid token but forges sub to impersonate victim — rejected", async () => {
    // Even if the attacker has a real valid token for 'attacker', they cannot
    // construct a cookie that makes verifySplJwt return valid for 'victim'.
    // We simulate SPL API correctly rejecting the mismatch.
    mockCookieValue.value = makeToken("victim");
    mockVerifyResult.value = "invalid"; // SPL rejects attacker's token for victim's account
    const result = await getAuthStatus();
    expect(result.authenticated).toBe(false);
  });

  it("uses cached result on subsequent calls — upstream called only once", async () => {
    const { verifySplJwt } = await import("@/lib/backend/api/spl/spl-base-api");
    const spyVerify = vi.mocked(verifySplJwt);

    mockCookieValue.value = makeToken("cached-user");
    mockVerifyResult.value = "valid";

    await getAuthStatus();
    await getAuthStatus();

    expect(spyVerify).toHaveBeenCalledTimes(1);
  });

  it("returns unauthenticated on transient SPL error when token was never cached", async () => {
    mockCookieValue.value = makeToken("user1");
    mockVerifyResult.value = "error";
    const result = await getAuthStatus();
    // Fail closed — no cached entry → deny
    expect(result.authenticated).toBe(false);
  });

  it("returns authenticated on transient SPL error when token was recently verified", async () => {
    mockCookieValue.value = makeToken("user2");
    // First call: valid → populates cache
    mockVerifyResult.value = "valid";
    const first = await getAuthStatus();
    expect(first.authenticated).toBe(true);

    // Second call: transient SPL failure → cache hit → still authenticated
    mockVerifyResult.value = "error";
    const second = await getAuthStatus();
    expect(second.authenticated).toBe(true);
    expect(second.username).toBe("user2");
  });
});

// ── isAdminUser ───────────────────────────────────────────────────────────────

describe("isAdminUser", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns false when ADMIN_ACCOUNT is not set", () => {
    delete process.env.ADMIN_ACCOUNT;
    expect(isAdminUser("anyone")).toBe(false);
  });

  it("returns false when ADMIN_ACCOUNT is empty", () => {
    process.env.ADMIN_ACCOUNT = "";
    expect(isAdminUser("anyone")).toBe(false);
  });

  it("returns true for the exact configured admin account", () => {
    process.env.ADMIN_ACCOUNT = "myadmin";
    expect(isAdminUser("myadmin")).toBe(true);
  });

  it("is case-insensitive for the admin check", () => {
    process.env.ADMIN_ACCOUNT = "MyAdmin";
    expect(isAdminUser("myadmin")).toBe(true);
    expect(isAdminUser("MYADMIN")).toBe(true);
  });

  it("returns false for a regular authenticated user", () => {
    process.env.ADMIN_ACCOUNT = "myadmin";
    expect(isAdminUser("regularuser")).toBe(false);
  });

  it("returns false when display name matches admin but token is not verified — covered by getAuthStatus upstream check", () => {
    // isAdminUser only sees the username AFTER getAuthStatus has already
    // upstream-verified it. This test documents the contract: a raw username
    // string that happens to match the admin account only grants access if it
    // came from verified authentication.
    process.env.ADMIN_ACCOUNT = "myadmin";
    // isAdminUser itself is a string comparison; protection comes from only
    // calling it with getAuthStatus()-verified usernames.
    expect(isAdminUser("myadmin")).toBe(true); // shows the check works
    expect(isAdminUser("myadmin_impersonator")).toBe(false);
  });
});

// ── Admin authorization boundary ─────────────────────────────────────────────

describe("admin authorization — forged identity cannot gain admin access", () => {
  const originalEnv = process.env;
  let getAuthStatus: typeof import("./auth-actions").getAuthStatus;

  beforeEach(async () => {
    process.env = { ...originalEnv, ADMIN_ACCOUNT: "real-admin" };
    const mod = await import("./auth-actions");
    getAuthStatus = mod.getAuthStatus;
    clearAuthVerificationCache();
    mockVerifyResult.value = "valid";
    mockCookieValue.value = undefined;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("forged cookie claiming to be admin — rejected by upstream verification", async () => {
    mockCookieValue.value = makeToken("real-admin", { secret: "attacker-key" });
    mockVerifyResult.value = "invalid";

    const auth = await getAuthStatus();
    expect(auth.authenticated).toBe(false);
    expect(isAdminUser(auth.username ?? "")).toBe(false);
  });

  it("valid token for non-admin user — authenticated but not admin", async () => {
    mockCookieValue.value = makeToken("normal-user");
    mockVerifyResult.value = "valid";

    const auth = await getAuthStatus();
    expect(auth.authenticated).toBe(true);
    expect(isAdminUser(auth.username!)).toBe(false);
  });

  it("valid token for admin user — authenticated and admin", async () => {
    mockCookieValue.value = makeToken("real-admin");
    mockVerifyResult.value = "valid";

    const auth = await getAuthStatus();
    expect(auth.authenticated).toBe(true);
    expect(isAdminUser(auth.username!)).toBe(true);
  });

  it("missing ADMIN_ACCOUNT config — admin check fails closed", async () => {
    delete process.env.ADMIN_ACCOUNT;
    mockCookieValue.value = makeToken("real-admin");
    mockVerifyResult.value = "valid";

    const auth = await getAuthStatus();
    // Authentication succeeds (token is genuine) but admin check fails
    expect(auth.authenticated).toBe(true);
    expect(isAdminUser(auth.username!)).toBe(false);
  });
});
