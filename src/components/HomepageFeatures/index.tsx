import BrowserOnly from "@docusaurus/BrowserOnly";
import Link from "@docusaurus/Link";
import { useReducedMotion } from "@fiestaboard/ui/components/board/reduced-motion";
import { ScaledBoardDisplay } from "@fiestaboard/ui/components/board/scaled-board-display";
import { Badge } from "@fiestaboard/ui/components/feedback/badge";
import { Button } from "@fiestaboard/ui/components/forms/button";
import { Box } from "@fiestaboard/ui/components/layout/box";
import { Code } from "@fiestaboard/ui/components/typography/code";
import { Heading } from "@fiestaboard/ui/components/typography/heading";
import { Text } from "@fiestaboard/ui/components/typography/text";
import { TextLink } from "@fiestaboard/ui/components/typography/text-link";
import { BOARD_CHARS } from "@fiestaboard/ui/lib/board-characters";
import AppShot from "@site/src/components/AppShot";
import type { LucideIcon } from "lucide-react";
import { Calendar, Container, Heart, Palette, Pencil, Puzzle } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { pluginPreviews, plugins, previewMessage } from "../../plugin-data";
import styles from "./styles.module.css";

/** Plugins that ship inside the container (countdown, date_time). */
const BUNDLED_PLUGIN_COUNT = 2;

/**
 * Each feature is drawn as a single split-flap tile: the app's own lucide icon,
 * blown up to glyph size, in a hardware board color, on a black flap face with
 * the seam running across it.
 *
 * Why a tile and not just a tinted icon: the board already renders one glyph in
 * a board color rather than the default off-white - `♥` comes out
 * `BOARD_COLORS.red` in FiestaUI's board display. A colored icon on a black flap
 * is that treatment, scaled up, so the grid reads as the board spelling out its
 * own feature set. It also fixes what was actually broken here - six pixel-art
 * PNGs at six different aspect ratios (220x128 through 240x230) that shared no
 * silhouette, no palette, and no baseline once `height: 92px` scaled each one to
 * a different width.
 *
 * `color` walks the palette in hardware code order - 63 red through 68 violet
 * (COLOR_CODE_MAP), the order the color guide documents - so six features spend
 * the six chromatic tiles exactly once, and the grid reads as a run of the
 * palette. The assignment is not semantic: none of these features map onto the
 * red-alert / green-good conventions, and pretending otherwise would be noise.
 * Adding a seventh feature means picking a second use of a color, not white or
 * black - a white or black flap has no glyph contrast left.
 */
type FeatureItem = {
  title: string;
  Icon: LucideIcon;
  /** A `--color-board-*` token name: the flap's character color. */
  color: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Plugin Architecture",
    Icon: Puzzle,
    color: "red",
    description:
      "26 built-in plugins for weather, stocks, transit, sports scores, Disney park wait times, ferry schedules, and more. Create your own plugins with our developer guide.",
  },
  {
    title: "WYSIWYG Editor",
    Icon: Pencil,
    color: "orange",
    description:
      "Create pages with a visual editor that shows exactly how content will appear on your board - template variables, colors, and alignment in real time.",
  },
  {
    title: "Schedule Mode",
    Icon: Calendar,
    color: "yellow",
    description:
      "Visual calendar to schedule which pages display when. Set different pages for different times and days, with a default page for gaps.",
  },
  {
    title: "Docker Ready",
    Icon: Container,
    color: "green",
    description:
      "One-command deployment with Docker Compose. Works on Mac, Linux, Windows, and Raspberry Pi. No complex setup required.",
  },
  {
    title: "Highly Customizable",
    Icon: Palette,
    color: "blue",
    description:
      "Create custom pages with multiple data sources. Configure silence schedules, time zones, temperature units, and more.",
  },
  {
    title: "Open Source",
    Icon: Heart,
    color: "violet",
    description:
      "MIT licensed and community-driven. Contribute plugins, report issues, or customize it for your needs. Built with love in San Francisco.",
  },
];

/** Flap frame interval, matching the cadence HeroBoard scrambles at. */
const FRAME_MS = 45;

/**
 * The stretch of the board's character set the tiles rotate through: codes 1-36,
 * which is A-Z then 1-9 and 0. Codes come from FiestaUI's `BOARD_CHARS`, which
 * is indexed by hardware character code and documented as a parity contract with
 * the app and the physical board - so this rotates through the real alphabet,
 * not an invented one. Punctuation (37-62) and the color tiles (63-71) are left
 * out: a color code is a filled panel rather than a glyph, so it would render as
 * a blank flap mid-rotation.
 */
