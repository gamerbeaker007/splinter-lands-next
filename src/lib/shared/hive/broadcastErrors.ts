/**
 * Turns a failed broadcast into a readable message and a kind the sequencer
 * can act on.
 *
 * Keychain rejects with `{ success: false, message, error }`: `message` is its
 * localized text ("Your transaction returned an error <br/><br/>Error: $1"),
 * built from the node's raw fc format string, so placeholders like `${a}` are
 * left unfilled. The values are in `error.data.stack[0].data`. dhive fills
 * them in itself (client.js), so its messages arrive readable.
 */

export type BroadcastErrorKind =
  /**
   * hived's per-account limit of 5 custom ops per block
   * (`HIVE_CUSTOM_OP_BLOCK_LIMIT`, checked in database::_push_transaction).
   * The node rejected the tx before it entered its pending pool, so it was
   * never relayed and never executed — safe to retry after the next block.
   */
  | "custom_op_limit"
  /** The player closed or declined the Keychain popup. */
  | "user_cancel"
  | "other";

export interface BroadcastErrorInfo {
  kind: BroadcastErrorKind;
  message: string;
  /**
   * True when the tx certainly did not execute: a node assertion (the node
   * answered with an fc error stack), a cancel, or a Keychain error before
   * signing. False when the text can't tell (a network error mid-broadcast),
   * because that tx may still land.
   */
  definite: boolean;
}

const CUSTOM_OP_LIMIT_FORMAT = "custom json operation(s) this block";

/**
 * Texts that don't say whether the tx reached the chain: Keychain's generic
 * `html_popup_error_while_broadcasting` (also used when the RPC call itself
 * threw) and its `unknown_error`, plus plain network failures.
 */
const AMBIGUOUS_RE =
  /error while broadcasting the transaction|something went wrong|failed to fetch|network|timed? ?out/i;

interface FcStackEntry {
  format?: unknown;
  data?: Record<string, unknown>;
}

function stackTop(err: unknown): FcStackEntry | null {
  if (!err || typeof err !== "object") return null;
  const obj = err as Record<string, unknown>;
  // Keychain puts the RPC error under `error`; a bare RPC error has `data`.
  const rpcError = (
    obj.error && typeof obj.error === "object" ? obj.error : obj
  ) as { data?: { stack?: FcStackEntry[] } };
  const top = rpcError.data?.stack?.[0];
  return top && typeof top.format === "string" ? top : null;
}

/** Fills `${key}` placeholders from fc's `data`, like dhive does. */
function fillFormat(format: string, data: Record<string, unknown> = {}) {
  return format.replace(/\$\{([a-z_]+)\}/gi, (match, key: string) =>
    data[key] === undefined ? match : String(data[key])
  );
}

/** Drops Keychain's markup and its "Your transaction returned an error" lead-in. */
function cleanKeychainText(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/[<>]/g, "")
    .replace(/^Your transaction returned an error\s*/i, "")
    .replace(/^Error:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function rawText(err: unknown): string {
  if (err == null) return "";
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message) return obj.message;
    if (typeof obj.error === "string" && obj.error) return obj.error;
    try {
      return JSON.stringify(err);
    } catch {
      return "";
    }
  }
  return String(err);
}

export function describeBroadcastError(err: unknown): BroadcastErrorInfo {
  const top = stackTop(err);
  const detail = top ? fillFormat(top.format as string, top.data) : null;
  const text = cleanKeychainText(detail ?? rawText(err));

  if (text.includes(CUSTOM_OP_LIMIT_FORMAT)) {
    return {
      kind: "custom_op_limit",
      message:
        "Hive allows only 5 custom operations per account per block, and " +
        "this account already used them in the current block (another " +
        "batch, app or bot may be broadcasting from it).",
      definite: true,
    };
  }
  if (/user_cancel|canceled by the user/i.test(text)) {
    return {
      kind: "user_cancel",
      message: "Cancelled in Keychain.",
      definite: true,
    };
  }
  return {
    kind: "other",
    message: text || "Unknown broadcast error",
    definite: top !== null || (text !== "" && !AMBIGUOUS_RE.test(text)),
  };
}
