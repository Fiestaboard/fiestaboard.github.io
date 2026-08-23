import Link from "@docusaurus/Link";
import { StaticBoardDisplay } from "@fiestaboard/ui/components/board/static-board-display";
import { Card } from "@fiestaboard/ui/components/containment/card";
import { IconTile } from "@fiestaboard/ui/components/containment/icon-tile";
import { BarList } from "@fiestaboard/ui/components/data/bar-list";
import { StatStrip } from "@fiestaboard/ui/components/data/stat-strip";
import { Badge } from "@fiestaboard/ui/components/feedback/badge";
import { Spinner } from "@fiestaboard/ui/components/feedback/spinner";
import { Button } from "@fiestaboard/ui/components/forms/button";
import { Box } from "@fiestaboard/ui/components/layout/box";
import { Heading } from "@fiestaboard/ui/components/typography/heading";
import { List, ListItem } from "@fiestaboard/ui/components/typography/list";
import { Text } from "@fiestaboard/ui/components/typography/text";
import type { PluginEntry } from "@site/src/plugin-data";
import {
  CATEGORY_LABELS as REGISTRY_CATEGORY_LABELS,
  pluginBoardImagePath,
  pluginPreviews,
  plugins,
  previewMessage,
} from "@site/src/plugin-data";
import Layout from "@theme/Layout";
import * as Icons from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import styles from "./stats.module.css";

interface PluginStat {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string | null;
  created_at: string | null;
  updated_at: string | null;
  // null when GitHub exposes no traffic data for the repo (community-hosted
  // plugins outside the Fiestaboard org — the traffic API needs push access).
  clones_14d_count: number | null;
  clones_14d_uniques: number | null;
}

interface StatsData {
  generated_at: string;
  window_days: number;
  plugins: PluginStat[];
}

const CATEGORY_LABELS = REGISTRY_CATEGORY_LABELS;

const pluginById = new Map<string, PluginEntry>(plugins.map((p) => [p.id, p]));

function PluginIcon({ name, size = 24 }: { name: string; size?: number }) {
  const key = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[key];
  if (!Icon) return null;
  return <Icon size={size} />;
}

function TopPluginSpotlight({
  plugin,
  entry,
  windowDays,
}: {
  plugin: PluginStat;
  entry: PluginEntry;
  windowDays: number;
}) {
  const preview = pluginPreviews[plugin.id]?.previews[0];
  // Backwards compat: no previews entry yet -> legacy screenshot -> icon.
  const [imgOk, setImgOk] = useState(true);

  return (
    <Link to={`/plugins/detail?id=${plugin.id}`} className={styles.spotlight}>
      {/* The anchor keeps only placement; the box (surface, border, radius,
          hover) is the DS Card, zero-padded because the board preview and the
          footer run edge to edge. */}
      <Card className="w-fit max-w-full gap-0 overflow-hidden py-0 hover:border-ring">
        {preview ? (
          <Box className={styles.spotlightBoard}>
            <StaticBoardDisplay
              message={previewMessage(preview)}
              size="sm"
              boardType="black"
              deviceType={preview.device_type ?? "flagship"}
              notesWide={preview.notes_wide ?? 1}
              notesTall={preview.notes_tall ?? 1}
              previewLabel={`${plugin.name} on a split-flap board`}
            />
          </Box>
        ) : imgOk ? (
          <img
            className={styles.spotlightImage}
            src={pluginBoardImagePath(entry, "dark")}
            alt={`${plugin.name} on a split-flap board`}
            loading="lazy"
            onError={() => setImgOk(false)}
          />
        ) : (
          <Box className={styles.spotlightImagePlaceholder}>
            <PluginIcon name={entry.icon} size={32} />
          </Box>
        )}
        <Box className={styles.spotlightFooter}>
          {/* IconTile is decorative by default (aria-hidden), which is right
              here: the plugin name it repeats sits immediately beside it. */}
          <IconTile size="md">
            <PluginIcon name={entry.icon} size={20} />
          </IconTile>
          <Box className={styles.spotlightBody}>
            <Box className={styles.spotlightName}>{plugin.name}</Box>
            <Box className={styles.spotlightStat}>
              {(plugin.clones_14d_uniques ?? 0).toLocaleString()} unique cloners in the last {windowDays} days
            </Box>
          </Box>
          <Badge variant="secondary" className={styles.spotlightBadge}>
            Most popular
          </Badge>
        </Box>
      </Card>
    </Link>
  );
}

