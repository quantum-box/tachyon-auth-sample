"use client";

import { useEffect, useState } from "react";
import { config } from "@/lib/config";

export default function Callback() {
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");

      if (error) {
        setStatus(`Authorization error: ${error}`);
        return;
      }

      if (!code) {
        setStatus("No authorization code received");
        return;
      }

      const savedState = sessionStorage.getItem("oauth_state");
      if (state !== savedState) {
        setStatus("State mismatch - possible CSRF attack");
        return;
      }

      const verifier = sessionStorage.getItem("pkce_verifier");
      if (!verifier) {
        setStatus("No PKCE verifier found");
        return;
      }

      try {
        setStatus("Exchanging code for token...");
        const res = await fetch("/api/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, code_verifier: verifier }),
        });

        if (!res.ok) {
          const text = await res.text();
          setStatus(`Token exchange failed: ${res.status} ${text}`);
          return;
        }

        const tokenData = await res.json();
        sessionStorage.setItem("tachyon_token", JSON.stringify(tokenData));
        sessionStorage.removeItem("pkce_verifier");
        sessionStorage.removeItem("oauth_state");

        window.location.href = "/";
      } catch (e) {
        setStatus(`Error: ${e}`);
      }
    }

    handleCallback();
  }, []);

  return (
    <main
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "60px 20px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 24 }}>Processing Authentication</h1>
      <p style={{ color: "#888" }}>{status}</p>
      <a href="/" style={{ color: "#2563eb", marginTop: 20, display: "block" }}>
        Back to Home
      </a>
    </main>
  );
}
