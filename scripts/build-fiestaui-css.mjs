/**
 * Compile the Tailwind v4 + FiestaUI stylesheet ahead of the Docusaurus build.
 *
 * Runs via the `prebuild` / `prestart` npm hooks. Reads src/css/fiestaui.src.css
 * and writes src/css/fiestaui.generated.css (a plain CSS file: DS tokens +
 * whichever utilities the FiestaUI components and this site actually use).
 * Docusaurus loads the generated file and never has to run Tailwind itself.
 *
 * See src/css/fiestaui.src.css for why we precompile instead of using
 * Docusaurus's `configurePostCss`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(scriptDir, "..");
const input = path.join(siteDir, "src/css/fiestaui.src.css");
const output = path.join(siteDir, "src/css/fiestaui.generated.css");

const src = fs.readFileSync(input, "utf8");
const result = await postcss([tailwindcss({ optimize: true })]).process(src, { from: input });

// NOTE on the "postcss-calc ... Lexical error ... infinity * 1px" warning that
// Docusaurus's production build prints (fiestaboard#1574):
//
// Tailwind v4 compiles `rounded-full` etc. to a literal huge finite radius
// (e.g. `3.40282e+38px`) right here, during this precompile step — that value
// is never touched by the warning. The warning instead comes from the design
// token `--radius-pill: calc(infinity * 1px);`, which Tailwind emits verbatim
// (`infinity` is a valid CSS <calc-keyword>, just one the postcss-calc version
// bundled in Docusaurus's css-minimizer-webpack-plugin predates and can't
// tokenize). Confirmed empirically (see #1574) that when postcss-calc fails to
// parse it, it leaves the declaration completely untouched — byte-for-byte
// identical before and after minification — rather than dropping or mangling
// it. So the warning is noise, not a lossy minification bug. Do not "fix" it
// by rewriting this token to a finite px value.

// Make FiestaUI's dark mode land on this site, where nothing ever stamps a
// `.dark` class — Docusaurus owns the theme signal and re-stamps
// `data-theme="dark"` on <html> pre-paint.
//
// @fiestaboard/ui 5.9.0 does most of that reach itself: theme.css declares
// every dark-scoped selector in BOTH spellings now, so the token block arrives
// as `.dark,[data-theme=dark]{…}`, each `dark:` utility as
// `…:is(.dark *,[data-theme=dark] *)`, and `.dark .sidebar-gradient-horizontal`
// (which this rewrite never reached, and which was therefore dead here for two
// majors) as a pair too.
//
// What the DS deliberately does NOT do is qualify with `html` — that would
// raise specificity to 0,1,1 and break scoped subtree theming for consumers who
// dark-theme a card rather than a document. So the token block still has to be
// rewritten here, now for SPECIFICITY rather than for reach. Docusaurus runs its
// own PostCSS colour-fallback pass over this file afterwards, and that pass
// appends `@supports (color:color(display-p3 …))` / `@media (color-gamut:p3)`
// upgrade blocks containing only the tokens whose value falls outside sRGB. A
// token can qualify in light mode but not dark (`--warning`, `--success`,
// `--primary`, `--ring`, `--chart-*`, `--tag-*`), which emits a wide-gamut
// `:root` declaration with no dark counterpart after it — on a P3 display that
// silently reinstated the *light* value in dark mode. At 0,1,0 the dark block
// only wins on source order, which those appended blocks lose; `html` wins
// outright.
//
// Two things the head pattern has to tolerate, hence a regex rather than a
// `}.dark,[data-theme=dark]{` literal:
//
//   - It does not arrive as ONE block. Tailwind hoists any token whose value
//     needs a feature guard into a separate `@supports (…){…}` fragment and
//     leaves a plain-value fallback behind in the main block, so the fragment
//     opens after a `{` instead of a `}`. 4.0.0 made that reachable —
//     `--brand-hover`, `--border` and `--input` are `color-mix()` values — and
//     a missed fragment is not a missing declaration but a token quietly stuck
//     on its fallback, which for `--brand-hover` is a link whose hover state is
//     its resting state.
//   - The attribute half is optional, because a bare `.dark{` head is what
//     every version before 5.9.0 emitted. Pinning to the pair would turn a DS
//     downgrade into a light-only site instead of into the same rewrite.
//
// Tailwind's optimizer drops the quotes from `[data-theme="dark"]`; the pattern
// accepts either, since that is its choice to make and not this file's.
const DARK_TOKEN_BLOCK = String.raw`([{}])\.dark(?:,\[data-theme=("?)dark\2\])?\{`;

// The per-utility `dark:` variants get widened too, and that line is inert as of
// 5.9.0 — kept because it is the ONLY thing standing between a DS that went back
// to a class-only `@custom-variant dark` and a site where every `dark:` utility
// in the bundle silently stops matching. That failure is invisible: the CSS is
// valid, the selectors still apply to the right elements, and the token block
// keeps working, so the page renders half-dark rather than visibly light.
const css = result.css
  .replaceAll(":is(.dark *)", ':is(.dark *, [data-theme="dark"] *)')
  .replaceAll(new RegExp(DARK_TOKEN_BLOCK, "g"), '$1html.dark,html[data-theme="dark"]{');

const banner = "/* AUTO-GENERATED by scripts/build-fiestaui-css.mjs from fiestaui.src.css. Do not edit. */\n";
fs.writeFileSync(output, banner + css);

