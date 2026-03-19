import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const {
    sessionToken,
    code_challenge,
    code_challenge_method,
    state,
  } = await request.json();

  // Call Tachyon's OAuth2 authorize endpoint (POST)
  const res = await fetch(`${config.tachyonAuthUrl}/oauth2/authorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
      "x-operator-id": config.operatorId,
    },
    body: JSON.stringify({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: config.scopes,
      state,
      code_challenge,
      code_challenge_method,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "authorization_failed", detail: text },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
