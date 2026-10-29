import { Client } from "@hiveio/dhive";
import logger from "../../log/logger.server";

// Keep in sync with lib/frontend/support-data.ts HIVE_NODES (browser reads).
const HIVE_NODES = [
  "https://api.hive.blog",
  "https://api.openhive.network",
  "https://rpc.mahdiyari.info",
  "https://api.deathwing.me",
];

// dhive rotates to the next node on failure, so one shared client is enough.
const client = new Client(HIVE_NODES);

/** Current Hive head block number. */
export async function fetchHiveHeadBlock(): Promise<number> {
  const props = await client.database.getDynamicGlobalProperties();
  return props.head_block_number;
}

export interface HiveTransfer {
  from: string;
  to: string;
  amount: number;
  currency: "HIVE" | "HBD";
}

interface RawTransferOp {
  from?: string;
  to?: string;
  /** Always "<amount> <symbol>", e.g. "1.000 HIVE". */
  amount?: string;
}

/**
 * Reads a `transfer` operation back off the chain by transaction id.
 *
 * A HIVE/HBD donation is a native Hive transfer, so it never reaches the SPL
 * engine and `fetchTransactionLookup` will never find it. This is the
 * equivalent authoritative source: it is what makes the amount server-verified
 * rather than whatever the browser claimed it sent.
 *
 * Returns null while the transaction is not yet retrievable (the block still
 * has to be applied) or when it carries no HIVE/HBD transfer at all — callers
 * poll on null and treat a persistent null as "not confirmed".
 */
export async function fetchHiveTransfer(
  trxId: string
): Promise<HiveTransfer | null> {
  let tx: unknown;
  try {
    tx = await client.call("condenser_api", "get_transaction", [trxId]);
  } catch (error) {
    logger.warn(`[hive] get_transaction failed for ${trxId}: ${error}`);
    return null;
  }

  const operations = (tx as { operations?: [string, RawTransferOp][] })
    ?.operations;
  if (!Array.isArray(operations)) return null;

  const transfer = operations.find(([op]) => op === "transfer")?.[1];
  if (!transfer?.from || !transfer.to || !transfer.amount) return null;

  const [rawAmount, currency] = String(transfer.amount).split(" ");
  if (currency !== "HIVE" && currency !== "HBD") return null;

  const amount = Number.parseFloat(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return { from: transfer.from, to: transfer.to, amount, currency };
}
