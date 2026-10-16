"use client";

import { splBrowser } from "@/lib/frontend/spl-browser-api";
import type { TrxLookupOutcome } from "@/types/spl/trx";

/**
 * Tab-wide record of SPL tx ids that have settled (confirmed or failed).
 *
 * A settled tx never changes, so it is looked up at most once per tab: the
 * Today panel re-renders after every action and navigation, and without this
 * it re-looked up every logged id each time. Pending outcomes are not kept.
 */
export type SettledTxOutcome = Exclude<TrxLookupOutcome, { status: "pending" }>;

const settled = new Map<string, SettledTxOutcome>();

export function getSettledTxOutcome(
  txId: string
): SettledTxOutcome | undefined {
  return settled.get(txId);
}

/** Record an outcome another flow already looked up (e.g. after a broadcast). */
export function recordTxOutcome(txId: string, outcome: TrxLookupOutcome) {
  if (outcome.status !== "pending") settled.set(txId, outcome);
}

/** The settled outcome, from the record or one browser lookup. */
export async function lookupTxOutcome(txId: string): Promise<TrxLookupOutcome> {
  const known = settled.get(txId);
  if (known) return known;
  const outcome = await splBrowser.fetchTransactionLookup(txId);
  recordTxOutcome(txId, outcome);
  return outcome;
}
