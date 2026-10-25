import Link from "@docusaurus/Link";
import { Button } from "@fiestaboard/ui/components/forms/button";
import { Box } from "@fiestaboard/ui/components/layout/box";
import { Heading } from "@fiestaboard/ui/components/typography/heading";
import { Text } from "@fiestaboard/ui/components/typography/text";
import DisplayTypes from "@site/src/components/DisplayTypes";
import Layout from "@theme/Layout";
import type { ReactNode } from "react";

import styles from "./installation.module.css";

export default function Displays(): ReactNode {
  return (
    <Layout
      title="Supported Displays"
      description="Explore FiestaBoard v10 support for Vestaboard Flagship and Note, Divoom Pixoo 64, and browser-based TV displays through FiestaPanel."
    >
      <Box as="main">
        <Box as="section" className={styles.section}>
          <Box className={styles.helpInner}>
            <Text as="span" className={styles.eyebrow}>
              Supported displays
            </Text>
            <h1 className={styles.heroTitle}>A display for every corner of your home.</h1>
            <Text className={styles.heroBody}>
              A split-flap board in the kitchen, pixels on your desk, or a TV on the wall. These are the displays
              FiestaBoard v10 supports. Hardware is separate; FiestaBoard runs on the host you choose.
            </Text>
            <Box className={styles.helpActions}>
              <Button asChild>
                <Link to="/installation">Choose an installation</Link>
              </Button>
            </Box>
          </Box>
        </Box>
        <DisplayTypes showContribution={false} linkToGuides />
        <Box as="section" className={styles.sectionMuted}>
          <Box className={styles.helpInner}>
            <Heading level={2} className={styles.sectionTitle}>
              Have a different display?
            </Heading>
            <Text className={styles.helpBody}>
              New hardware support starts with a display plugin. If you&apos;d like to build one, the output-plugin
              guide explains how to connect your device, test it, and contribute it to FiestaBoard.
            </Text>
            <Box className={styles.helpActions}>
              <Button asChild>
                <Link href="https://github.com/Fiestaboard/FiestaBoard/blob/next/docs/development/output-plugins.md">
                  Build a display plugin
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="https://github.com/Fiestaboard/FiestaBoard/issues">Discuss a display</Link>
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
}
