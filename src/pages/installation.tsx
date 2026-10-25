import Link from "@docusaurus/Link";
import { Badge } from "@fiestaboard/ui/components/feedback/badge";
import { Button } from "@fiestaboard/ui/components/forms/button";
import { Box } from "@fiestaboard/ui/components/layout/box";
import { Heading } from "@fiestaboard/ui/components/typography/heading";
import { List, ListItem } from "@fiestaboard/ui/components/typography/list";
import { Text } from "@fiestaboard/ui/components/typography/text";
import AppShot from "@site/src/components/AppShot";
import Layout from "@theme/Layout";
import { ArrowRight, Check, CircuitBoard, House, Server } from "lucide-react";
import type { ReactNode } from "react";

import styles from "./installation.module.css";

const PATHS = [
  {
    title: "Raspberry Pi",
    Icon: CircuitBoard,
    badge: "Recommended",
    fit: "A dedicated home for FiestaBoard",
    description: "Flash FiestaPi, our ready-to-run Pi image. It starts FiestaBoard for you when your Pi boots.",
    needs: ["Raspberry Pi 3B or newer", "microSD card and power supply", "A computer to prepare the card"],
    label: "Set up with FiestaPi",
    to: "/docs/setup/raspberry-pi",
  },
  {
    title: "Docker",
    Icon: Server,
    fit: "Use a computer you already have",
    description:
      "Make room on your NAS, home server or computer. Keep your existing setup and run FiestaBoard with Compose.",
    needs: ["A host that can stay running", "Docker and Docker Compose", "Comfort with a few terminal commands"],
    label: "Set up with Docker",
    to: "/docs/setup/quick-start#alternative-docker-any-computer",
  },
  {
    title: "Home Assistant",
    Icon: House,
    badge: "Beta",
    fit: "For an existing Home Assistant setup",
    description: "Run FiestaBoard alongside your home automations, with access from the Home Assistant sidebar.",
    needs: ["Home Assistant OS or Supervised", "Access to the Add-on Store", "Updates managed by Home Assistant"],
    label: "Set up the add-on",
    to: "/docs/setup/home-assistant-addon",
  },
];

function SetupChoices(): ReactNode {
  return (
    <Box as="section" className={styles.section} aria-labelledby="choose-your-setup">
      <Box className={styles.inner}>
        <Heading level={2} id="choose-your-setup" className={styles.sectionTitle}>
          Choose your setup
        </Heading>
        <Text className={styles.sectionBody}>
          Pick where FiestaBoard will run. Every path leads to the same app for your pages, plugins and schedules.
        </Text>
        <Box className={styles.choices}>
          {PATHS.map(({ title, Icon, badge, fit, description, needs, label, to }) => (
            <Box key={title} className={styles.choice} data-recommended={badge === "Recommended"}>
              <Box className={styles.choiceTop}>
                <Box className={styles.iconTile}>
                  <Icon aria-hidden="true" />
                </Box>
                {badge ? <Badge variant={badge === "Recommended" ? "success" : "secondary"}>{badge}</Badge> : null}
              </Box>
              <Heading level={3} className={styles.choiceTitle}>
                {title}
              </Heading>
              <Text className={styles.fit}>{fit}</Text>
              <Text className={styles.choiceBody}>{description}</Text>
              <List className={styles.needs} gap="3">
                {needs.map((need) => (
                  <ListItem key={need} className={styles.need}>
                    <Check aria-hidden="true" />
                    <Text as="span">{need}</Text>
                  </ListItem>
                ))}
              </List>
              <Button variant={badge === "Recommended" ? "default" : "outline"} asChild className={styles.pathLink}>
                <Link to={to}>
                  {label} <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </Box>
          ))}
        </Box>
        <Text className={styles.pathNote}>
          Home Assistant Container or Core? Choose Docker. Already using your Pi for something else?{" "}
          <Link to="/docs/deployment/raspberry-pi">Keep its existing OS and use Docker</Link>.
        </Text>
      </Box>
    </Box>
  );
}

