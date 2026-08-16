/**
 * Swizzled `@theme/SkipToContent` — the keyboard-only "Skip to main content"
 * link that is the first thing in the tab order on every page. It now renders
 * FiestaUI's `SkipToContent` instead of upstream's anchor + `styles.module.css`.
 *
 * Upstream is a one-liner (`<SkipToContentLink className={styles.skipToContent} />`)
 * but `SkipToContentLink` — from `@docusaurus/theme-common` — carries behaviour
 * that the visible link markup alone does not, so this file re-implements that
 * wrapper rather than replacing only the anchor:
 *
 *   - **Focus is moved programmatically, not by the URL hash.** On click the
 *     handler cancels navigation and focuses `main:first-of-type`, falling back
 *     to `#__docusaurus_skipToContent_fallback` (the id `@theme/Layout` puts on
 *     the Layout children). A bare `href="#…"` scrolls but, in several browsers,
 *     does not move focus, so the next Tab would land back at the top of the
 *     page — see facebook/docusaurus#6411.
 *   - **The `role="region"` wrapper** keeps the link reachable as a landmark.
 *   - **Focus resets on client-side PUSH navigation without a hash**, so that
 *     after following a link the next Tab starts from the skip link again
 *     rather than from wherever the previous page left the caret
 *     (facebook/docusaurus#8204).
 *
 * Preserved exactly: the `theme.common.skipToMainContent` translation id and
 * message, the `__docusaurus_skipToContent_fallback` target (imported from
 * theme-common so it cannot drift), and the props contract — upstream takes no
 * props and returns a `ReactNode`.
 *
 * One thing upstream's stylesheet carried that FiestaUI's does not: the focused
 * link has to out-stack the navbar. Upstream put the link at
 * `calc(var(--ifm-z-index-fixed) + 1)`; FiestaUI's `SkipToContent` hard-codes
 * `--z-skip-link` (200), which *ties* with Infima's `.navbar--fixed-top`
 * (`z-index: var(--ifm-z-index-fixed)`, also 200). `@theme/Layout` renders
 * `<SkipToContent />` before `<Navbar />`, so on a tie the navbar paints last
 * and wins — and since the token bridge makes the navbar opaque and the link
 * focuses to `top: 0.5rem; left: 0.5rem`, the link lands entirely behind it and
 * is never seen. The wrapper below restores upstream's `+ 1` by becoming the
 * stacking context the fixed link is painted in.
 */

import { useHistory } from "@docusaurus/router";
import { SkipToContentFallbackId } from "@docusaurus/theme-common";
import { useLocationChange } from "@docusaurus/theme-common/internal";
import { translate } from "@docusaurus/Translate";
import { SkipToContent as FiestaSkipToContent } from "@fiestaboard/ui";
import type { MouseEvent, ReactNode } from "react";
import { useCallback, useRef } from "react";

/**
 * `translate()`, not the `<Translate>` component: FiestaUI's `SkipToContent`
 * types `label` as a `string` (it is also the wrapper's `aria-label`), so the
 * message has to be resolved eagerly. Same id/message as upstream, so existing
 * `i18n/**\/code.json` entries keep applying.
 */
const skipToMainContentLabel = translate({
  id: "theme.common.skipToMainContent",
  description:
    "The skip to content label used for accessibility, allowing to rapidly navigate to main content with keyboard tab/enter navigation",
  message: "Skip to main content",
});

/** Upstream's target resolution: the real `<main>` first, Layout children second. */
function getSkipToContentTarget(): HTMLElement | null {
  return document.querySelector<HTMLElement>("main:first-of-type") ?? document.getElementById(SkipToContentFallbackId);
}

/** Focus an element that is not natively focusable, without leaving it in the tab order. */
function programmaticFocus(el: HTMLElement): void {
  el.setAttribute("tabindex", "-1");
  el.focus();
  el.removeAttribute("tabindex");
}

export default function SkipToContent(): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const { action } = useHistory();

  // The handler sits on the wrapper rather than the anchor: FiestaUI's
  // `SkipToContent` accepts only `label` and `targetId`, so there is no way to
  // pass `onClick` (or a ref) through it. Clicks — including the synthetic
  // click a keyboard Enter fires on a link — bubble here first, and
  // `preventDefault` on the bubbled event still cancels the hash navigation
  // because default actions run after propagation. The wrapper contains
  // nothing but that link, so there is no other click to catch.
  const onClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const targetElement = getSkipToContentTarget();
    if (targetElement) {
      programmaticFocus(targetElement);
    }
  }, []);

  useLocationChange(({ location }) => {
    if (containerRef.current && !location.hash && action === "PUSH") {
      programmaticFocus(containerRef.current);
    }
  });

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={skipToMainContentLabel}
      onClick={onClick}
      // `relative` only so `z-index` applies; the wrapper stays zero-sized
      // because its sole child is out of flow (`sr-only` at rest, `fixed` on
      // focus). See the header note — this is what keeps the focused link
      // above the sticky navbar, exactly as upstream's stylesheet did.
      className="relative z-[calc(var(--ifm-z-index-fixed)+1)]"
    >
      {/* `targetId` is the Docusaurus fallback id, not FiestaUI's default
          "main-content": that id exists in the FiestaBoard app shell but not in
          a Docusaurus page, and it is what the anchor points at when JS has not
          hydrated yet. With JS, `onClick` above retargets to <main> anyway. */}
      <FiestaSkipToContent label={skipToMainContentLabel} targetId={SkipToContentFallbackId} />
    </div>
  );
}
