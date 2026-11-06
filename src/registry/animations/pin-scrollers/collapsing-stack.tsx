"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CollapsingStackItem = {
  /** Row heading. Stays visible when the row is folded into the pile. */
  title: React.ReactNode;
  /** Copy under the heading. Folds away when the next row covers this one. */
  description?: React.ReactNode;
  /** Visual (image, video, illustration). Fills the art box. */
  media: React.ReactNode;
};

type CollapsingStackProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: CollapsingStackItem[];
  /** Distance from the top of the scroll area where the pile pins, in px (the site header). */
  stickyTop?: number;
  /** Height of art left showing on a folded row from `minWidth` up, in px. */
  peek?: number;
  /** Same, from 768px to `minWidth`. */
  tabletPeek?: number;
  /** Same, below 768px. */
  mobilePeek?: number;
  /** Padding above and below each row from `minWidth` up, in px. */
  padding?: number;
  /** Same, below `minWidth`. */
  mobilePadding?: number;
  /** Space between the text column and the art from `minWidth` up, in px. */
  gap?: number;
  /** Width of the text column from `minWidth` up, in px. */
  textWidth?: number;
  /** Art box aspect ratio (width / height). */
  aspectRatio?: number;
  /** Art corner radius from `minWidth` up, in px. Halved below it. */
  radius?: number;
  /** Scroll distance per pixel of stacking. 1.5 = rows move at 2/3 of the scroll speed. */
  speed?: number;
  /** Seconds the rows take to catch up with the scroll. 0 (the original) = locked to the scrollbar. */
  smoothing?: number;
  /** Row background. Rows are opaque so each one covers the one below. */
  background?: string;
  /** Colour of the hairline above each row. */
  borderColor?: string;
  /** Viewport width (px) from which text and art sit side by side. */
  minWidth?: number;
};

/**
 * Collapsing stack: a list of rows (heading + copy, and art) pins as you
 * scroll, and each row slides up over the previous one. The covered row
 * folds its copy away and crops its art to a short strip, so the section
 * ends as a pile of headings with the last row open. Used on the NetApp AI
 * website.
 *
 * How it works (a port of the original's GSAP ScrollTrigger setup):
 * - Rows are measured in normal flow. Each gets a slot in the pile:
 *   `padding + peek + padding` apart (260px) when text sits beside the art,
 *   or `padding + heading line + 20 + peek + padding` (150px) when the text
 *   sits above it on small screens, plus any extra heading lines.
 * - In stack mode the list is `position: sticky` and rows are absolutely
 *   placed at their slot, pushed down by `translateY` so they start exactly
 *   where they sat in flow. Scrolling shrinks those offsets at 1/`speed` of
 *   the scroll distance, so rows slide up into the pile.
 * - As row i+1 closes in on row i (distance `r`), row i's copy folds
 *   (`grid-template-rows: 1fr → 0fr`, opacity 1 → 0) over 75% of the row
 *   height minus its slot, and its art is cropped from the bottom with
 *   `clip-path` to `peek + r` (less the open copy when it sits above the
 *   art), keeping a constant gap above the incoming row.
 * - Everything is written straight to the DOM once per animation frame;
 *   React doesn't re-render while scrolling.
 *
 * Stacking turns on when `stickyTop` plus two slots fits in the scroll
 * area's height (as in the original); otherwise it's a plain list. Works in
 * any scroll container. Reduced motion: plain list, all copy open.
 */
