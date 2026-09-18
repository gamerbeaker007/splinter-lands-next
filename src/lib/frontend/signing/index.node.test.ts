import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSignerKind, setSignerKind, subscribe } from "./index";

describe("signer kind store", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      hive_keychain: {},
    });
    setSignerKind("hiveauth");
  });

  it("sets and gets the current signer kind", () => {
    setSignerKind("keychain");

    expect(getSignerKind()).toBe("keychain");
  });

  it("notifies subscribers when the signer kind changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    setSignerKind("keychain");
    unsubscribe();
    setSignerKind("hiveauth");

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
