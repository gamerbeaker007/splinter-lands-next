"use client";

/**
 * The SPL JWT as the browser sees it, for JWT reads sent straight to SPL
 * (lib/frontend/spl-browser-api.ts).
 *
 * One token, one place: the `jwt_token` cookie. The server sets it after
 * verifying the token upstream (`establishSessionAction`) and reads it on every
 * server action (`getAuthStatus`); it is deliberately NOT httpOnly so this
 * module can read it too and put it in the `Authorization` header. Cookies only
 * travel to this site's own origin, never to SPL, so the header is still added
 * by hand — exactly what the SPL site itself does.
 *
 * httpOnly would buy nothing here: the browser needs the token anyway, and an
 * XSS that can read a cookie could equally read any other copy. What makes the
 * server trust it is the upstream SPL verification, not the cookie flag; the
 * CSP (next.config.ts) is the defence against script injection.
 *
 * A module-level store (not React state) so plain async helpers — the
 * `use*Action` flows, loaders — can read it without threading props.
 */

const SESSION_COOKIE = "jwt_token";

export interface SplSession {
  username: string;
  token: string;
}

const listeners = new Set<() => void>();
const unauthorizedListeners = new Set<() => void>();
// Last parsed session, so the snapshot keeps its identity while the cookie
// holds the same token (useSyncExternalStore compares by reference).
let cached: SplSession | null = null;

function decodePayload(token: string): { sub?: unknown; exp?: unknown } {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

function readCookie(): string | null {
  for (const part of document.cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function notify() {
  listeners.forEach((listener) => listener());
}

/**
 * The live session, or null (no cookie, an unreadable or expired token). Pure
 * — safe as a `useSyncExternalStore` snapshot.
 *
 * The username comes from the token's `sub` claim, which is only a decode:
 * whether the token is genuine is decided by SPL (it rejects a forged one with
 * 401) and, for anything the server does, by `getAuthStatus`.
 */
export function getSplSession(): SplSession | null {
  if (typeof document === "undefined") return null;
  const token = readCookie();
  if (!token) return (cached = null);
  if (cached?.token === token) return cached;

  const { sub, exp } = decodePayload(token);
  if (typeof sub !== "string") return (cached = null);
  if (typeof exp === "number" && exp * 1000 <= Date.now()) return null;
  return (cached = { username: sub.toLowerCase(), token });
}

/** The session for `username`, or null when the cookie holds someone else's. */
export function getSplSessionFor(username: string): SplSession | null {
  const session = getSplSession();
  return session && session.username === username.toLowerCase()
    ? session
    : null;
}

/** Call after the server set or replaced the cookie (login). */
export function splSessionChanged() {
  notify();
}

/** Drops the cookie in this browser (the server clears its side on logout). */
export function clearSplSession() {
  const had = readCookie() !== null;
  document.cookie = `${SESSION_COOKIE}=; Max-Age=0; Path=/; SameSite=Strict`;
  cached = null;
  if (had) notify();
}

/**
 * Called by the browser transport when SPL rejects the token (HTTP 401).
 * Clears it and tells AuthContext, which logs the user out and prompts again.
 */
export function reportUnauthorized(token: string) {
  if (readCookie() !== token) return; // already replaced
  clearSplSession();
  unauthorizedListeners.forEach((listener) => listener());
}

export function onSplUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

interface CookieStoreLike extends EventTarget {
  addEventListener(type: "change", listener: () => void): void;
}

/**
 * For `useSyncExternalStore`. Follows logins/logouts in other tabs through the
 * Cookie Store API where the browser has it, and otherwise re-checks whenever
 * the tab regains focus.
 */
export function subscribeSplSession(listener: () => void): () => void {
  listeners.add(listener);
  const cookieStore = (window as { cookieStore?: CookieStoreLike }).cookieStore;
  cookieStore?.addEventListener("change", listener);
  window.addEventListener("focus", listener);
  return () => {
    listeners.delete(listener);
    cookieStore?.removeEventListener("change", listener);
    window.removeEventListener("focus", listener);
  };
}
