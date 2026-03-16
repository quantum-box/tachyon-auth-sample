"use client";

import { useState, useEffect } from "react";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "@/lib/pkce";
import { config } from "@/lib/config";

type UserInfo = {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
};

type TokenInfo = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
};

export default function Home() {
  const [token, setToken] = useState<TokenInfo | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("tachyon_token");
    if (stored) {
      const parsed = JSON.parse(stored) as TokenInfo;
      setToken(parsed);
      fetchUserInfo(parsed.access_token);
    }
  }, []);

  async function startLogin() {
    setError(null);
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateState();

    sessionStorage.setItem("pkce_verifier", verifier);
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes,
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    window.location.href = `${config.tachyonAuthUrl}/oauth2/authorize?${params}`;
  }

  async function fetchUserInfo(accessToken: string) {
    try {
      const res = await fetch(
        `${config.tachyonAuthUrl}/oauth2/userinfo`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok) {
        throw new Error(`UserInfo failed: ${res.status}`);
      }
      const data = (await res.json()) as UserInfo;
      setUserInfo(data);
    } catch (e) {
      setError(`Failed to fetch user info: ${e}`);
    }
  }

  async function handleLogout() {
    if (token?.access_token) {
      try {
        await fetch("/api/auth/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token.access_token }),
        });
      } catch {
        // Best effort revocation
      }
    }
    sessionStorage.removeItem("tachyon_token");
    sessionStorage.removeItem("pkce_verifier");
    sessionStorage.removeItem("oauth_state");
    setToken(null);
    setUserInfo(null);
  }

  return (
    <main
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "60px 20px",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>
        Tachyon Auth Sample
      </h1>
      <p style={{ color: "#888", marginBottom: 40 }}>
        OAuth2/OIDC integration with Tachyon Auth Platform (PKCE)
      </p>

      {error && (
        <div
          style={{
            background: "#2d1b1b",
            border: "1px solid #5c2626",
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      {!token ? (
        <div>
          <button
            onClick={startLogin}
            disabled={loading || !config.clientId}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 16,
              cursor: "pointer",
              opacity: loading || !config.clientId ? 0.5 : 1,
            }}
          >
            {loading ? "Redirecting..." : "Sign in with Tachyon"}
          </button>
          {!config.clientId && (
            <p style={{ color: "#888", fontSize: 14, marginTop: 12 }}>
              Set NEXT_PUBLIC_OAUTH2_CLIENT_ID in .env to enable login
            </p>
          )}
        </div>
      ) : (
        <div>
          <div
            style={{
              background: "#1a2e1a",
              border: "1px solid #2d5a2d",
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <p style={{ color: "#4ade80", margin: 0 }}>
              Authenticated successfully
            </p>
          </div>

          {userInfo && (
            <div
              style={{
                background: "#1a1a2e",
                border: "1px solid #2d2d5a",
                borderRadius: 8,
                padding: 20,
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: 18, marginTop: 0 }}>User Info</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {Object.entries(userInfo).map(([key, value]) => (
                    <tr key={key}>
                      <td
                        style={{
                          padding: "6px 12px 6px 0",
                          color: "#888",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {key}
                      </td>
                      <td style={{ padding: "6px 0", wordBreak: "break-all" }}>
                        {String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div
            style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: 18, marginTop: 0 }}>Token Details</h2>
            <pre
              style={{
                fontSize: 12,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {JSON.stringify(
                {
                  token_type: token.token_type,
                  expires_in: token.expires_in,
                  scope: token.scope,
                  access_token: `${token.access_token.slice(0, 20)}...`,
                  has_refresh_token: !!token.refresh_token,
                  has_id_token: !!token.id_token,
                },
                null,
                2
              )}
            </pre>
          </div>

          <button
            onClick={handleLogout}
            style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      )}

      <div style={{ marginTop: 60, color: "#555", fontSize: 13 }}>
        <p>
          Auth Server:{" "}
          <code style={{ color: "#888" }}>{config.tachyonAuthUrl}</code>
        </p>
        <p>
          Client ID:{" "}
          <code style={{ color: "#888" }}>
            {config.clientId || "(not configured)"}
          </code>
        </p>
      </div>
    </main>
  );
}
