"use client";

import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useSyncExternalStore,
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

let currentKind: SignerKind | undefined;
const listeners = new Set<() => void>();

function browserDefaultKind(): SignerKind {
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

export function getSignerKind(): SignerKind {
  if (typeof window === "undefined") return "hiveauth";
  currentKind ??= browserDefaultKind();
  return currentKind;
}

export function setSignerKind(kind: SignerKind): void {
  const previousKind = getSignerKind();
  currentKind = kind;
  rememberKind(kind);
  if (kind !== previousKind) {
    listeners.forEach((listener) => listener());
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getServerSignerKind(): SignerKind {
  return "hiveauth";
}

export function getSigner(kind: SignerKind): Signer {
  return signers[kind];
}

export function getCurrentSigner(): Signer {
  return getSigner(getSignerKind());
}

interface SignerContextValue {
  kind: SignerKind;
  signer: Signer;
  setKind: (kind: SignerKind) => void;
}

const SignerContext = createContext<SignerContextValue | undefined>(undefined);

export function SignerProvider({ children }: { children: ReactNode }) {
  const kind = useSyncExternalStore(
    subscribe,
    getSignerKind,
    getServerSignerKind
  );

  return createElement(
    SignerContext.Provider,
    { value: { kind, signer: getSigner(kind), setKind: setSignerKind } },
    children
  );
}

export function useSigner(): SignerContextValue {
  const context = useContext(SignerContext);
  if (!context)
    throw new Error("useSigner must be used within a SignerProvider");
  return context;
}
