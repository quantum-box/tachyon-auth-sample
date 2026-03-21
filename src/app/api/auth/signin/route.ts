import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  // Call Tachyon's password login endpoint
  const res = await fetch(`${config.tachyonAuthUrl}/oauth2/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password, client_id: config.clientId }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "authentication_failed", detail: text },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json({
    sessionToken: data.session_token,
    userId: data.user_id,
  });
}
