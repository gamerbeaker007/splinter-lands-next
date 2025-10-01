import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const jwtToken = request.cookies.get("spl_jwt_token");
    const username = request.cookies.get("spl_username");
    if (!jwtToken || !username) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      username: username.value,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Failed to check authentication" },
      { status: 500 },
    );
  }
}
