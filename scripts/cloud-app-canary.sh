#!/usr/bin/env bash
set -euo pipefail

app_name="${TACHYON_CANARY_APP:-auth-sample}"
manifest="${TACHYON_CANARY_MANIFEST:-tachyon.canary.yml}"
tenant_id="${TACHYON_TENANT_ID:?TACHYON_TENANT_ID is required}"
environment="${TACHYON_CANARY_ENVIRONMENT:-sandbox}"
branch="${TACHYON_CANARY_BRANCH:-${GITHUB_REF_NAME:-main}}"
timeout_secs="${TACHYON_CANARY_TIMEOUT_SECS:-900}"

command -v tachyon >/dev/null || {
  echo "tachyon CLI is required" >&2
  exit 127
}
command -v jq >/dev/null || {
  echo "jq is required" >&2
  exit 127
}

echo "::group::Tachyon CLI"
tachyon --version
echo "::endgroup::"

echo "::group::Canary manifest dry-run"
tachyon compute apps apply \
  -f "$manifest" \
  --app "$app_name" \
  --tenant-id "$tenant_id" \
  --environment "$environment" \
  --dry-run
echo "::endgroup::"

echo "::group::Apply canary manifest"
tachyon compute apps apply \
  -f "$manifest" \
  --app "$app_name" \
  --tenant-id "$tenant_id" \
  --environment "$environment"
echo "::endgroup::"

echo "::group::Trigger canary build"
trigger_output="$(
  tachyon compute builds trigger "$app_name" \
    --tenant-id "$tenant_id" \
    --branch "$branch"
)"
echo "$trigger_output"
build_id="$(printf '%s\n' "$trigger_output" | grep -Eo 'bld_[[:alnum:]]+' | head -n1 || true)"
if [ -z "$build_id" ]; then
  echo "Could not find build id in trigger output" >&2
  exit 1
fi
echo "build_id=$build_id" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "::endgroup::"

echo "::group::Watch canary build"
tachyon compute builds watch "$app_name" \
  --build-id "$build_id" \
  --tenant-id "$tenant_id" \
  --timeout-secs "$timeout_secs" \
  --no-logs
echo "::endgroup::"

echo "::group::Verify canary build metadata"
build_json="$(mktemp)"
tachyon compute builds get "$build_id" \
  --tenant-id "$tenant_id" \
  --json > "$build_json"
status="$(jq -r '.status // empty' "$build_json")"
commit_sha="$(jq -r '.commit_sha // empty' "$build_json")"
source_branch="$(jq -r '.source_branch // empty' "$build_json")"

if [ "$status" != "succeeded" ]; then
  echo "Canary build did not succeed: status=$status" >&2
  jq '{id, source_branch, commit_sha, status, error_message}' "$build_json" >&2
  exit 1
fi
if [ -z "$commit_sha" ]; then
  echo "Canary build has no commit_sha" >&2
  jq '{id, source_branch, commit_sha, status}' "$build_json" >&2
  exit 1
fi

echo "Canary build succeeded: id=$build_id branch=$source_branch commit=${commit_sha:0:8}"
echo "commit_sha=$commit_sha" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "::endgroup::"
