/**
 * Swizzled `@theme/Footer/Links/Simple` — the flat, one-row footer shape.
 *
 * This site configures the multi-column shape, so this branch is inert today;
 * it is swizzled anyway so that flipping `themeConfig.footer.links` to a flat
 * array does not drop half the footer back onto Infima's markup.
 *
 * Rebuilt on `Flex` (centred, wrapping) instead of Infima's nested
 * `.footer__links.text--center` divs. `.footer__link-separator` is kept on the
 * interpunct: it is what supplies the horizontal spacing
 * (`--ifm-footer-link-horizontal-spacing`) and, more importantly, what hides
 * the separators below 996px, where Infima turns each `.footer__link-item` into
 * its own block and a row of interpuncts would read as noise. Restating that
 * media query as utilities would duplicate a breakpoint Infima owns.
 *
 * The separator is `aria-hidden` because it is decoration between links, which
 * is the one place this file departs from upstream.
 */

import type { FooterLinkItem } from "@docusaurus/theme-common";
import { cn, Flex, Text } from "@fiestaboard/ui";
import LinkItem from "@theme/Footer/LinkItem";
import type { Props } from "@theme/Footer/Links/Simple";
import { Fragment, type ReactNode } from "react";

function Separator(): ReactNode {
  return (
    <Text as="span" size="sm" tone="muted" className="footer__link-separator" aria-hidden="true">
      ·
    </Text>
  );
}

function SimpleLinkItem({ item }: { item: FooterLinkItem }): ReactNode {
  return item.html ? (
    <Text
      as="span"
      size="sm"
      tone="muted"
      className={cn("footer__link-item", item.className)}
      // Developer provided the HTML, so assume it's safe.
      dangerouslySetInnerHTML={{ __html: item.html }}
    />
  ) : (
    <LinkItem item={item} />
  );
}

export default function FooterLinksSimple({ links }: Props): ReactNode {
  return (
    <Flex wrap align="center" justify="center">
      {links.map((item, i) => (
        <Fragment key={i}>
          <SimpleLinkItem item={item} />
          {links.length !== i + 1 && <Separator />}
        </Fragment>
      ))}
    </Flex>
  );
}
