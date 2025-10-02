import { NextRequest, NextResponse } from "next/server";
import { splLogin } from "@/lib/backend/api/spl/spl-base-api";
import { logError } from "@/lib/backend/log/logUtils";
import { validateCsrfToken } from "@/lib/backend/csrf";

export async function POST(request: NextRequest) {
  try {
    let username, timestamp, signature, requestBody;
    try {
      requestBody = await request.json();
      username = requestBody.username;
      timestamp = requestBody.timestamp;
      signature = requestBody.signature;
    } catch (err) {
      logError("Failed to parse JSON body in login request", err);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    // Validate CSRF token
    const csrfValidation = await validateCsrfToken(request, requestBody);
    if (!csrfValidation.isValid) {
      return NextResponse.json(
        { error: csrfValidation.error },
        { status: 403 },
      );
    }

    // Validate required fields
    if (!username || !timestamp || !signature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Call SPL API
    const splResponse = await splLogin(username, timestamp, signature);

    // Create response
    const response = NextResponse.json({
      success: true,
      username,
      message: "Login successful",
    });

    // Set authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
    };

    // Set JWT token cookie
    response.cookies.set("spl_jwt_token", splResponse.jwt_token, {
      ...cookieOptions,
    });

    // Set username cookie (for easy client access)
    response.cookies.set("spl_username", username, {
      ...cookieOptions,
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error during login" },
      { status: 500 },
    );
  }
}