const FLAP_FIRST_CODE = 1;
const FLAP_CODE_COUNT = 36;

/**
 * Minimum frames of spin before any tile is allowed to start landing. Only bites
 * when both observers fire at once - a deep link straight into the section, or a
 * refresh partway down the page - where the settle would otherwise begin on the
 * same frame the spin did and the flap would be over before it registered.
 */
const MIN_SPIN_FRAMES = 6;

/**
 * The flap controller: `spin()` starts the tiles turning and keeps them turning
 * indefinitely; `settle()` arms the landing sweep from wherever the spin has got
 * to; `stop()` tears down.
 *
 * Split in two because the tiles have to already be moving by the time they come
 * into view. A single trigger meant the grid sat showing its icons until it was
 * on screen, so the first thing you saw was the answer, then a shuffle, then the
 * same answer again. Now the spin starts below the fold and the landing is armed
 * separately, once enough of the grid is actually being looked at.
 *
 * Each tile advances one character code per frame from its own start offset - a
 * real flap walks its set in order, and a board's flaps are never all parked on
 * the same letter. Picking the character at random instead repeats and jumps
 * backwards, which the eye reads as a glitch rather than a rotation.
 *
 * Offsets are dealt one per bucket of the character set rather than drawn
 * independently, because independent draws collide: every tile advances at the
 * same rate, so two tiles that happen to start on the same code stay locked to
 * each other for the whole spin, showing the same letter side by side. Across
 * six tiles and 36 codes that is a coin flip on every page load. Bucketing makes
 * the offsets distinct by construction and spreads them over the whole set,
 * while the jitter inside each bucket keeps them off a regular interval.
 *
 * Tile `i` lands at `max(now, MIN_SPIN_FRAMES) + 2 + i * 2 + rand(0..4)` frames.
 * That is HeroBoard's settle curve in shape but not in coefficients: its
 * `4 + c * 0.8 + rand(0..7)` is tuned for a 22-column board where the index term
 * spreads ~17 frames and swamps the jitter, whereas across six tiles it spreads
 * 4 against 7 and the sweep disappears. Widening the index term and narrowing
 * the jitter restores the reading-order sweep at this width, while neighbouring
 * ranges still overlap so it does not look mechanical. Landing takes ~720ms from
 * the moment it is armed.
 *
 * A frame is one entry per tile: a character, or `null` for a tile that has
 * landed. `onFrame(null)` signals every tile down - the grid then renders each
 * card's own icon, which is also what it renders before any of this runs.
 */
function createFlap(count: number, onFrame: (shown: (string | null)[] | null) => void) {
  const bucket = Math.max(1, Math.floor(FLAP_CODE_COUNT / count));
  const startAt = Array.from({ length: count }, (_, i) => i * bucket + Math.floor(Math.random() * bucket));
  let frame = 0;
  let settleAt: number[] | null = null;
  let interval: ReturnType<typeof setInterval> | undefined;
  let done = false;

  const stop = () => {
    if (interval !== undefined) clearInterval(interval);
    interval = undefined;
  };

  const render = () => {
    frame += 1;
    let allLanded = settleAt !== null;
    const shown = Array.from({ length: count }, (_, i) => {
      if (settleAt !== null && frame >= settleAt[i]) return null;
      allLanded = false;
      return BOARD_CHARS[FLAP_FIRST_CODE + ((startAt[i] + frame) % FLAP_CODE_COUNT)];
    });
    onFrame(shown);
    if (allLanded) {
      done = true;
      stop();
      onFrame(null);
    }
  };

  return {
    spin() {
      if (interval !== undefined || done) return;
      render(); // first spun frame immediately, so the grid never shows icons then scrambles
      if (!done) interval = setInterval(render, FRAME_MS);
    },
    settle() {
      if (settleAt !== null || done) return;
      const from = Math.max(frame, MIN_SPIN_FRAMES);
      settleAt = Array.from({ length: count }, (_, i) => from + 2 + i * 2 + Math.random() * 4);
    },
    stop,
  };
}

type HighlightItem = {
  title: string;
  description: ReactNode;
  primary: { label: string; to: string };
  secondary: { label: string; to: string };
};

