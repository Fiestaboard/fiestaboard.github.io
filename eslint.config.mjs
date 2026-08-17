import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [".docusaurus/**", "build/**", "node_modules/**", "static/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "simple-import-sort": simpleImportSort,
    },
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        fetch: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        sessionStorage: "readonly",
        localStorage: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
      },
    },
    settings: {
      react: { version: "19" },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "smart"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      // Import FiestaUI components from the module that owns them, never from
      // the package root. Since @fiestaboard/ui 3.2.0 the root barrel also
      // re-exports the TipTap template editor, whose TipTap/CodeMirror peers
      // are declared *optional* — a consumer that doesn't render the editor is
      // not meant to install them. Webpack still has to resolve every import in
      // a barrel it pulls in, so a single `from "@fiestaboard/ui"` anywhere in
      // this site fails the production build with ~29 "Module not found"
      // errors. Deep subpaths keep the editor out of the module graph entirely.
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@fiestaboard/ui",
              message:
                'Import from the owning module instead (e.g. "@fiestaboard/ui/components/layout/box"). The root barrel drags in the TipTap editor, whose optional peer deps this site does not install.',
            },
          ],
        },
      ],
      // @fiestaboard/ui 4.0.0 locked the palette onto the board's six tile
      // colours, and in doing so made `--primary` the literal #f5a623 tile.
      // `variant="brand"` existed only to put that tile on a control while
      // `--primary` was a mustard, so on Button and Badge it is now a
      // character-for-character alias of the default variant — kept for one
      // minor, then removed. Rendering it is already a no-op; leaving it in
      // place is a build break on the next bump.
      "no-restricted-syntax": [
        "error",
        {
          selector: 'JSXAttribute[name.name="variant"][value.value="brand"]',
          message:
            'variant="brand" is a deprecated alias of the default variant since @fiestaboard/ui 4.0.0 and is removed in the next minor. Drop the prop.',
        },
        // `.nav-active-hover` is scoped to FiestaUI's own sidebar RAIL, and as
        // of 4.0.0 its token says so: `--nav-active-hover` went from an indigo
        // tint (`oklch(0.5 0.17 265 / 15%)`, opaque enough to read on any
        // surface) to `oklch(1 0 0 / 14%)` — a white alpha that only lifts a
        // row because the rail sits *below* the page in lightness.
        //
        // This site has no rail. Its sidebar rows sit directly on
        // `--background`, where white/14% composites to 1.015:1 — a 1.5%
        // lightness lift on near-white paper, i.e. no hover at all in light
        // mode. It read 1.242:1 on 3.4.0, and nothing in a build, a typecheck
        // or a route diff can see it go.
        //
        // The active-state classes (`nav-active`, `bg-nav-active`,
        // `text-nav-active-foreground`) are deliberately NOT restricted:
        // `--nav-active` is `--foreground` in light and `--primary` in dark,
        // both of which are opaque and read correctly on this site's page
        // surface. Only the hover tint is rail-relative.
        {
          selector: "Literal[value=/\\bnav-active-hover\\b/]",
          message:
            "`nav-active-hover` is FiestaUI's sidebar-rail hover tint; since 4.0.0 it is a white alpha that composites to 1.015:1 on this site's page surface. Let Infima's own hover rule apply and set --ifm-menu-color-background-hover in custom.css instead.",
        },
      ],
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Design-system enforcement, mirroring web/eslint.config.mjs: the site's own
  // React renders @fiestaboard/ui components, not raw HTML. Allowlisted leaves
  // (svg, canvas, iframe, img, br, em, small, kbd, pre, figure, figcaption, dl,
  // dt, dd, input, hr, blockquote) are simply not listed here.
  //
  // Scoped to src/components and src/pages on purpose. src/theme holds swizzled
  // Docusaurus components, which must mirror upstream's markup and Infima class
  // names to keep their behaviour (`.menu__list-item`, `.pagination-nav__link`,
  // `.clean-btn`); forcing primitives there would break the theme rather than
  // align it. Those files use DS components where the markup is genuinely ours.
  {
    files: ["src/components/**/*.tsx", "src/pages/**/*.tsx"],
    rules: {
      "react/forbid-elements": [
        "error",
        {
          forbid: [
            { element: "div", message: "Use Flex/Stack/Grid for layout, or Box (@fiestaboard/ui)" },
            { element: "span", message: 'Use Text as="span" (@fiestaboard/ui)' },
            { element: "p", message: "Use Text (@fiestaboard/ui)" },
            // `h1` is intentionally absent. The web app forbids it in favour of
            // `PageHeader`, but that is app chrome; FiestaUI's `Heading` covers
            // h2-h4 only, so a docs/marketing page's single h1 has no primitive
            // to move to and keeps its own element.
            { element: "h2", message: "Use Heading level={2} (@fiestaboard/ui)" },
            { element: "h3", message: "Use Heading level={3} (@fiestaboard/ui)" },
            { element: "h4", message: "Use Heading level={4} (@fiestaboard/ui)" },
            { element: "h5", message: "Use Heading (@fiestaboard/ui)" },
            { element: "h6", message: "Use Heading (@fiestaboard/ui)" },
            { element: "ul", message: "Use List (@fiestaboard/ui)" },
            { element: "ol", message: 'Use List as="ol" (@fiestaboard/ui)' },
            { element: "li", message: "Use ListItem (@fiestaboard/ui)" },
            { element: "section", message: 'Use Box as="section" (@fiestaboard/ui)' },
            { element: "main", message: 'Use Box as="main" (@fiestaboard/ui)' },
            { element: "header", message: 'Use Box as="header" (@fiestaboard/ui)' },
            { element: "footer", message: 'Use Box as="footer" (@fiestaboard/ui)' },
            { element: "nav", message: 'Use Box as="nav" (@fiestaboard/ui)' },
            { element: "form", message: 'Use Box as="form" (@fiestaboard/ui)' },
            { element: "table", message: "Use Table (@fiestaboard/ui)" },
            { element: "thead", message: "Use TableHeader (@fiestaboard/ui)" },
            { element: "tbody", message: "Use TableBody (@fiestaboard/ui)" },
            { element: "tr", message: "Use TableRow (@fiestaboard/ui)" },
            { element: "th", message: "Use TableHead (@fiestaboard/ui)" },
            { element: "td", message: "Use TableCell (@fiestaboard/ui)" },
            { element: "button", message: "Use Button (@fiestaboard/ui)" },
            { element: "a", message: "Use TextLink, or Docusaurus Link for navigation (@fiestaboard/ui)" },
            { element: "code", message: "Use Code (@fiestaboard/ui)" },
            { element: "strong", message: 'Use Text as="span" weight="semibold" (@fiestaboard/ui)' },
          ],
        },
      ],
    },
  },
  prettierConfig,
];
