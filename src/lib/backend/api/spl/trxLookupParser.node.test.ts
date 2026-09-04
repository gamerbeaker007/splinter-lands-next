import { parseTrxInfo } from "@/lib/backend/api/spl/trxLookupParser";
import { DONATION_ACCOUNT } from "@/constants/support";
import type { SplTrxInfo } from "@/types/spl/trx";
import { describe, expect, it } from "vitest";

const TX_ID = "b6027ec22f2569f936d61ad7eef85ffa59590d70";
const SENDER = "shinoumonk";

function tokenTransfer(
  resultOverrides: Record<string, unknown> = {},
  envelopeOverrides: Partial<SplTrxInfo> = {}
): SplTrxInfo {
  return {
    id: TX_ID,
    type: "token_transfer",
    player: SENDER,
    data: JSON.stringify({
      token: "DEC",
      to: DONATION_ACCOUNT,
      qty: 100,
      memo: "donation to spl-stats.com",
    }),
    result: JSON.stringify({
      success: true,
      from: SENDER,
      to: DONATION_ACCOUNT,
      amount: 100,
      token: "DEC",
      trx_id: TX_ID,
      created_date: "2026-09-01T12:00:00.000Z",
      ...resultOverrides,
    }),
    success: true,
    error: null,
    created_date: "2026-09-01T12:00:00.000Z",
    ...envelopeOverrides,
  };
}

describe("parseTrxInfo — token_transfer", () => {
  it("parses a confirmed DEC transfer", () => {
    const outcome = parseTrxInfo(tokenTransfer());

    expect(outcome.status).toBe("success");
    if (outcome.status !== "success") return;
    expect(outcome.result.op).toBe("token_transfer");
    if (outcome.result.op !== "token_transfer") return;
    expect(outcome.result.result).toEqual({
      from: SENDER,
      to: DONATION_ACCOUNT,
      token: "DEC",
      amount: 100,
      date: new Date("2026-09-01T12:00:00.000Z"),
    });
  });

  it("parses a confirmed SPS transfer", () => {
    const outcome = parseTrxInfo(tokenTransfer({ token: "SPS", amount: 50 }));

    expect(outcome.status).toBe("success");
    if (outcome.status !== "success") return;
    if (outcome.result.op !== "token_transfer") return;
    expect(outcome.result.result.token).toBe("SPS");
    expect(outcome.result.result.amount).toBe(50);
  });

  it("falls back to the envelope player and date", () => {
    const outcome = parseTrxInfo(
      tokenTransfer({ from: undefined, created_date: undefined })
    );

    if (outcome.status !== "success") throw new Error("expected success");
    if (outcome.result.op !== "token_transfer") return;
    expect(outcome.result.result.from).toBe(SENDER);
    expect(outcome.result.result.date).toEqual(
      new Date("2026-09-01T12:00:00.000Z")
    );
  });

  it("fails when the envelope reports an on-chain failure", () => {
    const outcome = parseTrxInfo(
      tokenTransfer({}, { success: false, error: "on-chain failure" })
    );

    expect(outcome).toEqual({ status: "failed", error: "on-chain failure" });
  });

  it("fails when the engine rejected the transfer", () => {
    const outcome = parseTrxInfo(
      tokenTransfer({ success: false, error: "insufficient balance" })
    );

    expect(outcome).toEqual({
      status: "failed",
      error: "insufficient balance",
    });
  });

  // A donation is recorded against this number, so a missing or zero amount is
  // a hard failure rather than something to keep polling on.
  it.each([0, -10, undefined, "abc"])(
    "fails on a non-positive amount (%s)",
    (amount) => {
      const outcome = parseTrxInfo(tokenTransfer({ amount }));
      expect(outcome).toEqual({
        status: "failed",
        error: "Invalid transaction amount",
      });
    }
  );

  it("fails when the result belongs to a different transaction", () => {
    const outcome = parseTrxInfo(tokenTransfer({ trx_id: "some-other-id" }));

    expect(outcome).toEqual({
      status: "failed",
      error: "Transaction ID mismatch",
    });
  });

  it("stays pending when the result JSON is unparseable", () => {
    const outcome = parseTrxInfo(tokenTransfer({}, { result: "not-json" }));

    expect(outcome).toEqual({ status: "pending" });
  });

  it("stays pending when the transaction is not on-chain yet", () => {
    expect(parseTrxInfo(null)).toEqual({ status: "pending" });
  });

  // The registry dispatches on the op, so a transfer parser can never claim a
  // transaction of a different type — callers check `result.op` to be sure.
  it("does not claim a transaction of another type", () => {
    const outcome = parseTrxInfo(
      tokenTransfer({}, { type: "some_unsupported_op" })
    );

    expect(outcome).toEqual({ status: "pending" });
  });
});