const HighlightList: HighlightItem[] = [
  {
    title: "FiestaPi - flash a Raspberry Pi, done",
    description: (
      <>
        A pre-built Raspberry Pi OS image with FiestaBoard, Docker, and the self-update sidecar all pre-installed. Flash
        a microSD card with Raspberry Pi Imager, boot your Pi, open <Code>http://fiestapi.local:4420</Code> - no Docker
        setup, no terminal, no config files. Works on Pi 3B, Pi 4, Pi 5, and Pi Zero 2 W.
      </>
    ),
    primary: { label: "FiestaPi Quick Start →", to: "/docs/setup/raspberry-pi" },
    secondary: { label: "Download image", to: "https://github.com/Fiestaboard/FiestaBoard/releases/latest" },
  },
  {
    title: "One-click in-app updates",
    description: (
      <>
        When a new version ships, a banner appears in Settings → System. Click Update Now and FiestaBoard updates itself
        - no SSH, no <Code>docker compose pull</Code>. On for FiestaPi by default; opt in on Docker installs by enabling
        the <Code>fiestaupdater</Code> sidecar.
      </>
    ),
    primary: { label: "How updates work →", to: "/docs/features/updating" },
    secondary: { label: "FiestaUpdater reference", to: "/docs/deployment/fiestaupdater" },
  },
];

type ShowcaseItem = {
  title: string;
  /** Capture name in static/captures — rendered live, not a screenshot. */
  capture: string;
  alt: string;
  description: string;
  link: string;
};

const FeatureShowcaseList: ShowcaseItem[] = [
  {
    title: "Dashboard & Web UI",
    capture: "web-ui-home",
    alt: "FiestaBoard web dashboard showing active display with stock ticker data",
    description: "Monitor your display, manage pages, and configure plugins from a modern web interface.",
    link: "/docs/features/page-editor",
  },
  {
    title: "WYSIWYG Page Editor",
    capture: "page-editor-wysiwyg",
    alt: "FiestaBoard WYSIWYG page editor with visual board preview",
    description:
      "Design your board layouts visually - see exactly how content will appear before sending it to your display.",
    link: "/docs/features/page-editor",
  },
  {
    title: "Visual Scheduling",
    capture: "schedule-calendar",
    alt: "FiestaBoard schedule calendar view with time-based page scheduling",
    description: "Schedule different pages for different times and days with an intuitive calendar interface.",
    link: "/docs/features/schedule",
  },
];

type PluginItem = {
  title: string;
  description: string;
  link: string;
  message: string;
  deviceType: "flagship" | "note" | "note_array";
  notesWide: number;
  notesTall: number;
};

/**
 * Featured plugins: a curated blurb per id; the board content comes from
 * plugin-previews.json (the same data the detail page renders), so the
 * homepage can never drift from the real preview data again. `device`
 * picks which declared shape to showcase - a deliberate mix of flagship
 * dashboards, Note boards, art, quotes, and transit for variety.
 */
const FEATURED_PLUGINS: { id: string; description: string; device?: string }[] = [
  { id: "weather", description: "Current conditions, UV index, high/low temps" },
  { id: "stocks", description: "Real-time stock prices with color indicators" },
  { id: "sun_art", description: "Beautiful time-of-day color patterns" },
  { id: "dad_jokes", description: "A fresh dad joke every refresh", device: "note" },
  { id: "disney_parks_times", description: "Live ride wait times from Disney parks" },
  { id: "moon_phase", description: "Tonight's moon phase and illumination" },
  { id: "visual_clock", description: "Full-screen pixel-art clock display" },
  { id: "star_trek_quotes", description: "Random quotes from TNG, Voyager, DS9" },
  { id: "muni", description: "Real-time SF Muni arrival predictions", device: "note" },
];

const PluginList: PluginItem[] = FEATURED_PLUGINS.flatMap(({ id, description, device }) => {
  const registryEntry = plugins.find((plugin) => plugin.id === id);
  const previews = pluginPreviews[id]?.previews ?? [];
  const board = (device && previews.find((entry) => entry.device_type === device)) || previews[0];
  // Backwards compat: skip quietly if the id ever leaves the registry or seed.
  if (!registryEntry || !board) return [];
  return [
    {
      title: registryEntry.name,
      description,
      link: `/plugins/detail?id=${id}`,
      message: previewMessage(board),
      deviceType: board.device_type ?? "flagship",
      notesWide: board.notes_wide ?? 1,
      notesTall: board.notes_tall ?? 1,
    },
  ];
});


/**
 * `glyph` is the board character this tile is showing mid-rotation; `null` means
 * landed, so it draws its icon. The flap stays this feature's color throughout -
 * only the face changes, which is the one variable a real flap moves.
 */
