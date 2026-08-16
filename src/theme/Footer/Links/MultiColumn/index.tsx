/**
 * Swizzled `@theme/Footer/Links/MultiColumn` — the four link columns, rebuilt
 * on FiestaUI `Flex`/`Box`/`Text`/`List` instead of Infima's 12-column grid
 * (`row` + `col footer__col`) and `.footer__title` type rule.
 *
 * Column sizing reproduces what Infima's `.col` did, without the grid:
 * `flex: 1 0` (equal columns) above Infima's 996px "narrow window" breakpoint,
 * `flex-basis: 100%` (one column per row) below it. The breakpoint is spelled
 * `min-[997px]` so the footer reflows on exactly the same pixel as the navbar
 * and sidebar, which are still driven by Infima's media query.
 *
 * Column titles stay non-heading elements, as upstream renders them. Promoting
 * them to `Heading` (h2-h4) would inject four extra headings into the outline
 * of every page on the site, changing how the docs read to anyone navigating by
 * heading — the same reasoning that keeps `PaginatorNavLink` on `Text`. The DS
 * `Text` primitive carries the title weight/size instead.
 *
 * `.footer__items clean-list` is kept on the `List`: they are Infima's own
 * neutralisers for the bullets / left padding / bottom margin it puts on bare
 * `ul` elements, so using them keeps the reset in one vocabulary rather than
 * re-deriving it from utilities. `List` therefore runs with `gap="0"`; the row
 * rhythm comes from the `line-height: 2` that `.footer__link-item` puts on each
 * anchor, exactly as upstream.
 *
 * Dropped from upstream: `row footer__links` and `col footer__col` (the Infima
 * grid, replaced by the flex sizing above) and `.footer__title` (its bold-h4
 * type rule and `--ifm-footer-title-color`, replaced by the `Text` below).
 * Nothing in `src/css` targets any of them. `.footer__item` / `.footer__items`
 * are kept because Infima's `margin` resets are declared against them.
 *
 * `ThemeClassNames.layout.footer.column` and the per-column `className` from
 * `themeConfig` are preserved, as is the raw-HTML item escape hatch.
 */

import type { FooterColumnItem, FooterLinkItem } from "@docusaurus/theme-common";
import { ThemeClassNames } from "@docusaurus/theme-common";
import { Box, cn, Flex, List, ListItem, Text } from "@fiestaboard/ui";
import LinkItem from "@theme/Footer/LinkItem";
import type { Props } from "@theme/Footer/Links/MultiColumn";
import type { ReactNode } from "react";

function ColumnLinkItem({ item }: { item: FooterLinkItem }): ReactNode {
  return item.html ? (
    <ListItem
      className={cn("footer__item", item.className)}
      // Developer provided the HTML, so assume it's safe.
      dangerouslySetInnerHTML={{ __html: item.html }}
    />
  ) : (
    <ListItem className="footer__item">
      <LinkItem item={item} />
    </ListItem>
  );
}

function Column({ column }: { column: FooterColumnItem }): ReactNode {
  return (
    <Box
      className={cn(
        ThemeClassNames.layout.footer.column,
        "grow basis-full min-[997px]:basis-0 min-[997px]:min-w-40",
        column.className,
      )}
    >
      <Text as="span" size="base" weight="semibold" className="mb-2 block">
        {column.title}
      </Text>
      <List gap="0" className="footer__items clean-list">
        {column.items.map((item, i) => (
          <ColumnLinkItem key={i} item={item} />
        ))}
      </List>
    </Box>
  );
}

export default function FooterLinksMultiColumn({ columns }: Props): ReactNode {
  return (
    <Flex wrap gap="8">
      {columns.map((column, i) => (
        <Column key={i} column={column} />
      ))}
    </Flex>
  );
}
