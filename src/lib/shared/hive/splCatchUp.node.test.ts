import {
  estimateRunSeconds,
  HIVE_BLOCK_SECONDS,
  SPL_CATCHUP_BLOCKS_PER_SECOND,
  splConfirmSeconds,
} from "@/lib/shared/hive/splCatchUp";
import { describe, expect, it } from "vitest";

describe("splConfirmSeconds", () => {
  it("is at least one block, even when SPL is at the head", () => {
    expect(splConfirmSeconds(0)).toBeGreaterThanOrEqual(HIVE_BLOCK_SECONDS);
  });

  it("works through the lag plus our block at SPL's catch-up speed", () => {
    expect(splConfirmSeconds(60)).toBeCloseTo(
      61 / SPL_CATCHUP_BLOCKS_PER_SECOND
    );
  });
});

describe("estimateRunSeconds", () => {
  it("one batch is signing plus one confirmation", () => {
    expect(estimateRunSeconds(1, 19)).toBeGreaterThan(splConfirmSeconds(19));
    expect(estimateRunSeconds(1, 19)).toBeLessThan(splConfirmSeconds(19) + 10);
  });

  it("pays SPL's lag once, not per batch", () => {
    const behind = 60; // 3 minutes
    const perExtraBatch =
      estimateRunSeconds(11, behind) - estimateRunSeconds(10, behind);
    expect(perExtraBatch).toBe(
      estimateRunSeconds(11, 0) - estimateRunSeconds(10, 0)
    );
    expect(perExtraBatch).toBeLessThan(15);
  });

  it("grows with the number of batches and with the lag", () => {
    expect(estimateRunSeconds(4, 10)).toBeGreaterThan(
      estimateRunSeconds(3, 10)
    );
    expect(estimateRunSeconds(4, 40)).toBeGreaterThan(
      estimateRunSeconds(4, 10)
    );
    expect(estimateRunSeconds(0, 40)).toBe(0);
  });
});
