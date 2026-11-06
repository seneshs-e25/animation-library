"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type FocusScrollItem = {
  /** Visual shown in the pinned column while this item is in focus. */
  media: React.ReactNode;
  /** Text block that scrolls past (title, copy, CTA). */
  content: React.ReactNode;
};

type FocusScrollProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: FocusScrollItem[];
  /** Distance from the top of the viewport where the media pins, in px (header height + 62). */
  stickyTop?: number;
  /** Height of the pinned media box, in px. Text blocks are at least this tall. */
  mediaHeight?: number;
  /** Width of the media column, as a percentage of the row. */
  mediaWidth?: number;
  /** Space between the media and text columns, in px. */
  gap?: number;
  /** Which side the pinned media sits on. */
  mediaSide?: "left" | "right";
  /** Crossfade duration between media, in ms. */
  duration?: number;
  /** Opacity of text blocks that are out of focus. 1 = no dimming (the original). */
  inactiveOpacity?: number;
  /**
   * Width of the component itself (px) from which the media pins. Below it,
   * each item renders as media followed by its text. It's a container query,
   * so the layout follows the space the component gets, not the window: a
   * narrow column stacks even on a wide screen.
   */
  minWidth?: number;
};

type Zone = "before" | "inside" | "after";

/**
 * Focus scroll: the media column pins while text blocks scroll past beside it,
 * and the pinned media crossfades to match the block in focus. Used on the
 * Sophos website.
 *
 * How it works:
 * - Every media item sits in the same sticky grid cell, spanning all the
 *   text rows, and only the active one is visible (opacity crossfade, 500ms
 *   cubic-bezier(0.4, 0, 0.2, 1) by default, as in the original).
 * - Each text block has a focus zone, like the original's ScrollTrigger:
 *   it starts when the block's top reaches `stickyTop - 10 + height/4` and
 *   ends when its bottom reaches `stickyTop - 10 + height/2`. Scrolling down
 *   into a zone (onEnter) or back up into one (onEnterBack) makes that block
 *   active. Leaving a zone changes nothing, so the last focused block stays
 *   active between zones and at the ends of the list.
 * - A passive scroll listener checks zones once per animation frame and only
 *   sets state when the active block changes, so React doesn't re-render
 *   while scrolling.
 *
 * The pinned layout switches on the component's own width (a container
 * query), so it stacks in a narrow column even on a wide screen. Both
 * layouts share one set of elements, so media and content render once.
 *
 * Works inside any scroll container, not just the window. Reduced motion:
 * media still swaps, but without the fade.
 */
