import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  const body = new URLSearchParams({
    token,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const res = await fetch(`${config.tachyonAuthUrl}/oauth2/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  return NextResponse.json({ ok: res.ok }, { status: res.status });
}
