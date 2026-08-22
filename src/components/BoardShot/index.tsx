import { useColorMode } from "@docusaurus/theme-common";
import { BoardShowcase } from "@fiestaboard/ui/components/plugin/board-showcase";
import { pluginPreviews } from "@site/src/plugin-data";
import { type ReactNode } from "react";

import styles from "./styles.module.css";

/**
 * BoardShot — render a plugin's board output live instead of as a screenshot.
 *
 * The board is a 6×22 grid of characters and colour tiles, and FiestaUI can
 * draw one from a message string, so a PNG of one was never buying anything.
 * The content comes from `data/plugin-previews.json`, which plugins publish in
 * their own manifests, so a plugin that changes what it puts on a board updates
 * its own documentation.
 *
 * This is strictly more than the screenshot it replaces: `BoardShowcase` brings
 * tabs for each device shape the plugin supports (Flagship, Note, note arrays)
 * and a black/white board toggle, where the PNG pair could only ever show one
 * shape in two colours.
 */
export interface BoardShotProps {
  /** Plugin id in `plugin-previews.json`, e.g. "weather". */
  plugin: string;
  /** Accessible description. Defaults to a sentence built from the id. */
  alt?: string;
  size?: "sm" | "md" | "lg";
  /** Rendered under the board. */
  caption?: ReactNode;
}

/** "star_trek_quotes" → "Star Trek Quotes" */
function titleFromId(id: string): string {
  return id
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function BoardShot({ plugin, alt, size = "md", caption }: BoardShotProps): ReactNode {
  const { colorMode } = useColorMode();
  const previews = pluginPreviews[plugin]?.previews ?? [];

  // A plugin with no published previews renders nothing rather than a broken
  // frame — the same way the plugin directory falls back.
  if (previews.length === 0) return null;

  return (
    <figure className={styles.container}>
      <BoardShowcase
        previews={previews}
        size={size}
        // Default to the board colour that suits the page's theme; the toggle
        // still lets a reader see the other one.
        defaultBoardType={colorMode === "light" ? "white" : "black"}
        previewLabel={alt ?? `${titleFromId(plugin)} displayed on a split-flap board`}
      />
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
