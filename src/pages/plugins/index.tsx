import Link from "@docusaurus/Link";
import { EmptyState } from "@fiestaboard/ui/components/feedback/empty-state";
import { Button } from "@fiestaboard/ui/components/forms/button";
import { Input } from "@fiestaboard/ui/components/forms/input";
import { Box } from "@fiestaboard/ui/components/layout/box";
import { Flex } from "@fiestaboard/ui/components/layout/flex";
import { PluginCard } from "@fiestaboard/ui/components/plugin/plugin-card";
import { Text } from "@fiestaboard/ui/components/typography/text";
import type { PluginEntry } from "@site/src/plugin-data";
import { CATEGORIES, CATEGORY_LABELS, pluginPreviews, plugins } from "@site/src/plugin-data";
import Layout from "@theme/Layout";
import { SearchX } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import styles from "./index.module.css";

function DirectoryCard({ plugin }: { plugin: PluginEntry }) {
  const teaser = pluginPreviews[plugin.id]?.teaser ?? plugin.name;

  return (
    <PluginCard
      name={plugin.name}
      description={plugin.description}
      category={plugin.category}
      categoryLabel={CATEGORY_LABELS[plugin.category] ?? plugin.category}
      teaser={teaser}
      renderLink={({ className, children }) => (
        <Link to={`/plugins/detail?id=${plugin.id}`} className={className}>
          {children}
        </Link>
      )}
    />
  );
}

export default function PluginDirectory(): ReactNode {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return plugins.filter((p) => {
      if (activeCategory && p.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, activeCategory]);

  return (
    <Layout
      title="Plugin Directory"
      description="Browse all FiestaBoard plugins - weather, stocks, transit, sports, art, and more. Explore what's available for your split-flap display."
    >
      <Box as="main" className={styles.directoryPage}>
        <Box className="container">
          {/* Header */}
          <Box className={styles.header}>
            <h1 className={styles.title}>Plugin Directory</h1>
            <Text className={styles.subtitle}>
              Explore {plugins.length} plugins for your split-flap display - from weather and stocks to Disney park wait
              times and generative art.
            </Text>
          </Box>

          {/* Search and filters. The input and pills are unstyled DS components -
              the module CSS used to repaint both (hand-rolled focus ring, literal
              #fff on the active pill); `Input` and the `default`/`outline` Button
              variants already carry the right tokens, so only layout is local. */}
          <Box className={styles.controls}>
            <Input
              type="search"
              className="mx-auto mb-4 block max-w-[480px]"
              placeholder="Search plugins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search plugins"
            />
            <Flex wrap gap="2" className={styles.categoryFilters}>
              <Button
                type="button"
                size="sm"
                variant={activeCategory === null ? "default" : "outline"}
                aria-pressed={activeCategory === null}
                className="rounded-full"
                onClick={() => setActiveCategory(null)}
              >
                All
              </Button>
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  size="sm"
                  variant={activeCategory === cat ? "default" : "outline"}
                  aria-pressed={activeCategory === cat}
                  className="rounded-full"
                  onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                >
                  {CATEGORY_LABELS[cat]}
                </Button>
              ))}
            </Flex>
          </Box>

          {/* Results */}
          {filtered.length > 0 ? (
            <Box className={styles.pluginGrid}>
              {filtered.map((plugin) => (
                <DirectoryCard key={plugin.id} plugin={plugin} />
              ))}
            </Box>
          ) : (
            <EmptyState
              className={styles.emptyState}
              icon={SearchX}
              title="No plugins found"
              description="No plugins match your search. Try a different query or category."
            />
          )}

          {/* CTA */}
          <Box className={styles.cta}>
            <Text>
              Want to build your own plugin?{" "}
              <Link to="/docs/development/plugin-guide">Check out the Plugin Development Guide →</Link>
            </Text>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
}
