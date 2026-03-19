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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const DEMO_USER = { username: "demo" };

  function fillDemoUser() {
    setUsername(DEMO_USER.username);
  }

  useEffect(() => {
    const stored = sessionStorage.getItem("tachyon_token");
    if (stored) {
      const parsed = JSON.parse(stored) as TokenInfo;
      setToken(parsed);
      fetchUserInfo(parsed.access_token);
    }
  }, []);

  async function startLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const state = generateState();

      sessionStorage.setItem("pkce_verifier", verifier);

      // Step 1: Sign in to Tachyon to get a session token
      const signInRes = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!signInRes.ok) {
        const text = await signInRes.text();
        throw new Error(`Sign in failed: ${text}`);
      }

      const { sessionToken } = await signInRes.json();

      // Step 2: Request authorization code via POST
      const authorizeRes = await fetch("/api/auth/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          code_challenge: challenge,
          code_challenge_method: "S256",
          state,
        }),
      });

      if (!authorizeRes.ok) {
        const text = await authorizeRes.text();
        throw new Error(`Authorization failed: ${text}`);
      }

      const { authorization_code } = await authorizeRes.json();

      // Step 3: Exchange code for tokens
      const tokenRes = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: authorization_code,
          code_verifier: verifier,
        }),
      });

      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        throw new Error(`Token exchange failed: ${text}`);
      }

      const tokenData = await tokenRes.json();
      sessionStorage.setItem("tachyon_token", JSON.stringify(tokenData));
      setToken(tokenData);
      fetchUserInfo(tokenData.access_token);
      setUsername("");
      setPassword("");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
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
            wordBreak: "break-all",
          }}
        >
          {error}
        </div>
      )}

      {!token ? (
        <form onSubmit={startLogin}>
          <div
            style={{
              background: "#1a1a2e",
              border: "1px solid #2d2d5a",
              borderRadius: 8,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 16 }}>
              Sign in with Tachyon
            </h2>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  color: "#888",
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your Tachyon username"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#0a0a1a",
                  border: "1px solid #333",
                  borderRadius: 6,
                  color: "#ededed",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  color: "#888",
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 12px",
                    background: "#0a0a1a",
                    border: "1px solid #333",
                    borderRadius: 6,
                    color: "#ededed",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    padding: 4,
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "\u{1F441}" : "\u{1F441}\u{200D}\u{1F5E8}"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !config.clientId}
              style={{
                width: "100%",
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
              {loading ? "Authenticating..." : "Sign in"}
            </button>
          </div>
          <div
            style={{
              background: "#1a1a2e",
              border: "1px solid #2d2d5a",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ fontSize: 14, margin: 0, color: "#888" }}>
                Demo Account
              </h3>
              <button
                type="button"
                onClick={fillDemoUser}
                style={{
                  background: "#334155",
                  color: "#e2e8f0",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Auto-fill
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "4px 12px 4px 0",
                      color: "#888",
                      fontSize: 13,
                    }}
                  >
                    Username
                  </td>
                  <td>
                    <code
                      style={{
                        color: "#e2e8f0",
                        fontSize: 13,
                        background: "#0a0a1a",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {DEMO_USER.username}
                    </code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {!config.clientId && (
            <p style={{ color: "#888", fontSize: 14 }}>
              Set NEXT_PUBLIC_OAUTH2_CLIENT_ID in .env to enable login
            </p>
          )}
        </form>
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
