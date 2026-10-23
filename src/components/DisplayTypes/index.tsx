import BrowserOnly from "@docusaurus/BrowserOnly";
import Link from "@docusaurus/Link";
import { DisplayPreview } from "@fiestaboard/ui/components/board/display-preview";
import { ScaledBoardDisplay } from "@fiestaboard/ui/components/board/scaled-board-display";
import { Badge } from "@fiestaboard/ui/components/feedback/badge";
import { Button } from "@fiestaboard/ui/components/forms/button";
import { Box } from "@fiestaboard/ui/components/layout/box";
import { Heading } from "@fiestaboard/ui/components/typography/heading";
import { Text } from "@fiestaboard/ui/components/typography/text";
import type { DeviceModelRef } from "@fiestaboard/ui/lib/devices";
import { FIESTAPANEL_SPLIT_FLAP_MODEL } from "@site/src/lib/display-models";
import type { ReactNode } from "react";

import styles from "./styles.module.css";

/**
 * "Every kind of display": one card per display technology FiestaBoard
 * drives, each showing the same forecast drawn the way that display draws it.
 * Same data, three renderers - which is the point the section makes.
 *
 * Badges describe state only ("New", "Coming soon"); device names live in the
 * copy, never in a badge.
 */

type DisplayCard = {
  title: string;
  /** A state badge, when the display has one worth calling out. */
  badge?: { label: string; variant: "success" | "secondary" };
  description: ReactNode;
  devices: string;
  preview: { model: DeviceModelRef; message: string; frame?: "tv"; letterCase?: "mixed" };
  previewLabel: string;
  link: { label: string; to: string };
};

const CARDS: DisplayCard[] = [
  {
    title: "Split-flap",
    description:
      "Mechanical flaps that clatter into place. Every page lands the way it would on an airport departures board.",
    devices: "Vestaboard Flagship, Note, and Note arrays",
    preview: {
      model: "vestaboard_flagship",
      message: "SF WEATHER\n\n{yellow} 72F  SUNNY\n\nHIGH 78    LOW 61\nUV 4    WIND 8 MPH",
    },
    previewLabel: "A weather forecast on a Vestaboard Flagship",
    link: { label: "Set up a split-flap board", to: "/docs/displays/split-flap" },
  },
  {
    title: "LED matrix",
    badge: { label: "New", variant: "success" },
    description:
      "Bright RGB pixels with icons, mixed-case text, and smooth transitions. Pages are redrawn for the pixel grid, not squeezed onto it.",
    devices: "Divoom Pixoo 64, with more panels arriving as output plugins",
    preview: {
      model: "divoom_pixoo64",
      message: "{icon:sun} 72°\nSunny\n\nHigh 78°\nLow  61°\n\nUV 4\nWind 8",
      letterCase: "mixed",
    },
    previewLabel: "The same forecast on a Divoom Pixoo 64",
    link: { label: "Set up an LED matrix", to: "/docs/displays/led-matrix" },
  },
  {
    title: "TV",
    badge: { label: "Apps coming soon", variant: "secondary" },
    description: (
      <>
        FiestaPanel turns any TV with a web browser into a life-size board, in the split-flap or LED look. Native apps
        for Apple TV and Android TV are on the way.
      </>
    ),
    devices: "Any TV or screen with a web browser",
    preview: {
      model: FIESTAPANEL_SPLIT_FLAP_MODEL,
      frame: "tv",
      message: [
        "",
        "",
        "  SF WEATHER",
        "",
        "  {yellow} 72F SUNNY",
        "",
        "  HIGH 78          LOW 61",
        "  UV 4         WIND 8 MPH",
      ].join("\n"),
    },
    previewLabel: "The same forecast on a TV running FiestaPanel",
    link: { label: "Set up a TV", to: "/docs/displays/tv" },
  },
];

function Card({ title, badge, description, devices, preview, previewLabel, link }: DisplayCard) {
  return (
    <Box className={styles.card}>
      <Box className={styles.preview} data-frame={preview.frame ?? "none"}>
        <BrowserOnly fallback={<Box className={styles.previewFallback} />}>
          {() =>
            // A Flagship goes through ScaledBoardDisplay, which fit-scales the
            // board to its box; DisplayPreview draws split-flap boards at a
            // fixed size. LED and TV previews size themselves to the wrapper.
            preview.model === "vestaboard_flagship" ? (
              <Box className={styles.wide}>
                <ScaledBoardDisplay message={preview.message} deviceType="flagship" size="sm" />
              </Box>
            ) : (
              <Box className={preview.model === "divoom_pixoo64" ? styles.square : styles.wide}>
                <DisplayPreview
                  model={preview.model}
                  message={preview.message}
                  frame={preview.frame}
                  letterCase={preview.letterCase}
                  font={preview.model === "divoom_pixoo64" ? "5x7" : undefined}
                  tv={preview.frame === "tv" ? { diagonalInches: 55 } : undefined}
                  previewLabel={previewLabel}
                />
              </Box>
            )
          }
        </BrowserOnly>
      </Box>
      <Box className={styles.titleRow}>
        <Heading level={3} className={styles.title}>
          {title}
        </Heading>
        {badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
      </Box>
      <Text className={styles.body}>{description}</Text>
      <Text className={styles.devices}>{devices}</Text>
      {/* A router Link, so the build's broken-link check covers it; the
          Button `link` variant is TextLink's pigment and underline. */}
      <Button variant="link" asChild className={styles.link}>
        <Link to={link.to}>{link.label} →</Link>
      </Button>
    </Box>
  );
}

export default function DisplayTypes(): ReactNode {
  return (
    <>
      <Box as="section" className={styles.section}>
        <Box className={styles.inner}>
          <Heading level={2} className={styles.sectionTitle}>
            One FiestaBoard, every kind of display
          </Heading>
          <Text className={styles.sectionSubtitle}>
            Make a page once. FiestaBoard draws it the way each display needs: flaps, pixels, or the TV on your wall.
          </Text>
          <Box className={styles.grid}>
            {CARDS.map((card) => (
              <Card key={card.title} {...card} />
            ))}
          </Box>
        </Box>
      </Box>

      <Box as="section" className={styles.sectionMuted}>
        <Box className={styles.byod}>
          <Box className={styles.byodCopy}>
            <Heading level={2} className={styles.byodTitle}>
              Bring your own display
            </Heading>
            <Text className={styles.byodBody}>
              Every display FiestaBoard drives is an output plugin, including the Vestaboard. Write one for your
              hardware, have your screen pull frames from FiestaBoard, or read the data straight from the API and MCP
              server.
            </Text>
          </Box>
          <Box className={styles.byodActions}>
            <Button variant="secondary" asChild>
              <Link to="/docs/development/output-plugins">Write an output plugin</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/docs/development/output-stream-api">Pull frames instead</Link>
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
