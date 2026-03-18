import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const { code, code_verifier } = await request.json();

  // Call Tachyon's OAuth2 token endpoint with JSON
  const res = await fetch(`${config.tachyonAuthUrl}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "token_exchange_failed", detail: text },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