// Fail loudly if the FiestaUI component utilities didn't make it in — that is
// the exact failure mode that motivated precompiling in the first place.
//
// The probe is `text-brand` (Button's `link` variant), not the
// `bg-brand-emphasis` this used to grep for. As of @fiestaboard/ui 4.0.0 no
// component renders `bg-brand-emphasis` any more: the sole occurrence of that
// string anywhere under the `@source` root is a prose comment inside
// theme.css — one that names this very check. Tailwind's scanner does not
// know a comment from code, so it kept emitting the utility and the canary
// kept passing while proving nothing about the component scan.
//
// A probe therefore has to be a class that only a component file can put in
// the output. `text-brand` qualifies: it is absent from theme.css and from
// this site's own source, so it can only arrive via the dist scan.
if (!/\.text-brand[,{]/.test(result.css)) {
  console.error("[build-fiestaui-css] FiestaUI utilities missing from output — @source scan produced nothing.");
  process.exit(1);
}

// This site's stylesheets consume DS tokens by name, and a token that FiestaUI
// has deprecated does not disappear — it becomes an alias of its replacement
// and keeps resolving, so a stale name renders plausibly for a whole minor and
// then breaks outright at the removal. Nothing else in the pipeline reads this
// site's CSS against the installed theme, so the check lives here, next to the
// other DS-integration canaries.
//
// The scan covers every hand-written stylesheet, not just custom.css. That
// widening is what 5.0.0 forced: it deprecated the font tokens, and this site
// named them from four files — the bridge plus three CSS modules — so a
// custom.css-only scan would have gone green while three call sites sat on
// names scheduled for deletion. The generated stylesheet is excluded because
// it is FiestaUI's own output, not a call site: it *declares* the aliases.
const DEPRECATED_TOKENS = {
  // 4.0.0: --brand-emphasis is an alias of --brand, so every hover that used
  // it now resolves to the resting colour. --brand-hover is the replacement
  // and moves toward --foreground, i.e. hover raises contrast in both themes.
  "--brand-emphasis": "--brand-hover",
  // 5.0.0: the font tokens are role-named now. Geist is gone — the faces are
  // Archivo and Spline Sans Mono — and the point of the rename is that the
  // token no longer carries a vendor's name that the next typeface change
  // would falsify. The old names survive only as aliases, "removed in the
  // next major" per theme.css.
  "--font-geist-sans": "--font-sans-stack",
  "--font-geist-mono": "--font-mono-stack",
};

function stylesheets(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) stylesheets(full, found);
    else if (entry.name.endsWith(".css") && entry.name !== "fiestaui.generated.css") found.push(full);
  }
  return found;
}

