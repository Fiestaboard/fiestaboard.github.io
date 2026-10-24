import BrowserOnly from "@docusaurus/BrowserOnly";
import Link from "@docusaurus/Link";
import { Button } from "@fiestaboard/ui/components/forms/button";
import { Box } from "@fiestaboard/ui/components/layout/box";
import { Flex } from "@fiestaboard/ui/components/layout/flex";
import { Text } from "@fiestaboard/ui/components/typography/text";
import HeroBoard from "@site/src/components/HeroBoard";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import Layout from "@theme/Layout";
import type { ReactNode } from "react";

import styles from "./index.module.css";

function Hero() {
  return (
    <Box as="section" className={styles.section}>
      <Box className={styles.heroInner}>
        <Box className={styles.heroCopy}>
          {/* The page's sole h1. FiestaUI's `Heading` covers h2-h4 only (h1 is
              reserved for the app's `PageHeader`), so the hero title keeps its
              own element and takes its type scale from `index.module.css`. */}
          <h1 className={styles.heroTitle}>Your data, out in the real world</h1>
          <Text className={styles.heroBody}>
            FiestaBoard turns live data into something you can glance at from across the room — your morning commute,
            the markets, the surf, a little Star Trek wisdom — on the displays around you: split-flap boards like
            Vestaboard, or any TV with a browser. Pick from 60+ plugins, design pages in a visual editor, schedule what
            shows when, and build your own plugins. Free, open source, and self-hosted in Docker.
          </Text>
          <Text className={styles.heroSubline}>
            Weather, stocks, sports &amp; more - flash a Raspberry Pi or run with Docker
          </Text>
          <Flex gap="3" wrap className={styles.heroButtons}>
            <Button size="lg" asChild>
              <Link to="/docs/intro">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="https://github.com/Fiestaboard/FiestaBoard">View on GitHub</Link>
            </Button>
          </Flex>
        </Box>
        <Box className={styles.heroBoard}>
          <BrowserOnly fallback={<Box className={styles.heroBoardFallback} />}>{() => <HeroBoard />}</BrowserOnly>
        </Box>
      </Box>
    </Box>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Your Data, Out in the Real World"
      description="FiestaBoard puts your data out in the real world: free, open-source, self-hosted software for Vestaboard split-flap displays (Flagship, Note, and Note arrays) and any TV with a browser. 60+ plugins for weather, stocks, sports, transit, and more."
    >
      <Hero />
      <Box as="main">
        <HomepageFeatures />
      </Box>
    </Layout>
  );
}
