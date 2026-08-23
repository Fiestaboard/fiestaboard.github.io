import { useColorMode } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { Box } from "@fiestaboard/ui/components/layout/box";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import styles from "./styles.module.css";

/**
 * AppShot — render a captured FiestaBoard screen as a figure.
 *
 * The captures in `static/captures/` are real DOM, serialised from the running
 * app by FiestaBoard's screenshot generator and synced here by
 * scripts/publish-docs.sh. One capture serves every state a PNG needed four
 * files for: the theme is a class on the wrapper and every colour resolves
 * through FiestaUI tokens, and the app is responsive through CSS breakpoints
 * rather than JS branching, so light/dark and desktop/mobile all come out of
 * the same bytes.
 *
 * A shot is NOT an app. It never scrolls, never takes a click, and cannot be
 * tabbed into. It holds the capture's real viewport and locks a scroll offset —
 * which matters, because the sidebar is `position: fixed` and a
 * full-content-height frame would stretch it down the whole document.
 *
 * `frame` and `highlight` are CSS SELECTORS, never pixel boxes. A card can move
 * four hundred pixels down the page when the app changes and the crop and the
 * spotlight both follow it; a pixel box would silently point at the wrong
 * thing, which is the failure mode this whole mechanism exists to remove.
 */
export interface AppShotProps {
  /** Capture name, e.g. "settings-page" (matches the generator's output). */
  name: string;
  /** Selector to crop to. Omit to show the whole viewport. */
  frame?: string;
  /** Crop to this ancestor of `frame` — e.g. "[data-slot=card]". */
  frameIn?: string;
  /** Selector to draw attention to. */
  highlight?: string;
  /** How the highlight is drawn. */
  mode?: "spotlight" | "outline" | "none";
  /** Short callout rendered beside the highlight. */
  label?: string;
  /** Padding around the crop, in capture pixels. */
  pad?: number;
  /** Render at the mobile breakpoint instead of desktop. */
  device?: "desktop" | "mobile";
  /** Required: describes the shot for screen readers. */
  alt: string;
  /** Optional caption rendered under the figure. */
  caption?: ReactNode;
  /** PNG to fall back to when no capture exists yet. */
  fallbackSrc?: string;
}

interface CaptureEntry {
  file: string;
  frame?: string;
  wrapperClass: string;
  vars: Record<string, Record<string, string>>;
  /** Desktop viewport the markup was captured at — fitted to its content. */
  capturedAt: { width: number; height: number };
  capturedAtMobile?: { width: number; height: number };
  viewportSpecific?: boolean;
}

interface Manifest {
  version: number;
  captures: Record<string, CaptureEntry>;
}

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
} as const;

/** The viewport a capture was taken at, falling back for older manifests. */
function captureViewport(entry: CaptureEntry | null, device: "desktop" | "mobile") {
  const recorded = device === "mobile" ? entry?.capturedAtMobile : entry?.capturedAt;
  return recorded ?? VIEWPORTS[device];
}

/** The manifest is fetched once per page, not once per shot. */
let manifestPromise: Promise<Manifest | null> | null = null;
function loadManifest(url: string): Promise<Manifest | null> {
  manifestPromise ??= fetch(url)
    .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : null))
    .catch(() => null);
  return manifestPromise;
}

/**
 * The docs site omits Tailwind's preflight on purpose — it would clobber
 * Infima's typography — but the app was rendered with it, so the capture needs
 * those base rules back. It MUST live in `@layer base`: at plain specificity
 * `.fb-shell button { padding: 0 }` outranks `.px-3` and collapses every tab
 * and heading in the capture.
 */
function scopedReset(vars: Record<string, Record<string, string>>): string {
  const decls = (bp: "desktop" | "mobile") =>
    Object.entries(vars?.[bp] ?? {})
      .map(([k, v]) => `${k}: ${v};`)
      .join(" ");
  return `@layer base {
    .fb-shell a { text-decoration: none; color: inherit; }
    .fb-shell button, .fb-shell input, .fb-shell select, .fb-shell textarea {
      font: inherit; color: inherit; background: none; border: 0; margin: 0; padding: 0; }
    .fb-shell *, .fb-shell *::before, .fb-shell *::after { box-sizing: border-box; }
    .fb-shell svg { display: block; vertical-align: middle; }
    .fb-shell h1,.fb-shell h2,.fb-shell h3,.fb-shell h4,.fb-shell p,.fb-shell figure {
      margin: 0; font-size: inherit; font-weight: inherit; }
    .fb-shell ul,.fb-shell ol { list-style: none; margin: 0; padding: 0; }
    .fb-shell { ${decls("mobile")} }
    @media (min-width: 1024px) { .fb-shell { ${decls("desktop")} } }
  }`;
}

