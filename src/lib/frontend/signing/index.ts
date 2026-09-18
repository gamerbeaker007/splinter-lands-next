"use client";

import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { HiveAuthSigner } from "./HiveAuthSigner";
import { KeychainSigner } from "./KeychainSigner";
import type { Signer, SignerKind } from "./Signer";

export type { Signer, SignerKeyType, SignerKind } from "./Signer";
export { HiveAuthSigner } from "./HiveAuthSigner";

const signers: Record<SignerKind, Signer> = {
  keychain: new KeychainSigner(),
  hiveauth: new HiveAuthSigner(),
};

let currentKind: SignerKind = "keychain";

function browserDefaultKind(): SignerKind {
  if (typeof window === "undefined") return "keychain";
  try {
    const stored = window.localStorage.getItem("land-manager-signer");
    if (stored === "keychain" || stored === "hiveauth") return stored;
  } catch {
    // Storage availability is optional.
  }
  return signers.keychain.isAvailable() ? "keychain" : "hiveauth";
}

function rememberKind(kind: SignerKind): void {
  try {
    window.localStorage.setItem("land-manager-signer", kind);
  } catch {
    // Storage availability is optional.
  }
}

export function getSigner(kind: SignerKind): Signer {
  return signers[kind];
}

export function getCurrentSigner(): Signer {
  return getSigner(currentKind);
}

interface SignerContextValue {
  kind: SignerKind;
  signer: Signer;
  setKind: (kind: SignerKind) => void;
}

const SignerContext = createContext<SignerContextValue | undefined>(undefined);

export function SignerProvider({ children }: { children: ReactNode }) {
  const [kind, setKindState] = useState<SignerKind>(() => {
    const initialKind = browserDefaultKind();
    currentKind = initialKind;
    return initialKind;
  });

  const setKind = useCallback((nextKind: SignerKind) => {
    currentKind = nextKind;
    setKindState(nextKind);
    if (typeof window !== "undefined") rememberKind(nextKind);
  }, []);

  return createElement(
    SignerContext.Provider,
    { value: { kind, signer: getSigner(kind), setKind } },
    children
  );
}

export function useSigner(): SignerContextValue {
  const context = useContext(SignerContext);
  if (!context)
    throw new Error("useSigner must be used within a SignerProvider");
  return context;
}
