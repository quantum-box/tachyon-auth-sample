# PLT-1927 CF Pages Runtime Env Check

## Purpose

This sample app is used to prove that a Tachyon Cloud App deployment does not pass just because Cloudflare Pages project-level env vars exist. The deployment must also serve a runtime that can read required credentials.

## Investigation Notes

PLT-1927 reproduced a gap between two different checks:

- Cloudflare Pages project-level env vars can show the required secret exists.
- The already-created Direct Upload deployment can still serve a runtime where the same key is absent.

Tachyon's Pages env sync verifies the project deployment config. That is useful for drift repair, but it is not a runtime proof for the immutable deployment that is already serving traffic. A smoke probe must execute inside the deployed runtime and read the same env access path as the application code.

## Runtime Probe

`GET /api/runtime-env-check` returns only key presence and public deployment context. It never returns `OAUTH2_CLIENT_SECRET`.

The endpoint returns:

- `200` with `ok: true` when `OAUTH2_CLIENT_SECRET` is present in the Pages runtime.
- `503` with the missing key names when the runtime does not receive the credential.

## Tachyon Manifest Behavior

`tachyon.yaml` declares `OAUTH2_CLIENT_SECRET` via:

```yaml
valueFrom:
  secret: auth-sample/OAUTH2_CLIENT_SECRET
```

Tachyon resolves this from the app env secret path for tenant `tn_01kthtvdwrhznnf8bs2v1b5s5a`. The secret value must be configured before deploy.

The `postDeploy` hook fetches the probe from both URLs:

- `TACHYON_DEPLOYMENT_URL`: the concrete Cloudflare Pages deployment origin.
- `TACHYON_DEPLOYMENT_PUBLIC_URL`: the txcloud public route.

Both calls must succeed and return identical JSON. This catches:

- required credential missing from the Direct Upload runtime;
- txcloud still pointing at an older deployment without the probe or with different runtime context.

Current Tachyon writes the txcloud route during the Cloudflare Pages deploy path before the `postDeploy` hook finishes. This sample is therefore a runtime proof and divergence detector. Strict prevention should be handled in Tachyon by delaying the route write until after `postDeploy` succeeds, or by reverting the route when the hook fails.

## Recovery Notes

Cloudflare Pages Direct Upload deployments are immutable operationally: updating project secrets after a deployment is created should be treated as insufficient to repair that already-created deployment. Create a fresh Tachyon build/deployment after the project secret is repaired.

Do not rely on Cloudflare rollback alone for txcloud recovery. If Cloudflare's production alias and Tachyon's deployment pointer diverge, redeploy through Tachyon so both the Pages deployment and txcloud route are advanced together.
