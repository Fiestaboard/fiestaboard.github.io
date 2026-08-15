#!/usr/bin/env node
/**
 * build-info.mjs — stamp the build output with provenance.
 *
 * Runs via the `postbuild` npm hook and writes build/build-info.json:
 *   sourceSha  the Fiestaboard/FiestaBoard commit the synced content
 *              (docs/, data/, branding) came from — read from the
 *              docs/.source-sha marker maintained by the sync, or
 *              "unknown" if the marker is absent
 *   siteSha    the commit of this repo the site was built from
 *   builtAt    ISO 8601 build timestamp
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = resolve(fileURLToPath(import.meta.url), "../..");
const buildDir = join(siteDir, "build");

if (!existsSync(buildDir)) {
  console.error("build-info: build/ not found — run `npm run build` first.");
  process.exit(1);
}

function sourceSha() {
  const marker = join(siteDir, "docs", ".source-sha");
  if (!existsSync(marker)) return "unknown";
  const sha = readFileSync(marker, "utf8").trim();
  return /^[0-9a-f]{7,40}$/i.test(sha) ? sha : "unknown";
}

function siteSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: siteDir, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const info = {
  sourceSha: sourceSha(),
  siteSha: siteSha(),
  builtAt: new Date().toISOString(),
};

writeFileSync(join(buildDir, "build-info.json"), `${JSON.stringify(info, null, 2)}\n`);
console.log(`build-info: wrote build/build-info.json (source ${info.sourceSha}, site ${info.siteSha})`);
