import { HIVE_BLOCK_SECONDS } from "@/lib/shared/hive/splCatchUp";
import {
  type HiveTxStatus,
  waitForInclusion,
} from "@/lib/shared/hive/waitForInclusion";
import { describe, expect, it } from "vitest";

/** `find_transaction` answering from a script, on a fake clock. */
function deps(statuses: (HiveTxStatus | Error)[]) {
  let t = 0;
  let call = 0;
  return {
    findTransaction: async () => {
      const s = statuses[Math.min(call++, statuses.length - 1)];
      if (s instanceof Error) throw s;
      return s;
    },
    sleep: async (ms: number) => {
      t += ms;
    },
    now: () => t,
    elapsed: () => t,
  };
}

describe("waitForInclusion", () => {
  it("waits through the mempool, then one more block", async () => {
    const d = deps(["unknown", "within_mempool", "within_reversible_block"]);
    expect(await waitForInclusion("tx", d, 60_000)).toBe("included");
    expect(d.elapsed()).toBe(2_000 + HIVE_BLOCK_SECONDS * 1000);
  });

  it("reports an expired tx as expired", async () => {
    const d = deps(["within_mempool", "expired_reversible"]);
    expect(await waitForInclusion("tx", d, 60_000)).toBe("expired");
  });

  it("is unknown when the tx never gets into a block in time", async () => {
    const d = deps(["within_mempool"]);
    expect(await waitForInclusion("tx", d, 10_000)).toBe("unknown");
  });

  it("rides out a lookup hiccup, but not a lookup that keeps failing", async () => {
    const boom = new Error("node down");
    expect(
      await waitForInclusion(
        "tx",
        deps([boom, "within_irreversible_block"]),
        60_000
      )
    ).toBe("included");
    expect(await waitForInclusion("tx", deps([boom]), 60_000)).toBe("unknown");
  });
});
