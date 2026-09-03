import { SPL_API_BASE } from "@/lib/shared/config/splApiConfig";
import axios from "axios";
import * as rax from "retry-axios";
import logger from "../../log/logger.server";
import { DEFAULT_RETRY_CONFIG } from "./retryConfig";

const splSupportClient = axios.create({
  baseURL: SPL_API_BASE,
  timeout: 30000,
  headers: {
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "User-Agent": "SPL-Data/1.0",
  },
});

rax.attach(splSupportClient);
splSupportClient.defaults.raxConfig = { ...DEFAULT_RETRY_CONFIG, retry: 2 };

export interface RawTokenTransferTrxInfo {
  id: string;
  type: string;
  player: string;
  data: string;
  result: string;
  success: boolean;
  error?: string | null;
  created_date: string;
}

export interface TokenTransferData {
  token: string;
  to: string;
  qty: number;
  memo?: string;
}

export interface TokenTransferResult {
  success: boolean;
  from: string;
  to: string;
  amount: number;
  token: string;
  trx_id?: string;
  type?: string;
  created_date?: string;
}

/** Fetches a raw token_transfer trx_info envelope from the SPL API. */
export async function fetchRawTokenTransfer(
  trxId: string
): Promise<RawTokenTransferTrxInfo | null> {
  try {
    logger.info(`Fetch raw token transfer: ${trxId}`);
    const res = await splSupportClient.get("/transactions/lookup", {
      params: { trx_id: trxId },
    });
    const trxInfo = res.data?.trx_info as RawTokenTransferTrxInfo | undefined;
    return trxInfo ?? null;
  } catch {
    return null;
  }
}

export interface VerifiedTokenTransfer {
  from: string;
  to: string;
  token: string;
  amount: number;
  date: Date;
  trxId: string;
}

export type TokenTransferVerifyResult =
  | { ok: true; data: VerifiedTokenTransfer }
  | { ok: false; pending: true }
  | { ok: false; pending: false; error: string };

/** Verifies and parses a token_transfer transaction. */
export function parseTokenTransferTrxInfo(
  trxInfo: RawTokenTransferTrxInfo
): TokenTransferVerifyResult {
  if (!trxInfo.success) {
    return {
      ok: false,
      pending: false,
      error: trxInfo.error ?? "Transaction failed on-chain",
    };
  }

  if (trxInfo.type !== "token_transfer") {
    return {
      ok: false,
      pending: false,
      error: `Unexpected transaction type: ${trxInfo.type}`,
    };
  }

  let resultObj: TokenTransferResult;
  try {
    resultObj = JSON.parse(trxInfo.result) as TokenTransferResult;
  } catch {
    return {
      ok: false,
      pending: false,
      error: "Could not parse transaction result",
    };
  }

  if (!resultObj.success) {
    return {
      ok: false,
      pending: false,
      error: "Transaction result indicates failure",
    };
  }

  const amount = Number(resultObj.amount);
  if (!isFinite(amount) || amount <= 0) {
    return { ok: false, pending: false, error: "Invalid transaction amount" };
  }

  if (resultObj.trx_id && resultObj.trx_id !== trxInfo.id) {
    return { ok: false, pending: false, error: "Transaction ID mismatch" };
  }

  const date = resultObj.created_date
    ? new Date(resultObj.created_date)
    : new Date(trxInfo.created_date);

  return {
    ok: true,
    data: {
      from: resultObj.from ?? trxInfo.player,
      to: resultObj.to,
      token: resultObj.token,
      amount,
      date,
      trxId: trxInfo.id,
    },
  };
}
