import { NextResponse } from "next/server";

export const runtime = "edge";

const REQUIRED_RUNTIME_ENV_KEYS = ["OAUTH2_CLIENT_SECRET"] as const;

const RUNTIME_CONTEXT_KEYS = [
  "TACHYON_APP_URL",
  "TACHYON_URL",
  "TACHYON_ENV",
  "TACHYON_PROJECT_NAME",
  "TACHYON_GIT_REPO_OWNER",
  "TACHYON_GIT_REPO_SLUG",
  "TACHYON_GIT_COMMIT_SHA",
  "TACHYON_GIT_COMMIT_REF",
  "CF_PAGES",
  "CF_PAGES_URL",
  "CF_PAGES_BRANCH",
  "CF_PAGES_COMMIT_SHA",
] as const;

function readEnv(key: string): string {
  return process.env[key]?.trim() ?? "";
}

export async function GET() {
  const missing = REQUIRED_RUNTIME_ENV_KEYS.filter((key) => !readEnv(key));
  const present = REQUIRED_RUNTIME_ENV_KEYS.filter((key) => readEnv(key));
  const runtime = Object.fromEntries(
    RUNTIME_CONTEXT_KEYS.map((key) => [key, readEnv(key) || null])
  );
  const ok = missing.length === 0;

  return NextResponse.json(
    {
      ok,
      requiredRuntimeEnv: {
        present,
        missing,
      },
      runtime,
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
