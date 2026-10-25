import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import versions from "./versions.json";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// PR-mode build: only compile the latest documented version. CI uses this on
// PRs (DOCS_PR_MODE=1) so docs builds don't recompile historical version
// snapshots that haven't changed.
//
// Deploy builds are capped to the most recent minors: one snapshot exists per
// minor release, so the full set grows without bound (57 as of 7.3) and
// building all of them exhausts the Node heap - deploys OOMed from
// 2026-06-16 to 2026-07-18. Older snapshots stay in versioned_docs/ but are
// not built or served.
const isPRMode = process.env.DOCS_PR_MODE === "1";
const DEPLOY_VERSION_CAP = 12;
const onlyIncludeVersions =
  versions.length > 0 ? (isPRMode ? [versions[0]] : versions.slice(0, DEPLOY_VERSION_CAP)) : undefined;

// URL prefixes that used to serve docs but no longer exist, redirected to the
// current docs at the same path. GitHub Pages can't emit HTTP 301s, so
// plugin-client-redirects writes a stub page at each old URL (instant
// meta-refresh + canonical link - treated as a permanent redirect by search
// engines):
// - version snapshots older than DEPLOY_VERSION_CAP are no longer built, but
//   their URLs were indexed while they were live; slice(CAP) keeps this list
//   in sync as future releases push versions off the cap
// - the "Next" (unversioned) docs were served at /docs/next/ until v2.11
// - "latest" is an evergreen alias: /docs/latest/<page> always forwards to
//   the current docs at /docs/<page>
// Pages of the retired docs/plugins section (removed 2026-10), redirected to
// the Plugin Directory at /plugins.
const LEGACY_PLUGIN_DOCS = [
  "overview",
  "configuration",
  "air-fog",
  "baywheels",
  "countdown",
  "date-time",
  "disney-parks",
  "entertainment",
  "guest-wifi",
  "home-assistant",
  "last-fm",
  "muni",
  "nearby-aircraft",
  "plex",
  "random",
  "shopify",
  "sports-scores",
  "spotify",
  "star-trek-quotes",
  "stardate",
  "stocks",
  "sun-art",
  "surf",
  "traffic",
  "transit",
  "visual-clock",
  "weather",
  "wsdot",
];

const redirectedDocsPrefixes = [...versions.slice(DEPLOY_VERSION_CAP), "next", "latest"];

// Latest version gets a "(latest)" dropdown label; every other built version
// gets noIndex so search engines only index the current docs (noIndex pages
// are also excluded from the sitemap).
const builtVersions = onlyIncludeVersions ?? versions;
const versionsConfig = Object.fromEntries(
  builtVersions.map((v) => [v, v === versions[0] ? { label: `${v} (latest)` } : { noIndex: true }]),
);

