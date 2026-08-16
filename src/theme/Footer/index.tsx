/**
 * Swizzled `@theme/Footer` — the site footer, rebuilt on FiestaUI primitives.
 *
 * This file is a 1:1 port of upstream's composition root: it reads
 * `themeConfig.footer` and hands the four slots to `@theme/Footer/Layout`.
 * Nothing about *what* renders changes here — the rebuild lives in the
 * sub-components (`Layout`, `Links`, `Links/MultiColumn`, `Links/Simple`,
 * `LinkItem`, `Copyright`, `Logo`), each of which is swizzled alongside this
 * one so the whole subtree stays internally consistent.
 *
 * Kept from upstream: `React.memo` (the footer re-renders on every route
 * change otherwise), the `!footer` early return, and the falsy slot values
 * (`links && links.length > 0 && …`) that `Layout` tests to decide whether to
 * render the bottom row at all.
 */

import { useThemeConfig } from "@docusaurus/theme-common";
import FooterCopyright from "@theme/Footer/Copyright";
import FooterLayout from "@theme/Footer/Layout";
import FooterLinks from "@theme/Footer/Links";
import FooterLogo from "@theme/Footer/Logo";
import React, { type ReactNode } from "react";

function Footer(): ReactNode | null {
  const { footer } = useThemeConfig();

  if (!footer) {
    return null;
  }

  const { copyright, links, logo, style } = footer;

  return (
    <FooterLayout
      copyright={copyright && <FooterCopyright copyright={copyright} />}
      links={links && links.length > 0 && <FooterLinks links={links} />}
      logo={logo && <FooterLogo logo={logo} />}
      style={style}
    />
  );
}

export default React.memo(Footer);
