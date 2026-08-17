/**
 * Swizzled `@theme/DocSidebarItem/Category` — a collapsible branch of the docs
 * sidebar, restyled as a FiestaUI nav row.
 *
 * Only the presentation changes. Every piece of behaviour is upstream's,
 * verbatim: `useVisibleSidebarItems` (unlisted/filtered children),
 * `isActiveSidebarItem` / `isSamePath`, `useCollapsible` + `Collapsible` (the
 * height animation and `lazy` mounting), `useDocSidebarItemsExpandedState`
 * (`autoCollapseCategories`), the SSR href fallback, the auto-expand effect,
 * and the click semantics that collapse a category only when you are already
 * on its own page. `DocSidebarItems` still recurses, so depth is unbounded.
 *
 * The pill lives on `.menu__list-item-collapsible` — the wrapper around the
 * label link *and* the caret button — because Infima deliberately hands the row
 * background to that wrapper and kills it on the inner link with
 * `.menu__list-item-collapsible .menu__link--active { background: none !important }`.
 * That rule sits in `@layer docusaurus.infima`, which *outranks* an important
 * Tailwind utility in `@layer utilities` (important declarations reverse layer
 * order), so a `bg-nav-active!` on the label would lose. Styling the wrapper
 * both dodges that and highlights the whole row (label + caret) as one control,
 * which is what FiestaUI's sidebar rows look like. The label only takes a
 * `color`, which that rule does not touch.
 *
 * See `src/theme/DocSidebarItem/Link` for why the two leaf renderers are
 * swizzled instead of substituting FiestaUI's `Sidebar` component, and for the
 * full cascade-layer model behind the `!` modifiers below.
 *
 * Upstream's `styles.module.css` is dropped. `.categoryLink`'s `overflow:
 * hidden` and `.categoryLinkLabel`'s `flex: 1` + clamp are restated as
 * utilities below. Its third rule —
 * `:global(.menu__link--sublist-caret)::after { margin-left: … }` — is not:
 * with `flex-1` on the label there is no free space for Infima's own
 * `margin-left: auto` to consume, and `NAV_ROW`'s `gap-3` supplies the gap
 * instead (the `::after` is a flex item of `.menu__link`).
 */

import Link from "@docusaurus/Link";
import type { PropSidebarItemCategory, PropSidebarItemLink } from "@docusaurus/plugin-content-docs";
import {
  findFirstSidebarItemLink,
  isActiveSidebarItem,
  useDocSidebarItemsExpandedState,
  useVisibleSidebarItems,
} from "@docusaurus/plugin-content-docs/client";
import { Collapsible, ThemeClassNames, useCollapsible, usePrevious, useThemeConfig } from "@docusaurus/theme-common";
import { isSamePath } from "@docusaurus/theme-common/internal";
import { translate } from "@docusaurus/Translate";
import useIsBrowser from "@docusaurus/useIsBrowser";
import { cn } from "@fiestaboard/ui/lib/utils";
import type { Props } from "@theme/DocSidebarItem/Category";
import DocSidebarItemLink from "@theme/DocSidebarItem/Link";
import DocSidebarItems from "@theme/DocSidebarItems";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useMemo } from "react";

/** Kept byte-identical to `NAV_ROW` in `src/theme/DocSidebarItem/Link`. */
const NAV_ROW = "flex items-center gap-3 rounded-lg! px-3! py-2! text-sm font-medium transition-colors";

/**
 * The wrapper only needs the pill's shape and fill — its children (the label
 * link and the caret button) bring their own padding from Infima.
 */
const NAV_ROW_WRAPPER = "rounded-lg! transition-colors";

// If we navigate to a category and it becomes active, it should automatically
// expand itself
function useAutoExpandActiveCategory({
  isActive,
  collapsed,
  updateCollapsed,
  activePath,
}: {
  isActive: boolean;
  collapsed: boolean;
  updateCollapsed: (b: boolean) => void;
  activePath: string;
}) {
  const wasActive = usePrevious(isActive);
  const previousActivePath = usePrevious(activePath);
  useEffect(() => {
    const justBecameActive = isActive && !wasActive;
    const stillActiveButPathChanged = isActive && wasActive && activePath !== previousActivePath;
    if ((justBecameActive || stillActiveButPathChanged) && collapsed) {
      updateCollapsed(false);
    }
  }, [isActive, wasActive, collapsed, updateCollapsed, activePath, previousActivePath]);
}

