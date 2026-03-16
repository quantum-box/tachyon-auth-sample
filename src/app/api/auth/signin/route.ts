import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  // Authenticate against Tachyon platform using GraphQL
  // SignInWithPlatform mutation
  const graphqlRes = await fetch(`${config.tachyonAuthUrl}/v1/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-operator-id": "tn_01hjjn348rn3t49zz6hvmfq67p",
    },
    body: JSON.stringify({
      query: `mutation SignInWithPlatform($platformId: String!, $accessToken: String!) {
        signInWithPlatform(platformId: $platformId, accessToken: $accessToken) {
          id
          email
        }
      }`,
      variables: {
        platformId: "tn_01hjjn348rn3t49zz6hvmfq67p",
        accessToken: "dummy-token",
      },
    }),
  });

  if (!graphqlRes.ok) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }

  // For demo purposes, return a session token
  // In production, this would be a real JWT from Tachyon
  return NextResponse.json({
    sessionToken: "dummy-token",
    userId: "us_01hs2yepy5hw4rz8pdq2wywnwt",
  });
}
