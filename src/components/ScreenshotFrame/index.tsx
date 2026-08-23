import { MediaFrame, MediaFrameBar, MediaFrameMedia } from "@fiestaboard/ui/components/containment/media-frame";
import { Toggle, ToggleGroup } from "@fiestaboard/ui/components/forms/toggle";
import {
  Lightbox,
  LightboxContent,
  LightboxFooter,
  LightboxTrigger,
} from "@fiestaboard/ui/components/overlays/lightbox";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The shared shell behind `<BoardScreenshot>` and `<ThemedScreenshot>`.
 *
 * Those two components used to be 606 lines between them, of which 334 were
 * two byte-identical CSS modules and two separate hand-rolled lightboxes.
 * FiestaUI promoted the pattern in issue #229 item 4 — `MediaFrame` is
 * literally described in its own header as "promoted from the docs site's
 * BoardScreenshot/ThemedScreenshot pair" — so this file is the adoption: one
 * frame, one lightbox, one toggle, parameterised by the list of renditions.
 * The two public components stay put as thin wrappers so `MDXComponents.ts`
 * and every `.md` page that renders `<BoardScreenshot>` keep working.
 *
 * Two bugs are fixed by the move rather than ported:
 *
 *  - The hand-rolled version put `onClick` straight on the `<img>`, so the
 *    zoom affordance existed only for a mouse. `MediaFrameMedia` becomes a
 *    real `<button>` as soon as it is given a handler (the `LightboxTrigger`
 *    below injects one), so it is tabbable and announced.
 *  - The hand-rolled lightbox had a keydown listener and a body-overflow
 *    toggle but no focus trap. The DS `Lightbox` composes Base UI's Dialog,
 *    which brings focus containment, scroll lock, backdrop dismissal and
 *    portalling with it.
 */

export interface ScreenshotVariant {
  /** Toggle value; also the subdirectory the rendition is derived from. */
  value: string;
  /** Visible toggle label. */
  label: string;
  /** Tooltip, preserved from the hand-rolled toggle bar. */
  title: string;
  src: string;
  Icon?: LucideIcon;
}

interface ScreenshotFrameProps {
  alt: string;
  variants: ScreenshotVariant[];
  active: string;
  onActiveChange: (value: string) => void;
  /**
   * Accessible name for the toggle group. `ToggleGroup` requires one in its
   * type — a `role="group"` of controls has no implicit label — so a nameless
   * screenshot toggle cannot ship.
   */
  toggleLabel: string;
}

/**
 * Both wrappers derive their renditions the same way: the caller passes a
 * base path and each variant lives in a sibling directory named after it
 * (`/img/foo.png` -> `/img/black/foo.png`). Deduplicated here rather than
 * being spelled out once per component.
 */
export function screenshotVariantSrc(src: string, dir: string): string {
  const lastSlash = src.lastIndexOf("/");
  return `${src.substring(0, lastSlash)}/${dir}/${src.substring(lastSlash + 1)}`;
}

export default function ScreenshotFrame({
  alt,
  variants,
  active,
  onActiveChange,
  toggleLabel,
}: ScreenshotFrameProps): ReactNode {
  const activeSrc = (variants.find((v) => v.value === active) ?? variants[0]).src;
  // The button's own name: with `alt=""` (the prop default, and what several
  // pages pass) the image contributes nothing, which would leave a nameless
  // control. No visible text is inside it, so SC 2.5.3 does not apply.
  const zoomLabel = alt ? `Enlarge: ${alt}` : "Enlarge screenshot";

  // Rendered twice — once in the frame's bar, once in the lightbox footer —
  // exactly as the hand-rolled version did. They are two independent groups
  // driven by the same state, not one group teleported.
  const toggles = (
    // ToggleGroup is the `aria-pressed` toolbar model, which is what these
    // buttons already were. Its single-select value CAN be emptied (press the
    // pressed item again) and a screenshot must always show something, so the
    // empty array is dropped here rather than reaching for SegmentedControl,
    // whose radiogroup semantics would be a bigger change than the one this
    // PR is making. `text-muted-foreground` is the resting ink: Toggle's
    // unpressed state deliberately inherits colour, and inside LightboxFooter
    // it would otherwise inherit the scrim's `text-white` and vanish into the
    // segmented frame's own light surface.
    <ToggleGroup
      segmented
      aria-label={toggleLabel}
      value={[active]}
      onValueChange={(next) => {
        if (next[0]) onActiveChange(next[0]);
      }}
      className="text-muted-foreground"
    >
      {variants.map(({ value, label, title, Icon }) => (
        <Toggle key={value} value={value} size="sm" title={title}>
          {Icon && <Icon aria-hidden="true" />}
          {label}
        </Toggle>
      ))}
    </ToggleGroup>
  );

  return (
    <Lightbox>
      {/* my-5 stands in for the deleted `.container` rule's 1.25rem block
          margin; the frame is a block figure in MDX prose. */}
      <MediaFrame className="my-5">
        <LightboxTrigger asChild>
          <MediaFrameMedia aria-label={zoomLabel}>
            <img src={activeSrc} alt={alt} loading="lazy" />
          </MediaFrameMedia>
        </LightboxTrigger>
        <MediaFrameBar>{toggles}</MediaFrameBar>
      </MediaFrame>
      <LightboxContent aria-label={alt || "Screenshot"}>
        <img src={activeSrc} alt={alt} />
        <LightboxFooter>{toggles}</LightboxFooter>
      </LightboxContent>
    </Lightbox>
  );
}
