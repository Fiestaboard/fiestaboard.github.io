# Parity harness fixtures

- `routes.fixture.json` — hand-picked URL fixture run by `scripts/docs-parity.mjs` against a build dir or live host.
- `baseline.json` — frozen URL-surface manifest diffed by `docs-parity.mjs --compare`.
- `production-sitemap.xml` — snapshot of the live sitemap.
- `docs-parity.live.test.mjs` — tests for `docs-parity.mjs --host` (the mode the production watch runs), driving the real script against a local server. Run with `npm test`.

Note: `/.nojekyll` is deliberately not asserted — actions/upload-pages-artifact excludes dot-prefixed files from the Pages artifact, and Actions-based deploys never run Jekyll, so the file is functionally obsolete on the deploy-pages path (static/.nojekyll is kept only for any remaining branch-based serving).
