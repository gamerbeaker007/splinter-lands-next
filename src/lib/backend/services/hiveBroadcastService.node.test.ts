import { Client, Operation, PrivateKey } from "@hiveio/dhive";
import { describe, expect, it } from "vitest";

import { buildSignedTx } from "./hiveBroadcastService";

/**
 * Drift tripwire for buildSignedTx.
 *
 * buildSignedTx hand-replicates @hiveio/dhive's BroadcastAPI.sendOperations tx
 * construction so we can compute a tx's deterministic id BEFORE sending it — the
 * id that lets broadcastOpsAsService verify a throwing broadcast actually landed
 * on-chain. If a dhive upgrade changes that construction or its
 * serialization/signing, the id we compute would stop matching what the node
 * indexes and the verify-on-throw recovery would silently break.
 *
 * dhive signing is deterministic, so for fixed inputs the id is constant. We pin
 * that id below. If this test fails after bumping @hiveio/dhive, do NOT just
 * paste the new value — confirm buildSignedTx still mirrors dhive's current
 * sendOperations (node_modules/@hiveio/dhive/lib/helpers/broadcast.js) and that
 * a real tx still lands, THEN update GOLDEN_TRX_ID intentionally.
 *
 * Validated against @hiveio/dhive 1.3.6.
 */

// Deterministic inputs — must not change, or the golden id changes meaninglessly.
const FIXED_PROPS = {
  head_block_number: 0x0abc1234,
  head_block_id: "0abc1234deadbeefcafebabe0123456789abcdef",
  time: "2024-01-01T00:00:00",
};

const KEY = PrivateKey.fromSeed("splinterlands-buildSignedTx-test");

const OP: Operation = [
  "custom_json",
  {
    required_auths: ["splinterlands"],
    required_posting_auths: [],
    id: "sm_market_rent",
    json: '{"items":["abc-123"],"currency":"DEC"}',
  },
];

const GOLDEN_TRX_ID = "83db13af7e1661ffa85a2b749b30ee73f36280fd";

/** A client whose only network call (getDynamicGlobalProperties) is stubbed. */
function stubbedClient(): Client {
  const client = new Client(["https://api.hive.blog"]);
  // buildSignedTx only reaches the network for the global props; everything
  // else (sign, trx-id serialization) is local crypto.
  client.database.getDynamicGlobalProperties = async () =>
    FIXED_PROPS as unknown as Awaited<
      ReturnType<typeof client.database.getDynamicGlobalProperties>
    >;
  return client;
}

describe("buildSignedTx", () => {
  it("produces the dhive-pinned tx id for fixed inputs", async () => {
    const { trxId } = await buildSignedTx(stubbedClient(), [OP], KEY);
    expect(trxId).toBe(GOLDEN_TRX_ID);
  });

  it("is deterministic across runs", async () => {
    const a = await buildSignedTx(stubbedClient(), [OP], KEY);
    const b = await buildSignedTx(stubbedClient(), [OP], KEY);
    expect(a.trxId).toBe(b.trxId);
  });
});
