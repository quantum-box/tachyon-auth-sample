export const config = {
  tachyonAuthUrl:
    process.env.NEXT_PUBLIC_TACHYON_AUTH_URL || "https://api.n1.tachy.one",
  clientId:
    process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID ||
    "tachyon_oc_01kkvsaph1qxcp5k9fxvvrzdg2",
  clientSecret: process.env.OAUTH2_CLIENT_SECRET || "",
  redirectUri:
    process.env.NEXT_PUBLIC_REDIRECT_URI ||
    "https://auth-sample.txcloud.app/callback",
  operatorId:
    process.env.NEXT_PUBLIC_OPERATOR_ID ||
    "tn_01hjjn348rn3t49zz6hvmfq67p",
  scopes: "openid profile email",
} as const;
