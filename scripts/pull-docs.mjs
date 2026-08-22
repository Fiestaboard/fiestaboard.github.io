#!/usr/bin/env node
/**
 * pull-docs.mjs — sync the content this site publishes from its source of
 * truth, Fiestaboard/FiestaBoard@main, without cloning that repo.
 *
 * The sync allowlist:
 *   docs/                    → docs/          (published pages only; docs/internal/ never syncs)
 *   plugin-registry.json     → data/plugin-registry.json
 *   plugin-previews.json     → data/plugin-previews.json
 *   assets/img/branding/     → static/img/branding/
 *   assets/docs-captures/    → static/captures/   (serialised app screens; see AppShot)
 *
 * Also writes docs/.source-sha (the FiestaBoard commit synced from — baked
 * into build-info.json by scripts/build-info.mjs) and generated-file banner
 * READMEs in docs/ and data/.
 *
 * Usage:
 *   node scripts/pull-docs.mjs            # populate only if docs/ is missing/empty
 *   node scripts/pull-docs.mjs --refresh  # wipe and re-sync everything
 *
 * Downloads the repo tarball from codeload.github.com (one request, no auth,
 * no git) and extracts just the allowlisted paths with the system tar.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OWNER_REPO = "Fiestaboard/FiestaBoard";
const REF = "main";

const siteDir = resolve(fileURLToPath(import.meta.url), "../..");
const refresh = process.argv.includes("--refresh");

const docsDir = join(siteDir, "docs");
const dataDir = join(siteDir, "data");
const brandingDir = join(siteDir, "static", "img", "branding");
const capturesDir = join(siteDir, "static", "captures");

function docsPopulated() {
  if (!existsSync(docsDir)) return false;
  return readdirSync(docsDir).some((name) => name !== ".gitkeep");
}

if (!refresh && docsPopulated()) {
  console.log("pull-docs: docs/ already populated — pass --refresh to re-sync from FiestaBoard main.");
  process.exit(0);
}

async function resolveSha() {
  const res = await fetch(`https://api.github.com/repos/${OWNER_REPO}/commits/${REF}`, {
    headers: { Accept: "application/vnd.github.sha", "User-Agent": "fiestaboard-docs-sync" },
  });
  if (!res.ok) throw new Error(`resolving ${REF} SHA failed: HTTP ${res.status}`);
  return (await res.text()).trim();
}

const sha = await resolveSha();
console.log(`pull-docs: syncing from ${OWNER_REPO}@${sha.slice(0, 7)}`);

const tmp = mkdtempSync(join(tmpdir(), "pull-docs-"));
try {
  const tarball = join(tmp, "src.tar.gz");
  const res = await fetch(`https://codeload.github.com/${OWNER_REPO}/tar.gz/${sha}`, {
    headers: { "User-Agent": "fiestaboard-docs-sync" },
  });
  if (!res.ok) throw new Error(`tarball download failed: HTTP ${res.status}`);
  writeFileSync(tarball, Buffer.from(await res.arrayBuffer()));

  const prefix = `${OWNER_REPO.split("/")[1]}-${sha}`;
  const extractDir = join(tmp, "x");
  mkdirSync(extractDir);
  execFileSync(
    "tar",
    [
      "-xzf",
      tarball,
      "-C",
      extractDir,
      "--strip-components=1",
      `${prefix}/docs`,
      `${prefix}/plugin-registry.json`,
      `${prefix}/plugin-previews.json`,
      `${prefix}/assets/img/branding`,
      `${prefix}/assets/docs-captures`,
    ],
    { stdio: "inherit" },
  );

  // docs/ — published pages only; internal engineering docs never sync.
  rmSync(join(extractDir, "docs", "internal"), { recursive: true, force: true });
  rmSync(docsDir, { recursive: true, force: true });
  cpSync(join(extractDir, "docs"), docsDir, { recursive: true });
  writeFileSync(join(docsDir, ".source-sha"), `${sha}\n`);
  writeFileSync(
    join(docsDir, "README.md"),
    [
      "<!-- GENERATED FILE — DO NOT EDIT. -->",
      "",
      "# Synced documentation",
      "",
      `This tree is a synced copy of [${OWNER_REPO}](https://github.com/${OWNER_REPO}) \`docs/\``,
      "(published pages only — `docs/internal/` never syncs). Do not edit it here:",
      "changes belong in the FiestaBoard repo and arrive via the sync",
      "(`node scripts/pull-docs.mjs --refresh`). The commit synced from is recorded",
      "in `.source-sha`.",
      "",
    ].join("\n"),
  );

  // data/ — plugin registry + previews.
  mkdirSync(dataDir, { recursive: true });
  cpSync(join(extractDir, "plugin-registry.json"), join(dataDir, "plugin-registry.json"));
  cpSync(join(extractDir, "plugin-previews.json"), join(dataDir, "plugin-previews.json"));
  writeFileSync(
    join(dataDir, "README.md"),
    [
      "<!-- GENERATED FILE — DO NOT EDIT. -->",
      "",
      "# Synced registry data",
      "",
      `\`plugin-registry.json\` and \`plugin-previews.json\` are synced copies of the`,
      `repo-root files in [${OWNER_REPO}](https://github.com/${OWNER_REPO}). Do not edit`,
      "them here: changes belong in the FiestaBoard repo and arrive via the sync",
      "(`node scripts/pull-docs.mjs --refresh`).",
      "",
      "`plugin-stats.json` and `fiestapi-latest-version.txt` are owned by this repo",
      "and copied into the build output by the postbuild step so they keep serving",
      "at `/plugin-stats.json` and `/fiestapi-latest-version.txt`.",
      "",
    ].join("\n"),
  );

  // static/img/branding/ — brand lockups (canonical in FiestaBoard assets/img/branding/).
  rmSync(brandingDir, { recursive: true, force: true });
  cpSync(join(extractDir, "assets", "img", "branding"), brandingDir, { recursive: true });

  // static/captures/ — DOM captures of app screens, rendered by <AppShot>
  // instead of PNG screenshots. Replaced wholesale so a screen removed
  // upstream disappears here too.
  rmSync(capturesDir, { recursive: true, force: true });
  cpSync(join(extractDir, "assets", "docs-captures"), capturesDir, { recursive: true });

  console.log(
    "pull-docs: synced docs/, data/plugin-registry.json, data/plugin-previews.json, static/img/branding/, static/captures/.",
  );
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