export function FocusScroll({
  items,
  stickyTop = 180,
  mediaHeight = 450,
  mediaWidth = 60,
  gap = 80,
  mediaSide = "left",
  duration = 500,
  inactiveOpacity = 1,
  minWidth = 900,
  className,
  style,
  ...props
}: FocusScrollProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);
  // Whether the pinned layout is showing. Mirrors the container query below;
  // only used to hide inactive media from screen readers.
  const [wide, setWide] = React.useState(false);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const count = items.length;

  const stickyTopRef = React.useRef(stickyTop);
  const requestRef = React.useRef<() => void>(() => {});
  React.useEffect(() => {
    stickyTopRef.current = stickyTop;
    requestRef.current();
  }, [stickyTop, mediaHeight]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-focus-block]"));
    // Mirrors the container query: pinned only while the component is wide enough.
    let pinned = false;
    const scroller = scrollParent(root);
    const zones: Zone[] = blocks.map(() => "before");
    let current = 0;
    let lastScroll = 0;
    let frame = 0;

    const activate = (i: number) => {
      if (i === current) return;
      current = i;
      setActive(i);
    };

    const tick = () => {
      frame = 0;
      if (!pinned) return;
      const viewportTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const scroll = scroller ? scroller.scrollTop : window.scrollY;
      const down = scroll >= lastScroll;
      lastScroll = scroll;
      const line = stickyTopRef.current - 10;

      const next = blocks.map((el): Zone => {
        const r = el.getBoundingClientRect();
        const top = r.top - viewportTop;
        const bottom = r.bottom - viewportTop;
        if (top > line + r.height / 4) return "before";
        if (bottom < line + r.height / 2) return "after";
        return "inside";
      });

      // Fire in scroll order, so on a fast jump the last block passed wins,
      // as ScrollTrigger does.
      const order = blocks.map((_, i) => i);
      if (!down) order.reverse();
      for (const i of order) {
        const was = zones[i];
        const is = next[i];
        if (was === is) continue;
        // onEnter (incl. skipping straight past) and onEnterBack.
        if (is === "inside" || (was === "before" && is === "after") || (was === "after" && is === "before")) {
          activate(i);
        }
        zones[i] = is;
      }
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(() => {
      pinned = root.clientWidth >= minWidth;
      setWide(pinned);
      request();
    });

    requestRef.current = request;
    const target = scroller ?? window;
    target.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    ro.observe(root);

    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      ro.disconnect();
      requestRef.current = () => {};
    };
  }, [minWidth, count]);

  const s = `[data-focus-scroll="${id}"]`;
  const mediaCol = mediaSide === "right" ? 2 : 1;
  const textCol = mediaSide === "right" ? 1 : 2;
  const columns =
    mediaSide === "right"
      ? "minmax(0,1fr) var(--focus-media-w)"
      : "var(--focus-media-w) minmax(0,1fr)";
  const ease = "cubic-bezier(.4,0,.2,1)";

  return (
    <div
      ref={rootRef}
      className={cn("@container mx-auto w-full max-w-[1220px]", className)}
      style={
        {
          "--focus-top": `${stickyTop}px`,
          "--focus-h": `${mediaHeight}px`,
          "--focus-media-w": `${mediaWidth}%`,
          "--focus-gap": `${gap}px`,
          "--focus-duration": `${duration}ms`,
          "--focus-dim": inactiveOpacity,
          ...style,
        } as React.CSSProperties
      }
      data-focus-scroll={id}
      {...props}
    >
      {/*
        One set of elements serves both layouts. Below minWidth it's a single
        column: media, then its text, per item. From minWidth every media item
        sits in the same grid cell spanning all rows, sticky, and only the
        active one is visible; text blocks fill the other column, one per row.
        Container queries can't read CSS variables, so values are written here.
      */}
      <style>{`
${s}>[data-grid]{display:grid;grid-template-columns:minmax(0,1fr)}
${s} [data-media]{position:relative;width:100%;aspect-ratio:16/10}
${s} [data-media]:not(:first-child){margin-top:64px}
${s} [data-focus-block]{margin-top:24px}
@container (min-width:${minWidth}px){
${s}>[data-grid]{grid-template-columns:${columns};column-gap:var(--focus-gap);align-items:start}
${s} [data-media]{grid-column:${mediaCol};grid-row:1 / span ${Math.max(count, 1)};position:sticky;top:var(--focus-top);height:var(--focus-h);aspect-ratio:auto;margin:0;transition:opacity var(--focus-duration) ${ease}}
${s} [data-media]:not(:first-child){margin-top:0}
${s} [data-media]:not([data-active]){opacity:0;pointer-events:none}
${s} [data-focus-block]{grid-column:${textCol};grid-row:var(--focus-row);margin:0;display:flex;flex-direction:column;min-height:var(--focus-h);padding:105px 0 155px;transition:opacity var(--focus-duration) ${ease}}
${s} [data-focus-block][data-last]{padding-bottom:40px}
${s} [data-focus-block]:not([data-active]){opacity:var(--focus-dim)}
}
@media (prefers-reduced-motion:reduce){${s} [data-media],${s} [data-focus-block]{transition:none!important}}`}</style>

      <div data-grid>
        {items.map((item, i) => (
          <React.Fragment key={i}>
            <div
              data-media
              data-active={i === active ? "" : undefined}
              aria-hidden={wide && i !== active ? true : undefined}
            >
              {item.media}
            </div>
            <div
              data-focus-block
              data-active={i === active ? "" : undefined}
              data-last={i === count - 1 ? "" : undefined}
              // Spacing matches the original: content starts 105px down, 155px below.
              style={{ "--focus-row": i + 1 } as React.CSSProperties}
            >
              {item.content}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/** Nearest ancestor that scrolls vertically, or null for the window. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if (/(auto|scroll|overlay)/.test(overflowY)) return p;
  }
  return null;
}
