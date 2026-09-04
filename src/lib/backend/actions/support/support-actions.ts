"use server";

import { DONATION_ACCOUNT, type DonationCurrency } from "@/constants/support";
import { getAuthStatus } from "@/lib/backend/actions/auth-actions";
import {
  fetchHiveAccountBalances,
  fetchHiveTransfer,
} from "@/lib/backend/api/hive/hive-account-api";
import {
  fetchPlayerBalances,
  fetchTransactionLookup,
} from "@/lib/backend/api/spl/spl-base-api";
import { getPrices } from "@/lib/backend/api/spl/spl-prices-api";
import {
  fetchValidatorVotesByAccount,
  ValidatorVote,
} from "@/lib/backend/api/spl/spl-validator-api";
import logger from "@/lib/backend/log/logger.server";
import { prisma } from "@/lib/prisma";
import { TRX_VERIFY_POLL_MS, TRX_VERIFY_TIMEOUT_MS } from "@/types/landManager";
import { Decimal } from "@prisma/client/runtime/client";

// ── Validator votes ───────────────────────────────────────────────────────────

export async function getValidatorVotes(): Promise<{
  votes: ValidatorVote[];
  error?: string;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { votes: [], error: "Not authenticated" };
  }
  try {
    const votes = await fetchValidatorVotesByAccount(auth.username);
    return { votes };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.warn(`[support] Failed to fetch validator votes: ${msg}`);
    return { votes: [], error: msg };
  }
}

// ── Balances ──────────────────────────────────────────────────────────────────

export async function getSupportBalances(): Promise<{
  dec: number;
  sps: number;
  hive: number;
  hbd: number;
  error?: string;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { dec: 0, sps: 0, hive: 0, hbd: 0, error: "Not authenticated" };
  }

  const [splResult, hiveResult] = await Promise.allSettled([
    fetchPlayerBalances(auth.username, ["DEC", "SPS"]),
    fetchHiveAccountBalances(auth.username),
  ]);

  let dec = 0;
  let sps = 0;
  let hive = 0;
  let hbd = 0;
  const errors: string[] = [];

  if (splResult.status === "fulfilled") {
    for (const b of splResult.value) {
      if (b.token === "DEC") dec = Number(b.balance);
      if (b.token === "SPS") sps = Number(b.balance);
    }
  } else {
    errors.push("Could not load DEC/SPS balances");
    logger.warn(`[support] SPL balance fetch failed: ${splResult.reason}`);
  }

  if (hiveResult.status === "fulfilled") {
    hive = hiveResult.value.hive;
    hbd = hiveResult.value.hbd;
  } else {
    errors.push("Could not load HIVE/HBD balances");
    logger.warn(`[support] Hive balance fetch failed: ${hiveResult.reason}`);
  }

  return {
    dec,
    sps,
    hive,
    hbd,
    error: errors.length > 0 ? errors.join("; ") : undefined,
  };
}

// ── Donation recording ────────────────────────────────────────────────────────
//
// Both flows follow the same shape: the client hands over nothing but a
// transaction id, and the server reads the amount back off the authoritative
// source before it writes a row. Nothing the browser claims about what was sent
// is trusted — the two sources just differ.
//
//   DEC / SPS  → sm_token_transfer, settled by the SPL engine, read through the
//                shared `fetchTransactionLookup` / `parseTrxInfo` pipeline.
//   HIVE / HBD → a native Hive transfer that never reaches the SPL engine, read
//                back off the chain with `fetchHiveTransfer`.

export type DonationRecordResult =
  | { status: "success"; donationId: number }
  | { status: "pending"; message: string }
  | { status: "already_recorded" }
  | { status: "error"; error: string };

const PENDING_MESSAGE =
  "Your transaction was broadcast successfully but is still being confirmed. Please try again in a few seconds.";

