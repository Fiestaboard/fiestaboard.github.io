import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fiestaboard/ui/components/containment/table";
import AppShot from "@site/src/components/AppShot";
import BoardScreenshot from "@site/src/components/BoardScreenshot";
import BoardShot from "@site/src/components/BoardShot";
import ThemedScreenshot from "@site/src/components/ThemedScreenshot";
import MDXComponents from "@theme-original/MDXComponents";

/**
 * Render Markdown tables with the FiestaUI `Table` component set so docs tables
 * match the design system (the handoff calls for the DS Table set in
 * production). The six GFM table elements map 1:1 onto FiestaUI's primitives;
 * GFM column-alignment `style` attributes pass through via prop spreading.
 */
export default {
  ...MDXComponents,
  // <AppShot> renders a serialised capture of the real app (static/captures/),
  // which is what docs pages should use for UI screenshots. <ThemedScreenshot>
  // remains for the PNGs not yet migrated.
  AppShot,
  // <BoardShot> renders a plugin's board output live from plugin-previews.json.
  // <BoardScreenshot> remains for the PNGs not yet migrated.
  BoardShot,
  ThemedScreenshot,
  BoardScreenshot,
  table: Table,
  thead: TableHeader,
  tbody: TableBody,
  tr: TableRow,
  th: TableHead,
  td: TableCell,
};
