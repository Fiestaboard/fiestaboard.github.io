#!/usr/bin/env node
/**
 * copy-served-data.mjs — copy repo-owned data files into the build output.
 *
 * plugin-stats.json and fiestapi-latest-version.txt live in data/ (they are
 * data this repo owns, not site chrome) but have always been served at the
 * site root. Runs via the `postbuild` npm hook so /plugin-stats.json and
 * /fiestapi-latest-version.txt keep working.
 */
import { copyFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = resolve(fileURLToPath(import.meta.url), "../..");
const buildDir = join(siteDir, "build");

if (!existsSync(buildDir)) {
  console.error("copy-served-data: build/ not found — run `npm run build` first.");
  process.exit(1);
}

const files = ["plugin-stats.json", "fiestapi-latest-version.txt"];
for (const name of files) {
  copyFileSync(join(siteDir, "data", name), join(buildDir, name));
}
console.log(`copy-served-data: copied ${files.join(", ")} into build/.`);
