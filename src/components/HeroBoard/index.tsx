import { DisplayPreview } from "@fiestaboard/ui/components/board/display-preview";
import { ScaledBoardDisplay } from "@fiestaboard/ui/components/board/scaled-board-display";
import { Tabs, TabsList, TabsTrigger } from "@fiestaboard/ui/components/containment/tabs";
import { Button } from "@fiestaboard/ui/components/forms/button";
import { Box } from "@fiestaboard/ui/components/layout/box";
import { Text } from "@fiestaboard/ui/components/typography/text";
import type { DeviceModel } from "@fiestaboard/ui/lib/devices";
import { FIESTAPANEL_LED_MATRIX_MODEL, FIESTAPANEL_SPLIT_FLAP_MODEL } from "@site/src/lib/display-models";
import { Pause, Play } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import styles from "./styles.module.css";

/**
 * The homepage hero: one stage, every kind of display FiestaBoard drives.
 *
 * A tab per display technology - split-flap, LED matrix, TV - over a stage
 * that cycles through a few scenes on each. Left alone it walks every scene
 * in order, so the tabs change on their own and a visitor who never touches
 * anything still sees all three kinds. Picking a tab keeps the rotation inside
 * that kind; the pause button stops it altogether.
 *
 * Every board is drawn by FiestaUI, the same renderers the app uses:
 *   - split-flap scenes go through `ScaledBoardDisplay`, with the flap driven
 *     here (see `runScramble`) so it fires on load and on every change;
 *   - LED and TV scenes go through `DisplayPreview`, which dispatches on the
 *     device model, animates its own transition when the message changes,
 *     and puts a board on a television with `frame="tv"`.
 *
 * Rendered inside <BrowserOnly> (see src/pages/index.tsx). Respects
 * `prefers-reduced-motion`: no scramble and no fade - content is set directly.
 */

type DisplayKindId = "split_flap" | "led" | "tv";

type SceneBase = {
  /** What the display is showing, e.g. "Market Movers". */
  title: string;
  /** What it is running on, e.g. "Vestaboard Flagship · 22 × 6". */
  label: string;
  message: string;
};

type FlapScene = SceneBase & {
  kind: "split_flap";
  deviceType: "flagship" | "note" | "note_array";
  notesWide?: number;
  notesTall?: number;
};

type LedScene = SceneBase & { kind: "led"; model: "divoom_pixoo64" };

/** FiestaPanel draws on a TV in either look; its models are the ones the
 *  FiestaPanel output plugin declares (FiestaUI ships them as fixtures). */
type TvScene = SceneBase & { kind: "tv"; model: DeviceModel };

type Scene = FlapScene | LedScene | TvScene;

const DISPLAY_KINDS: { id: DisplayKindId; tab: string }[] = [
  { id: "split_flap", tab: "Split-flap" },
  { id: "led", tab: "LED matrix" },
  { id: "tv", tab: "TV" },
];

