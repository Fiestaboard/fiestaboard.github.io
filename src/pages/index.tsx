import BrowserOnly from "@docusaurus/BrowserOnly";
import Link from "@docusaurus/Link";
import { Button } from "@fiestaboard/ui/components/forms/button";
import { Box } from "@fiestaboard/ui/components/layout/box";
import { Flex } from "@fiestaboard/ui/components/layout/flex";
import { Text } from "@fiestaboard/ui/components/typography/text";
import DisplayTypes from "@site/src/components/DisplayTypes";
import HeroBoard from "@site/src/components/HeroBoard";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import IntroVideo from "@site/src/components/IntroVideo";
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
          <h1 className={styles.heroTitle}>Your data, on every display in the room</h1>
          <Text className={styles.heroBody}>
            FiestaBoard puts your morning commute, the markets, the surf report, or a little Star Trek wisdom on the
            displays around you: split-flap boards like Vestaboard, LED matrices like the Divoom Pixoo 64, and any TV
            with a web browser. Design a page once and every display shows it its own way.
          </Text>
          <Text className={styles.heroSubline}>Free, open source, and self-hosted</Text>
          <Flex gap="3" wrap className={styles.heroButtons}>
            <Button size="lg" asChild>
              <Link to="/installation">Get Started</Link>
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
      title="Your Data, on Every Display in the Room"
      description="FiestaBoard is free, open-source software that puts live data on split-flap boards like Vestaboard, LED matrices like the Divoom Pixoo 64, and any TV with a web browser. 60+ plugins for weather, stocks, sports, transit, and more."
    >
      <Hero />
      <Box as="main">
        <IntroVideo />
        <DisplayTypes />
        <HomepageFeatures />
      </Box>
    </Layout>
  );
}
