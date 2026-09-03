import { describe, expect, it } from "vitest";
import {
  parseTokenTransferTrxInfo,
  type RawTokenTransferTrxInfo,
} from "@/lib/backend/api/spl/spl-support-api";
import { DONATION_ACCOUNT } from "@/constants/support";

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_TX_ID = "b6027ec22f2569f936d61ad7eef85ffa59590d70";
const SENDER = "shinoumonk";

function makeTrxInfo(
  overrides: Partial<RawTokenTransferTrxInfo> = {}
): RawTokenTransferTrxInfo {
  const data = {
    token: "DEC",
    to: DONATION_ACCOUNT,
    qty: 100,
    memo: "donation to spl-stats.com",
  };
  const result = {
    success: true,
    from: SENDER,
    to: DONATION_ACCOUNT,
    amount: 100,
    token: "DEC",
    trx_id: VALID_TX_ID,
    created_date: "2026-09-01T12:00:00.000Z",
  };
  return {
    id: VALID_TX_ID,
    type: "token_transfer",
    player: SENDER,
    data: JSON.stringify(data),
    result: JSON.stringify(result),
    success: true,
    error: null,
    created_date: "2026-09-01T12:00:00.000Z",
    ...overrides,
  };
}

// ── Validation: valid transactions ────────────────────────────────────────────

describe("parseTokenTransferTrxInfo – valid transactions", () => {
  it("parses a valid DEC transaction", () => {
    const out = parseTokenTransferTrxInfo(makeTrxInfo());
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.data.token).toBe("DEC");
    expect(out.data.amount).toBe(100);
    expect(out.data.to).toBe(DONATION_ACCOUNT);
    expect(out.data.from).toBe(SENDER);
    expect(out.data.trxId).toBe(VALID_TX_ID);
  });

  it("parses a valid SPS transaction", () => {
    const out = parseTokenTransferTrxInfo(
      makeTrxInfo({
        result: JSON.stringify({
          success: true,
          from: SENDER,
          to: DONATION_ACCOUNT,
          amount: 50,
          token: "SPS",
          trx_id: VALID_TX_ID,
        }),
      })
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.data.token).toBe("SPS");
    expect(out.data.amount).toBe(50);
  });
});

// ── Validation: failed / invalid transactions ─────────────────────────────────

describe("parseTokenTransferTrxInfo – invalid/failed transactions", () => {
  it("fails when trxInfo.success is false", () => {
    const out = parseTokenTransferTrxInfo(
      makeTrxInfo({ success: false, error: "on-chain failure" })
    );
    expect(out.ok).toBe(false);
    if (out.ok || out.pending) return;
    expect(out.error).toMatch(/on-chain/i);
  });

  it("fails when type is not token_transfer", () => {
    const out = parseTokenTransferTrxInfo(
      makeTrxInfo({ type: "land_operation" })
    );
    expect(out.ok).toBe(false);
    if (out.ok || out.pending) return;
    expect(out.error).toMatch(/unexpected transaction type/i);
  });

  it("fails when result.success is false", () => {
    const result = JSON.stringify({ success: false, from: SENDER });
    const out = parseTokenTransferTrxInfo(makeTrxInfo({ result }));
    expect(out.ok).toBe(false);
    if (out.ok || out.pending) return;
    expect(out.error).toMatch(/failure/i);
  });

  it("fails when amount is zero", () => {
    const result = JSON.stringify({
      success: true,
      from: SENDER,
      to: DONATION_ACCOUNT,
      amount: 0,
      token: "DEC",
    });
    const out = parseTokenTransferTrxInfo(makeTrxInfo({ result }));
    expect(out.ok).toBe(false);
    if (out.ok || out.pending) return;
    expect(out.error).toMatch(/invalid.*amount/i);
  });

  it("fails when amount is negative", () => {
    const result = JSON.stringify({
      success: true,
      from: SENDER,
      to: DONATION_ACCOUNT,
      amount: -10,
      token: "DEC",
    });
    const out = parseTokenTransferTrxInfo(makeTrxInfo({ result }));
    expect(out.ok).toBe(false);
  });

  it("fails when trx_id in result does not match", () => {
    const result = JSON.stringify({
      success: true,
      from: SENDER,
      to: DONATION_ACCOUNT,
      amount: 100,
      token: "DEC",
      trx_id: "different_id",
    });
    const out = parseTokenTransferTrxInfo(makeTrxInfo({ result }));
    expect(out.ok).toBe(false);
    if (out.ok || out.pending) return;
    expect(out.error).toMatch(/mismatch/i);
  });

  it("fails when result JSON is unparseable", () => {
    const out = parseTokenTransferTrxInfo(makeTrxInfo({ result: "not-json" }));
    expect(out.ok).toBe(false);
  });
});