/** Reuse the page's own compiled stylesheets inside the frame. */
function parentStyles(): string {
  if (typeof document === "undefined") return "";
  return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((l) => `<link rel="stylesheet" href="${(l as HTMLLinkElement).href}">`)
    .join("");
}

export default function AppShot({
  name,
  frame,
  frameIn,
  highlight,
  mode = "spotlight",
  label,
  pad = 20,
  device = "desktop",
  alt,
  caption,
  fallbackSrc,
}: AppShotProps): ReactNode {
  const { colorMode } = useColorMode();
  const capturesBase = useBaseUrl("/captures/");
  const fallbackUrl = useBaseUrl(fallbackSrc ?? "/");
  const hostRef = useRef<HTMLElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLElement>(null);

  const [entry, setEntry] = useState<CaptureEntry | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    loadManifest(`${capturesBase}manifest.json`).then((m) => {
      if (!live) return;
      const found = m?.captures?.[name] ?? null;
      if (!found) setFailed(true);
      else setEntry(found);
    });
    return () => {
      live = false;
    };
  }, [capturesBase, name]);

  /** Position the crop, the highlight and the callout. Re-runs on resize. */
  const layout = useCallback(() => {
    const host = hostRef.current;
    const iframe = iframeRef.current;
    const overlay = overlayRef.current;
    const viewport = viewportRef.current;
    if (!host || !iframe || !overlay || !viewport || !entry) return;
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) return;

    // Render at the viewport the capture was TAKEN at, not a fixed one. The
    // generator fits the desktop height to each screen's content, so the
    // Dashboard is 670px rather than 800. Rendering it in a taller frame would
    // reintroduce the band of empty page background this exists to remove.
    const { width, height } = captureViewport(entry, device);

    // The app renders mobile and desktop copies of its chrome, one of them
    // display:none — always anchor to the one that is actually laid out.
    const resolve = (sel?: string): HTMLElement | null => {
      if (!sel) return null;
      const card = /^card:(.+)$/.exec(sel);
      const list = card
        ? Array.from(doc.querySelectorAll<HTMLElement>('[data-slot="card"]')).filter(
            (c) =>
              (c.querySelector('[data-slot="card-title"]')?.textContent ?? "").trim().toLowerCase() ===
              card[1].trim().toLowerCase(),
          )
        : Array.from(doc.querySelectorAll<HTMLElement>(sel));
      return list.find((e) => e.getBoundingClientRect().width > 0) ?? list[0] ?? null;
    };

    let target = resolve(frame ?? entry.frame);
    if (target && frameIn) target = target.closest<HTMLElement>(frameIn) ?? target;

    // Measure the callout first so the crop can reserve room for it, rather
    // than drawing it over the thing it points at.
    overlay.innerHTML = "";
    let labelEl: HTMLDivElement | null = null;
    let labelH = 0;
    if (label && mode !== "none" && highlight) {
      labelEl = document.createElement("div");
      labelEl.className = styles.label;
      labelEl.textContent = label;
      labelEl.style.visibility = "hidden";
      overlay.appendChild(labelEl);
      labelH = labelEl.offsetHeight;
    }
    const room = labelEl ? labelH + 12 : 0;

    // Lock the scroll so the target sits `pad` below the top edge.
    let scrollTop = 0;
    if (target) {
      const top = target.getBoundingClientRect().top + win.scrollY;
      scrollTop = Math.max(0, Math.min(top - pad, doc.documentElement.scrollHeight - height));
    }
    win.scrollTo(0, scrollTop);

    let crop: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: width, h: height };
    if (target) {
      const r = target.getBoundingClientRect();
      crop = {
        x: Math.max(0, r.left - pad),
        y: Math.max(0, r.top - pad),
        w: Math.min(width, r.width + pad * 2),
        h: Math.min(height, r.height + pad * 2 + room),
      };
    }

    const avail = host.clientWidth || width;
    const scale = Math.min(1, avail / crop.w);

    iframe.style.transformOrigin = "top left";
    iframe.style.transform = `scale(${scale}) translate(${-crop.x}px, ${-crop.y}px)`;
    viewport.style.width = `${crop.w * scale}px`;
    viewport.style.height = `${crop.h * scale}px`;

    // Soften only edges that are truncating. An edge the crop chose is
    // deliberate, and fading it makes a clean frame look damaged.
    const docH = doc.documentElement.scrollHeight;
    const clippedBottom = target
      ? target.getBoundingClientRect().height + pad * 2 + room > height
      : scrollTop + height < docH - 0.5;
    const fades = [
      !target && scrollTop > 0.5 ? "transparent 0px, #000 28px" : null,
      clippedBottom || room > 0 ? "#000 calc(100% - 28px), transparent 100%" : null,
    ].filter(Boolean);
    const mask = fades.length ? `linear-gradient(to bottom, ${fades.join(", ")})` : "none";
    viewport.style.webkitMaskImage = mask;
    viewport.style.maskImage = mask;

    const hlEl = resolve(highlight);
    if (hlEl && mode !== "none") {
      const r = hlEl.getBoundingClientRect();
      const hole = document.createElement("div");
      hole.className = `${styles.highlight} ${mode === "outline" ? styles.outline : styles.spotlight}`;
      hole.style.left = `${(r.left - crop.x) * scale}px`;
      hole.style.top = `${(r.top - crop.y) * scale}px`;
      hole.style.width = `${r.width * scale}px`;
      hole.style.height = `${r.height * scale}px`;
      overlay.appendChild(hole);

      if (labelEl) {
        const gap = 6;
        const vw = crop.w * scale;
        const vh = crop.h * scale;
        const hx = (r.left - crop.x) * scale;
        const hy = (r.top - crop.y) * scale;
        let ty = hy + r.height * scale + gap;
        if (ty + labelH > vh) ty = hy - labelH - gap;
        labelEl.style.left = `${Math.max(0, Math.min(hx, vw - labelEl.offsetWidth))}px`;
        labelEl.style.top = `${Math.max(0, Math.min(ty, vh - labelH))}px`;
        labelEl.style.visibility = "visible";
      }
    }
  }, [entry, device, frame, frameIn, highlight, label, mode, pad]);

  /** Build the frame document from the capture. */
  useEffect(() => {
    if (!entry) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    let live = true;

    const file = entry.viewportSpecific ? entry.file.replace(/\.html$/, `.${device}.html`) : entry.file;

    fetch(`${capturesBase}${file}`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((html) => {
        if (!live) return;
        const doc = iframe.contentDocument;
        if (!doc) return;
        doc.open();
        doc.write(
          `<!doctype html><html class="${colorMode === "dark" ? "dark" : ""}" data-resolved-theme="${colorMode}">` +
            `<head><meta charset="utf-8">${parentStyles()}` +
            `<style>html,body{margin:0;padding:0;overflow:hidden}${scopedReset(entry.vars)}</style></head>` +
            // inert: a recording, not an app — nothing here is focusable.
            `<body class="bg-background text-foreground"><div class="fb-shell ${entry.wrapperClass}" inert>${html}</div></body></html>`,
        );
        doc.close();
        // Stylesheets load asynchronously; measure once they have.
        const done = () => live && layout();
        if (doc.readyState === "complete") setTimeout(done, 60);
        else iframe.contentWindow?.addEventListener("load", done, { once: true });
        setTimeout(done, 400);
      })
      .catch(() => live && setFailed(true));

    return () => {
      live = false;
    };
  }, [entry, colorMode, device, capturesBase, layout]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => layout());
    ro.observe(host);
    return () => ro.disconnect();
  }, [layout]);

  if (failed) {
    return fallbackSrc ? (
      <figure className={styles.container}>
        <img className={styles.fallback} src={fallbackUrl} alt={alt} loading="lazy" />
        {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
      </figure>
    ) : null;
  }

  return (
    <figure className={styles.container} role="img" aria-label={alt}>
      <Box className={styles.host} ref={hostRef} data-device={device}>
        <Box className={styles.viewport} ref={viewportRef}>
          <iframe
            className={styles.frame}
            ref={iframeRef}
            title={alt}
            tabIndex={-1}
            aria-hidden="true"
            scrolling="no"
            width={captureViewport(entry, device).width}
            height={captureViewport(entry, device).height}
          />
          <Box className={styles.overlay} ref={overlayRef} />
        </Box>
      </Box>
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