/**
 * When a collapsible category has no link, we still link it to its first child
 * during SSR as a temporary fallback. This allows to be able to navigate inside
 * the category even when JS fails to load, is delayed or simply disabled
 * React hydration becomes an optional progressive enhancement
 * see https://github.com/facebookincubator/infima/issues/36#issuecomment-772543188
 * see https://github.com/facebook/docusaurus/issues/3030
 */
function useCategoryHrefWithSSRFallback(item: Props["item"]): string | undefined {
  const isBrowser = useIsBrowser();
  return useMemo(() => {
    if (item.href && !item.linkUnlisted) {
      return item.href;
    }
    // In these cases, it's not necessary to render a fallback
    // We skip the "findFirstCategoryLink" computation
    if (isBrowser || !item.collapsible) {
      return undefined;
    }
    return findFirstSidebarItemLink(item);
  }, [item, isBrowser]);
}

function CollapseButton({
  collapsed,
  categoryLabel,
  onClick,
}: {
  collapsed: boolean;
  categoryLabel: string;
  onClick: ComponentProps<"button">["onClick"];
}) {
  return (
    <button
      aria-label={
        collapsed
          ? translate(
              {
                id: "theme.DocSidebarItem.expandCategoryAriaLabel",
                message: "Expand sidebar category '{label}'",
                description: "The ARIA label to expand the sidebar category",
              },
              { label: categoryLabel },
            )
          : translate(
              {
                id: "theme.DocSidebarItem.collapseCategoryAriaLabel",
                message: "Collapse sidebar category '{label}'",
                description: "The ARIA label to collapse the sidebar category",
              },
              { label: categoryLabel },
            )
      }
      aria-expanded={!collapsed}
      type="button"
      // Only rendered for categories that have their own page; it is a second
      // hover target inside the row, so it gets the same pill treatment.
      // Infima's `.menu__caret:hover` reads the same
      // `--ifm-menu-color-background-hover` as `.menu__link:hover`, so the two
      // halves of the row still fill identically — see the note in
      // `src/theme/DocSidebarItem/Link` for why the fill is no longer borrowed
      // from FiestaUI's rail-scoped `.nav-active-hover`.
      className="clean-btn menu__caret rounded-lg!"
      onClick={onClick}
    />
  );
}

function CategoryLinkLabel({ label }: { label: string }) {
  // `flex-1` + the two-line clamp are upstream's CSS module, expressed as
  // utilities; `flex-1` is what leaves the caret pinned to the right edge.
  return <span className="line-clamp-2 flex-1">{label}</span>;
}

export default function DocSidebarItemCategory(props: Props): ReactNode {
  const visibleChildren = useVisibleSidebarItems(props.item.items, props.activePath);
  if (visibleChildren.length === 0) {
    return <DocSidebarItemCategoryEmpty {...props} />;
  } else {
    return <DocSidebarItemCategoryCollapsible {...props} />;
  }
}

function isCategoryWithHref(category: PropSidebarItemCategory): category is PropSidebarItemCategory & { href: string } {
  return typeof category.href === "string";
}

// If a category doesn't have any visible children, we render it as a link
function DocSidebarItemCategoryEmpty({ item, ...props }: Props): ReactNode {
  // If the category has no link, we don't render anything
  // It's not super useful to render a category you can't open nor click
  if (!isCategoryWithHref(item)) {
    return null;
  }
  // We remove props that don't make sense for a link and forward the rest
  const {
    type: _type,
    collapsed: _collapsed,
    collapsible: _collapsible,
    items: _items,
    linkUnlisted: _linkUnlisted,
    ...forwardableProps
  } = item;
  const linkItem: PropSidebarItemLink = {
    type: "link",
    ...forwardableProps,
  };
  return <DocSidebarItemLink item={linkItem} {...props} />;
}

