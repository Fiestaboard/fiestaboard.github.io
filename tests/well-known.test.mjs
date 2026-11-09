// The /.well-known/ files that let the FiestaBoard phone apps open
// https://fiestaboard.app/link/* links (iOS Universal Links, Android App
// Links). The fallback page itself lives in Fiestaboard/link.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

// The iOS app's bundle id (claude/ios-p5, project.yml) and the Android
// app's applicationId (claude/android-p5, app/build.gradle.kts).
const IOS_BUNDLE_ID = "com.fiestaboard.ios.draft";
const ANDROID_PACKAGE = "com.fiestaboard.android";
// An Apple Team ID: ten upper-case letters or digits.
const TEAM_ID = /^([A-Z0-9]{10}|REPLACE_ME_APPLE_TEAM_ID)$/;
// A SHA-256 certificate fingerprint as Play Console shows it.
const SHA256 = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$|^REPLACE_ME_PLAY_APP_SIGNING_SHA256$/;

test("apple-app-site-association is JSON with no extension, claiming /link/* only", () => {
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
      ["/link/*", false],
    ],
  );
  assert.deepEqual(details.paths, ["NOT /link/", "/link/*"]);
  for (const component of details.components) {
    assert.equal(component["?"], undefined, "link data is in the fragment, never the query");
  }
});

test("assetlinks.json delegates handle_all_urls to the Android app", () => {
  const statements = JSON.parse(read("static/.well-known/assetlinks.json"));
  assert.equal(statements.length, 1);
  const [statement] = statements;
  assert.deepEqual(statement.relation, ["delegate_permission/common.handle_all_urls"]);
  assert.equal(statement.target.namespace, "android_app");
  assert.equal(statement.target.package_name, ANDROID_PACKAGE);
  assert.ok(statement.target.sha256_cert_fingerprints.length > 0);
  for (const fingerprint of statement.target.sha256_cert_fingerprints) assert.match(fingerprint, SHA256);
});

test("the Pages artifact keeps dot-prefixed paths, so /.well-known/ is deployed", () => {
  const workflow = read(".github/workflows/build-deploy.yml");
  assert.match(
    workflow,
    /uses: actions\/upload-pages-artifact@[^\n]+\n\s+with:\n(\s+[^\n]*\n)*?\s+include-hidden-files: true/,
  );
});