// Same walk, for the site's own components. The tag-tint check below starts
// from a JSX call site rather than from a class name, because the class it is
// looking for belongs to this site and can be renamed out from under a grep.
function sources(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sources(full, found);
    else if (entry.name.endsWith(".tsx")) found.push(full);
  }
  return found;
}

const bridgePath = path.join(siteDir, "src/css/custom.css");
const bridge = fs.readFileSync(bridgePath, "utf8");

const staleTokens = stylesheets(path.join(siteDir, "src")).flatMap((file) =>
  Object.entries(DEPRECATED_TOKENS)
    .filter(([token]) => fs.readFileSync(file, "utf8").includes(`var(${token})`))
    .map(([token, replacement]) => ({ file: path.relative(siteDir, file), token, replacement })),
);
if (staleTokens.length > 0) {
  for (const { file, token, replacement } of staleTokens) {
    console.error(`[build-fiestaui-css] ${file} uses ${token}, deprecated by @fiestaboard/ui — use ${replacement}.`);
  }
  process.exit(1);
}

// A bridge rule that suppresses the UA focus outline owes a keyboard user a
// replacement they can actually see, and the replacement has to be built from
// tokens whose CONTRAST — not just whose name — survives a palette change.
//
// This bridge hand-rolled FiestaUI's pre-4.0.0 recipe, `ring-ring/50` at 3px.
// That band was always thin (2.19:1 light, 2.65:1 dark, both under SC 2.4.11's
// 3:1), but 4.0.0 made it invisible: --ring is declared as an alias of
// --primary, and --primary is now the literal #f5a623 tile, so a 50% band of
// it composites to 1.36:1 against the page in light mode. Nothing in a build,
// a typecheck or a route diff can see a focus ring go — the selector still
// matches and the declaration still resolves.
//
// FiestaUI's answer is `.focus-ring`: an orange band bounded by --ring-edge
// board-ink hairlines, so the hairline carries the boundary in light (16.19:1)
// and the band carries it in dark (9.77:1). It is class-based, and MDX renders
// prose anchors with no way to opt in, so for two majors the bridge mirrored
// the three stops by hand.
//
// @fiestaboard/ui 5.4.0 ends the mirroring: the recipe is published as
// `--focus-ring-shadow` on :root, and `.focus-ring` is now one CALLER of that
// property rather than the place it is written down (#228 item 5). Both stops
// resolve through --ring and --ring-edge, which are already themed, so the
// property re-resolves per theme with no dark counterpart to keep in sync —
// which is what makes it usable from a stylesheet a consumer owns. The DS
// names this bridge as the reason it exists, and names the failure too: the
// hand-mirrored copy has already gone stale once. A stale copy is invisible
// here by construction — it is still three valid declarations resolving to
// three valid colours, just no longer the DS's three.
//
// So the check is now two-sided, the same shape as the --nav-active-hover one
// below:
//
// 1. While the DS publishes the property, a rule that clears `outline` must
//    CONSUME it. Re-spelling the stops renders identically today, which is
//    precisely why nothing catches it drifting tomorrow.
//
// 2. If the DS ever stops publishing it, the bridge has to go back to spelling
//    a bounded recipe itself — `var(--focus-ring-shadow)` would then resolve
//    to nothing, leaving a rule that suppresses the UA outline and paints no
//    replacement at all. That is a worse failure than the one this guard was
//    written for, and it arrives with no edit to this site to notice it by.
//
// The scan runs over the bridge with its comments stripped. Every rule here is
// preceded by a block comment arguing it, and `[^{}]*` before the `{` happily
// swallows one — so an un-stripped scan quotes a paragraph back at you instead
// of the selector, and worse, would read a rule that had been COMMENTED OUT as
// a live one.
const dsFocusRing = css.match(/(?<![\w-])--focus-ring-shadow:\s*([^;}]+)/)?.[1]?.trim();
const bridgeRules = bridge.replaceAll(/\/\*[\s\S]*?\*\//g, "");
const outlineClearing = [...bridgeRules.matchAll(/(?:^|\})\s*([^{}]*:focus-visible[^{}]*)\{([^}]*)\}/g)]
  .map(([, selector, body]) => ({ selector: selector.trim().replace(/\s*\n\s*/g, " "), body }))
  .filter(({ body }) => /outline:\s*none/.test(body));

