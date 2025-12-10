"use server";

import { splLogin } from "@/lib/backend/api/spl/spl-base-api";
import { validateSplJwt } from "@/lib/backend/jwt/splJwtValidation";
import { cookies } from "next/headers";

export async function getAuthStatus() {
  try {
    const cookieStore = await cookies();
    const jwtToken = cookieStore.get("jwt_token")?.value;

    if (!jwtToken) {
      return { authenticated: false, username: null };
    }

    const validation = await validateSplJwt(jwtToken);

    if (!validation.valid) {
      // Clear invalid token
      cookieStore.delete("jwt_token");
      return { authenticated: false, username: null };
    }

    return {
      authenticated: true,
      username: validation.username,
    };
  } catch (error) {
    console.error("Error validating auth status:", error);
    return { authenticated: false, username: null };
  }
}

export async function loginAction(
  username: string,
  timestamp: number,
  signature: string
) {
  try {
    const result = await splLogin(username.toLowerCase(), timestamp, signature);

    if (!result.token) {
      return { success: false, error: "No token received from Splinterlands" };
    }

    // Set JWT token in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("jwt_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true, username: result.name };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("jwt_token");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
