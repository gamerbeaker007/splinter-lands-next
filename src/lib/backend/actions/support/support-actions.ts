"use server";

import { DONATION_ACCOUNT } from "@/constants/support";
import { getAuthStatus } from "@/lib/backend/actions/auth-actions";
import { fetchHiveAccountBalances } from "@/lib/backend/api/hive/hive-account-api";
import { fetchPlayerBalances } from "@/lib/backend/api/spl/spl-base-api";
import { getPrices } from "@/lib/backend/api/spl/spl-prices-api";
import {
  fetchRawTokenTransfer,
  parseTokenTransferTrxInfo,
} from "@/lib/backend/api/spl/spl-support-api";
import {
  fetchValidatorVotesByAccount,
  ValidatorVote,
} from "@/lib/backend/api/spl/spl-validator-api";
import logger from "@/lib/backend/log/logger.server";
import { prisma } from "@/lib/prisma";
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

// ── DEC/SPS donation recording ────────────────────────────────────────────────

export type DonationRecordResult =
  | { status: "success"; donationId: number }
  | { status: "pending"; message: string }
  | { status: "already_recorded" }
  | { status: "error"; error: string };

const TOKEN_TRANSFER_LOOKUP_ATTEMPTS = 3;
const TOKEN_TRANSFER_LOOKUP_DELAY_MS = 2000;

export async function recordTokenTransferDonation(
  txId: string
): Promise<DonationRecordResult> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { status: "error", error: "Not authenticated" };
  }

  if (!txId || typeof txId !== "string" || txId.trim().length === 0) {
    return { status: "error", error: "Invalid transaction ID" };
  }

  // Idempotency: check if already recorded
  const existing = await prisma.supportDonation.findUnique({
    where: { tx: txId },
  });
  if (existing) return { status: "already_recorded" };

  // Bounded retry for indexing delay
  let trxInfo = null;
  for (let attempt = 0; attempt < TOKEN_TRANSFER_LOOKUP_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, TOKEN_TRANSFER_LOOKUP_DELAY_MS));
    }
    trxInfo = await fetchRawTokenTransfer(txId);
    if (trxInfo) break;
  }

  if (!trxInfo) {
    return {
      status: "pending",
      message:
        "Your transaction was broadcast successfully but is still being confirmed. Please try again in a few seconds.",
    };
  }

  const parsed = parseTokenTransferTrxInfo(trxInfo);
  if (!parsed.ok) {
    if (parsed.pending) {
      return {
        status: "pending",
        message: "Transaction is still confirming. Please try again shortly.",
      };
    }
    return { status: "error", error: parsed.error };
  }

  const { from, to, token, amount, date } = parsed.data;

  // Verify sender matches authenticated user
  if (from.toLowerCase() !== auth.username.toLowerCase()) {
    return {
      status: "error",
      error: "Transaction sender does not match authenticated account",
    };
  }

  // Verify recipient
  if (to.toLowerCase() !== DONATION_ACCOUNT.toLowerCase()) {
    return {
      status: "error",
      error: "Transaction recipient is not the donation account",
    };
  }

  // Verify supported token
  if (token !== "DEC" && token !== "SPS") {
    return {
      status: "error",
      error: `Unsupported token: ${token}. Only DEC and SPS are accepted.`,
    };
  }

  // Fetch current price server-side
  let prices;
  try {
    prices = await getPrices();
  } catch (err) {
    logger.error(
      "[support] Failed to fetch prices for donation recording",
      err
    );
    return {
      status: "error",
      error: "Could not retrieve current token price. Please try again.",
    };
  }

  const tokenKey = token.toLowerCase() as "dec" | "sps";
  const usdPrice = prices[tokenKey] ?? 0;
  const usdValue = amount * usdPrice;

  try {
    const donation = await prisma.supportDonation.create({
      data: {
        created_at: date,
        username: from,
        currency: token,
        amount: new Decimal(amount),
        usd_value: new Decimal(usdValue),
        tx: txId,
      },
    });
    logger.info(
      `[support] Recorded ${token} donation ${amount} from ${from}, tx=${txId}`
    );
    return { status: "success", donationId: donation.id };
  } catch (err: unknown) {
    // Unique constraint violation = already recorded (race condition)
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return { status: "already_recorded" };
    }
    logger.error("[support] Failed to record donation", err);
    return { status: "error", error: "Failed to save donation record" };
  }
}

// ── HIVE/HBD donation recording ───────────────────────────────────────────────

export async function recordHiveTransferDonation(input: {
  txId: string;
  currency: string;
  amount: number;
}): Promise<DonationRecordResult> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { status: "error", error: "Not authenticated" };
  }

  const { txId, currency, amount } = input;

  if (!txId || typeof txId !== "string" || txId.trim().length === 0) {
    return { status: "error", error: "Invalid transaction ID" };
  }

  if (currency !== "HIVE" && currency !== "HBD") {
    return { status: "error", error: `Unsupported currency: ${currency}` };
  }

  if (!isFinite(amount) || amount <= 0) {
    return { status: "error", error: "Invalid donation amount" };
  }

  // Idempotency check
  const existing = await prisma.supportDonation.findUnique({
    where: { tx: txId },
  });
  if (existing) return { status: "already_recorded" };

  // Fetch price server-side
  let prices;
  try {
    prices = await getPrices();
  } catch (err) {
    logger.error("[support] Failed to fetch prices for HIVE/HBD donation", err);
    return {
      status: "error",
      error: "Could not retrieve current token price. Please try again.",
    };
  }

  const priceKey = currency.toLowerCase() as "hive" | "hbd";
  const usdPrice = prices[priceKey] ?? 0;
  const usdValue = amount * usdPrice;

  try {
    const donation = await prisma.supportDonation.create({
      data: {
        username: auth.username,
        currency,
        amount: new Decimal(amount),
        usd_value: new Decimal(usdValue),
        tx: txId,
      },
    });
    logger.info(
      `[support] Recorded ${currency} donation ${amount} from ${auth.username}, tx=${txId}`
    );
    return { status: "success", donationId: donation.id };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return { status: "already_recorded" };
    }
    logger.error("[support] Failed to record HIVE/HBD donation", err);
    return { status: "error", error: "Failed to save donation record" };
  }
}