const handMirroredFocus = dsFocusRing
  ? outlineClearing.filter(({ body }) => !/box-shadow:\s*var\(--focus-ring-shadow\)/.test(body))
  : [];
if (handMirroredFocus.length > 0) {
  for (const { selector } of handMirroredFocus) {
    console.error(
      `[build-fiestaui-css] @fiestaboard/ui publishes the focus ring as a property now:\n` +
        `    --focus-ring-shadow: ${dsFocusRing}\n` +
        `  but custom.css still spells the stops out itself:\n` +
        `    ${selector}\n` +
        `  A re-spelling renders identically today and stops tracking a retune, which is the drift the\n` +
        `  DS cites this bridge for. Set the rule's box-shadow to \`var(--focus-ring-shadow)\`.`,
    );
  }
  process.exit(1);
}

const unboundedFocus = dsFocusRing ? [] : outlineClearing.filter(({ body }) => !body.includes("var(--ring-edge)"));
if (unboundedFocus.length > 0) {
  for (const { selector } of unboundedFocus) {
    console.error(
      `[build-fiestaui-css] custom.css drops the UA focus outline without an --ring-edge-bounded indicator:\n` +
        `    ${selector}\n` +
        `  @fiestaboard/ui no longer publishes --focus-ring-shadow, so a box-shadow reading it resolves to\n` +
        `  nothing and this rule paints no indicator at all. Since 4.0.0 a band of --ring alone is 1.36:1\n` +
        `  on the page, so spell the bounded recipe out again:\n` +
        `    box-shadow: 0 0 0 1px var(--ring-edge), 0 0 0 3px var(--ring), 0 0 0 4px var(--ring-edge);`,
    );
  }
  process.exit(1);
}

// Likewise if the dark-mode token block was not rewritten: a change to how the
// `dark` selector compiles would leave the block at 0,1,0, i.e. losing to every
// wide-gamut `:root` block Docusaurus appends after it.
if (!css.includes('html.dark,html[data-theme="dark"]{')) {
  console.error("[build-fiestaui-css] dark-mode token block not rewritten — the compiled dark selector changed.");
  process.exit(1);
}

