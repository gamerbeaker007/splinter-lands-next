/**
 * Coerce an unknown thrown/rejected/returned value into a human-readable
 * string. Useful at boundaries with browser-extension APIs (Hive Keychain)
 * that sometimes resolve or throw with plain objects shaped like
 * `{ message: "...", error: "user_cancel" }` rather than `Error` instances.
 */
export function formatError(err: unknown): string {
  if (err == null) return "Unknown error";
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message.length > 0) {
      return obj.message;
    }
    if (typeof obj.error === "string" && obj.error.length > 0) {
      return obj.error;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return "Unknown error";
    }
  }
  return String(err);
}
