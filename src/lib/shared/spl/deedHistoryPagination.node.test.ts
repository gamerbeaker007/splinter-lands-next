import { createSplReads } from "@/lib/shared/spl/splReads";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The shared reads take their transport as an argument, so a fake `get`
// stands in for both the server (axios) and the browser (fetch) transport.
const get = vi.fn();
const { fetchAllDeedHarvestActions, fetchAllDeedProjects } =
  createSplReads(get);

const UNKNOWN_DEED = "not-a-real-deed-uid";

beforeEach(() => {
  get.mockReset();
});

describe("deed history pagination", () => {
  // For a deed uid it does not know the Splinterlands API still answers
  // `status: "success"`, but `data` is a scalar: `-1` from the projects
  // endpoint and `null` from the reward-actions one. Either used to be spread
  // into the accumulator and crash the deed-history page with a 500.
  it("treats a -1 data payload as an empty page of projects", async () => {
    get.mockResolvedValue({ status: "success", data: -1 });

    await expect(fetchAllDeedProjects(UNKNOWN_DEED)).resolves.toEqual({
      status: "success",
      data: [],
    });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("treats a null data payload as an empty page of harvest actions", async () => {
    get.mockResolvedValue({ status: "success", data: null });

    await expect(fetchAllDeedHarvestActions(UNKNOWN_DEED)).resolves.toEqual({
      status: "success",
      data: [],
    });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("still rejects a non-success response", async () => {
    get.mockResolvedValue({ status: "error" });

    await expect(fetchAllDeedProjects(UNKNOWN_DEED)).rejects.toThrow(
      "Invalid response from Splinterlands API"
    );
  });

  it("keeps paginating while a full page comes back", async () => {
    const page = (ids: number[]) => ({
      status: "success",
      data: ids.map((id) => ({ id })),
    });
    const full = Array.from({ length: 100 }, (_, i) => i + 1);

    get.mockResolvedValueOnce(page(full)).mockResolvedValueOnce(page([101]));

    const result = await fetchAllDeedProjects("I-295-1aa8c0692dc15d");

    expect(get).toHaveBeenCalledTimes(2);
    expect(result.data).toHaveLength(101);
    // Second request continues from the last id of the first page.
    expect(get.mock.calls[1][2].params.offset).toBe(100);
  });
});
