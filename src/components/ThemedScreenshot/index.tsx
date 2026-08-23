import { useColorMode } from "@docusaurus/theme-common";
import ScreenshotFrame, { screenshotVariantSrc } from "@site/src/components/ScreenshotFrame";
import { Moon, Sun } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

interface ThemedScreenshotProps {
  src: string;
  alt?: string;
  light?: string;
  dark?: string;
}

/**
 * An app screenshot in light and dark renditions, framed and zoomable. The
 * frame, toggle and lightbox are `ScreenshotFrame` (FiestaUI `MediaFrame` +
 * `Lightbox`, #229 item 4) — this file is only the light/dark rendition list
 * and the colour-mode default. The component name is load-bearing:
 * `MDXComponents.ts` registers it and versioned doc pages render
 * `<ThemedScreenshot>` directly.
 */
export default function ThemedScreenshot({ src, alt = "", light, dark }: ThemedScreenshotProps): ReactNode {
  const { colorMode } = useColorMode();
  const [activeMode, setActiveMode] = useState<string>(colorMode);

  useEffect(() => {
    setActiveMode(colorMode);
  }, [colorMode]);

  return (
    <ScreenshotFrame
      alt={alt}
      toggleLabel="Screenshot theme"
      active={activeMode}
      onActiveChange={setActiveMode}
      variants={[
        {
          value: "light",
          label: "Light",
          title: "Light mode",
          Icon: Sun,
          src: light ?? screenshotVariantSrc(src, "light"),
        },
        {
          value: "dark",
          label: "Dark",
          title: "Dark mode",
          Icon: Moon,
          src: dark ?? screenshotVariantSrc(src, "dark"),
        },
      ]}
    />
  );
}
