import assert from "node:assert/strict";
import { test } from "node:test";
import remarkLegacyPluginLinks from "../scripts/remark-legacy-plugin-links.mjs";

const legacyPages = ["overview", "weather"];

test("retired plugin links and reference definitions render the Plugin Directory", () => {
  const tree = {
    type: "root",
    children: [
      { type: "paragraph", children: [{ type: "link", url: "/docs/plugins/overview", children: [] }] },
      { type: "definition", identifier: "weather", url: "/docs/plugins/weather#api-key" },
    ],
  };
  remarkLegacyPluginLinks({ enabled: true, legacyPages })(tree);
  assert.equal(tree.children[0].children[0].url, "/plugins");
  assert.equal(tree.children[1].url, "/plugins");
});

test("unknown, external, historical and non-link URLs remain available for normal validation", () => {
  const tree = {
    type: "root",
    children: [
      { type: "link", url: "/docs/plugins/typo" },
      { type: "link", url: "https://example.com/docs/plugins/weather" },
      { type: "link", url: "/docs/9.11/plugins/weather" },
      { type: "image", url: "/docs/plugins/weather" },
    ],
  };
  const original = structuredClone(tree);
  remarkLegacyPluginLinks({ enabled: true, legacyPages })(tree);
  assert.deepEqual(tree, original);
});

test("links keep their original destinations while the latest snapshot still serves plugin docs", () => {
  const tree = { type: "root", children: [{ type: "link", url: "/docs/plugins/weather" }] };
  remarkLegacyPluginLinks({ enabled: false, legacyPages })(tree);
  assert.equal(tree.children[0].url, "/docs/plugins/weather");
});
