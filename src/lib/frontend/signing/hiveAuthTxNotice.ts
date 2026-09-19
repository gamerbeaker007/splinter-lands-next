"use client";

export const HIVEAUTH_PHONE_APPROVAL_MESSAGE =
  "HiveAuth: Please approve/sign this transaction on your phone.";

export const HIVEAUTH_SESSION_EXPIRED_EVENT = "hiveauth:session-expired";

interface HiveAuthTxNoticeState {
  visible: boolean;
  message: string;
  expire?: number;
}

let state: HiveAuthTxNoticeState = {
  visible: false,
  message: HIVEAUTH_PHONE_APPROVAL_MESSAGE,
};

const listeners = new Set<() => void>();
let activeRequests = 0;

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeHiveAuthTxNotice(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getHiveAuthTxNoticeSnapshot(): HiveAuthTxNoticeState {
  return state;
}

export function showHiveAuthTxNotice(expire?: number): void {
  activeRequests += 1;
  state = {
    visible: true,
    message: HIVEAUTH_PHONE_APPROVAL_MESSAGE,
    expire,
  };
  emit();
}

export function updateHiveAuthTxNotice(expire?: number): void {
  if (!state.visible) return;
  state = { ...state, expire };
  emit();
}

export function hideHiveAuthTxNotice(): void {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests > 0) return;
  state = {
    visible: false,
    message: HIVEAUTH_PHONE_APPROVAL_MESSAGE,
  };
  emit();
}

export function notifyHiveAuthSessionExpired(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(HIVEAUTH_SESSION_EXPIRED_EVENT));
}
