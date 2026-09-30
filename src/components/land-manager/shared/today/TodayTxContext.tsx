"use client";

import { fragmentsIn, laborsLuckIn } from "@/lib/shared/harvestRewards";
import { SplTrxResult } from "@/types/spl/trx";
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

/** The confirmed payloads of the given tx ids (unknown ones are skipped). */
function resultsOf(
  txResults: Map<string, SplTrxResult>,
  txIds: string[]
): (SplTrxResult | undefined)[] {
  return txIds.map((id) => txResults.get(id));
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
      laborsLuckFrom: (txIds: string[]) =>
        laborsLuckIn(resultsOf(state.txResults, txIds)),
      fragmentsByDeed: (txIds: string[]) =>
        fragmentsIn(resultsOf(state.txResults, txIds)),
    }),
    [state]
  );
}
