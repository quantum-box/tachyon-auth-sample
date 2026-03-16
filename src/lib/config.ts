export const config = {
  tachyonAuthUrl:
    process.env.NEXT_PUBLIC_TACHYON_AUTH_URL || "https://api.n1.tachy.one",
  clientId: process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID || "",
  clientSecret: process.env.OAUTH2_CLIENT_SECRET || "",
  redirectUri:
    process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/callback",
  scopes: "openid profile email",
} as const;
