/**
 * Swizzled `@theme/Footer/Copyright` — the copyright line.
 *
 * `copyright` is a string of developer-provided HTML (see
 * `themeConfig.footer.copyright`), so the host element stays a `div` — hence
 * `Box` rather than `Text`. `Text` only renders `p`/`span`, and putting
 * arbitrary HTML inside either risks a block element landing in a phrasing
 * container, which React resolves as a hydration mismatch rather than a layout
 * quirk. The DS typography is applied as tokens on the `Box` instead: the same
 * muted, small treatment `Text size="sm" tone="muted"` would have produced.
 *
 * `.footer__copyright` is kept — Infima declares nothing for it, but it is a
 * public class name that user CSS may target.
 */

import { Box } from "@fiestaboard/ui/components/layout/box";
import { cn } from "@fiestaboard/ui/lib/utils";
import type { Props } from "@theme/Footer/Copyright";
import type { ReactNode } from "react";

export default function FooterCopyright({ copyright }: Props): ReactNode {
  return (
    <Box
      className={cn("footer__copyright", "text-sm text-muted-foreground")}
      // Developer provided the HTML, so assume it's safe.
      dangerouslySetInnerHTML={{ __html: copyright }}
    />
  );
}
