import jwt from "jsonwebtoken";

export interface SplJwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
  nbf?: number;
}

export interface SplJwtValidationResult {
  valid: boolean;
  username?: string;
  expired?: boolean;
  error?: string;
}

/**
 * Structurally decodes a JWT and checks local claims (expiry, nbf, sub).
 * Does NOT verify the JWT signature — this function alone is insufficient for
 * authentication. Callers must additionally verify the token against an
 * authoritative upstream source (see getAuthStatus in auth-actions.ts).
 */
export function validateSplJwt(token: string): SplJwtValidationResult {
  try {
    if (!token) {
      return { valid: false, error: "No token provided" };
    }

    const decoded = jwt.decode(token, { complete: true });

    if (!decoded || typeof decoded === "string") {
      return { valid: false, error: "Invalid JWT format" };
    }

    const payload = decoded.payload as SplJwtPayload;

    if (!payload || !payload.sub) {
      return { valid: false, error: "Missing required SPL fields" };
    }

    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return {
        valid: false,
        expired: true,
        username: payload.sub,
        error: "JWT token has expired",
      };
    }

    if (payload.nbf && payload.nbf > now) {
      return {
        valid: false,
        error: "JWT token is not yet valid",
      };
    }

    return {
      valid: true,
      username: payload.sub,
      expired: false,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "JWT validation failed",
    };
  }
}