const SCENES: Scene[] = [
  {
    kind: "split_flap",
    deviceType: "flagship",
    title: "Market Movers",
    label: "Vestaboard Flagship · 22 × 6",
    message:
      "MARKET MOVERS\n{green}AAPL  232.10  +1.24%\n{green}NVDA  121.44  +0.86%\n{red}TSLA  244.90  -2.10%\n{red}BTC   61,204  -1.40%\n{green}S+P   5,712   +0.42%",
  },
  {
    kind: "split_flap",
    deviceType: "flagship",
    title: "Weekly Forecast",
    label: "Vestaboard Flagship · 22 × 6",
    message:
      "SF FORECAST\nMON {yellow} SUNNY     68 54\nTUE {blue} RAIN      61 52\nWED {violet} FOG       59 51\nTHU {yellow} SUNNY     70 55\nFRI {orange} HOT       78 58",
  },
  {
    kind: "split_flap",
    deviceType: "note",
    title: "Game Day",
    label: "Vestaboard Note · 15 × 3",
    message: "{orange}SF 24  {red}LA 17\n4TH QTR   2:41\n{orange}SF BALL 1ST+10",
  },
  {
    kind: "split_flap",
    deviceType: "note_array",
    notesWide: 2,
    notesTall: 1,
    title: "Transit + Markets",
    label: "Vestaboard Note Array · 2 × 1",
    // Two 15-column Notes side by side: each half is laid out to its own 15
    // cells, with a blank column either side of the seam.
    message: [
      "N JUDAH  4 MIN " + " BART    9 MIN",
      "AAPL 232 +1.2% " + " NVDA 121 -0.9%",
      "SURF OB 3-4 FT " + " UV INDEX    4",
    ].join("\n"),
  },
  {
    kind: "led",
    model: "divoom_pixoo64",
    title: "Weather",
    label: "Divoom Pixoo 64 · 64 × 64 LEDs",
    message: "{icon:sun} 72°\nSunny\n\nHigh 78°\nLow  61°\n\n{yellow}{yellow}{orange}{orange}{red}{red}",
  },
  {
    kind: "led",
    model: "divoom_pixoo64",
    title: "Next Train",
    label: "Divoom Pixoo 64 · 64 × 64 LEDs",
    message: "N Judah\n{green: 4 min }\n\nKT\n{yellow: 9 min }\n\nBART\n{red: 14 min }",
  },
  {
    kind: "led",
    model: "divoom_pixoo64",
    title: "Markets",
    label: "Divoom Pixoo 64 · 64 × 64 LEDs",
    message: "AAPL\n{green: +1.24% }\n\nNVDA\n{green: +0.86% }\n\nTSLA\n{red: -2.10% }",
  },
  {
    kind: "tv",
    model: FIESTAPANEL_SPLIT_FLAP_MODEL,
    title: "Morning Dashboard",
    label: "FiestaPanel on a 55″ TV · 29 × 12",
    message: [
      "",
      "  GOOD MORNING",
      "",
      "  {yellow} 62F CLEAR        UV 4",
      "  {blue} OCEAN BEACH    3-4 FT",
      "",
      "  N JUDAH            4 MIN",
      "  KT                 9 MIN",
      "",
      "  {green} AAPL  232.10   +1.24%",
      "  {red} TSLA  244.90   -2.10%",
    ].join("\n"),
  },
  {
    kind: "tv",
    model: FIESTAPANEL_LED_MATRIX_MODEL,
    title: "Game Day",
    label: "FiestaPanel on a 55″ TV · LED look",
    message:
      "\n   Game Day\n\n   {orange:SF}  24   {red:LA}  17\n\n   4th Qtr   2:41\n   SF ball 1st & 10\n\n   {63}{63}{64}{64}{65}{65}{66}{66}{67}{67}{68}{68}",
  },
];

const ROTATE_MS = 5200; // time each scene is shown
const FADE_MS = 380; // fade-out before swapping displays
const FRAME_MS = 45; // scramble frame interval

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-:%";
const COLORS = ["{red}", "{orange}", "{yellow}", "{green}", "{blue}", "{violet}"];

/**
 * Split a row into board cells the way FiestaUI's renderer does: a `{color}`
 * token is one cell (a color tile), every other character is one cell.
 */
function toCells(row: string): string[] {
  return row.match(/\{[^}]+\}|[\s\S]/g) ?? [];
}

/**
 * Run the split-flap scramble for a message, calling `onFrame` with each
 * frame. Cell (row r, col c) locks to its final value at frame
 * 4 + c*0.8 + r*1.6 + rand(0..7); until then it shows a random value of its
 * own kind - color tiles flap through colors, characters through glyphs.
 */
