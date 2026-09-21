import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();

vi.mock("axios", () => ({
  default: { create: () => ({ get, defaults: {} }) },
}));
vi.mock("retry-axios", () => ({ attach: () => 0 }));
vi.mock("@/generated/prisma/client", () => ({}));
vi.mock("../../log/logger.server", () => ({
  default: { info: () => {}, warn: () => {}, error: () => {} },
  logError: () => {},
}));

const { fetchAllDeedHarvestActions, fetchAllDeedProjects } =
  await import("./spl-land-api");

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
    get.mockResolvedValue({ data: { status: "success", data: -1 } });

    await expect(fetchAllDeedProjects(UNKNOWN_DEED)).resolves.toEqual({
      status: "success",
      data: [],
    });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("treats a null data payload as an empty page of harvest actions", async () => {
    get.mockResolvedValue({ data: { status: "success", data: null } });

    await expect(fetchAllDeedHarvestActions(UNKNOWN_DEED)).resolves.toEqual({
      status: "success",
      data: [],
    });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("still rejects a non-success response", async () => {
    get.mockResolvedValue({ data: { status: "error" } });

    await expect(fetchAllDeedProjects(UNKNOWN_DEED)).rejects.toThrow(
      "Invalid response from Splinterlands API"
    );
  });

  it("keeps paginating while a full page comes back", async () => {
    const page = (ids: number[]) => ({
      data: { status: "success", data: ids.map((id) => ({ id })) },
    });
    const full = Array.from({ length: 100 }, (_, i) => i + 1);

    get.mockResolvedValueOnce(page(full)).mockResolvedValueOnce(page([101]));

    const result = await fetchAllDeedProjects("I-295-1aa8c0692dc15d");

    expect(get).toHaveBeenCalledTimes(2);
    expect(result.data).toHaveLength(101);
    // Second request continues from the last id of the first page.
    expect(get.mock.calls[1][1].params.offset).toBe(100);
  });
});
