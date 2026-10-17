import { describe, expect, it } from "vitest";
import {
  MAX_CONCURRENT_SERVICE_REQUESTS,
  MAX_ITEMS_PER_SERVICE_REQUEST,
  validateMarketIds,
  validatePrices,
  withServiceBroadcastSlot,
} from "./serviceBroadcastGuard";

describe("validateMarketIds", () => {
  it("accepts ordinary market ids", () => {
    expect(validateMarketIds(["a1b2c3-0", "d4e5f6-1"])).toBeNull();
  });

  it("rejects too many listings in one request", () => {
    const ids = Array.from(
      { length: MAX_ITEMS_PER_SERVICE_REQUEST + 1 },
      (_, i) => `id-${i}`
    );
    expect(validateMarketIds(ids)).toMatch(/Too many listings/);
  });

  it("rejects non-strings, odd characters, duplicates and non-arrays", () => {
    expect(validateMarketIds([1, 2])).toBe("Invalid market IDs.");
    expect(validateMarketIds(["a b"])).toBe("Invalid market IDs.");
    expect(validateMarketIds(["x".repeat(101)])).toBe("Invalid market IDs.");
    expect(validateMarketIds(["a", "a"])).toBe("Duplicate market IDs.");
    expect(validateMarketIds("abc")).toBe("Invalid market IDs.");
  });
});

describe("validatePrices", () => {
  it("accepts positive finite prices only", () => {
    expect(validatePrices([1, 0.5])).toBeNull();
    expect(validatePrices([0])).toBe("Invalid listing price.");
    expect(validatePrices([-1])).toBe("Invalid listing price.");
    expect(validatePrices([Number.NaN])).toBe("Invalid listing price.");
    expect(validatePrices(["1"])).toBe("Invalid listing price.");
  });
});

describe("withServiceBroadcastSlot", () => {
  it("allows one request per player at a time", async () => {
    let release!: () => void;
    const first = withServiceBroadcastSlot(
      "alice",
      () => new Promise<string>((r) => (release = () => r("done")))
    );

    await expect(
      withServiceBroadcastSlot("alice", async () => "second")
    ).resolves.toBeNull();

    release();
    await expect(first).resolves.toBe("done");
    await expect(
      withServiceBroadcastSlot("alice", async () => "again")
    ).resolves.toBe("again");
  });

  it("caps concurrent requests across players", async () => {
    const releases: (() => void)[] = [];
    const running = Array.from(
      { length: MAX_CONCURRENT_SERVICE_REQUESTS },
      (_, i) =>
        withServiceBroadcastSlot(
          `player-${i}`,
          () => new Promise<void>((r) => releases.push(r))
        )
    );

    await expect(
      withServiceBroadcastSlot("one-too-many", async () => "ran")
    ).resolves.toBeNull();

    releases.forEach((r) => r());
    await Promise.all(running);
  });

  it("frees the slot when the broadcast throws", async () => {
    await expect(
      withServiceBroadcastSlot("bob", async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    await expect(
      withServiceBroadcastSlot("bob", async () => "ok")
    ).resolves.toBe("ok");
  });
});