function runScramble(message: string, onFrame: (frame: string) => void): ReturnType<typeof setInterval> {
  const rows = message.split("\n").map(toCells);
  const settleAt = rows.map((cells, ri) => cells.map((_, ci) => 4 + ci * 0.8 + ri * 1.6 + Math.random() * 7));
  const randomCell = (cell: string) =>
    cell.startsWith("{")
      ? COLORS[Math.floor(Math.random() * COLORS.length)]
      : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

  let frame = 0;
  const render = () => {
    frame += 1;
    let done = true;
    const out = rows
      .map((cells, ri) =>
        cells
          .map((cell, ci) => {
            if (frame >= settleAt[ri][ci]) return cell;
            done = false;
            return randomCell(cell);
          })
          .join(""),
      )
      .join("\n");
    onFrame(out);
    if (done) {
      clearInterval(interval);
      onFrame(message);
    }
  };
  render(); // first scrambled frame immediately, so nothing pops in
  const interval = setInterval(render, FRAME_MS);
  return interval;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** The next scene: the following one overall, or within `pinned` when a tab is pinned. */
function nextScene(current: number, pinned: DisplayKindId | null): number {
  for (let step = 1; step <= SCENES.length; step++) {
    const candidate = (current + step) % SCENES.length;
    if (!pinned || SCENES[candidate].kind === pinned) return candidate;
  }
  return current;
}

function SceneDisplay({ scene, message, reduceMotion }: { scene: Scene; message: string; reduceMotion: boolean }) {
  switch (scene.kind) {
    case "split_flap":
      return (
        <ScaledBoardDisplay
          message={message}
          deviceType={scene.deviceType}
          notesWide={scene.notesWide}
          notesTall={scene.notesTall}
          size="md"
          animationsEnabled={false}
        />
      );
    case "led":
      return (
        <Box className={styles.ledSquare}>
          <DisplayPreview
            model={scene.model}
            message={message}
            letterCase="mixed"
            font="5x7"
            transition={reduceMotion ? "none" : "wipe"}
            previewLabel={`${scene.title} on a ${scene.label}`}
          />
        </Box>
      );
    case "tv":
      return (
        <Box className={styles.tv}>
          <DisplayPreview
            model={scene.model}
            message={message}
            frame="tv"
            tv={{ diagonalInches: 55, stand: true }}
            animated={!reduceMotion}
            letterCase="mixed"
            transition={scene.model.technology === "led_matrix" && !reduceMotion ? "dissolve" : undefined}
            previewLabel={`${scene.title} on a ${scene.label}`}
          />
        </Box>
      );
  }
}

export default function HeroBoard(): ReactNode {
  const [shown, setShown] = useState(0);
  const [message, setMessage] = useState(() => SCENES[0].message);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [pinned, setPinned] = useState<DisplayKindId | null>(null);

  const shownRef = useRef(shown);
  const scrambleTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reduceMotion = useRef(false);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  /**
   * Show scene `index`. A change of display kind fades out, swaps the device
   * while hidden and fades back in; a new message on the same kind of display
   * changes in place, so the display's own transition is what you see. A
   * split-flap message always flaps in through the scramble.
   */
  const show = (index: number) => {
    const scene = SCENES[index];
    const previous = SCENES[shownRef.current];
    clearInterval(scrambleTimer.current);
    clearTimeout(fadeTimer.current);
    const swapIn = () => {
      setShown(index);
      shownRef.current = index;
      if (scene.kind === "split_flap" && !reduceMotion.current) {
        scrambleTimer.current = runScramble(scene.message, setMessage);
      } else {
        setMessage(scene.message);
      }
    };
    const sameDevice =
      previous.kind === scene.kind &&
      (previous.kind === "split_flap"
        ? previous.deviceType === (scene as FlapScene).deviceType &&
          previous.notesWide === (scene as FlapScene).notesWide
        : previous.model === (scene as LedScene | TvScene).model);
    if (reduceMotion.current || sameDevice) {
      swapIn();
      return;
    }
    setVisible(false);
    fadeTimer.current = setTimeout(() => {
      swapIn();
      setVisible(true);
    }, FADE_MS);
  };

  // The opening board flaps in on load.
  useEffect(() => {
    reduceMotion.current = prefersReducedMotion();
    if (reduceMotion.current) return;
    scrambleTimer.current = runScramble(SCENES[0].message, setMessage);
    return () => clearInterval(scrambleTimer.current);
  }, []);

  // The rotation, rebuilt when the visitor pauses, resumes or pins a tab.
  useEffect(() => {
    if (paused) return;
    const cycle = setInterval(() => show(nextScene(shownRef.current, pinned)), ROTATE_MS);
    // Only the interval stops here: a fade already under way finishes, so
    // pausing - or picking a tab, which starts a fade and re-pins the
    // rotation in the same render - never strands the stage half-faded or
    // drops the scene that was asked for.
    return () => clearInterval(cycle);
  }, [paused, pinned]);

  useEffect(
    () => () => {
      clearInterval(scrambleTimer.current);
      clearTimeout(fadeTimer.current);
    },
    [],
  );

  const scene = SCENES[shown];

  const pickKind = (value: unknown) => {
    const kind = value as DisplayKindId;
    setPinned(kind);
    if (SCENES[shownRef.current].kind !== kind) show(SCENES.findIndex((s) => s.kind === kind));
  };

  return (
    <Box className={styles.stage}>
      <Tabs value={scene.kind} onValueChange={pickKind}>
        <TabsList aria-label="Display type" className={styles.tabs}>
          {DISPLAY_KINDS.map((kind) => (
            <TabsTrigger key={kind.id} value={kind.id}>
              {kind.tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Box className={styles.frame} data-visible={visible} data-kind={scene.kind}>
        <SceneDisplay scene={scene} message={message} reduceMotion={reduceMotion.current} />
      </Box>
      <Box className={styles.captionRow}>
        <Box className={styles.caption} data-visible={visible}>
          <Text as="span" className={styles.captionTitle}>
            {scene.title}
          </Text>
          <Text as="span" className={styles.captionMeta}>
            {scene.label}
          </Text>
        </Box>
        <Button
          variant="ghost"
          size="icon-sm"
          className={styles.pauseButton}
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Resume display rotation" : "Pause display rotation"}
        >
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        </Button>
      </Box>
    </Box>
  );
}
