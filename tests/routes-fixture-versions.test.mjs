// Keeps tests/routes.fixture.json consistent with which docs versions a
// deploy actually builds. Deploys only build versions.slice(0,
// DEPLOY_VERSION_CAP) (docusaurus.config.ts); every older snapshot is served
// as a redirect stub to the current docs. Each release snapshot pushes one
// version off the cap, so a fixture entry that pins an old version as a
// "page" silently goes stale — that is what filed #118–#179 (8.28 fell off
// the cap with the 9.10 snapshot on 2026-10-03). This test fails the
// snapshot PR instead of the production watch.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const versions = JSON.parse(read("versions.json"));
const fixture = JSON.parse(read("tests/routes.fixture.json"));
const capMatch = read("docusaurus.config.ts").match(/const DEPLOY_VERSION_CAP = (\d+);/);

test("DEPLOY_VERSION_CAP is readable from docusaurus.config.ts", () => {
  assert.ok(capMatch, "could not find `const DEPLOY_VERSION_CAP = <n>;`");
});

const built = new Set(versions.slice(0, Number(capMatch?.[1] ?? 0)));
const known = new Set(versions);
// Removed historical pages may move to a different current guide. The URL
// fixture verifies their exact targets; the cap test ensures those targets
// are current pages covered by that same fixture.
const currentPages = new Set(
  fixture.filter((e) => e.expect === "page" && !/^\/docs\/\d+\.\d+(?:\/|$)/.test(e.path)).map((e) => e.path),
);
const versioned = fixture
  .map((e) => ({ e, v: e.path.match(/^\/docs\/(\d+\.\d+)(?:\/|$)/)?.[1] }))
  .filter(({ v }) => v && known.has(v));

for (const { e, v } of versioned) {
  test(`fixture ${e.path} (${e.expect}) agrees with the version cap`, () => {
    if (built.has(v)) {
      // Built version: either a real page or the version root → its intro.
      if (e.expect === "redirect")
        assert.ok(
          e.target.startsWith(`/docs/${v}/`),
          `${v} is built, so ${e.path} should not redirect out of /docs/${v}/ (target ${e.target})`,
        );
    } else {
      assert.equal(
        e.expect,
        "redirect",
        `${v} is past DEPLOY_VERSION_CAP and is no longer built — ${e.path} is a redirect stub, not a page`,
      );
      assert.ok(
        currentPages.has(e.target),
        `${e.path} should redirect to a current page covered by the URL fixture (target ${e.target})`,
      );
    }
  });
}
