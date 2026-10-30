import {
  getAuthorityStatus,
  invalidateAuthorityStatusCache,
} from "@/lib/frontend/land-data";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthorityServiceInfo: vi.fn(),
  getSplSession: vi.fn(),
  fetchPlayerAuthorities: vi.fn(),
}));

vi.mock("@/lib/backend/actions/land-manager/authority-actions", () => ({
  getAuthorityServiceInfo: mocks.getAuthorityServiceInfo,
}));
vi.mock("@/lib/frontend/splSession", () => ({
  getSplSession: mocks.getSplSession,
}));
vi.mock("@/lib/frontend/spl-browser-api", () => ({
  splBrowser: { fetchPlayerAuthorities: mocks.fetchPlayerAuthorities },
}));

describe("authority status browser cache", () => {
  beforeEach(() => {
    invalidateAuthorityStatusCache("beaker007");
    vi.clearAllMocks();
    mocks.getAuthorityServiceInfo.mockResolvedValue({
      serviceConfigured: true,
      serviceAccount: "spl-land-service",
    });
    mocks.getSplSession.mockReturnValue({
      username: "beaker007",
      token: "token",
    });
  });

  it("reloads the authority list after it is invalidated", async () => {
    mocks.fetchPlayerAuthorities
      .mockResolvedValueOnce([
        { name: "beaker007", authorities: { rental: [], purchase: [] } },
      ])
      .mockResolvedValueOnce([
        {
          name: "beaker007",
          authorities: {
            rental: ["spl-land-service"],
            purchase: [],
          },
        },
      ]);

    expect((await getAuthorityStatus("rental")).authorized).toBe(false);
    invalidateAuthorityStatusCache("beaker007");

    expect((await getAuthorityStatus("rental")).authorized).toBe(true);
    expect(mocks.fetchPlayerAuthorities).toHaveBeenCalledTimes(2);
  });
});
