"use client";

import {
  getAuthStatus,
  loginAction,
  logoutAction,
} from "@/lib/backend/actions/auth-actions";
import logger from "@/lib/frontend/log/logger.client";
import { getCurrentSigner } from "@/lib/frontend/signing";
import { useRouter } from "next/navigation";
import { HIVEAUTH_SESSION_EXPIRED_EVENT } from "@/lib/frontend/signing/hiveAuthTxNotice";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is logged in (from server)
  const checkAuthStatus = async () => {
    try {
      setError(null);
      const data = await getAuthStatus();

      if (data.authenticated && data.username) {
        setUser({
          username: data.username,
          isAuthenticated: true,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      const errorMsg = "Auth check error";
      logger.error(errorMsg, error);
      setError(errorMsg);
      setUser(null);
    } finally {
      setLoading(false);
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
        signature ||
        (await getCurrentSigner().signBuffer(username, message, "posting"));

      // Use server action instead of API route
      const result = await loginAction(
        username.toLowerCase(),
        finalTimestamp,
        finalSignature
      );

      if (!result.success) {
        const errorMsg = result.error || "Login failed";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

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

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onHiveAuthSessionExpired = () => {
      void (async () => {
        try {
          await logoutAction();
        } catch (error) {
          logger.error("HiveAuth session-expired logout failed", error);
        } finally {
          setUser(null);
          setError("HiveAuth session expired. Connect again.");
          router.refresh();
        }
      })();
    };

    window.addEventListener(
      HIVEAUTH_SESSION_EXPIRED_EVENT,
      onHiveAuthSessionExpired
    );
    return () => {
      window.removeEventListener(
        HIVEAUTH_SESSION_EXPIRED_EVENT,
        onHiveAuthSessionExpired
      );
    };
  }, [router]);

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
