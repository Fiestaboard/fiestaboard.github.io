/**
 * Swizzled `@theme/Footer/Layout` — the footer shell, rebuilt on FiestaUI
 * `Box` + `Stack` instead of Infima's `footer__bottom` / `text--center` /
 * `margin-bottom--sm` utility classes.
 *
 * Two Infima classes deliberately survive, and they are the same kind of
 * "placement, not treatment" hooks `PaginatorNavLink` keeps:
 *
 *   - `.footer` is what `custom.css` targets to put the footer flush on the
 *     DS `--background` with a hairline `--border` top rule, and it is also
 *     what hides the footer in print. It carries the block padding too.
 *   - `.container container-fluid` is the same width/gutter box the navbar and
 *     every doc page use, so the footer columns line up with the content above.
 *
 * Those stay for provenance, not for cascade reasons: `.footer` is what
 * `custom.css` and the print stylesheet already target, so re-expressing its
 * padding/background as utilities here would split one concern across two
 * files. (For the record — and contrary to what an earlier draft of these
 * comments claimed — Tailwind utilities *do* outrank Infima on this site:
 * `future: { v4: true }` puts Infima in `@layer docusaurus.infima`, declared
 * before `@layer utilities`. See the cascade model in
 * `src/theme/DocSidebarItem/Link`.) Structure and rhythm, which Infima does not
 * declare, move to the DS primitives; chrome that Infima already owns is left
 * on the Infima hook.
 *
 * Dropped from upstream: `.footer__bottom` (Infima declares nothing for it) and
 * the `text--center` / `margin-bottom--sm` utility classes, both restated on
 * the `Stack` below. No site CSS targets them.
 *
 * `.footer--dark` is kept for the same reason: `style: "dark"` is a documented
 * config surface, and Infima is what implements it. This site sets
 * `style: "light"`, so the branch is inert here but the prop contract holds.
 */

import { ThemeClassNames } from "@docusaurus/theme-common";
import { Box, cn, Stack } from "@fiestaboard/ui";
import type { Props } from "@theme/Footer/Layout";
import type { ReactNode } from "react";

export default function FooterLayout({ style, links, logo, copyright }: Props): ReactNode {
  return (
    <Box
      as="footer"
      className={cn(ThemeClassNames.layout.footer.container, "footer", style === "dark" && "footer--dark")}
    >
      <Box className="container container-fluid">
        {/* Upstream spaced the link grid from the bottom row with Infima's
            `.footer__links { margin-bottom: 1rem }`; the gap owns it now. */}
        <Stack gap="6">
          {links}
          {(logo || copyright) && (
            <Stack align="center" gap="2" className="text-center">
              {logo}
              {copyright}
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
