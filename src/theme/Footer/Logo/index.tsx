/**
 * Swizzled `@theme/Footer/Logo` — `themeConfig.footer.logo`, if one is set.
 *
 * This site sets no footer logo, so nothing renders today; the component is
 * swizzled with the rest of the subtree so that adding one later lands in DS
 * markup instead of reintroducing upstream's CSS module.
 *
 * `ThemedImage` is kept: it is what serves `srcDark` in dark mode without JS,
 * and replacing it would change what is rendered. The one thing that goes is
 * upstream's `styles.module.css` — its two rules (50% opacity, full opacity on
 * hover) are expressible as utilities, and nothing declares `opacity` for this
 * anchor at all, so there is no cascade question. Layout comes from the `Box`
 * wrapper; `.footer__logo` is kept for the `margin-top` / `max-width` Infima
 * declares for it, and as a public hook.
 */

import Link from "@docusaurus/Link";
import { useBaseUrlUtils } from "@docusaurus/useBaseUrl";
import { Box } from "@fiestaboard/ui/components/layout/box";
import { cn } from "@fiestaboard/ui/lib/utils";
import type { Props } from "@theme/Footer/Logo";
import ThemedImage from "@theme/ThemedImage";
import type { ReactNode } from "react";

function LogoImage({ logo }: Props): ReactNode {
  const { withBaseUrl } = useBaseUrlUtils();
  const sources = {
    light: withBaseUrl(logo.src),
    dark: withBaseUrl(logo.srcDark ?? logo.src),
  };

  return (
    <ThemedImage
      className={cn("footer__logo", logo.className)}
      alt={logo.alt}
      sources={sources}
      width={logo.width}
      height={logo.height}
      style={logo.style}
    />
  );
}

export default function FooterLogo({ logo }: Props): ReactNode {
  return (
    <Box className="inline-block">
      {logo.href ? (
        <Link href={logo.href} target={logo.target} className="opacity-50 transition-opacity hover:opacity-100">
          <LogoImage logo={logo} />
        </Link>
      ) : (
        <LogoImage logo={logo} />
      )}
    </Box>
  );
}
