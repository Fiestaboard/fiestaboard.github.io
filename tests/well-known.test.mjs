// The /.well-known/ files that let the FiestaBoard phone apps open
// https://fiestaboard.app/link/* links (iOS Universal Links, Android App
// Links). The fallback page itself lives in Fiestaboard/link.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
// No test here may hang: a stuck test would show up in CI as a stuck job.
const TIMEOUT = { timeout: 5000 };

// The iOS app's bundle id (claude/ios-p5, project.yml) and the Android
// app's applicationId (claude/android-p5, app/build.gradle.kts).
const IOS_BUNDLE_ID = "com.fiestaboard.ios.draft";
const ANDROID_PACKAGE = "com.fiestaboard.android";
// An Apple Team ID: ten upper-case letters or digits.
const TEAM_ID = /^([A-Z0-9]{10}|REPLACE_ME_APPLE_TEAM_ID)$/;
// A SHA-256 certificate fingerprint as Play Console shows it.
const SHA256 = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$|^REPLACE_ME_PLAY_APP_SIGNING_SHA256$/;

test("apple-app-site-association is JSON with no extension, claiming /link/* only", TIMEOUT, () => {
  const aasa = JSON.parse(read("static/.well-known/apple-app-site-association"));
  const [details, ...rest] = aasa.applinks.details;
  assert.equal(rest.length, 0);
  for (const appID of [...details.appIDs, details.appID]) {
    const [team, ...bundle] = appID.split(".");
    assert.match(team, TEAM_ID, appID);
    assert.equal(bundle.join("."), IOS_BUNDLE_ID);
  }
  assert.deepEqual(
    details.components.map((c) => [c["/"], Boolean(c.exclude)]),
    [
      ["/link/", true],
      ["/link/index.html", true],
      ["/link/*", false],
    ],
  );
  assert.deepEqual(details.paths, ["NOT /link/", "NOT /link/index.html", "/link/*"]);
  for (const component of details.components) {
    assert.equal(component["?"], undefined, "link data is in the fragment, never the query");
  }
});

test("assetlinks.json delegates handle_all_urls to the Android app", TIMEOUT, () => {
  const statements = JSON.parse(read("static/.well-known/assetlinks.json"));
  assert.equal(statements.length, 1);
  const [statement] = statements;
  assert.deepEqual(statement.relation, ["delegate_permission/common.handle_all_urls"]);
  assert.equal(statement.target.namespace, "android_app");
  assert.equal(statement.target.package_name, ANDROID_PACKAGE);
  assert.ok(statement.target.sha256_cert_fingerprints.length > 0);
  for (const fingerprint of statement.target.sha256_cert_fingerprints) assert.match(fingerprint, SHA256);
});

/**
 * The value of `include-hidden-files` in the upload-pages-artifact step's
 * `with:` block, or undefined. Reads the workflow line by line (no
 * backtracking regex, so it can't hang): find the step, then its `with:`,
 * then the keys indented under it.
 */
export function uploadIncludesHidden(workflow) {
  const lines = workflow.split("\n");
  const uses = lines.findIndex((line) => /^[ \t-]*uses:[ \t]*actions\/upload-pages-artifact@/.test(line));
  if (uses === -1) return undefined;
  const stepIndent = lines[uses].search(/\S/);
  for (let i = uses + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    const indent = line.search(/\S/);
    if (indent < stepIndent || line.trimStart().startsWith("- ")) return undefined; // the step ended
    if (line.trim() !== "with:") continue;
    for (let j = i + 1; j < lines.length; j++) {
      const key = lines[j];
      if (key.trim() === "" || key.trim().startsWith("#")) continue;
      if (key.search(/\S/) <= indent) return undefined; // the with: block ended
      const match = /^[ \t]*include-hidden-files:[ \t]*("?)([^"#\s]*)\1[ \t]*(#.*)?$/.exec(key);
      if (match) return match[2];
    }
    return undefined;
  }
  return undefined;
}

test("the Pages artifact keeps dot-prefixed paths, so /.well-known/ is deployed", TIMEOUT, () => {
  assert.equal(uploadIncludesHidden(read(".github/workflows/build-deploy.yml")), "true");
});

// The guard must FAIL, quickly, when the setting is gone or false.
const step = (withLines) =>
  [
    "jobs:",
    "  build:",
    "    steps:",
    "      - name: Upload Pages artifact",
    "        uses: actions/upload-pages-artifact@v5",
    "        with:",
    "          path: build",
    ...withLines,
    ...Array.from({ length: 40 }, (_, n) => `          # filler comment line ${n} to make backtracking expensive`),
    "",
    "  deploy:",
    "    steps:",
    "      - name: Deploy",
    "        uses: actions/deploy-pages@v5",
    "        with:",
    "          include-hidden-files: true",
  ].join("\n");

test("the guard reads include-hidden-files from the upload step only, quickly", TIMEOUT, () => {
  const started = performance.now();
  assert.equal(uploadIncludesHidden(step(["          include-hidden-files: true"])), "true");
  assert.equal(uploadIncludesHidden(step(['          include-hidden-files: "true"  # keep'])), "true");
  assert.equal(uploadIncludesHidden(step(["          include-hidden-files: false"])), "false");
  // Missing from the upload step: another step's setting must not count.
  assert.equal(uploadIncludesHidden(step([])), undefined);
  assert.equal(uploadIncludesHidden("name: x\n"), undefined);
  assert.ok(performance.now() - started < 100, "the guard must not backtrack");
});
