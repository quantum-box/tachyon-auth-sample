# Isolated Workspace Builder acceptance fixture

This is a synthetic, non-production fixture. Keep its fixture pull requests unmerged.

It uses its own Cloud App, Cloudflare Pages project, production database, and preview database. It does not reference the existing auth-sample app, its databases, OAuth clients, or app secrets. The database contains one synthetic marker only.

The seed branch is the app default branch. The canary branch must differ from that branch and remain an open pull request. Creating the Cloud App also attempts one ordinary initial build; that build is not canonical builder-image acceptance evidence.

Canonical acceptance requires the server's six observations for one exact app, PR, commit, immutable builder digest, and grant. Build success alone is insufficient. GET /api/acceptance must return HTTP 200 and ready=true after a successful preview deployment.
