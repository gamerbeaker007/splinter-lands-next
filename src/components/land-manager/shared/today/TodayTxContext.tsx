"use client";

import { LaborsLuckTreasure, SplTrxResult } from "@/types/spl/trx";
import { SplCardDetails } from "@/types/splCardDetails";
import { createContext, ReactNode, useContext, useMemo } from "react";

export interface TodayTxState {
  /** Tx ids confirmed on-chain. */
  verifiedTxIds: Set<string>;
  /** Tx ids rejected on-chain, mapped to the engine's error. */
  failedTxIds: Map<string, string>;
  /**
   * Parsed payloads of the confirmed transactions, keyed by tx id. This — not
   * the day log — is the source of truth for what the engine actually awarded
   * (totem fragments, Labor's Luck cards).
   */
  txResults: Map<string, SplTrxResult>;
  /** Needed to turn a Labor's Luck card uid into artwork. */
  cardDetails: SplCardDetails[] | null;
}

const EMPTY: TodayTxState = {
  verifiedTxIds: new Set(),
  failedTxIds: new Map(),
  txResults: new Map(),
  cardDetails: null,
};

const TodayTxContext = createContext<TodayTxState>(EMPTY);

/**
 * Transaction outcomes are cross-cutting — the section shell needs them for its
 * status icons and several leaf rows need them for rewards. A context keeps the
 * individual sections down to just their own slice of the day log.
 */
export function TodayTxProvider({
  value,
  children,
}: {
  value: TodayTxState;
  children: ReactNode;
}) {
  return (
    <TodayTxContext.Provider value={value}>{children}</TodayTxContext.Provider>
  );
}

/**
 * Labor's Luck cards awarded by the given transactions. Both harvest_all and
 * the DEC power-up/down auto-harvest carry per-deed harvest results, so both
 * can drop a treasure.
 */
function laborsLuckIn(
  txResults: Map<string, SplTrxResult>,
  txIds: string[]
): LaborsLuckTreasure[] {
  const treasures: LaborsLuckTreasure[] = [];
  for (const txId of txIds) {
    const parsed = txResults.get(txId);
    if (!parsed) continue;
    const deedResults =
      parsed.op === "harvest_all"
        ? parsed.result.results
        : parsed.op === "dec_powerup_region" ||
            parsed.op === "dec_powerdown_region"
          ? parsed.result.harvest_results
          : [];
    for (const deed of deedResults) {
      if (deed.labors_luck_treasure) treasures.push(deed.labors_luck_treasure);
    }
  }
  return treasures;
}

/** deed_uid → fragment code, from the confirmed tax_collection results. */
function fragmentsIn(
  txResults: Map<string, SplTrxResult>,
  txIds: string[]
): Map<string, string> {
  const found = new Map<string, string>();
  for (const txId of txIds) {
    const parsed = txResults.get(txId);
    if (parsed?.op !== "tax_collection") continue;
    const { deed_uid, fragment_found, fragment_type } = parsed.result;
    if (fragment_found && fragment_type) found.set(deed_uid, fragment_type);
  }
  return found;
}

export function useTodayTx() {
  const state = useContext(TodayTxContext);
  return useMemo(
    () => ({
      ...state,
      allVerified: (txIds: string[]) =>
        txIds.length > 0 && txIds.every((id) => state.verifiedTxIds.has(id)),
      anyFailed: (txIds: string[]) =>
        txIds.some((id) => state.failedTxIds.has(id)),
      laborsLuckFrom: (txIds: string[]) => laborsLuckIn(state.txResults, txIds),
      fragmentsByDeed: (txIds: string[]) => fragmentsIn(state.txResults, txIds),
    }),
    [state]
  );
}
