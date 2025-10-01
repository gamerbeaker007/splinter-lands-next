import { NextResponse } from "next/server";

// Logout: Remove authentication cookies
export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
    });

    // Remove cookies by setting them with empty value and immediate expiration
    const expiredCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      expires: new Date(0),
    };

    response.cookies.set("spl_jwt_token", "", expiredCookieOptions);
    response.cookies.set("spl_username", "", expiredCookieOptions);

    return response;
  } catch (error) {
    console.error("Logout API error:", error);

    return NextResponse.json(
      { error: "Internal server error during logout" },
      { status: 500 },
    );
  }
}