function DocSidebarItemCategoryCollapsible({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}: Props): ReactNode {
  const { items, label, collapsible, className, href } = item;
  const {
    docs: {
      sidebar: { autoCollapseCategories },
    },
  } = useThemeConfig();
  const hrefWithSSRFallback = useCategoryHrefWithSSRFallback(item);

  const isActive = isActiveSidebarItem(item, activePath);
  const isCurrentPage = isSamePath(href, activePath);

  const { collapsed, setCollapsed } = useCollapsible({
    // Active categories are always initialized as expanded. The default
    // (`item.collapsed`) is only used for non-active categories.
    initialState: () => {
      if (!collapsible) {
        return false;
      }
      return isActive ? false : item.collapsed;
    },
  });

  const { expandedItem, setExpandedItem } = useDocSidebarItemsExpandedState();
  // Use this instead of `setCollapsed`, because it is also reactive
  const updateCollapsed = (toCollapsed: boolean = !collapsed) => {
    setExpandedItem(toCollapsed ? null : index);
    setCollapsed(toCollapsed);
  };
  useAutoExpandActiveCategory({ isActive, collapsed, updateCollapsed, activePath });
  useEffect(() => {
    if (collapsible && expandedItem != null && expandedItem !== index && autoCollapseCategories) {
      setCollapsed(true);
    }
  }, [collapsible, expandedItem, index, setCollapsed, autoCollapseCategories]);

  const handleItemClick: ComponentProps<"a">["onClick"] = (e) => {
    onItemClick?.(item);
    if (collapsible) {
      if (href) {
        // When already on the category's page, we collapse it
        // We don't use "isActive" because it would collapse the
        // category even when we browse a children element
        // See https://github.com/facebook/docusaurus/issues/11213
        if (isCurrentPage) {
          e.preventDefault();
          updateCollapsed();
        } else {
          // When navigating to a new category, we always expand
          // see https://github.com/facebook/docusaurus/issues/10854#issuecomment-2609616182
          updateCollapsed(false);
        }
      } else {
        e.preventDefault();
        updateCollapsed();
      }
    }
  };

  return (
    <li
      className={cn(
        ThemeClassNames.docs.docSidebarItemCategory,
        ThemeClassNames.docs.docSidebarItemCategoryLevel(level),
        "menu__list-item",
        {
          "menu__list-item--collapsed": collapsed,
        },
        className,
      )}
    >
      <div
        className={cn(
          "menu__list-item-collapsible",
          NAV_ROW_WRAPPER,
          // Upstream reserves the filled state for the category's *own* page,
          // not for "a child of mine is open" — a solid pill on a row that
          // isn't the current page would misread. The branch-is-active hint
          // stays where upstream put it: the label's `menu__link--active`
          // colour below.
          // Inactive rows carry no hover class: Infima's own
          // `.menu__list-item-collapsible:hover` reads
          // `--ifm-menu-color-background-hover` from `custom.css`, and its
          // layered rule loses to the important `bg-nav-active!` above, so an
          // active row still holds its fill while hovered.
          isCurrentPage && "menu__list-item-collapsible--active nav-active bg-nav-active!",
        )}
      >
        <Link
          className={cn("menu__link", NAV_ROW, "overflow-hidden", {
            "menu__link--sublist": collapsible,
            "menu__link--sublist-caret": !href && collapsible,
            "menu__link--active": isActive,
            // The pill is painted on the wrapper, so the label only needs the
            // on-pill foreground. It has to be important: `.menu__link` sets
            // `color` unlayered, which beats any layered utility.
            "text-nav-active-foreground!": isCurrentPage,
          })}
          onClick={handleItemClick}
          aria-current={isCurrentPage ? "page" : undefined}
          role={collapsible && !href ? "button" : undefined}
          aria-expanded={collapsible && !href ? !collapsed : undefined}
          href={collapsible ? (hrefWithSSRFallback ?? "#") : hrefWithSSRFallback}
          {...props}
        >
          <CategoryLinkLabel label={label} />
        </Link>
        {href && collapsible && (
          <CollapseButton
            collapsed={collapsed}
            categoryLabel={label}
            onClick={(e) => {
              e.preventDefault();
              updateCollapsed();
            }}
          />
        )}
      </div>

      <Collapsible lazy as="ul" className="menu__list" collapsed={collapsed}>
        <DocSidebarItems
          items={items}
          tabIndex={collapsed ? -1 : 0}
          onItemClick={onItemClick}
          activePath={activePath}
          level={level + 1}
        />
      </Collapsible>
    </li>
  );
}
