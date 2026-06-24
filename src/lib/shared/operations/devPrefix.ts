import { SPL_OP_ID_PREFIX } from "@/lib/shared/config/splApiConfig";

/**
 * In dev mode, prefix the `id` of every custom_json op with `sl-mavs` so the
 * test engine routes them to its namespaced handlers. A no-op in production.
 *
 * Applied at the broadcast boundary (keychain path and relay path) so op
 * builders stay environment-agnostic. Accepts both dhive `Operation` tuples and
 * keychain `[string, object]` tuples. Returns a new array; inputs untouched.
 */
export type LooseOp = [string, object];

export function applyDevPrefixToOps(ops: LooseOp[]): LooseOp[] {
  if (!SPL_OP_ID_PREFIX) return ops;
  return ops.map((op) => {
    const [name, payload] = op;
    const id = (payload as { id?: unknown }).id;
    return name === "custom_json" && typeof id === "string"
      ? [name, { ...payload, id: SPL_OP_ID_PREFIX + id }]
      : op;
  });
}
