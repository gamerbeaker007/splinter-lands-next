"use client";

import {
  establishSessionAction,
  getAuthStatus,
  logoutAction,
} from "@/lib/backend/actions/auth-actions";
import { clearBrowserCaches } from "@/lib/frontend/browser-cache";
import logger from "@/lib/frontend/log/logger.client";
import { splLoginInBrowser } from "@/lib/frontend/spl-browser-api";
import {
  clearSplSession,
  getSplSessionFor,
  onSplUnauthorized,
  splSessionChanged,
} from "@/lib/frontend/splSession";
import { KeychainKeyTypes, KeychainSDK } from "keychain-sdk";
import { useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface AuthUser {
  username: string;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (
    username: string,
    timestamp?: number,
    signature?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_CHECK_ERROR = "Auth check error";

/**
 * Resolves the current session from the server, or throws.
 *
 * A server session whose cookie the browser can't read (an httpOnly cookie
 * from before browser-side SPL reads) can't make the JWT reads the land
 * manager needs, so it is ended and the user logs in again once.
 */
async function readAuthUser(): Promise<AuthUser | null> {
  const data = await getAuthStatus();
  if (!data.authenticated || !data.username) {
    clearSplSession();
    return null;
  }
  if (!getSplSessionFor(data.username)) {
    await logoutAction();
    return null;
  }
  return { username: data.username, isAuthenticated: true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Re-check the session on demand (exposed as refreshAuth).
  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      setUser(await readAuthUser());
      setError(null);
    } catch (error) {
      logger.error(AUTH_CHECK_ERROR, error);
      setError(AUTH_CHECK_ERROR);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Sign message with Keychain
  const signWithKeychain = async (
    username: string,
    message: string
  ): Promise<string> => {
    try {
      interface HiveKeychainWindow extends Window {
        hive_keychain?: unknown;
      }
      const win = window as HiveKeychainWindow;
      if (!win || !win.hive_keychain) {
        throw new Error("Keychain extension not found");
      }
      const keychain = new KeychainSDK(win);
      const result = await keychain.signBuffer({
        username: username.toLowerCase(),
        message,
        method: KeychainKeyTypes.posting,
      });

      if (result?.success) {
        const signature =
          typeof result.result === "string"
            ? result.result
            : result.message || "";

        if (!signature) {
          throw new Error("Keychain returned empty signature");
        }

        return signature;
      } else {
        throw new Error("Keychain signature was rejected or failed");
      }
    } catch (err) {
      let errorMessage = "Unknown Keychain error occurred";

      if (err instanceof Error) {
        errorMessage = `Keychain error: ${err.message}`;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = `Keychain error: ${err.message}`;
      }

      logger.error("Keychain signing error:", err);
      throw new Error(errorMessage);
    }
  };

  // Login function - throws errors for caller to handle
  const login = async (
    username: string,
    timestamp?: number,
    signature?: string
  ) => {
    try {
      setError(null);

      const finalTimestamp = timestamp || Date.now();
      const message = `${username.toLowerCase()}${finalTimestamp}`;

      // Get signature if not provided
      const finalSignature =
        signature || (await signWithKeychain(username, message));

      // The SPL login runs in the browser (the visitor's IP, not the
      // server's); the server only verifies the token and sets its cookie.
      const { token } = await splLoginInBrowser(
        username.toLowerCase(),
        finalTimestamp,
        finalSignature
      );
      const result = await establishSessionAction(username, token);

      if (!result.success) {
        const errorMsg = result.error || "Login failed";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      clearBrowserCaches();
      splSessionChanged(); // the server just set the session cookie

      // Refresh auth status after successful login
      await checkAuthStatus();
      // Re-run the current page's server components so server-fetched data
      // (e.g. land-manager config) reflects the new user instead of showing
      // the previous user's data until the next full page reload.
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        throw err; // Re-throw API errors
      } else {
        const errorMsg = "Network error during login";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    }
  };

  // Logout function - logs errors but doesn't throw
  const logout = async () => {
    clearSplSession();
    clearBrowserCaches();
    try {
      setError(null);
      await logoutAction();
    } catch (error) {
      const errorMsg = "Logout network error";
      logger.error(errorMsg, error);
      setError(errorMsg);
    } finally {
      setUser(null);
      router.refresh();
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Check auth status on mount. Written out rather than calling
  // checkAuthStatus so nothing is set synchronously while the effect runs
  // (react-hooks/set-state-in-effect) — `loading` already starts true.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const nextUser = await readAuthUser();
        if (cancelled) return;
        setUser(nextUser);
        setError(null);
      } catch (error) {
        if (cancelled) return;
        logger.error(AUTH_CHECK_ERROR, error);
        setError(AUTH_CHECK_ERROR);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // SPL rejected the browser's token (expired / revoked): end the session.
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  });
  useEffect(() => onSplUnauthorized(() => void logoutRef.current()), []);

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    isAuthenticated: !!user,
    refreshAuth: checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