function FeatureCard({ title, Icon, color, description, glyph }: FeatureItem & { glyph: string | null }) {
  return (
    <Box className={styles.featureCard}>
      {/* Decorative: the flap carries no information the title below doesn't. */}
      <Box className={styles.featureFlap} style={{ "--flap-color": `var(--color-board-${color})` } as CSSProperties}>
        {glyph === null ? (
          <Icon className={styles.featureFlapGlyph} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Text as="span" className={styles.featureFlapChar} aria-hidden="true">
            {glyph}
          </Text>
        )}
      </Box>
      <Box className={styles.featureCardBody}>
        <Heading level={3} className={styles.featureCardTitle}>
          {title}
        </Heading>
        <Text className={styles.featureCardDesc}>{description}</Text>
      </Box>
    </Box>
  );
}

function HighlightCard({ title, description, primary, secondary }: HighlightItem) {
  return (
    <Box className={styles.highlightCard}>
      {/* No className: the "New" chip is the DS `success` tag pair as shipped.
          It used to be overridden here with opaque hexes, on the claim that the
          translucent tint collapsed to ~1.5:1 on the dark card. It does not -
          recomputed from theme.css it is 9.20:1 at the resting fill and 7.18:1
          at the anchor-hover one (7.17 / 6.22 in light), where the hexes that
          replaced it were 7.52:1 and 6.49:1. The fork measured worse than the
          thing it overrode, and a hex cannot follow a retune of the pair;
          @fiestaboard/ui 5.4.0 now recomputes that whole matrix in CI, so there
          is nothing left for a consumer to second-guess. */}
      <Badge variant="success">New</Badge>
      <Heading level={3} className={styles.highlightTitle}>
        {title}
      </Heading>
      <Text className={styles.highlightBody}>{description}</Text>
      <Box className={styles.cardButtons}>
        <Button variant="secondary" size="sm" asChild>
          <Link to={primary.to}>{primary.label}</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to={secondary.to}>{secondary.label}</Link>
        </Button>
      </Box>
    </Box>
  );
}

function ShowcaseRow({ title, capture, alt, description, link, reverse }: ShowcaseItem & { reverse?: boolean }) {
  return (
    <Box className={reverse ? styles.showcaseRowReverse : styles.showcaseRow}>
      <Box className={styles.showcaseImage}>
        {/* The real app, serialised — not a screenshot of it. Follows the
            visitor's theme, stays sharp at any zoom, and cannot go stale
            without the app itself changing. */}
        <AppShot name={capture} alt={alt} />
      </Box>
      <Box className={styles.showcaseContent}>
        <Heading level={3} className={styles.showcaseTitle}>
          {title}
        </Heading>
        <Text className={styles.showcaseDesc}>{description}</Text>
        <TextLink href={link}>Learn More →</TextLink>
      </Box>
    </Box>
  );
}

function PluginCard({ title, description, link, message, deviceType, notesWide, notesTall }: PluginItem) {
  return (
    <Link to={link} className={styles.pluginCard}>
      <Box className={styles.pluginCardBoard}>
        <BrowserOnly fallback={<Box className={styles.pluginBoardFallback} />}>
          {() => (
            <ScaledBoardDisplay
              message={message}
              size="sm"
              deviceType={deviceType}
              notesWide={notesWide}
              notesTall={notesTall}
            />
          )}
        </BrowserOnly>
      </Box>
      <Text className={styles.pluginCardName}>{title}</Text>
      <Text className={styles.pluginCardDesc}>{description}</Text>
    </Link>
  );
}