// ── Donation amount validation ────────────────────────────────────────────────

describe("donation amount validation logic", () => {
  function validateDonationAmount(
    value: string,
    balance: number
  ): string | null {
    const num = parseFloat(value);
    if (!value || isNaN(num)) return "invalid";
    if (!isFinite(num)) return "invalid";
    if (num <= 0) return "zero or negative";
    if (num > balance) return "exceeds balance";
    return null;
  }

  it("accepts a valid DEC amount", () => {
    expect(validateDonationAmount("100", 500)).toBeNull();
  });

  it("accepts a valid SPS amount", () => {
    expect(validateDonationAmount("5.5", 100)).toBeNull();
  });

  it("accepts a valid HIVE amount", () => {
    expect(validateDonationAmount("1.000", 50)).toBeNull();
  });

  it("accepts a valid HBD amount", () => {
    expect(validateDonationAmount("2.500", 10)).toBeNull();
  });

  it("rejects zero", () => {
    expect(validateDonationAmount("0", 100)).toBe("zero or negative");
  });

  it("rejects negative", () => {
    expect(validateDonationAmount("-1", 100)).toBe("zero or negative");
  });

  it("rejects invalid string", () => {
    expect(validateDonationAmount("abc", 100)).toBe("invalid");
  });

  it("rejects amount exceeding balance", () => {
    expect(validateDonationAmount("200", 100)).toBe("exceeds balance");
  });

  it("rejects empty string", () => {
    expect(validateDonationAmount("", 100)).toBe("invalid");
  });
});

// ── Validator vote state logic ────────────────────────────────────────────────

describe("validator vote state logic", () => {
  const VALIDATOR = "beaker007";

  function determineVoteState(
    votes: { validator: string }[],
    maxVotes: number
  ) {
    const alreadyVoted = votes.some(
      (v) => v.validator.toLowerCase() === VALIDATOR.toLowerCase()
    );
    if (alreadyVoted) return "already_voted";
    if (votes.length >= maxVotes) return "full";
    return "can_vote";
  }

  it("detects already voted for beaker007", () => {
    const votes = [{ validator: "beaker007" }, { validator: "other" }];
    expect(determineVoteState(votes, 10)).toBe("already_voted");
  });

  it("returns can_vote with zero votes", () => {
    expect(determineVoteState([], 10)).toBe("can_vote");
  });

  it("returns can_vote with nine votes and no beaker007", () => {
    const votes = Array.from({ length: 9 }, (_, i) => ({
      validator: `val${i}`,
    }));
    expect(determineVoteState(votes, 10)).toBe("can_vote");
  });

  it("returns full with ten votes and no beaker007", () => {
    const votes = Array.from({ length: 10 }, (_, i) => ({
      validator: `val${i}`,
    }));
    expect(determineVoteState(votes, 10)).toBe("full");
  });

  it("detects already_voted even with 10 total votes", () => {
    const votes = [
      { validator: "beaker007" },
      ...Array.from({ length: 9 }, (_, i) => ({ validator: `val${i}` })),
    ];
    expect(determineVoteState(votes, 10)).toBe("already_voted");
  });
});
