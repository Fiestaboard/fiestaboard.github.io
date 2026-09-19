/**
 * Swizzled `@theme/Tag` — the pill behind every blog tag, rendered on FiestaUI's
 * `Chip` instead of Infima's `styles.tag` / `.tagRegular` / `.tagWithCount`
 * rules. This is the last item of FiestaUI #229 (the `versions.tsx` chips
 * moved in #44; the blog tag rows did not).
 *
 * Ejected rather than wrapped: `@theme-original/Tag` puts its own border,
 * radius and padding on the anchor, so wrapping that in `<Chip asChild>`
 * would stack two pills. Upstream is twenty lines, and everything that
 * matters about it is preserved:
 *
 *   - `rel="tag"`, `href={permalink}` and `title={description}` land on a
 *     real Docusaurus `Link`. `Chip` is `asChild` around it, per its documented
 *     primary usage, so a tag stays a navigable anchor with client-side routing
 *     rather than a styled `<button>`.
 *   - `count` (only set on the `/blog/tags` index, never in a post's own tag
 *     row) still renders after the label. Upstream cut the pill into a
 *     luggage-label shape with a punched hole to distinguish the counted
 *     variant; the DS has one `Chip` shape, so the count is a muted `Text`
 *     inside it instead, separated by `Chip`'s own `gap-1`.
 *
 * Every tag call site goes through this component: `TagsListInline` (the
 * `Tags:` row at the foot of a blog post — still the stock swizzle-free
 * version, since all it owns is that label and the inline `li` layout) and
 * `TagsListByLetter` (the `/blog/tags` index).
 *
 * The contrast decision comes with `Chip` for free. The pill hover this
 * replaces borrowed `--ifm-link-color`, which the token bridge resolves to the
 * brand gold that measures 1.83:1 on a light page — it cannot carry a state.
 * `Chip` hovers to `border-brand` at the ink plateau (5.09:1 light, 9.63:1
 * dark), which is exactly why the DS rejected `--ring` for chip hover.
 */

import Link from "@docusaurus/Link";
import { Chip } from "@fiestaboard/ui/components/feedback/chip";
import { Text } from "@fiestaboard/ui/components/typography/text";
import type { Props } from "@theme/Tag";
import type { ReactNode } from "react";

export default function Tag({ permalink, label, count, description }: Props): ReactNode {
  return (
    <Chip asChild>
      <Link rel="tag" href={permalink} title={description}>
        {label}
        {count && (
          <Text as="span" size="xs" tone="muted" className="tabular-nums">
            {count}
          </Text>
        )}
      </Link>
    </Chip>
  );
}
