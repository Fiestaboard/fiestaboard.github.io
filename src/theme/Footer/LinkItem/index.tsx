/**
 * Swizzled `@theme/Footer/LinkItem` — one footer link.
 *
 * The anchor stays Docusaurus's `Link`: it is what gives internal `to` links
 * client-side routing and prefetching, what feeds the broken-link checker, and
 * what `prependBaseUrlToHref` is defined against. FiestaUI's `TextLink` is not
 * used here for two reasons — it is a plain `<a>` with no router integration,
 * and it underlines at rest, which is the right call for a link buried in a
 * paragraph (WCAG 1.4.1) but wrong for a column of nav links that are already
 * distinguishable by position.
 *
 * What does move to the DS is the label treatment: `Text` at `sm`/`muted`,
 * brightening to `--foreground` on hover, which is the same muted -> foreground
 * pattern `custom.css` gives the navbar and sidebar links. It lives on an inner
 * `span` rather than on the anchor so the tone survives regardless of how
 * Infima's `.footer__link-item { color: … }` / `:hover` pair is layered — the
 * `span` has no competitor at all. (On this site Infima is in
 * `@layer docusaurus.infima`, which loses to `@layer utilities`; see the
 * cascade model in `src/theme/DocSidebarItem/Link`. Keeping the tone off the
 * anchor makes that irrelevant either way.)
 *
 * `.footer__link-item` is kept on the anchor: it is the documented hook for
 * user CSS, and it is what supplies the `line-height: 2` list rhythm (which
 * `Links/MultiColumn` relies on instead of a list gap) and the narrow-window
 * `display: block; width: max-content`.
 *
 * The external-link icon lives inside the same `Text`, so it tints with the
 * label instead of inheriting Infima's link colour. Rendered content is
 * otherwise identical to upstream, icon included.
 */

import isInternalUrl from "@docusaurus/isInternalUrl";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { cn, Text } from "@fiestaboard/ui";
import type { Props } from "@theme/Footer/LinkItem";
import IconExternalLink from "@theme/Icon/ExternalLink";
import type { ReactNode } from "react";

export default function FooterLinkItem({ item }: Props): ReactNode {
  const { to, href, label, prependBaseUrlToHref, className, ...props } = item;
  const toUrl = useBaseUrl(to);
  const normalizedHref = useBaseUrl(href, { forcePrependBaseUrl: true });

  return (
    <Link
      className={cn("footer__link-item group", className)}
      {...(href ? { href: prependBaseUrlToHref ? normalizedHref : href } : { to: toUrl })}
      {...props}
    >
      <Text as="span" size="sm" tone="muted" className="transition-colors group-hover:text-foreground">
        {label}
        {href && !isInternalUrl(href) && <IconExternalLink />}
      </Text>
    </Link>
  );
}