function SetupQuestions(): ReactNode {
  return (
    <Box as="section" className={styles.sectionMuted} aria-labelledby="installation-questions">
      <Box className={styles.questionsInner}>
        <Heading level={2} id="installation-questions" className={styles.sectionTitle}>
          A few things to know
        </Heading>
        <Box className={styles.questions}>
          <details>
            <summary>Is FiestaBoard free?</summary>
            <Text>
              Yes. FiestaBoard is free, open-source software. You provide the computer that runs it and your displays.
              Some optional data services and AI providers may charge for their services.
            </Text>
          </details>
          <details>
            <summary>Does FiestaBoard track what I do?</summary>
            <Text>
              The self-hosted FiestaBoard app has no built-in analytics or usage tracking, and it does not automatically
              send us diagnostic logs. Troubleshooting logs stay on your host. Plugins and AI services you choose to
              connect have their own data practices.
            </Text>
          </details>
          <details>
            <summary>Does FiestaBoard run on my display?</summary>
            <Text>
              FiestaBoard runs on the host you choose above and sends content to your connected displays. It does not
              replace your display&apos;s firmware. For a TV, FiestaPanel displays your pages in a browser.
            </Text>
          </details>
          <details>
            <summary>Does my computer need to stay on?</summary>
            <Text>
              Keep the host running and connected whenever you want FiestaBoard to refresh data or change pages on a
              schedule. A dedicated Pi or an existing home server is a good fit for an always-on display.
            </Text>
          </details>
          <details>
            <summary>Can I use a Raspberry Pi I already have?</summary>
            <Text>
              Yes. Use FiestaPi for a dedicated Pi, or run Docker on a compatible 64-bit OS you already use. Flashing
              FiestaPi replaces the contents of the card, so keep your existing card if you want to preserve that setup.
              If your Pi runs Home Assistant OS, use the add-on path instead.
            </Text>
          </details>
          <details>
            <summary>Will I need API keys?</summary>
            <Text>
              It depends on your display and the data you choose. A Vestaboard needs its API credentials, and some
              plugins need keys for their data services. Your setup guide explains what to prepare.
            </Text>
          </details>
        </Box>
      </Box>
    </Box>
  );
}

export default function Installation(): ReactNode {
  return (
    <Layout
      title="Install FiestaBoard — Find Your Setup"
      description="Choose a friendly way to install FiestaBoard: FiestaPi on a Raspberry Pi, the Home Assistant add-on, or Docker on your own server."
    >
      <Box as="main">
        <Box as="section" className={styles.section} aria-labelledby="installation-title">
          <Box className={styles.heroInner}>
            <Box className={styles.heroCopy}>
              <Text as="span" className={styles.eyebrow}>
                Installation
              </Text>
              <h1 id="installation-title" className={styles.heroTitle}>
                Bring FiestaBoard home.
              </h1>
              <Text className={styles.heroBody}>
                Choose a home for FiestaBoard: a Raspberry Pi, Home Assistant, or a computer you already use. Then
                connect your displays and make them yours.
              </Text>
              <Text className={styles.heroNote}>Free, open source, and self-hosted. Hardware is separate.</Text>
            </Box>
            <Box className={styles.heroPreview}>
              <AppShot
                name="dashboard-running"
                frame="card:Active Display"
                pad={16}
                alt="FiestaBoard dashboard showing a display preview and controls for its pages"
                caption="Your pages, plugins and schedules, together in your browser."
                fallbackSrc="/img/web-ui-home.png"
              />
            </Box>
          </Box>
        </Box>
        <SetupChoices />
        <SetupQuestions />
        <Box as="section" className={styles.section} aria-labelledby="installation-help">
          <Box className={styles.helpInner}>
            <Heading level={2} id="installation-help" className={styles.sectionTitle}>
              A little help along the way
            </Heading>
            <Text className={styles.helpBody}>
              New to this? Start with the beginner&apos;s guide or ask the community. Once you&apos;re running, your{" "}
              <Link to="/docs/setup/first-10-minutes">first ten minutes</Link> are about connecting a display, choosing
              your plugins and making your first page.
            </Text>
            <Box className={styles.helpActions}>
              <Button asChild>
                <Link to="/docs/setup/beginners-guide">Beginner&apos;s guide</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="https://discord.gg/2GAqKnRF6h">Ask on Discord</Link>
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
}
