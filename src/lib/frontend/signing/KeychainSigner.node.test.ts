import { beforeEach, describe, expect, it, vi } from "vitest";

const keychain = vi.hoisted(() => ({
  signBuffer: vi.fn(),
  broadcast: vi.fn(),
}));
const KeychainSDK = vi.hoisted(() =>
  vi.fn(function KeychainSDKMock() {
    return keychain;
  })
);

vi.mock("keychain-sdk", () => ({
  KeychainSDK,
  KeychainKeyTypes: { posting: "Posting", active: "Active" },
}));

import { KeychainSigner } from "./KeychainSigner";

describe("KeychainSigner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(globalThis, { window: { hive_keychain: {} } });
  });

  it("keeps the existing signature result extraction", async () => {
    keychain.signBuffer.mockResolvedValue({
      success: true,
      result: "signature",
    });

    const signer = new KeychainSigner();
    await expect(
      signer.signBuffer("Alice", "message", "posting")
    ).resolves.toBe("signature");
    expect(keychain.signBuffer).toHaveBeenCalledWith({
      username: "alice",
      message: "message",
      method: "Posting",
    });
  });

  it("keeps both Keychain transaction-id result shapes", async () => {
    const signer = new KeychainSigner();
    keychain.broadcast.mockResolvedValueOnce({
      success: true,
      result: { id: "tx-id" },
    });
    await expect(signer.broadcast("Alice", [], "posting")).resolves.toEqual({
      txId: "tx-id",
      submitted: true,
    });
    expect(keychain.broadcast).toHaveBeenCalledWith({
      username: "alice",
      operations: [],
      method: "Posting",
    });

    keychain.broadcast.mockResolvedValueOnce({
      success: true,
      result: { tx_id: "legacy-id" },
    });
    await expect(signer.broadcast("alice", [], "posting")).resolves.toEqual({
      txId: "legacy-id",
      submitted: true,
    });
  });

  it("reports successful submission when Keychain omits a transaction id", async () => {
    const signer = new KeychainSigner();
    keychain.broadcast.mockResolvedValue({ success: true, result: {} });

    await expect(signer.broadcast("alice", [], "posting")).resolves.toEqual({
      txId: undefined,
      submitted: true,
    });
  });
});
