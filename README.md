# Tachyon Auth Sample

A sample Next.js application demonstrating OAuth2/OIDC integration with [Tachyon Auth Platform](https://app.n1.tachy.one).

## Features

- OAuth2 Authorization Code flow with PKCE
- Token exchange via server-side API route (client secret never exposed to browser)
- UserInfo endpoint integration
- Token revocation on logout

## Setup

1. **Register an OAuth2 Client** on Tachyon Auth Platform:
   - Go to https://app.n1.tachy.one/v1beta/{tenant_id}/iam/oauth2-clients
   - Create a new client with redirect URI: `https://your-app-url/callback`
   - Note the `client_id` and `client_secret`

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your OAuth2 client credentials
   ```

3. **Run locally**:
   ```bash
   npm install
   npm run dev
   ```

4. **Deploy to Tachyon Compute**:
   - Push to GitHub
   - Create a Cloud App on Tachyon Compute pointing to this repo
   - Set environment variables in the app configuration
   - Store `OAUTH2_CLIENT_SECRET` as an app secret before deploy

## Runtime Credential Check

`GET /api/runtime-env-check` verifies that `OAUTH2_CLIENT_SECRET` is present in the deployed Cloudflare Pages runtime without exposing the secret value.

The Tachyon manifest runs this endpoint as a `postDeploy` smoke check against both the concrete Pages deployment URL and the txcloud public URL. A deployment fails if the runtime credential is missing or if the public route still serves a different deployment response.

For local Pages artifact verification, run `npm run pages:build`; Tachyon's Cloudflare Pages build path also runs `next-on-pages` before Direct Upload.

## OAuth2 Flow

```
Browser                    This App (Next.js)           Tachyon Auth Platform
  |                              |                              |
  |-- Click "Sign in" --------->|                              |
  |                              |-- Generate PKCE verifier    |
  |<-- Redirect to /oauth2/authorize ----------------------->|
  |                              |                              |
  |                              |           (User authenticates & consents)
  |                              |                              |
  |<-- Redirect to /callback with code ----------------------|
  |                              |                              |
  |-- POST /api/auth/token ----->|                              |
  |                              |-- POST /oauth2/token ------>|
  |                              |<-- access_token, id_token --|
  |<-- Token response -----------|                              |
  |                              |                              |
  |-- GET /oauth2/userinfo (via browser) -------------------->|
  |<-- User profile ------------------------------------------|
```

## Tech Stack

- [Next.js](https://nextjs.org) 15 (App Router)
- OAuth2 with PKCE (RFC 7636)
- Tachyon Auth Platform as OAuth2/OIDC Provider

<!-- build trigger: PLT-1882 CF Pages deploy verification -->
