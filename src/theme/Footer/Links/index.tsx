/**
 * Swizzled `@theme/Footer/Links` — unchanged from upstream except for types.
 *
 * It is only the branch between the two footer shapes Docusaurus supports, and
 * both branches are themselves swizzled (`Links/MultiColumn`, `Links/Simple`).
 * Keeping this file means the split stays addressable: a future
 * `themeConfig.footer.links` written as a flat array still gets our markup.
 * This site uses the multi-column shape.
 */

import { isMultiColumnFooterLinks } from "@docusaurus/theme-common";
import type { Props } from "@theme/Footer/Links";
import FooterLinksMultiColumn from "@theme/Footer/Links/MultiColumn";
import FooterLinksSimple from "@theme/Footer/Links/Simple";
import type { ReactNode } from "react";

export default function FooterLinks({ links }: Props): ReactNode {
  return isMultiColumnFooterLinks(links) ? (
    <FooterLinksMultiColumn columns={links} />
  ) : (
    <FooterLinksSimple links={links} />
  );
}
