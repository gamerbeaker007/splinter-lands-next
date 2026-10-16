import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  value: { authenticated: false, username: null } as {
    authenticated: boolean;
    username: string | null;
  },
}));

vi.mock("@/lib/backend/actions/auth-actions", () => ({
  getAuthStatus: vi.fn(async () => auth.value),
}));

const { requirePlayer } = await import("./requirePlayer");

describe("requirePlayer (client-supplied player on log actions)", () => {
  beforeEach(() => {
    auth.value = { authenticated: true, username: "beaker007" };
  });

  it("returns the verified player when the claim matches (case-insensitive)", async () => {
    await expect(requirePlayer("Beaker007")).resolves.toBe("beaker007");
  });

  it("rejects a claim for another account", async () => {
    await expect(requirePlayer("victim")).rejects.toThrow(
      "Player does not match the logged-in account"
    );
  });

  it("rejects when not logged in (e.g. a forged cookie SPL refused)", async () => {
    auth.value = { authenticated: false, username: null };
    await expect(requirePlayer("beaker007")).rejects.toThrow(
      "Not authenticated"
    );
  });
});
