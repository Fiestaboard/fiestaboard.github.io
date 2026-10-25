// Historical snapshots are immutable and may link to the old unversioned
// plugin guides. Once the latest snapshot retires those guides, render the
// links to their working destination so Docusaurus can still validate them.
export default function remarkLegacyPluginLinks({ enabled, legacyPages }) {
  const knownPages = new Set(legacyPages);
  return (tree) => {
    if (!enabled) return;
    function rewrite(node) {
      if ((node.type === "link" || node.type === "definition") && typeof node.url === "string") {
        const match = node.url.match(/^\/docs\/plugins\/([^/?#]+)\/?(?:[?#].*)?$/);
        if (match && knownPages.has(match[1])) node.url = "/plugins";
      }
      for (const child of node.children ?? []) rewrite(child);
    }
    rewrite(tree);
  };
}
