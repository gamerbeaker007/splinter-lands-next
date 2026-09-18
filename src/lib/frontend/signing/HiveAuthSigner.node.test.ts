import { beforeEach, describe, expect, it, vi } from "vitest";

const has = vi.hoisted(() => ({
  connect: vi.fn(),
  status: vi.fn(() => ({
    host: "wss://hive-auth.arcange.eu/",
    connected: true,
    timeout: 60_000,
  })),
  authenticate: vi.fn(),
  challenge: vi.fn(),
  broadcast: vi.fn(),
}));

vi.mock("hive-auth-wrapper", () => ({ default: has }));

import { HiveAuthSigner, normalizeHiveAuthTxId } from "./HiveAuthSigner";

describe("HiveAuthSigner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    has.connect.mockResolvedValue(true);
  });

  it("normalises string and object transaction acknowledgements", () => {
    expect(normalizeHiveAuthTxId({ data: "abc123" })).toBe("abc123");
    expect(normalizeHiveAuthTxId({ data: { id: "def456" } })).toBe("def456");
    expect(normalizeHiveAuthTxId({ data: { tx_id: "ghi789" } })).toBe("ghi789");
  });

  it("creates a pairing link and clears an expired session", async () => {
    vi.useFakeTimers();
    const expire = Date.now() + 1_000;
    has.authenticate.mockImplementation(
      async (
        auth: { token?: string; key?: string; expire?: number },
        _meta: unknown,
        _challenge: unknown,
        onWait: (event: unknown) => void
      ) => {
        auth.token = "token";
        auth.key = "key";
        auth.expire = expire;
        onWait({ account: "alice", uuid: "uuid", key: "key", expire });
        return { data: { expire } };
      }
    );
    has.challenge.mockResolvedValue({ data: { challenge: "signature" } });

    const signer = new HiveAuthSigner();
    let wait: { qr: string; deepLink: string } | undefined;
    await signer.connect("Alice", (next) => {
      wait = next;
    });

    expect(wait?.deepLink).toMatch(/^has:\/\/auth_req\//);
    expect(wait?.qr).toBe(wait?.deepLink);
    expect(await signer.signBuffer("alice", "message", "posting")).toBe(
      "signature"
    );

    vi.advanceTimersByTime(1_001);
    await expect(
      signer.signBuffer("alice", "message", "posting")
    ).rejects.toThrow("HiveAuth session expired");
    vi.useRealTimers();
  });

  it("pairs and signs in one wallet approval while storing the session", async () => {
    vi.useFakeTimers();
    const expire = Date.now() + 1_000;
    has.authenticate.mockImplementation(
      async (
        auth: { token?: string; key?: string; expire?: number },
        _meta: unknown,
        challenge: unknown,
        onWait: (event: unknown) => void
      ) => {
        expect(challenge).toEqual({
          key_type: "posting",
          challenge: "alicets",
        });
        auth.token = "token";
        auth.key = "key";
        auth.expire = expire;
        onWait({ account: "alice", uuid: "uuid", key: "key", expire });
        return {
          data: {
            expire,
            challenge: { challenge: "login-signature", pubkey: "PUB" },
          },
        };
      }
    );

    const signer = new HiveAuthSigner();
    const wait = vi.fn();

    await expect(signer.connectAndSign("Alice", "alicets", wait)).resolves.toBe(
      "login-signature"
    );
    expect(wait).toHaveBeenCalledWith({
      qr: expect.stringMatching(/^has:\/\/auth_req\//),
      deepLink: expect.stringMatching(/^has:\/\/auth_req\//),
      expire,
    });

    has.challenge.mockResolvedValue({ data: { challenge: "later-signature" } });
    await expect(signer.signBuffer("alice", "later", "posting")).resolves.toBe(
      "later-signature"
    );
    expect(has.challenge).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "alice",
        token: "token",
        key: "key",
        expire,
      }),
      { key_type: "posting", challenge: "later" }
    );
    vi.useRealTimers();
  });

  it.each([
    [{ cmd: "auth_nack" }, "Request rejected in the wallet."],
    [new Error("expired"), "Request expired. Try again."],
    [
      { cmd: "challenge_err", data: "Wallet unavailable" },
      "Wallet unavailable",
    ],
  ])(
    "maps HiveAuth failure %# to a non-empty message",
    async (failure, message) => {
      has.authenticate.mockRejectedValue(failure);

      await expect(
        new HiveAuthSigner().connectAndSign("alice", "message", vi.fn())
      ).rejects.toThrow(message);
    }
  );
});
