#!/usr/bin/env python3
"""
Fetch GitHub traffic and metadata for all FiestaBoard plugin repos and write
data/plugin-stats.json.

Requires: GH_TOKEN env var (or gh CLI already authenticated) with traffic read
access to all plugin repos. Run from the repo root:

  python3 scripts/fetch_plugin_stats.py
"""

import base64
import datetime
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

REGISTRY_PATH = Path(__file__).parent.parent / "data/plugin-registry.json"
OUTPUT_PATH = Path(__file__).parent.parent / "data/plugin-stats.json"
MAX_WORKERS = 10
# Plugins hosted here are the ones the CI credential is expected to reach; see
# the traffic check in main().
ORG = "Fiestaboard"


def gh_api(path: str):
    result = subprocess.run(["gh", "api", path], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  warning: gh api {path} failed: {result.stderr.strip()}", file=sys.stderr)
        return None
    return json.loads(result.stdout)


def fetch_plugin(plugin: dict) -> tuple[dict, str]:
    # Registry plugins are not all org-hosted (community plugins live under
    # their author's account), so derive owner/repo from the registry URL
    # instead of assuming the Fiestaboard org.
    owner, repo_name = plugin["repository"].rstrip("/").split("/")[-2:]
    print(f"  {owner}/{repo_name}", file=sys.stderr)

    # The traffic API needs Administration:read, which we only have for org
    # repos. For community repos it 403s — keep None so the output
    # distinguishes "no data" (null) from a genuine zero.
    traffic = gh_api(f"repos/{owner}/{repo_name}/traffic/clones")
    meta = gh_api(f"repos/{owner}/{repo_name}") or {}

    version = None
    manifest_raw = gh_api(f"repos/{owner}/{repo_name}/contents/manifest.json")
    if manifest_raw and manifest_raw.get("content"):
        try:
            manifest_data = json.loads(base64.b64decode(manifest_raw["content"]).decode())
            version = manifest_data.get("version")
        except (ValueError, KeyError, TypeError) as e:
            print(f"  warning: could not parse manifest for {repo_name}: {e}", file=sys.stderr)

    return {
        "id": plugin["id"],
        "repo": repo_name,
        "name": plugin["name"],
        "category": plugin["category"],
        "description": plugin["description"],
        "version": version,
        "created_at": meta.get("created_at"),
        "updated_at": meta.get("updated_at"),
        "clones_14d_count": traffic.get("count", 0) if traffic is not None else None,
        "clones_14d_uniques": traffic.get("uniques", 0) if traffic is not None else None,
    }, owner


def main() -> None:
    with open(REGISTRY_PATH) as f:
        registry = json.load(f)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        fetched = list(executor.map(fetch_plugin, registry["plugins"]))

    plugins_out = [record for record, _ in fetched]

    # A credential without Administration:read still fetches metadata and
    # manifests fine, so the run looks healthy while every traffic field comes
    # back null — and the site drops null-traffic plugins from its ranking, so
    # publishing that wipes the stats page. Community repos are null by design;
    # every org repo being null means the token is broken, not the data. Bail
    # without writing so the last good file keeps serving.
    org_records = [record for record, owner in fetched if owner == ORG]
    if org_records and not any(r["clones_14d_uniques"] is not None for r in org_records):
        print(
            f"error: no traffic data for any of the {len(org_records)} {ORG} repos — "
            "GH_TOKEN is missing Administration:read on them. Refusing to overwrite "
            f"{OUTPUT_PATH} with null stats.",
            file=sys.stderr,
        )
        sys.exit(1)

    output = {
        "generated_at": datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "window_days": 14,
        "plugins": plugins_out,
    }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)
        f.write("\n")
    print(f"Wrote {OUTPUT_PATH}", file=sys.stderr)


if __name__ == "__main__":
    main()
