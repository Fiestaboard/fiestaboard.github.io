import { useColorMode } from "@docusaurus/theme-common";
import ScreenshotFrame, { screenshotVariantSrc } from "@site/src/components/ScreenshotFrame";
import { type ReactNode, useEffect, useState } from "react";

interface BoardScreenshotProps {
  src: string;
  alt?: string;
  black?: string;
  white?: string;
}

type BoardStyle = "black" | "white";

/**
 * A split-flap board screenshot in black and white hardware, framed and
 * zoomable. All of the frame, toggle and lightbox machinery lives in
 * `ScreenshotFrame` on top of FiestaUI's `MediaFrame`/`Lightbox` (#229 item
 * 4); this file is only the black/white rendition list and the colour-mode
 * default. The component name is load-bearing — `MDXComponents.ts` registers
 * it and ~2.5k versioned doc pages render `<BoardScreenshot>`.
 */
export default function BoardScreenshot({ src, alt = "", black, white }: BoardScreenshotProps): ReactNode {
  const { colorMode } = useColorMode();
  const defaultStyle: BoardStyle = colorMode === "light" ? "white" : "black";
  const [activeStyle, setActiveStyle] = useState<string>(defaultStyle);

  useEffect(() => {
    setActiveStyle(colorMode === "light" ? "white" : "black");
  }, [colorMode]);

  return (
    <ScreenshotFrame
      alt={alt}
      toggleLabel="Board style"
      active={activeStyle}
      onActiveChange={setActiveStyle}
      variants={[
        { value: "black", label: "Black", title: "Black board", src: black ?? screenshotVariantSrc(src, "black") },
        { value: "white", label: "White", title: "White board", src: white ?? screenshotVariantSrc(src, "white") },
      ]}
    />
  );
}
