/** Layout changes the crop's height, so only its available width is input.
 * Defer writes until the next frame to avoid re-entering observer delivery. */
export function observeWidth(element: Element, layout: () => void): () => void {
  let lastWidth: number | undefined;
  let pending: number | null = null;
  const observer = new window.ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width;
    if (width === undefined || width === lastWidth) return;
    lastWidth = width;
    if (pending !== null) return;
    pending = window.requestAnimationFrame(() => {
      pending = null;
      layout();
    });
  });
  observer.observe(element);
  return () => {
    observer.disconnect();
    if (pending !== null) window.cancelAnimationFrame(pending);
  };
}
