import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const { code, code_verifier } = await request.json();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code_verifier,
  });

  const res = await fetch(`${config.tachyonAuthUrl}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
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
