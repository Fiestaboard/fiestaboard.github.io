/**
 * Swizzled `@theme/ColorModeToggle` — the navbar light/dark/system switch,
 * rendered with FiestaUI's `ThemeToggle` instead of Infima's round `clean-btn`
 * so the one control every visitor touches carries the DS ghost-button
 * treatment (hover fill, focus ring, iconography) instead of a hand-rolled one.
 *
 * State stays exactly where Docusaurus keeps it: `@theme/Navbar/ColorModeToggle`
 * still owns `useColorMode()` and hands this component the stored *choice*
 * (`null` = follow the OS) plus `onChange`. Only the presentation is replaced.
 * The cycle (light → dark → system when `respectPrefersColorScheme`, else
 * light ⇄ dark) and the translated ARIA labels are carried over from the
 * original verbatim, translation ids included, so existing locales keep
 * working.
 *
 * `iconSource="dom"` because this site is statically rendered: the server does
 * not know the visitor's theme, so the Sun/Moon split must key on the same
 * pre-paint signal the stylesheet does — the `.dark`-variant utilities, which
 * `scripts/build-fiestaui-css.mjs` widens to also match Docusaurus's
 * `[data-theme="dark"]` attribute, stamped by an inline script before first
 * paint. With the default `iconSource="prop"` the glyph would follow the
 * SSR-baked prop and every dark-mode visitor would see the light glyph flash
 * on cold load — the exact failure `ThemeToggle`'s own docs call out.
 *
 * The Monitor (system) glyph cannot key on `.dark` — it reflects the *choice*,
 * not the resolved theme — so it follows the `data-resolved-theme` attribute,
 * which SSR bakes as "system" (the choice is in localStorage, unreadable at
 * build time). For the majority — visitors who never picked a mode — that is
 * already correct pre-paint. For visitors with a stored explicit choice,
 * custom.css bridges the hydration gap with rules keyed on
 * `html[data-theme-choice]` (see "Theme toggle pre-hydration glyph" there);
 * the `.fiesta-theme-toggle` wrapper class below is that bridge's hook.
 *
 * Dropped from the original, deliberately:
 * - `buttonClassName`: only ever set for `navbar.style: "dark"`, which this
 *   site does not use, and `ThemeToggle` owns its button styling anyway.
 * - `disabled={!isBrowser}`: pre-hydration the button has no handler, so a
 *   click is already inert; disabling it besides only greys the control out
 *   during hydration.
 */

import { translate } from "@docusaurus/Translate";
import { ThemeToggle } from "@fiestaboard/ui/components/chrome/theme-toggle";
import { cn } from "@fiestaboard/ui/lib/utils";
import type { Props } from "@theme/ColorModeToggle";
import React, { type ReactNode } from "react";

type ColorModeChoice = Props["value"];

// The order of color modes is defined here, and can be customized with swizzle
// (unchanged from the original).
function getNextColorMode(colorMode: ColorModeChoice, respectPrefersColorScheme: boolean): ColorModeChoice {
  // 2-value transition
  if (!respectPrefersColorScheme) {
    return colorMode === "dark" ? "light" : "dark";
  }
  // 3-value transition
  switch (colorMode) {
    case null:
      return "light";
    case "light":
      return "dark";
    case "dark":
      return null;
    default:
      throw new Error(`unexpected color mode ${String(colorMode)}`);
  }
}

function getColorModeLabel(colorMode: ColorModeChoice): string {
  switch (colorMode) {
    case null:
      return translate({
        message: "system mode",
        id: "theme.colorToggle.ariaLabel.mode.system",
        description: "The name for the system color mode",
      });
    case "light":
      return translate({
        message: "light mode",
        id: "theme.colorToggle.ariaLabel.mode.light",
        description: "The name for the light color mode",
      });
    case "dark":
      return translate({
        message: "dark mode",
        id: "theme.colorToggle.ariaLabel.mode.dark",
        description: "The name for the dark color mode",
      });
    default:
      throw new Error(`unexpected color mode ${String(colorMode)}`);
  }
}

function getColorModeAriaLabel(colorMode: ColorModeChoice): string {
  return translate(
    {
      message: "Switch between dark and light mode (currently {mode})",
      id: "theme.colorToggle.ariaLabel",
      description: "The ARIA label for the color mode toggle",
    },
    {
      mode: getColorModeLabel(colorMode),
    },
  );
}

function ColorModeToggle({ className, respectPrefersColorScheme, value, onChange }: Props): ReactNode {
  return (
    <div className={cn("fiesta-theme-toggle", className)}>
      <ThemeToggle
        theme={value ?? "system"}
        onToggle={() => onChange(getNextColorMode(value, respectPrefersColorScheme))}
        label={getColorModeAriaLabel(value)}
        iconSource="dom"
      />
    </div>
  );
}

export default React.memo(ColorModeToggle);
