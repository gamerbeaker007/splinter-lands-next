/**
 * Lifecycle of a broadcast-backed action, shared by the worksite hooks.
 *
 * Every on-chain action goes through two waits that feel very different to the
 * user: signing in Keychain, then waiting for Splinterlands to accept the
 * transaction. Reporting them separately is what makes a 30s wait legible
 * instead of looking like a hang.
 */
export type ActionPhase = "idle" | "broadcasting" | "confirming";

/** Short status text for a running action — null when nothing is running. */
export function actionPhaseLabel(phase: ActionPhase): string | null {
  switch (phase) {
    case "broadcasting":
      return "Signing & broadcasting…";
    case "confirming":
      return "Validating on chain…";
    default:
      return null;
  }
}

/**
 * Compact status for inside a button — includes the transaction counter when a
 * bulk run spans several transactions ("Validating 2/4…").
 */
export function actionButtonLabel(
  phase: ActionPhase,
  progress?: { done: number; total: number } | null
): string | null {
  if (phase === "broadcasting") return "Signing…";
  if (phase === "confirming") {
    return progress && progress.total > 1
      ? `Validating ${progress.done}/${progress.total}…`
      : "Validating…";
  }
  return null;
}