/** Shared tail: price the confirmed transfer in USD and store it. */
async function storeDonation(input: {
  username: string;
  currency: DonationCurrency;
  amount: number;
  txId: string;
  createdAt?: Date;
}): Promise<DonationRecordResult> {
  const { username, currency, amount, txId, createdAt } = input;

  let prices;
  try {
    prices = await getPrices();
  } catch (err) {
    logger.error("[support] Failed to fetch prices for donation", err);
    return {
      status: "error",
      error: "Could not retrieve current token price. Please try again.",
    };
  }

  // Every donation currency is one of the price feed's keys by construction.
  const usdPrice =
    prices[currency.toLowerCase() as Lowercase<DonationCurrency>];
  const usdValue = amount * (usdPrice ?? 0);

  try {
    const donation = await prisma.supportDonation.create({
      data: {
        ...(createdAt ? { created_at: createdAt } : {}),
        username,
        currency,
        amount: new Decimal(amount),
        usd_value: new Decimal(usdValue),
        tx: txId,
      },
    });
    logger.info(
      `[support] Recorded ${currency} donation ${amount} from ${username}, tx=${txId}`
    );
    return { status: "success", donationId: donation.id };
  } catch (err: unknown) {
    // Unique constraint violation = already recorded (race condition).
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return { status: "already_recorded" };
    }
    logger.error("[support] Failed to record donation", err);
    return { status: "error", error: "Failed to save donation record" };
  }
}

/** Guard shared by both flows: authenticated, sane txId, not already stored. */
async function beginRecording(
  txId: string
): Promise<
  { ok: true; username: string } | { ok: false; result: DonationRecordResult }
> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return {
      ok: false,
      result: { status: "error", error: "Not authenticated" },
    };
  }

  if (typeof txId !== "string" || txId.trim().length === 0) {
    return {
      ok: false,
      result: { status: "error", error: "Invalid transaction ID" },
    };
  }

  const existing = await prisma.supportDonation.findUnique({
    where: { tx: txId },
  });
  if (existing) {
    return { ok: false, result: { status: "already_recorded" } };
  }

  return { ok: true, username: auth.username };
}

const sameAccount = (a: string, b: string) =>
  a.toLowerCase() === b.toLowerCase();

/** Records a DEC or SPS donation from its sm_token_transfer transaction. */
export async function recordTokenTransferDonation(
  txId: string
): Promise<DonationRecordResult> {
  const start = await beginRecording(txId);
  if (!start.ok) return start.result;

  // A single lookup, not a poll: the client already waited on this transaction
  // with `waitForTransactions` before calling in, so by now the engine either
  // knows about it or something is wrong. This call is the server-side
  // VERIFICATION of what actually moved, not a second waiting room.
  const outcome = await fetchTransactionLookup(txId);

  if (outcome.status === "pending") {
    return { status: "pending", message: PENDING_MESSAGE };
  }
  if (outcome.status === "failed") {
    return { status: "error", error: outcome.error };
  }
  if (outcome.result.op !== "token_transfer") {
    return {
      status: "error",
      error: `Unexpected transaction type: ${outcome.result.op}`,
    };
  }

  const { from, to, token, amount, date } = outcome.result.result;

  if (!sameAccount(from, start.username)) {
    return {
      status: "error",
      error: "Transaction sender does not match authenticated account",
    };
  }
  if (!sameAccount(to, DONATION_ACCOUNT)) {
    return {
      status: "error",
      error: "Transaction recipient is not the donation account",
    };
  }
  if (token !== "DEC" && token !== "SPS") {
    return {
      status: "error",
      error: `Unsupported token: ${token}. Only DEC and SPS are accepted.`,
    };
  }

  return storeDonation({
    username: from,
    currency: token,
    amount,
    txId,
    createdAt: date,
  });
}

/** Records a HIVE or HBD donation from its native Hive transfer transaction. */
export async function recordHiveTransferDonation(
  txId: string
): Promise<DonationRecordResult> {
  const start = await beginRecording(txId);
  if (!start.ok) return start.result;

  // Unlike the SPL path there is no client-side wait to lean on — nothing in
  // the browser can see a native Hive transfer — so the wait happens here, on
  // the cadence and ceiling every other confirmation in the app uses.
  const deadline = Date.now() + TRX_VERIFY_TIMEOUT_MS;
  let transfer = await fetchHiveTransfer(txId);
  while (!transfer && Date.now() + TRX_VERIFY_POLL_MS < deadline) {
    await new Promise((r) => setTimeout(r, TRX_VERIFY_POLL_MS));
    transfer = await fetchHiveTransfer(txId);
  }
  if (!transfer) return { status: "pending", message: PENDING_MESSAGE };

  if (!sameAccount(transfer.from, start.username)) {
    return {
      status: "error",
      error: "Transaction sender does not match authenticated account",
    };
  }
  if (!sameAccount(transfer.to, DONATION_ACCOUNT)) {
    return {
      status: "error",
      error: "Transaction recipient is not the donation account",
    };
  }

  return storeDonation({
    username: transfer.from,
    currency: transfer.currency,
    amount: transfer.amount,
    txId,
  });
}
