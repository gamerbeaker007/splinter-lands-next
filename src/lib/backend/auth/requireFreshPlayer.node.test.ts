import {
  clearAuthVerificationCache,
  getCachedVerification,
  setCachedVerification,
} from "@/lib/backend/cache/authVerificationCache";
import { sign } from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieValue = vi.hoisted(() => ({
  value: undefined as string | undefined,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () =>
      mockCookieValue.value ? { value: mockCookieValue.value } : undefined,
    delete: vi.fn(),
  })),
}));

const mockVerifyResult = vi.hoisted(() => ({
  value: "valid" as "valid" | "invalid" | "error",
}));

const verifySplJwt = vi.hoisted(() =>
  vi.fn(async () => mockVerifyResult.value)
);
vi.mock("@/lib/backend/api/spl/spl-base-api", () => ({ verifySplJwt }));

const { requireFreshPlayer } = await import("./requireFreshPlayer");

function makeToken(sub: string) {
  return sign(
    { sub, exp: Math.floor(Date.now() / 1000) + 3600 },
    "test-secret"
  );
}

describe("requireFreshPlayer (service-signed spending)", () => {
  beforeEach(() => {
    clearAuthVerificationCache();
    verifySplJwt.mockClear();
    mockVerifyResult.value = "valid";
  });

  it("asks Splinterlands even when the token is already cached", async () => {
    const token = makeToken("beaker007");
    mockCookieValue.value = token;
    setCachedVerification(token, "beaker007");

    await expect(requireFreshPlayer()).resolves.toBe("beaker007");
    expect(verifySplJwt).toHaveBeenCalledOnce();
  });

  it("rejects a cached token that Splinterlands has since revoked", async () => {
    const token = makeToken("beaker007");
    mockCookieValue.value = token;
    setCachedVerification(token, "beaker007");
    mockVerifyResult.value = "invalid";

    await expect(requireFreshPlayer()).resolves.toBeNull();
    expect(getCachedVerification(token)).toBeUndefined();
  });

  it("fails closed when Splinterlands cannot be reached", async () => {
    mockCookieValue.value = makeToken("beaker007");
    mockVerifyResult.value = "error";

    await expect(requireFreshPlayer()).resolves.toBeNull();
  });

  it("returns null without a cookie", async () => {
    mockCookieValue.value = undefined;

    await expect(requireFreshPlayer()).resolves.toBeNull();
    expect(verifySplJwt).not.toHaveBeenCalled();
  });
});