export function CollapsingStack({
  items,
  stickyTop = 100,
  peek = 200,
  tabletPeek = 170,
  mobilePeek = 79,
  padding = 30,
  mobilePadding = 10,
  gap = 80,
  textWidth = 367,
  aspectRatio = 833 / 533,
  radius = 20,
  speed = 1.5,
  smoothing = 0,
  background = "#FFFFFF",
  borderColor = "#F4F1ED",
  minWidth = 1024,
  className,
  style,
  ...props
}: CollapsingStackProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");

  // Smoothing doesn't change the layout, so it's read live instead of re-measuring.
  const smoothingRef = React.useRef(smoothing);
  React.useEffect(() => {
    smoothingRef.current = smoothing;
  }, [smoothing]);
  const count = items.length;

  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));
    const heads = rows.map((r) => r.querySelector<HTMLElement>("[data-heading]"));
    const descs = rows.map((r) => r.querySelector<HTMLElement>("[data-desc]"));
    const arts = rows.map((r) => r.querySelector<HTMLElement>("[data-art]"));
    const last = rows.length - 1;
    if (last < 1) return;

    const scroller = getScrollParent(root);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    let on = false;
    let stacked = false; // text above art (small screens)
    let peekPx = peek;
    let artRadius = radius;
    let w = 0; // total distance rows travel, px
    let runway = 0; // scroll distance that drives it, px
    let flowTop: number[] = [];
    let slot: number[] = [];
    let fold: number[] = [];
    let artH: number[] = [];
    let descH: number[] = [];
    let current = 0;
    let target = 0;
    let lastT = NaN;
    let raf = 0;
    let prevTime = 0;

    const reset = () => {
      delete root.dataset.stack;
      root.style.removeProperty("--cs-h");
      root.style.removeProperty("--cs-pile");
      rows.forEach((r) => {
        r.style.removeProperty("--cs-slot");
        r.style.removeProperty("--cs-live");
        r.style.transform = "";
      });
      descs.forEach((d) => {
        if (!d) return;
        d.style.gridTemplateRows = "";
        d.style.opacity = "";
        d.inert = false;
      });
      arts.forEach((a) => a && (a.style.clipPath = ""));
    };

    const viewTop = () => (scroller === window ? 0 : (scroller as HTMLElement).getBoundingClientRect().top);
    const viewHeight = () => (scroller === window ? window.innerHeight : (scroller as HTMLElement).clientHeight);

    const measure = () => {
      reset();
      on = false;
      lastT = NaN;
      if (reduce.matches) return;

      const vw = window.innerWidth;
      stacked = vw < minWidth;
      peekPx = vw >= minWidth ? peek : vw >= 768 ? tabletPeek : mobilePeek;
      artRadius = stacked ? radius / 2 : radius;
      const pad = stacked ? mobilePadding : padding;

      const rowH = rows.map((r) => r.getBoundingClientRect().height);
      artH = arts.map((a) => a?.getBoundingClientRect().height ?? 0);
      descH = descs.map((d) => (d?.firstElementChild as HTMLElement | null)?.scrollHeight ?? 0);
      const headH = heads.map((h) => h?.scrollHeight ?? 0);
      // One line of heading: the part of the heading that's always visible.
      const lineH = heads.map((h) => lineHeight(h?.firstElementChild ?? h));
      const rowGap = stacked ? parseFloat(getComputedStyle(rows[0]).rowGap) || 0 : 0;

      // Slot spacing: what stays visible of a folded row.
      const pitch = stacked ? pad * 2 + lineH[0] + rowGap + peekPx : pad * 2 + peekPx;
      const step = headH.map((h, i) => pitch + Math.max(0, h - (stacked ? lineH[i] : peekPx)));

      slot = [];
      flowTop = [];
      let a = 0;
      let b = 0;
      for (let i = 0; i <= last; i++) {
        slot[i] = a;
        flowTop[i] = b;
        a += step[i];
        b += rowH[i];
      }
      w = Math.max(0, flowTop[last] - slot[last]);
      fold = rowH.map((h, i) => Math.max(1, 0.75 * h - step[i]));
      // Each row is at least tall enough to hide the rows under it.
      const live = rowH.map((h, i) => {
        let m = h;
        for (let e = 0; e < i; e++) m = Math.max(m, rowH[e] - (slot[i] - slot[e]));
        return m;
      });

      if (w <= 0 || stickyTop + 2 * Math.max(...step) > viewHeight()) return;

      runway = w * Math.max(1, speed);
      rows.forEach((r, i) => {
        r.style.setProperty("--cs-slot", `${slot[i]}px`);
        r.style.setProperty("--cs-live", `${live[i]}px`);
      });
      root.style.setProperty("--cs-pile", `${slot[last] + live[last]}px`);
      root.style.setProperty("--cs-h", `${flowTop[last] + rowH[last] + runway - w}px`);
      root.dataset.stack = "";
      on = true;
      current = target = progress();
      render(current);
    };

    const progress = () => {
      const top = root.getBoundingClientRect().top - viewTop();
      return Math.min(1, Math.max(0, (stickyTop - top) / runway));
    };

    const render = (p: number) => {
      const t = Math.round(p * w);
      if (t === lastT) return;
      lastT = t;
      const off = rows.map((_, i) => Math.max(0, Math.round(flowTop[i] - slot[i] - t)));
      rows.forEach((r, i) => {
        r.style.transform = off[i] ? `translate3d(0,${off[i]}px,0)` : "";
        const dist = i < last ? off[i + 1] - off[i] : Infinity;
        const folded = Math.min(1, Math.max(0, 1 - dist / fold[i]));
        const d = descs[i];
        if (d) {
          d.style.gridTemplateRows = `${1 - folded}fr`;
          d.style.opacity = `${1 - folded}`;
          d.inert = folded >= 1;
        }
        const art = arts[i];
        if (art) {
          // Open copy above the art pushes it down, so less of it can show.
          const above = stacked ? descH[i] * (1 - folded) : 0;
          const visible = Math.max(peekPx, Math.min(artH[i], peekPx + dist - above));
          const crop = Math.round(artH[i] - visible);
          art.style.clipPath = crop > 0 ? `inset(0 0 ${crop}px 0 round ${artRadius}px)` : "";
        }
      });
    };

    const tick = (now: number) => {
      const dt = prevTime ? (now - prevTime) / 1000 : 1 / 60;
      prevTime = now;
      const tau = smoothingRef.current / 4;
      current = tau > 0 ? current + (target - current) * (1 - Math.exp(-dt / tau)) : target;
      if (Math.abs(target - current) * w < 0.5) current = target;
      render(current);
      raf = current === target ? 0 : requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (!on) return;
      target = progress();
      if (!raf) {
        prevTime = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    let lastWidth = -1;
    let lastHeight = -1;
    const onResize = () => {
      // Our own height writes don't change the layout; only width and viewport height do.
      const width = root.clientWidth;
      const height = viewHeight();
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      measure();
    };

    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    window.addEventListener("resize", onResize);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    reduce.addEventListener("change", measure);
    // Web fonts change heading heights after first paint.
    document.fonts?.ready.then(() => {
      lastWidth = -1;
      onResize();
    });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      scroller.removeEventListener("scroll", onScroll);
      reduce.removeEventListener("change", measure);
      reset();
    };
  }, [count, stickyTop, peek, tabletPeek, mobilePeek, padding, mobilePadding, gap, textWidth, aspectRatio, radius, speed, minWidth]);

  const s = `[data-collapsing-stack="${id}"]`;

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full min-w-0", className)}
      style={
        {
          "--cs-top": `${stickyTop}px`,
          "--cs-pad": `${mobilePadding}px`,
          "--cs-pad-lg": `${padding}px`,
          "--cs-gap": `${gap}px`,
          "--cs-text-w": `${textWidth}px`,
          "--cs-ratio": aspectRatio,
          "--cs-radius": `${radius}px`,
          "--cs-bg": background,
          "--cs-border": borderColor,
          ...style,
        } as React.CSSProperties
      }
      data-collapsing-stack={id}
      {...props}
    >
      <style>{`
${s} [data-row]{display:flex;flex-direction:column;gap:20px;padding:calc(var(--cs-pad) - 1px) 0 var(--cs-pad);border-top:1px solid var(--cs-border);background:var(--cs-bg)}
${s} [data-desc-inner]{padding-top:16px}
${s} [data-art]{position:relative;overflow:hidden;border-radius:calc(var(--cs-radius) / 2);aspect-ratio:var(--cs-ratio)}
@media (min-width:${minWidth}px){
${s} [data-row]{flex-direction:row;align-items:flex-start;gap:var(--cs-gap);padding:calc(var(--cs-pad-lg) - 1px) 0 var(--cs-pad-lg)}
${s} [data-text]{width:var(--cs-text-w);flex-shrink:0}
${s} [data-desc-inner]{padding-top:40px}
${s} [data-art]{flex:1;min-width:0;border-radius:var(--cs-radius)}
}
${s}[data-stack]{height:var(--cs-h)}
${s}[data-stack] [data-list]{position:sticky;top:var(--cs-top);height:var(--cs-pile)}
${s}[data-stack] [data-row]{position:absolute;inset-inline:0;top:var(--cs-slot);min-height:var(--cs-live)}`}</style>

      <ul data-list className="relative">
        {items.map((item, i) => (
          <li key={i} data-row>
            <div data-text>
              <div data-heading>{item.title}</div>
              {item.description && (
                <div data-desc className="grid grid-rows-[1fr]">
                  <div className="min-h-0 overflow-hidden">
                    <div data-desc-inner>{item.description}</div>
                  </div>
                </div>
              )}
            </div>
            <div data-art>
              <div className="absolute inset-0 *:size-full *:object-cover">{item.media}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Computed line height of an element, in px. */
function lineHeight(el: Element | null): number {
  if (!el) return 0;
  const cs = getComputedStyle(el);
  const lh = parseFloat(cs.lineHeight);
  return Number.isFinite(lh) ? lh : parseFloat(cs.fontSize) * 1.2;
}

/** Nearest ancestor that scrolls vertically, or the window. */
function getScrollParent(el: HTMLElement): HTMLElement | Window {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if (oy === "auto" || oy === "scroll") return p;
  }
  return window;
}
