/**
 * SPL processes every custom_json op of a Hive transaction as its own SPL
 * transaction: op 0 keeps the Hive tx id, op N becomes `<hiveTxId>-N`. A lookup
 * of the bare Hive tx id therefore only ever returns op 0 — results (and
 * failures) of the other ops in a batched broadcast have to be looked up by
 * their own id.
 */
export function splOpTxIds(hiveTxId: string, opCount: number): string[] {
  return Array.from({ length: opCount }, (_, i) =>
    i === 0 ? hiveTxId : `${hiveTxId}-${i}`
  );
}

/** The Hive tx id an SPL op id belongs to: `abc-2` → `abc`, `abc` → `abc`. */
export function hiveTxIdOf(opTxId: string): string {
  return opTxId.replace(/-\d+$/, "");
}

/** The distinct Hive tx ids behind a list of SPL op ids, in first-seen order. */
export function hiveTxIdsOf(opTxIds: string[]): string[] {
  return [...new Set(opTxIds.map(hiveTxIdOf))];
}
