/**
 * Swizzled `@theme/DocSidebarItem/Link` — a leaf row of the docs sidebar,
 * restyled as a FiestaUI nav row.
 *
 * Only the presentation changes. Everything Docusaurus needs is forwarded
 * untouched: `isActiveSidebarItem` decides the active state, `onItemClick`
 * still closes the mobile drawer, `autoAddBaseUrl` / `aria-current` / the
 * `...props` spread (which carries the `tabIndex` a collapsed parent category
 * passes down) all behave exactly as upstream.
 *
 * Why the leaf renderer instead of dropping in FiestaUI's `Sidebar`: that
 * component takes two flat arrays of icon-bearing items and renders its own
 * viewport-fixed `<aside>` plus a mobile header with a hamburger — it has no
 * tree/collapse model and would collide with Docusaurus's navbar. The docs
 * sidebar is a sticky in-flow column of a recursive tree, so we keep
 * Docusaurus's tree and borrow only the row vocabulary.
 *
 * Infima keeps everything structural (`menu__list-item`, `menu__link`, the
 * nested `.menu__list` indent, the mobile drawer) exactly as it does for
 * `src/theme/PaginatorNavLink`, where Infima owns placement and FiestaUI owns
 * the box.
 *
 * Upstream's `styles.module.css` is dropped: `.linkLabel`'s clamp is exactly
 * what `line-clamp-2` compiles to, and `.menuExternalLink`'s `align-items:
 * center` is already in `NAV_ROW`.
 */

import isInternalUrl from "@docusaurus/isInternalUrl";
import Link from "@docusaurus/Link";
import { isActiveSidebarItem } from "@docusaurus/plugin-content-docs/client";
import { ThemeClassNames } from "@docusaurus/theme-common";
import { cn } from "@fiestaboard/ui/lib/utils";
import type { Props } from "@theme/DocSidebarItem/Link";
import IconExternalLink from "@theme/Icon/ExternalLink";
import type { ReactNode } from "react";

/**
 * The nav-row vocabulary from FiestaUI's own `chrome/sidebar.tsx`
 * (`DESKTOP_LINK_BASE`). Kept byte-identical in
 * `src/theme/DocSidebarItem/Category` so both row types read as one control.
 *
 * ---------------------------------------------------------------------------
 * Cascade model for this site (verified against the emitted bundle, not
 * assumed — `build/assets/css/styles.*.css`):
 *
 * `docusaurus.config.ts` sets `future: { v4: true }`, which turns on
 * `useCssCascadeLayers`. `@docusaurus/plugin-css-cascade-layers` therefore
 * wraps `node_modules/infima/dist` in `@layer docusaurus.infima`, and that
 * layer is declared *before* Tailwind's `@layer utilities` in the bundle.
 * Neither `src/css/*` nor `@fiestaboard/ui`'s `theme.css` matches the plugin's
 * path filters, so both stay unlayered. Net precedence:
 *
 *   normal declarations  : unlayered  >  @layer utilities  >  docusaurus.infima
 *   !important           : docusaurus.infima  >  @layer utilities  >  unlayered
 *     (important reverses layer order, and unlayered sorts as the last layer)
 *
 * Two consequences that actually matter here:
 *   1. A *plain* utility already outranks Infima. The `!` modifiers below are
 *      belt-and-braces: they keep the pill geometry from depending on a layer
 *      order that the plugin owns and could reorder. Do not remove them without
 *      re-checking the emitted bundle.
 *   2. `!` is *not* a universal escape hatch — an Infima `!important` rule now
 *      beats an important Tailwind utility. That is exactly why the Category
 *      swizzle paints its pill on `.menu__list-item-collapsible` instead of on
 *      the label link: Infima's
 *      `.menu__list-item-collapsible .menu__link--active { background: none !important }`
 *      would win there, `bg-nav-active!` or not.
 * ---------------------------------------------------------------------------
 *
 * `transition-colors` stays plain: Infima's `transition: background` on
 * `.menu__link` produces the same fade either way.
 */
const NAV_ROW = "flex items-center gap-3 rounded-lg! px-3! py-2! text-sm font-medium transition-colors";

/**
 * `nav-active` / `nav-active-hover` ship in `@fiestaboard/ui/theme.css`, which
 * is imported into `fiestaui.src.css` without a `layer()` wrapper and lives
 * outside the cascade-layers plugin's path filters — so they are unlayered and
 * beat every Infima rule on the normal-declaration path above, regardless of
 * specificity.
 *
 * The active row still restates both halves of `.nav-active` as important
 * utilities built from the very same tokens (`--color-nav-active` /
 * `--color-nav-active-foreground`). That is deliberate belt-and-braces against
 * Infima's hover pair — `.menu__link:hover` and `.menu__link--active:hover`,
 * neither of which is `!important` — so hovering an active row can never swap
 * the active fill for Infima's accent and repaint the label against it.
 * (That fill was indigo-600 until @fiestaboard/ui 4.0.0 locked the palette
 * onto the board; it is now `--foreground` in light and `--primary` in dark.
 * Only the values moved — this swizzle names the tokens, not the colours.)
 * Leaf links are not inside `.menu__list-item-collapsible`, so Infima's one
 * `background: none !important` rule (see above) does not reach them.
 *
 * Upstream's `menu__link--active` is kept — user CSS and our own `custom.css`
 * (`.menu__link--active:not(.menu__link--sublist)`) target it.
 *
 * There is still deliberately no companion class on the INACTIVE row, but the
 * reason has changed. It used to be that `.nav-active-hover` was unusable
 * here: 4.0.0 retuned its token to `oklch(1 0 0 / 14%)`, a white alpha that
 * reads only because the rail sits below the page in lightness, and these rows
 * sit on `--background`, where it composites to 1.015:1 and disappears. An
 * eslint rule kept it out. @fiestaboard/ui 5.3.0 made the token
 * surface-relative, so the class is merely redundant now rather than wrong,
 * and the ban is gone with the hazard.
 *
 * What keeps it off the row is that the fill has three targets, not one —
 * `.menu__link:hover`, `.menu__caret:hover` and
 * `.menu__list-item-collapsible:hover` — and Infima routes all three through
 * `--ifm-menu-color-background-hover`, which `custom.css` points straight at
 * `var(--nav-active-hover)`. One binding paints the whole row; the class would
 * paint whichever element it was spelled on. Infima's hover rule is layered
 * (`docusaurus.infima`) and so loses to the active row's important utilities,
 * which is what keeps an active row from repainting on hover.
 */
const NAV_ROW_ACTIVE = "menu__link--active nav-active bg-nav-active! text-nav-active-foreground!";

function LinkLabel({ label }: { label: string }) {
  // Upstream clamps the label to two lines via its CSS module; `line-clamp-2`
  // compiles to exactly the same declarations.
  return <span className="line-clamp-2">{label}</span>;
}

export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  // Destructured only to keep it out of the `...props` spread below, exactly
  // as upstream does — `index` is meaningful to Category, not to a leaf link.
  index: _index,
  ...props
}: Props): ReactNode {
  const { href, label, className, autoAddBaseUrl } = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  return (
    <li
      className={cn(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        "menu__list-item",
        className,
      )}
      key={label}
    >
      <Link
        className={cn("menu__link", NAV_ROW, isActive && NAV_ROW_ACTIVE)}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? "page" : undefined}
        to={href}
        {...(isInternalLink && {
          onClick: onItemClick ? () => onItemClick(item) : undefined,
        })}
        {...props}
      >
        <LinkLabel label={label} />
        {!isInternalLink && <IconExternalLink />}
      </Link>
    </li>
  );
}