// And if ANY of them escaped. Tailwind splits the dark token block whenever a
// token needs a `@supports` guard, and each fragment carries its own copy of the
// selector — one the rewrite has to reach as well, because an unqualified
// fragment loses that specificity race while the plain-value fallback beside it
// keeps resolving. That is a token silently stuck on its fallback in dark mode,
// which is indistinguishable from working until you measure it.
//
// This deliberately does NOT re-run DARK_TOKEN_BLOCK. Doing so reads as
// belt-and-braces and is in fact a tautology: `replaceAll` leaves no match of
// its own pattern behind, so the check could only ever pass, and a check that
// cannot fail is the failure mode this file exists to prevent. The escapes
// worth catching are by definition the heads that pattern does not describe —
// the pair emitted in the other order (`[data-theme=dark],.dark{`), the
// attribute half alone, a `.dark` that is not the first item in its list. Each
// leaves the guard above green, because that one only asks whether SOME head
// was rewritten, never whether every one was.
//
// So the scan is structural, over the emitted heads: a selector list item that
// is a WHOLE dark compound on its own — no `html` in front of it, no descendant
// part after it — is a block scoped to the document that will sit at 0,1,0.
// Items with a descendant part (`.dark .sidebar-gradient-horizontal`, and the
// `:is(.dark *, …)` the `dark:` utilities compile to) are not that: they scope a
// component, not the token layer, and never race the `:root` blocks Docusaurus
// appends.
const BARE_DARK_COMPOUND = /^(?:\.dark|\[data-theme=("?)dark\1\])$/;
const escapedDarkBlocks = [...css.matchAll(/(?:^|[{}])([^{}]*)\{/g)]
  .map(([, head]) => head.trim())
  .filter((head) => head.split(",").some((item) => BARE_DARK_COMPOUND.test(item.trim())));
if (escapedDarkBlocks.length > 0) {
  for (const head of escapedDarkBlocks) {
    console.error(
      `[build-fiestaui-css] a dark token block escaped the rewrite — it will never win over \`:root\` here:\n` +
        `    ${head}\n` +
        "  Teach DARK_TOKEN_BLOCK the head shape @fiestaboard/ui compiles to now, so the rewrite reaches it\n" +
        '  and it lands as `html.dark,html[data-theme="dark"]`.',
    );
  }
  process.exit(1);
}

// The docs sidebar swizzles `.nav-active` onto rows that sit on the PAGE, and
// FiestaUI tunes that class for its RAIL. The two agree on the token names and
// disagree on which way the pair points: on the rail (and here in dark) the
// pill is a bright fill under a board-ink label, so retuning `--nav-active`
// alone lifts both halves. In light mode this site inverts it — `--nav-active`
// is `--foreground` under a `--background` label — so a fill-only retune moves
// one half of a pair and destroys the contrast instead of raising it.
//
// So: any DS rule that sets `--nav-active` by itself owes this site a
// light-mode answer, and custom.css pins one under `prefers-contrast: more`.
//
// The scan is over emitted BLOCKS, not over one selector spelling. It used to
// grep for the literal `.nav-active{--nav-active:` that 4.0.0 unscoped, and
// @fiestaboard/ui 5.0.1 moves that exact retune into the dark token block
// (`.dark { --nav-active: … }`, #228) — a re-spelling that leaves the grep
// matching nothing, i.e. a guard that goes quiet because it can no longer see
// its subject rather than because the subject became safe. A guard that cannot
// fail is the failure mode this whole file exists to prevent, so it now checks
// the invariant instead of the spelling: a block that sets `--nav-active`
// without restating `--nav-active-foreground` beside it, in a scope that can
// reach light mode. Scoped to dark is fine — dark's pair here IS the rail's
// pair, ink on a bright fill, so lifting the fill lifts both halves. Which is
// precisely why 5.0.1's re-scoping needs no answer from this site, and why
// saying so has to be a decision the check reaches, not one it skips.
const DARK_SCOPED = /html\.dark|\[data-theme="dark"\]/;
const unpairedNavActive = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(([, , body]) => /(?<![\w-])--nav-active:/.test(body) && !/--nav-active-foreground:/.test(body))
  .map(([, selector]) => selector.trim())
  .filter((selector) => !DARK_SCOPED.test(selector));
if (unpairedNavActive.length > 0 && !/--nav-active:\s*var\(--foreground\)/.test(bridge)) {
  console.error(
    "[build-fiestaui-css] @fiestaboard/ui retunes --nav-active without --nav-active-foreground, and custom.css\n" +
      "  does not pin a light-mode fill. On this site's page surface that inverts the active row's pair.\n" +
      `  Unpaired in: ${unpairedNavActive.join(", ")}\n` +
      "  Add a `--nav-active: var(--foreground)` branch for light mode in custom.css.",
  );
  process.exit(1);
}

// The sidebar row hover reads the DS token directly now.
//
// It could not always. 4.0.0 retuned `--nav-active-hover` to
// `oklch(1 0 0 / 14%)`, a white alpha tuned on the RAIL — a surface a step
// darker than the page — which composites to 1.015:1 on this site's rows. So
// this bridge hand-mixed the same recipe against the surface it actually has,
// answered the transparency branch itself because the DS's opaque fallback was
// a near-black rail literal, and banned the rail class from the row swizzles
// in eslint.
//
// @fiestaboard/ui 5.3.0 is the bump that finally ships the surface-relative
// form (#228 — in 5.0.1's source, absent from its tarball): the token is
// `color-mix(in oklch, var(--foreground) 14%, transparent)`, re-declared from
// `--sidebar-foreground` inside `.sidebar-gradient`, with a
// `prefers-contrast: more` lift to 24%. That is this bridge's own recipe, two
// points louder and self-adapting, so the hand-mix and the eslint ban are
// retired in favour of `var(--nav-active-hover)`.
//
// Two invariants outlive that swap, and nothing in a build, a typecheck or a
// route diff can see either one break:
//
// 1. While the token is surface-relative, the bridge must CONSUME it. A
//    hand-mix reintroduced here would render identically at rest and silently
//    drop the prefers-contrast lift — the one branch a stand-in never had.
//    And symmetrically: if FiestaUI ever puts an absolute colour back, the
//    bridge has to stop consuming it, because that is the 1.015:1 row again.
//
// 2. The token still carries alpha — it is the only chrome token that does —
//    and the DS's opaque answer for it is scoped to `.nav-active-hover:hover`,
//    a class these rows do not render: the fill reaches them through Infima's
//    `.menu__link:hover`, `.menu__caret:hover` and
//    `.menu__list-item-collapsible:hover`, all three reading
//    `--ifm-menu-color-background-hover`. So the bridge still owes
//    `prefers-reduced-transparency` an answer, and it owes it the DS's
//    PAGE-surface one rather than a second opinion. That value is read back
//    out of the compiled DS rule instead of being written down here, so the
//    two cannot drift apart quietly.
const hoverBindings = [...bridge.matchAll(/--ifm-menu-color-background-hover:\s*([^;}]+)/g)].map(([, value]) =>
  value.trim(),
);
const surfaceRelativeHover = [...css.matchAll(/(?<![\w-])--nav-active-hover:\s*([^;}]+)/g)]
  .map(([, value]) => value.trim())
  .filter((value) => /var\(--(?:sidebar-)?foreground\)/.test(value));

const bindsDsHover = hoverBindings.includes("var(--nav-active-hover)");
const handMixedHover = hoverBindings.filter((value) => value.startsWith("color-mix("));

if (surfaceRelativeHover.length > 0 && (!bindsDsHover || handMixedHover.length > 0)) {
  console.error(
    "[build-fiestaui-css] @fiestaboard/ui's --nav-active-hover is surface-relative:\n" +
      `    ${surfaceRelativeHover.join("\n    ")}\n` +
      "  It no longer assumes the rail, so this site must consume it rather than stand in for it —\n" +
      "  a stand-in matches it at rest and has no prefers-contrast: more lift.\n" +
      `  custom.css binds --ifm-menu-color-background-hover to: ${hoverBindings.join(", ") || "(nothing)"}\n` +
      "  Set the resting binding to `var(--nav-active-hover)` and drop any hand-mix.",
  );
  process.exit(1);
}
if (surfaceRelativeHover.length === 0 && bindsDsHover) {
  console.error(
    "[build-fiestaui-css] @fiestaboard/ui's --nav-active-hover is an absolute colour again, and custom.css\n" +
      "  still points --ifm-menu-color-background-hover at it. A rail-tuned literal composites to 1.015:1\n" +
      "  on this site's page surface, i.e. no hover at all. Hand-mix the recipe against --foreground again,\n" +
      "  and restore the eslint ban that keeps the rail class off the row swizzles.",
  );
  process.exit(1);
}

const dsOpaqueHover = css
  .match(
    /@media\s*\(prefers-reduced-transparency:\s*reduce\)\s*\{\.nav-active-hover:hover\{background:\s*([^;}]+)/,
  )?.[1]
  ?.trim();
const bridgeTransparencyBranch =
  bridge.match(/@media\s*\(prefers-reduced-transparency:\s*reduce\)\s*\{(?:[^{}]|\{[^{}]*\})*\}/)?.[0] ?? "";
const bridgeOpaqueHover = [...bridgeTransparencyBranch.matchAll(/--ifm-menu-color-background-hover:\s*([^;}]+)/g)].map(
  ([, value]) => value.trim(),
);
if (dsOpaqueHover && !bridgeOpaqueHover.includes(dsOpaqueHover)) {
  console.error(
    "[build-fiestaui-css] @fiestaboard/ui answers prefers-reduced-transparency for the row hover with\n" +
      `    .nav-active-hover:hover { background: ${dsOpaqueHover} }\n` +
      "  but that rule is class-scoped and this site's rows take the tint through Infima's\n" +
      `  --ifm-menu-color-background-hover, which the branch in custom.css sets to: ${bridgeOpaqueHover.join(", ") || "(nothing)"}\n` +
      `  Point that branch at ${dsOpaqueHover} so the opaque fill matches the DS's page-surface answer.`,
  );
  process.exit(1);
}
// A Badge tag tint is a PAIR composited over whatever surface the badge landed
// on, and this site forks one.
//
// The three tag variants paint as `bg-tag-x/15` under `text-tag-x-foreground`
// (lifting to /25 when the badge is an anchor being hovered), so the thing the
// label is actually measured against is not a token at all — it is the tint
// composited over the live surface. That is why the pair has to move together,
// and why a consumer cannot fork half of it and stay correct.
//
// @fiestaboard/ui 5.4.0 makes the whole matrix a CI-computed proof (every
// variant x surface x theme x tint, recomputed from theme.css and failed under
// 4.5:1) and names this site while doing it: the "New" badge on the homepage
// pins all three properties to hex literals with `!important`. A hex cannot
// follow a theme and cannot follow a retune, so the fork stops tracking the DS
// the moment either moves — and it does so invisibly, because a forked badge is
// still valid colours on a valid fill, just no longer the design system's.
//
// So: while the DS paints a variant from a `--tag-*` pair, a site rule on that
// badge may not restate its colours as hexes.
//
// The check reads the variant map out of the DS's own bundle rather than
// hard-coding which variants are tag-backed, and it reaches the site's rule
// through the CALL SITE (`<Badge variant=… className={styles.x}>`) rather than
// through a class name spelled here — a class this site owns can be renamed,
// and a guard that stops finding its subject is the failure this file exists to
// prevent. Same reason the map being unparseable is itself an error: no map
// means no variants, which would let the whole check pass by seeing nothing.
const badgeModule = path.join(siteDir, "node_modules/@fiestaboard/ui/dist/components/feedback/badge.js");
const badgeVariantBlock = fs
  .readFileSync(badgeModule, "utf8")
  .match(/variants:\s*\{\s*variant:\s*\{([\s\S]*?)\}\s*\}/)?.[1];
if (!badgeVariantBlock) {
  console.error(
    "[build-fiestaui-css] cannot read Badge's variant map out of @fiestaboard/ui — the tag-tint fork check\n" +
      `  has no subject and would pass by seeing nothing. Re-derive it from ${path.relative(siteDir, badgeModule)}.`,
  );
  process.exit(1);
}
const tagBackedVariants = new Map(
  [...badgeVariantBlock.matchAll(/(\w+):\s*"([^"]*)"/g)]
    .map(([, variant, classes]) => [
      variant,
      [...new Set([...classes.matchAll(/-(tag-[a-z]+)(?:\/|\b)/g)].map(([, t]) => t))],
    ])
    .filter(([, tokens]) => tokens.length > 0),
);

// `<Badge variant="x" className={styles.y}>` — the two attributes in either
// order, so the scan is per-element rather than per-attribute-pair.
const HEX_COLOR_DECL =
  /(?:^|[;{])\s*(color|background|background-color|border|border-color)\s*:\s*[^;}]*#[0-9a-fA-F]{3,8}/;
const forkedTagBadges = [];
for (const file of sources(path.join(siteDir, "src"))) {
  const source = fs.readFileSync(file, "utf8");
  for (const [, element] of source.matchAll(/<Badge\b([^>]*)>/g)) {
    const variant = element.match(/variant=\{?"([^"]+)"\}?/)?.[1];
    const tokens = variant && tagBackedVariants.get(variant);
    if (!tokens) continue;

    // Side two: the tint tokens this variant paints from must still be
    // published. If the DS withdraws one, `bg-tag-x/15` still compiles and
    // still applies — it just resolves to nothing, so the chip loses its field
    // on every surface and this site would need its own colours back.
    const withdrawn = tokens
      .flatMap((t) => [`--${t}`, `--${t}-foreground`])
      .filter((n) => !new RegExp(`${n}:`).test(css));
    if (withdrawn.length > 0) {
      console.error(
        `[build-fiestaui-css] ${path.relative(siteDir, file)} renders <Badge variant="${variant}">, but @fiestaboard/ui\n` +
          `  no longer publishes ${withdrawn.join(", ")}. The variant's utilities still apply and resolve to nothing,\n` +
          "  which is a chip with no field on any surface. This site needs its own treatment for it again.",
      );
      process.exit(1);
    }

    const local = element.match(/className=\{(\w+)\.(\w+)\}/);
    if (!local) continue;
    const specifier = source.match(new RegExp(`import\\s+${local[1]}\\s+from\\s+"([^"]+\\.css)"`))?.[1];
    if (!specifier) continue;
    const modulePath = path.resolve(path.dirname(file), specifier);
    // Comments stripped first, for the same two reasons as the focus scan
    // above: `[^{}]+` before the `{` swallows the paragraph arguing the rule
    // and quotes it back at you instead of the selector, and a rule that had
    // been commented OUT would otherwise read as a live one.
    const module = fs.readFileSync(modulePath, "utf8").replaceAll(/\/\*[\s\S]*?\*\//g, "");
    const rules = [...module.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(
        ([, selector, body]) => new RegExp(`\\.${local[2]}(?![\\w-])`).test(selector) && HEX_COLOR_DECL.test(body),
      )
      .map(([, selector]) => selector.trim().replace(/\s*\n\s*/g, " "));
    for (const selector of rules) {
      forkedTagBadges.push({ file: path.relative(siteDir, modulePath), selector, variant, tokens });
    }
  }
}
if (forkedTagBadges.length > 0) {
  for (const { file, selector, variant, tokens } of forkedTagBadges) {
    console.error(
      `[build-fiestaui-css] ${file} forks a @fiestaboard/ui tag pair into hex literals:\n` +
        `    ${selector}\n` +
        `  It overrides <Badge variant="${variant}">, which the DS paints from ${tokens.map((t) => `--${t}`).join(", ")}\n` +
        "  and its `-foreground` half — a pair 5.4.0 recomputes in CI for every surface, theme and tint.\n" +
        "  A hex follows neither the theme nor a retune, and the divergence renders as perfectly valid\n" +
        "  colours, so nothing else in this pipeline can see it. Drop the override and take the pair.",
    );
  }
  process.exit(1);
}

console.log(`[build-fiestaui-css] wrote ${output} (${result.css.length} bytes)`);
