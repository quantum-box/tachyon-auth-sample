# Cloud App Canary

This repository is the continuous canary for Tachyon Cloud Apps auth and
runtime environment handling.

## What It Checks

- `spec.auth.enabled: true` materializes auth client runtime env vars.
- `spec.auth.env.clientId` and `spec.auth.env.clientSecret` can override the
  generated env var names to `COGNITO_CLIENT_ID` and `COGNITO_CLIENT_SECRET`.
- Cloudflare Pages runtime can read both keys after deployment.
- Pages origin and the txcloud public URL return the same non-secret canary
  response.
- `tachyon compute builds trigger --branch` creates a build with a concrete
  commit SHA.

The runtime endpoint returns only present/missing key names and non-secret
runtime context. It never returns env values.

## Endpoint

```text
/api/cloud-app-canary/auth-env
```

Expected successful response shape:

```json
{
  "ok": true,
  "requiredRuntimeEnv": {
    "present": ["COGNITO_CLIENT_ID", "COGNITO_CLIENT_SECRET"],
    "missing": []
  }
}
```

## Local Runtime Proof

```bash
npm ci
npm run pages:build
```

Missing runtime bindings should fail closed:

```bash
npx wrangler pages dev .vercel/output/static \
  --compatibility-flag=nodejs_compat \
  --ip 127.0.0.1 \
  --port 3101 \
  --log-level error
curl -sS -o /tmp/cloud-app-canary-missing.json -w '%{http_code}\n' \
  http://127.0.0.1:3101/api/cloud-app-canary/auth-env
```

Expected status: `503`.

Dummy runtime bindings should pass without exposing values:

```bash
npx wrangler pages dev .vercel/output/static \
  --compatibility-flag=nodejs_compat \
  --ip 127.0.0.1 \
  --port 3102 \
  --log-level error \
  --binding COGNITO_CLIENT_ID=dummy-client-id \
  --binding COGNITO_CLIENT_SECRET=dummy-client-secret
curl -sS -o /tmp/cloud-app-canary-present.json -w '%{http_code}\n' \
  http://127.0.0.1:3102/api/cloud-app-canary/auth-env
```

Expected status: `200`.

## Live Canary

The live canary uses `tachyon.canary.yml` and `scripts/cloud-app-canary.sh`.

Required GitHub repository configuration:

- Secret `TACHYON_API_KEY`: scoped to the canary tenant.
- Secret `TACHYON_CLI_DOWNLOAD_URL` or `TACHYON_CLI_INSTALL_COMMAND`: installs
  the Tachyon CLI in GitHub Actions.
- Optional variable `TACHYON_API_URL`: defaults to `https://api.n1.tachy.one`.
- Optional variable `TACHYON_CANARY_TENANT_ID`: defaults to
  `tn_01hjjn348rn3t49zz6hvmfq67p`.
- Optional variable `TACHYON_CANARY_APP`: defaults to `auth-sample`.
- Optional variable `TACHYON_CANARY_ENVIRONMENT`: defaults to `sandbox`.
- Optional variable `TACHYON_CANARY_BRANCH`: defaults to the workflow ref.
- Optional variable `TACHYON_CANARY_TIMEOUT_SECS`: defaults to `900`.

Manual run:

```bash
TACHYON_API_KEY=... \
TACHYON_TENANT_ID=tn_01hjjn348rn3t49zz6hvmfq67p \
TACHYON_CANARY_ENVIRONMENT=sandbox \
TACHYON_CANARY_BRANCH=main \
scripts/cloud-app-canary.sh
```

Do not put secret values in `tachyon.canary.yml`, workflow logs, issues, or
pull request comments.