export default function HomepageFeatures(): ReactNode {
  const pluginCount = plugins.length + BUNDLED_PLUGIN_COUNT;
  const reducedMotion = useReducedMotion();
  const gridRef = useRef<HTMLElement>(null);
  /** Board character each tile is mid-rotation on; null per tile once landed,
      and null overall before the flap runs and after every tile has settled. */
  const [glyphs, setGlyphs] = useState<(string | null)[] | null>(null);

  /**
   * Two triggers, because "already spinning when you get there" and "start
   * landing once you are actually looking" are different moments.
   *
   * `spin` fires early - `rootMargin` pushes the root's bottom edge a quarter of
   * a viewport past the fold, so the tiles are turning before they are on screen
   * and you never catch them sitting on their icons. `land` fires at 40% of the
   * grid visible and arms the settle sweep; until then the tiles just keep
   * turning, however long you linger.
   *
   * They are separate observers rather than one with several thresholds because
   * `rootMargin` inflates the root box that `intersectionRatio` is measured
   * against - sharing it would make "40%" mean 40% of an imaginary taller
   * viewport, and the tiles would start landing early.
   *
   * Nothing here runs on the server or without JS, and that is the point: the
   * grid's resting render is already the finished state, so the flap only ever
   * replaces settled tiles. No `BrowserOnly` wrapper (unlike HeroBoard), no
   * layout shift, and no missing icons if this never fires.
   */
  useEffect(() => {
    if (reducedMotion || typeof IntersectionObserver === "undefined") return;
    const grid = gridRef.current;
    if (!grid) return;

    const flap = createFlap(FeatureList.length, setGlyphs);

    const spin = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        spin.disconnect();
        flap.spin();
      },
      // Bottom edge pushed down a quarter viewport: the grid counts as
      // intersecting while it is still below the fold, which is the whole point.
      { rootMargin: "0px 0px 25% 0px" },
    );

    const land = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry.isIntersecting) return;
        // 40% of the grid on screen - or, when the grid is taller than the
        // viewport and 40% of it is simply unreachable (short viewport, phone in
        // landscape), 40% of the viewport filled by it. Without the second clause
        // the ratio can top out below the threshold and the tiles spin forever.
        const rootHeight = entry.rootBounds?.height ?? 0;
        const fillsViewport = rootHeight > 0 && entry.intersectionRect.height >= rootHeight * 0.4;
        if (entry.intersectionRatio < 0.4 && !fillsViewport) return;
        land.disconnect();
        flap.spin(); // no-op if already spinning; covers landing straight into the section
        flap.settle();
      },
      // Several thresholds, not just 0.4: the callback only fires on a crossing,
      // so a grid whose ratio never reaches 0.4 needs a lower one to give the
      // `fillsViewport` check a chance to run at all.
      { threshold: [0.2, 0.4, 0.7] },
    );

    spin.observe(grid);
    land.observe(grid);
    return () => {
      spin.disconnect();
      land.disconnect();
      flap.stop();
    };
  }, [reducedMotion]);

  return (
    <>
      {/* Feature grid */}
      <Box as="section" className={styles.section}>
        <Box className={styles.inner}>
          <Box className={styles.featureGrid} ref={gridRef}>
            {FeatureList.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} glyph={glyphs?.[index] ?? null} />
            ))}
          </Box>
        </Box>
      </Box>

      {/* What's New */}
      <Box as="section" className={styles.sectionMuted}>
        <Box className={styles.inner}>
          <Heading level={2} className={styles.sectionTitle}>
            What&apos;s New
          </Heading>
          <Text className={styles.sectionSubtitle}>
            The fastest way to run FiestaBoard, and updates without ever touching a terminal
          </Text>
          <Box className={styles.highlightGrid}>
            {HighlightList.map((props) => (
              <HighlightCard key={props.title} {...props} />
            ))}
          </Box>
        </Box>
      </Box>

      {/* See It in Action */}
      <Box as="section" className={styles.section}>
        <Box className={styles.inner}>
          <Heading level={2} className={styles.sectionTitle}>
            See It in Action
          </Heading>
          <Text className={styles.sectionSubtitle}>A powerful web interface to manage your split-flap display</Text>
          <Box className={styles.showcaseStack}>
            {FeatureShowcaseList.map((props, idx) => (
              <ShowcaseRow key={props.title} {...props} reverse={idx % 2 === 1} />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Plugin grid */}
      <Box as="section" className={styles.sectionMuted}>
        <Box className={styles.inner}>
          <Heading level={2} className={styles.sectionTitle}>
            {pluginCount}+ Plugins and Counting
          </Heading>
          <Text className={styles.sectionSubtitle}>
            From weather and stocks to Disney park wait times - there&apos;s a plugin for everything
          </Text>
          <Box className={styles.pluginGrid}>
            {PluginList.map((props) => (
              <PluginCard key={props.title} {...props} />
            ))}
          </Box>
          <Box className={styles.centerAction}>
            <Button variant="outline" size="lg" asChild>
              <Link to="/plugins">Explore All Plugins</Link>
            </Button>
          </Box>
        </Box>
      </Box>

      {/* CTA */}
      <Box as="section" className={styles.section}>
        <Box className={styles.ctaInner}>
          <Heading level={2} className={styles.sectionTitle}>
            Ready to Get Started?
          </Heading>
          <Text className={styles.ctaSubtitle}>
            FiestaBoard is free, open source, and runs anywhere Docker does. Get up and running in minutes.
          </Text>
          <Box className={styles.centerAction}>
            <Button size="lg" asChild>
              <Link to="/docs/setup/beginners-guide">Beginner&apos;s Guide</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/docs/development/plugin-guide">Build a Plugin</Link>
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
