import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { Button } from "@fiestaboard/ui/components/forms/button";
import { Box } from "@fiestaboard/ui/components/layout/box";
import { Heading } from "@fiestaboard/ui/components/typography/heading";
import { Text } from "@fiestaboard/ui/components/typography/text";
import { ArrowUpRight, Play } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import styles from "./styles.module.css";

const VIDEO_ID = "SXrqx4k1RP8";

export default function IntroVideo(): ReactNode {
  const [loaded, setLoaded] = useState(false);
  const player = useRef<HTMLIFrameElement>(null);
  const poster = useBaseUrl("/img/what-is-fiestaboard.jpg");

  useEffect(() => {
    if (loaded) player.current?.focus();
  }, [loaded]);

  return (
    <Box as="section" className={styles.section} aria-labelledby="intro-video-title">
      <Box className={styles.inner}>
        <Box className={styles.panel}>
          <Box className={styles.copy}>
            <Text as="span" className={styles.duration}>
              3-minute introduction
            </Text>
            <Heading level={2} id="intro-video-title" className={styles.title}>
              What is FiestaBoard?
            </Heading>
            <Text className={styles.description}>
              See how FiestaBoard brings live information to the displays around your home.
            </Text>
            <Button variant="link" asChild className={styles.youtubeLink}>
              <Link href={`https://www.youtube.com/watch?v=${VIDEO_ID}`}>
                Watch on YouTube <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </Box>
          <Box className={styles.media}>
            {loaded ? (
              <iframe
                ref={player}
                className={styles.player}
                src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
                title="What is FiestaBoard? — introduction video"
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <Button
                type="button"
                variant="ghost"
                className={styles.poster}
                onClick={() => setLoaded(true)}
                aria-label="Play introduction: What is FiestaBoard? (3 minutes)"
              >
                <img src={poster} alt="" width={1280} height={720} loading="lazy" decoding="async" />
                <Text as="span" className={styles.playLabel}>
                  <Play aria-hidden="true" fill="currentColor" />
                  Play introduction
                </Text>
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