const RANKING_PREVIEW = 15;

export default function StatsPage(): ReactNode {
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState(false);
  const [showAllRanking, setShowAllRanking] = useState(false);

  useEffect(() => {
    fetch("/plugin-stats.json")
      .then((r) => {
        if (!r.ok) throw new Error("not ok");
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  // Plugins with null traffic (community-hosted repos GitHub exposes no
  // traffic data for) stay in the directory sections below but are excluded
  // from the popularity ranking and totals — "unknown" is not "zero".
  const ranked = data
    ? data.plugins
        .filter((p) => p.clones_14d_uniques != null)
        .sort((a, b) => (b.clones_14d_uniques ?? 0) - (a.clones_14d_uniques ?? 0))
    : [];

  const topPlugin = ranked[0];
  const totalUniques = ranked.reduce((s, p) => s + (p.clones_14d_uniques ?? 0), 0);
  const maxUniques = topPlugin?.clones_14d_uniques ?? 1;
  const hiddenFromRanking = data ? data.plugins.length - ranked.length : 0;
  const displayedPlugins = showAllRanking ? ranked : ranked.slice(0, RANKING_PREVIEW);

  const byCategory = data
    ? Object.entries(
        data.plugins.reduce<Record<string, number>>((acc, p) => {
          acc[p.category] = (acc[p.category] ?? 0) + (p.clones_14d_uniques ?? 0);
          return acc;
        }, {}),
      ).sort(([, a], [, b]) => b - a)
    : [];

  const recentlyAdded = data
    ? [...data.plugins]
        .filter((p) => p.created_at)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 6)
    : [];

  const recentlyUpdated = data
    ? [...data.plugins]
        .filter((p) => p.updated_at && p.version)
        .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
        .slice(0, 6)
    : [];

  const generatedAt = data
    ? new Date(data.generated_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Layout
      title="Plugin Stats"
      description="Live popularity and activity stats for all FiestaBoard plugins, updated daily from GitHub."
    >
      <Box as="main" className={styles.page}>
        <Box className="container">
          <Box className={styles.header}>
            <h1>Plugin Stats</h1>
            <Text className={styles.subtitle}>
              Popularity across all {data ? data.plugins.length : "…"} FiestaBoard plugins, updated daily.
            </Text>
          </Box>

          {error && <Text className={styles.error}>Stats are unavailable right now - check back soon.</Text>}

          {!data && !error && (
            <Box className={styles.loading}>
              <Spinner size="lg" label="Loading plugin stats" />
            </Box>
          )}

          {data && (
            <>
              <Box className={styles.dashboard}>
                <Box className={styles.dashboardLeft}>
                  {/* mb-5 stands in for the deleted `.statStrip` rule's
                      1.25rem bottom margin — `.dashboardLeft` is not a flex
                      column, so the strip owns its own spacing. */}
                  <StatStrip
                    className="mb-5"
                    tone="brand"
                    items={[
                      { value: data.plugins.length, label: "plugins" },
                      {
                        value: totalUniques.toLocaleString(),
                        label: `unique cloners (last ${data.window_days} days)`,
                      },
                    ]}
                  />
                  {topPlugin &&
                    (() => {
                      const entry = pluginById.get(topPlugin.id);
                      return entry ? (
                        <TopPluginSpotlight plugin={topPlugin} entry={entry} windowDays={data.window_days} />
                      ) : null;
                    })()}
                </Box>

                <Box as="section" className={styles.dashboardRight}>
                  <Heading level={2}>Popularity ranking</Heading>
                  <Text className={styles.sectionNote}>
                    Unique cloners in the last {data.window_days} days
                    {hiddenFromRanking > 0 &&
                      ` - ${hiddenFromRanking} community-hosted ${hiddenFromRanking === 1 ? "plugin doesn't" : "plugins don't"} expose clone data and ${hiddenFromRanking === 1 ? "is" : "are"} not ranked`}
                  </Text>
                  {/* `max` is passed explicitly rather than left to BarList's
                      "largest item wins" default: the preview slice and the
                      full list must share one scale, so a bar keeps its width
                      when "Show all" is toggled. `renderLabel` is the DS's
                      router-agnostic link seam — the Docusaurus <Link> goes
                      here so client-side routing survives, and the DS's own
                      truncation/type classes land on the anchor itself. */}
                  <BarList
                    max={maxUniques}
                    items={displayedPlugins.map((plugin) => ({
                      key: plugin.id,
                      label: plugin.name,
                      value: plugin.clones_14d_uniques ?? 0,
                      renderLabel: ({ className, children }) => (
                        <Link to={`/plugins/detail?id=${plugin.id}`} className={className}>
                          {children}
                        </Link>
                      ),
                    }))}
                  />
                  {ranked.length > RANKING_PREVIEW && (
                    <Button
                      variant="ghost"
                      className={styles.showMoreBtn}
                      onClick={() => setShowAllRanking(!showAllRanking)}
                    >
                      {showAllRanking ? "Show fewer" : `Show all ${ranked.length} plugins`}
                    </Button>
                  )}
                </Box>
              </Box>

              <Box as="section" className={styles.section}>
                <Heading level={2}>By category</Heading>
                <Text className={styles.sectionNote}>
                  Sum of per-plugin unique cloners by category, last {data.window_days} days - users cloning multiple
                  plugins in the same category are counted once per plugin
                </Text>
                <Box className={styles.categoryGrid}>
                  {byCategory.map(([cat, count]) => (
                    <Card key={cat} className="gap-1 p-4 py-4 text-center">
                      <Text as="span" className="text-2xl font-bold text-brand">
                        {count.toLocaleString()}
                      </Text>
                      <Text as="span" size="xs" tone="muted">
                        {CATEGORY_LABELS[cat] ?? cat}
                      </Text>
                    </Card>
                  ))}
                </Box>
              </Box>

              <Box as="section" className={styles.section}>
                <Box className={styles.recentColumns}>
                  <Box>
                    <Heading level={2}>Recently added</Heading>
                    <List gap="0" className={styles.recentList}>
                      {recentlyAdded.map((p) => (
                        <ListItem key={p.id} className={styles.recentItem}>
                          <Link to={`/plugins/detail?id=${p.id}`}>{p.name}</Link>
                          <Text as="span" className={styles.recentMeta}>
                            <Badge variant="secondary">{CATEGORY_LABELS[p.category] ?? p.category}</Badge>
                            <Text as="span" className={styles.recentDate}>
                              {new Date(p.created_at!).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </Text>
                          </Text>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                  <Box>
                    <Heading level={2}>Recently updated</Heading>
                    <List gap="0" className={styles.recentList}>
                      {recentlyUpdated.map((p) => (
                        <ListItem key={p.id} className={styles.recentItem}>
                          <Link to={`/plugins/detail?id=${p.id}`}>{p.name}</Link>
                          <Text as="span" className={styles.recentMeta}>
                            <Badge variant="secondary">{CATEGORY_LABELS[p.category] ?? p.category}</Badge>
                            <Text as="span" className={styles.recentVersion}>
                              v{p.version}
                            </Text>
                            <Text as="span" className={styles.recentDate}>
                              {new Date(p.updated_at!).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </Text>
                          </Text>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Box>
              </Box>

              <Text className={styles.freshness}>
                Data refreshed {generatedAt}. Clone counts reflect the {data.window_days}-day window provided by the
                GitHub Traffic API and include automated traffic such as fleet auto-updates and the weekly security
                scan.
              </Text>
            </>
          )}
        </Box>
      </Box>
    </Layout>
  );
}