const config: Config = {
  clientModules: ["./src/clientModules/versionSession.ts"],

  title: "FiestaBoard",
  tagline: "Your data, on every display in the room",
  favicon: "img/favicon.ico",

  // Brand lockups are canonical in the product repo
  // (Fiestaboard/FiestaBoard assets/img/branding/); static/img/branding/ is a
  // synced copy (scripts/pull-docs.mjs) serving them at /img/branding/*
  // (navbar logo below).
  staticDirectories: ["static"],

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://fiestaboard.app",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  organizationName: "Fiestaboard",
  projectName: "fiestaboard.github.io",

  onBrokenLinks: "throw",

  markdown: {
    // Docusaurus 3.10's `future.v4` flips mdx1CompatDisabledByDefault, but our
    // docs/ and versioned_docs/ are synced snapshots that use HTML comments
    // (incl. `<!-- truncate -->`); keep MDX v1 compat until the source
    // markdown in Fiestaboard/FiestaBoard is migrated.
    mdx1Compat: {
      comments: true,
      admonitions: true,
      headingIds: true,
    },
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang.
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  headTags: [
    {
      tagName: "meta",
      attributes: {
        name: "keywords",
        content:
          "split-flap display, split-flap display software, dashboard, Vestaboard, Vestaboard software, Vestaboard app, Vestaboard dashboard, Vestaboard Home Assistant, Vestaboard plugins, best software for Vestaboard, LED matrix display, Divoom Pixoo 64, Pixoo dashboard, TV dashboard, TV information display, Apple TV dashboard, Android TV dashboard, weather display, stocks display, sports scores, Docker, Raspberry Pi, home automation, smart display, open source, self-hosted, WYSIWYG editor, display scheduler, IoT display, transit times, surf report, Home Assistant display, split-flap display app, display plugins, FiestaBoard",
      },
    },
    {
      tagName: "meta",
      attributes: {
        name: "author",
        content: "FiestaBoard",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "canonical",
        href: "https://fiestaboard.app",
      },
    },
    {
      tagName: "script",
      attributes: {
        type: "application/ld+json",
      },
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "FiestaBoard",
        alternateName: [
          "FiestaBoard Split-Flap Display Software",
          "FiestaBoard LED and TV Dashboard",
          "FiestaBoard Dashboard",
        ],
        description:
          "Open-source software that puts live data on split-flap boards (Vestaboard Flagship, Note and Note arrays), LED matrices (Divoom Pixoo 64) and any TV with a web browser. Plugins, scheduling, and a visual page editor.",
        url: "https://fiestaboard.app",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Linux, macOS, Windows",
        license: "https://opensource.org/licenses/MIT",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList:
          "Split-flap, LED matrix and TV displays, Output plugins for new displays, WYSIWYG page editor, Schedule mode, 60+ plugins, Docker deployment, Raspberry Pi support, Weather display, Stock ticker, Sports scores, Transit times, Home Assistant integration",
        screenshot: "https://fiestaboard.app/img/web-ui-home.png",
        softwareRequirements: "Docker and Docker Compose",
        codeRepository: "https://github.com/Fiestaboard/FiestaBoard",
        sourceOrganization: {
          "@type": "Organization",
          name: "FiestaBoard",
          url: "https://github.com/Fiestaboard/FiestaBoard",
        },
      }),
    },
    {
      tagName: "script",
      attributes: {
        type: "application/ld+json",
      },
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is FiestaBoard?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FiestaBoard is free, open-source software that puts live data on the displays around you: split-flap boards like Vestaboard, LED matrices like the Divoom Pixoo 64, and any TV with a web browser. It adds 60+ data plugins, a visual page editor, and scheduling.",
            },
          },
          {
            "@type": "Question",
            name: "Is FiestaBoard free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. FiestaBoard is completely free and open source under the MIT license. There are no subscriptions, paid tiers, or usage limits.",
            },
          },
          {
            "@type": "Question",
            name: "How do I install FiestaBoard?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Install FiestaBoard with FiestaPi on a dedicated Raspberry Pi, the beta add-on for Home Assistant OS or Supervised, or Docker Compose on a compatible computer, NAS or home server. The installation page helps you choose a setup and links to its guide.",
            },
          },
          {
            "@type": "Question",
            name: "What can FiestaBoard show on my display?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FiestaBoard has 60+ plugins for weather, stocks, sports scores, transit times, Disney park wait times, aircraft tracking, surf conditions, Home Assistant integration, and more. Many plugins require no API key.",
            },
          },
          {
            "@type": "Question",
            name: "Which displays does FiestaBoard support?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FiestaBoard drives split-flap boards (Vestaboard Flagship, Note and Note arrays), LED matrices (Divoom Pixoo 64), and any TV or screen with a web browser through FiestaPanel. Native Apple TV and Android TV apps are coming soon. Every display is an output plugin, so new hardware can be added without changing FiestaBoard itself.",
            },
          },
          {
            "@type": "Question",
            name: "Does FiestaBoard work with Vestaboard?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. FiestaBoard is compatible with Vestaboard Flagship (22x6), Vestaboard Note (15x3) and Note arrays. It connects via the Vestaboard Local API (recommended, supports animations) or the Vestaboard Cloud API (works remotely). FiestaBoard runs alongside the official Vestaboard app.",
            },
          },
        ],
      }),
    },
  ],

  plugins: [
    [
      "@sablier/docusaurus-plugin-llms",
      {
        // Generate from the snapshot that /docs/ actually serves - the
        // working docs/ dir can describe unreleased features between
        // releases. versions[0] keeps this on the latest snapshot as
        // releases ship.
        docsDir: `versioned_docs/version-${versions[0]}`,
        pathTransformation: {
          ignorePaths: ["versioned_docs", `version-${versions[0]}`],
        },
        title: "FiestaBoard",
        description:
          "Open-source software for split-flap boards (Vestaboard), LED matrices (Divoom Pixoo 64) and TVs. Plugins, scheduling, and a visual page editor for every display.",
        version: versions[0],
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        includeOrder: [
          "**/intro.md",
          "**/setup/**",
          "**/features/**",
          "**/deployment/**",
          "**/reference/**",
          "**/troubleshooting.md",
        ],
      },
    ],
    [
      "@docusaurus/plugin-client-redirects",
      {
        // Pages that were deleted outright (not just moved off the version
        // cap), pointing at the page that absorbed their content.
        redirects: [
          {
            from: ["/docs/setup/split-flap-display-software", "/docs/next/setup/split-flap-display-software"],
            to: "/docs/intro",
          },
          // The retired secret-encryption helper guide has no same-path
          // successor. Preserve it as older snapshots leave the build cap.
          {
            from: redirectedDocsPrefixes.map((prefix) => `/docs/${prefix}/setup/secret-encryption`),
            to: "/docs/setup/api-keys",
          },
          // Bare section roots have no route of their own: /docs itself and
          // the bare form of every redirected prefix (/docs/latest,
          // /docs/next, /docs/<retired-version>) land on the docs home page.
          {
            from: ["/docs", ...redirectedDocsPrefixes.map((prefix) => `/docs/${prefix}`)],
            to: "/docs/intro",
          },
          // Bare roots of still-served older versions land on that version's
          // home page (builtVersions is latest-only in PR mode, so these
          // entries only exist in deploy builds where the target routes do).
          ...builtVersions
            .filter((v) => v !== versions[0])
            .map((v) => ({ from: `/docs/${v}`, to: `/docs/${v}/intro` })),
          // /docs/category/* generated-index pages existed while the sidebar
          // was autogenerated (2026-02-15 → #295 on 2026-02-22); each one
          // forwards to its section's entry page.
          { from: "/docs/category/setup", to: "/docs/setup/quick-start" },
          { from: "/docs/category/plugins", to: "/plugins" },
          { from: "/docs/category/features", to: "/docs/features/page-editor" },
          { from: "/docs/category/development", to: "/docs/development/contributing" },
          { from: "/docs/category/deployment", to: "/docs/deployment/production" },
          { from: "/docs/category/reference", to: "/docs/reference/api-endpoints" },
          // The hand-written docs/plugins section was removed in favor of the
          // generated Plugin Directory. Its pages stay live while an older
          // snapshot is still the latest version (the plugin skips redirects
          // whose `from` is an existing route), then forward here.
          {
            from: LEGACY_PLUGIN_DOCS.map((page) => `/docs/plugins/${page}`),
            to: "/plugins",
          },
        ],
        // Map current docs routes to their retired-prefix ancestors.
        // Retired pages without a same-path successor need an explicit
        // redirect above so leaving the build cap does not drop their URLs.
        createRedirects(existingPath: string) {
          const match = existingPath.match(/^\/docs\/(.+)$/);
          if (!match) return undefined;
          // Skip routes of still-served older versions (/docs/8.11/...)
          if (/^\d+\.\d+\//.test(match[1])) return undefined;
          return redirectedDocsPrefixes.map((prefix) => `/docs/${prefix}/${match[1]}`);
        },
      },
    ],
  ],

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: "/docs",
      },
    ],
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          // Current-release markdown is canonical in Fiestaboard/FiestaBoard
          // (docs/); the local docs/ tree is a synced copy (published pages
          // only — docs/internal/ never syncs) and is what
          // `docusaurus docs:version` snapshots. It is NOT built directly
          // (includeCurrentVersion: false) — the site serves snapshots only.
          path: "docs",
          sidebarPath: "./sidebars.ts",
          // "Edit this page" targets this repo: Docusaurus appends the doc's
          // path relative to the site dir (docs/… or versioned_docs/…), and
          // since the cutover those trees live here, not in
          // Fiestaboard/FiestaBoard/docs-site/ (which no longer exists).
          editUrl: "https://github.com/Fiestaboard/fiestaboard.github.io/tree/main/",
          includeCurrentVersion: false,
          versions: versionsConfig,
          ...(onlyIncludeVersions ? { onlyIncludeVersions } : {}),
        },
        blog: {
          blogTitle: "FiestaBoard Blog",
          blogDescription: "News, release announcements, and project updates from FiestaBoard",
          showReadingTime: true,
          blogSidebarTitle: "Recent posts",
          onUntruncatedBlogPosts: "throw",
          feedOptions: {
            type: ["rss", "atom"],
            title: "FiestaBoard Blog",
            description: "News, release announcements, and project updates from FiestaBoard",
            copyright: `Copyright © ${new Date().getFullYear()} FiestaBoard.`,
          },
        },
        theme: {
          // fiestaui.generated.css (precompiled DS tokens + Tailwind utilities,
          // built by `npm run build:css`) loads first so custom.css can bridge
          // Infima variables onto the DS tokens.
          customCss: ["./src/css/fiestaui.generated.css", "./src/css/app-calendar.css", "./src/css/custom.css"],
        },
        gtag: {
          trackingID: "G-5D2S6D6PNC",
          anonymizeIP: true,
        },
        sitemap: {
          lastmod: "date",
          changefreq: "weekly",
          priority: 0.5,
          filename: "sitemap.xml",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/logo.png",
    metadata: [
      {
        name: "description",
        content:
          "FiestaBoard is free, open-source software for split-flap boards, LED matrices and TVs. Add weather, stocks, sports scores, transit times, and more with 60+ plugins, a visual editor, and scheduling. Compatible with Vestaboard and Divoom Pixoo 64.",
      },
      // og:title/og:description/og:image/og:type are emitted per-page by
      // Docusaurus (blog posts get og:type=article + their own social card);
      // only add tags here that have no per-page counterpart, or they win
      // over the page-specific ones in social scrapers.
      { property: "og:site_name", content: "FiestaBoard" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      logo: {
        alt: "FiestaBoard Logo",
        src: "img/branding/logo-lockup-light.png",
        srcDark: "img/branding/logo-lockup-dark.png",
        style: { height: "48px" },
      },
      items: [
        {
          to: "/installation",
          label: "Install",
          position: "left",
        },
        {
          type: "dropdown",
          label: "Documentation",
          position: "left",
          items: [
            { type: "doc", docId: "intro", label: "Getting Started" },
            { type: "doc", docId: "setup/quick-start", label: "Setup" },
            { type: "doc", docId: "features/page-editor", label: "Features" },
            { type: "doc", docId: "deployment/production", label: "Deployment" },
            { type: "doc", docId: "development/contributing", label: "Development" },
            { type: "doc", docId: "reference/api-endpoints", label: "API Reference" },
            { type: "doc", docId: "troubleshooting", label: "Troubleshooting" },
          ],
        },
        {
          to: "/plugins",
          label: "Plugins",
          position: "left",
        },
        {
          to: "/stats",
          label: "Stats",
          position: "left",
        },
        {
          to: "/blog",
          label: "Blog",
          position: "left",
        },
        // The three external links collapse to brand icons as the bar
        // tightens (see "External navbar links" in src/css/custom.css) -
        // the site nav (Documentation/Plugins/Stats/Blog) keeps its labels.
        {
          href: "https://hub.docker.com/r/fiestaboard/fiestaboard",
          label: "Docker Hub",
          position: "right",
          className: "navbar-ext-link navbar-ext-dockerhub",
        },
        {
          href: "https://discord.gg/2GAqKnRF6h",
          label: "Discord",
          position: "right",
          className: "navbar-ext-link navbar-ext-discord",
        },
        {
          href: "https://github.com/Fiestaboard/FiestaBoard",
          label: "GitHub",
          position: "right",
          className: "navbar-ext-link navbar-ext-github",
        },
      ],
    },
    footer: {
      // "light" so the footer follows the FiestaUI token bridge (page
      // background + muted links) instead of Infima's fixed dark palette.
      style: "light",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Install",
              to: "/installation",
            },
            {
              label: "Getting Started",
              to: "/docs/intro",
            },
            {
              label: "Setup Guide",
              to: "/docs/setup/quick-start",
            },
            {
              label: "Plugin Directory",
              to: "/plugins",
            },
            {
              label: "Plugin Stats",
              to: "/stats",
            },
            {
              label: "Versions",
              to: "/versions",
            },
          ],
        },
        {
          title: "Features",
          items: [
            {
              label: "Page Editor",
              to: "/docs/features/page-editor",
            },
            {
              label: "Schedule Mode",
              to: "/docs/features/schedule",
            },
            {
              label: "API Reference",
              to: "/docs/reference/api-endpoints",
            },
            {
              label: "Troubleshooting",
              to: "/docs/troubleshooting",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Blog",
              to: "/blog",
            },
            {
              label: "Docker Hub",
              href: "https://hub.docker.com/r/fiestaboard/fiestaboard",
            },
            {
              label: "Discord",
              href: "https://discord.gg/2GAqKnRF6h",
            },
            {
              label: "GitHub",
              href: "https://github.com/Fiestaboard/FiestaBoard",
            },
            {
              label: "Issues",
              href: "https://github.com/Fiestaboard/FiestaBoard/issues",
            },
            {
              label: "Contributing",
              to: "/docs/development/contributing",
            },
            {
              label: "MIT License",
              href: "https://github.com/Fiestaboard/FiestaBoard/blob/main/LICENSE",
            },
          ],
        },
        {
          title: "Support",
          items: [
            {
              label: "Buy a Vestaboard ($200 off)",
              href: "https://fiestaboard.app/buyavestaboard",
            },
            {
              label: "Buy Me a Coffee",
              href: "https://www.buymeacoffee.com/fiestaboard",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} FiestaBoard. Made with ❤️ in San Francisco.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
