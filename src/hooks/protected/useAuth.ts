import logger from "@/lib/frontend/log/logger.client";
import { KeychainKeyTypes, KeychainSDK } from "keychain-sdk";
import { useEffect, useState } from "react";
import { useCsrfToken } from "../useCsrf";

interface AuthUser {
  username: string;
  isAuthenticated: boolean;
}

export function useAuth() {
  const { getCsrfToken } = useCsrfToken();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in (from server)
  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/status", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.username) {
          setUser({
            username: data.username,
            isAuthenticated: data.authenticated,
          });
        } else {
          setUser(null);
        }
      } else if (response.status === 401) {
        // Expected when not logged in
        setUser(null);
      } else {
        console.error(
          `Auth status check failed with status: ${response.status}`,
        );
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check network error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to sign message with Keychain - throws errors
  const signWithKeychain = async (
    username: string,
    message: string,
  ): Promise<string> => {
    try {
      const keychain = new KeychainSDK(window);
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
      if (
        err instanceof Error ||
        (err && typeof err === "object" && "success" in err && "message" in err)
      ) {
        throw new Error(`Keychain error: ${err.message}`);
      } else {
        throw new Error("Unknown Keychain error occurred");
      }
    }
  };

  // Login function - throws errors for caller to handle
  const login = async (
    username: string,
    timestamp?: number,
    signature?: string,
  ) => {
    // Fetch CSRF token when needed (lazy loading)
    const csrfToken = await getCsrfToken();

    const finalTimestamp = timestamp || Date.now();
    const message = `${username.toLowerCase()}${finalTimestamp}`;

    // Get signature if not provided
    const finalSignature =
      signature || (await signWithKeychain(username, message));

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          username: username.toLowerCase(),
          timestamp: finalTimestamp,
          signature: finalSignature,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Login failed with status: ${response.status}`,
        );
      }

      // Refresh auth status after successful login
      await checkAuthStatus();
    } catch (err) {
      if (err instanceof Error) {
        throw err; // Re-throw API errors
      } else {
        throw new Error("Network error during login");
      }
    }
  };

  // Logout function - logs errors but doesn't throw
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      logger.error("Logout network error:", error);
    } finally {
      setUser(null);
    }
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    refreshAuth: checkAuthStatus,
  };
}
