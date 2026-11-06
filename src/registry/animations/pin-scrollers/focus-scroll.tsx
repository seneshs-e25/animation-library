"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type FocusScrollItem = {
  /** Visual shown in the pinned column while this item is in focus, and on top of its card on phones. */
  media: React.ReactNode;
  /** Text block that scrolls past (title and copy). */
  content: React.ReactNode;
  /** Optional link or button under the text (pinned layout: 43px below; phone cards: pinned to the bottom). */
  action?: React.ReactNode;
};

type FocusScrollProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: FocusScrollItem[];
  /** Distance from the top of the viewport where the media pins, in px (the original: header height + 62). */
  stickyTop?: number;
  /** Width of the media column from 1220px, as a percentage of the row (50% below that). */
  mediaWidth?: number;
  /** Space between the media and text columns from 1220px, in px (40px below that). */
  gap?: number;
  /** Which side the pinned media sits on. The original: left. */
  mediaSide?: "left" | "right";
  /** Crossfade between media, in ms. */
  duration?: number;
  /** Opacity of text blocks that are out of focus. 1 = no dimming (the original). */
  inactiveOpacity?: number;
  /** Time the phone carousel takes to move one card, in ms. */
  slideDuration?: number;
  /** Colours for the phone cards and progress bar: "dark" for dark sections, "light" for light ones. */
  theme?: "dark" | "light";
};

type Zone = "before" | "inside" | "after";

/**
 * Interaction values for the phone carousel are react-slick's defaults, which
 * the original runs on: a drag changes card past 1/TOUCH_THRESHOLD of the
 * card width (`touchThreshold: 5`), past the first or last card the row
 * moves EDGE_FRICTION of the drag (`edgeFriction: 0.35`), and a move asked
 * for mid-slide is ignored (`waitForAnimate: true`).
 */
const TOUCH_THRESHOLD = 5;
const EDGE_FRICTION = 0.35;

/**
 * Focus scroll: the media column pins while text blocks scroll past beside it,
 * and the pinned media crossfades to match the block in focus. On phones it
 * becomes a swipeable row of glass cards with a progress bar. Rebuilt from
 * the Sophos website's "Focus scroll" (GSAP ScrollTrigger and react-slick
 * there; no dependencies here).
 *
 * How it works:
 * - From 720px wide, the media sit stacked in a sticky column: the active
 *   one is in the flow (so the column takes its height), the others are
 *   absolute and transparent. Changing focus fades opacity over 500ms
 *   cubic-bezier(0.4, 0, 0.2, 1).
 * - Each text block has a focus zone, as in the original's ScrollTrigger:
 *   it starts when the block's top reaches `stickyTop - 10 + height/4` and
 *   ends when its bottom reaches `stickyTop - 10 + height/2`. Scrolling down
 *   into a zone (onEnter) or back up into one (onEnterBack) makes that block
 *   active. Leaving a zone changes nothing, so the last focused block stays
 *   active between zones and at the ends of the list.
 * - A passive scroll listener checks zones once per animation frame and only
 *   sets state when the active block changes.
 * - Below 720px: each item is a card (media 191px tall, then text) in a row
 *   that moves one card with `translateX` over 500ms `ease`; the next card
 *   peeks in on the right. A progress bar under it fills to
 *   (index + 1) / count over the same 500ms.
 *
 * Breakpoints are container queries on the component's own width, set to
 * the original's container widths: 720px (pinned layout), 960px and 1220px.
 * Works inside any scroll container, not just the window. Reduced motion:
 * media still swap and cards still change, without the fade or slide.
 */
export function FocusScroll({
  items,
  stickyTop = 180,
  mediaWidth = 60,
  gap = 80,
  mediaSide = "left",
  duration = 500,
  inactiveOpacity = 1,
  slideDuration = 500,
  theme = "dark",
  className,
  style,
  ...props
}: FocusScrollProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);
  // Whether the pinned layout is showing. Mirrors the container query below.
  const [wide, setWide] = React.useState(false);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const count = items.length;

  const stickyTopRef = React.useRef(stickyTop);
  const requestRef = React.useRef<() => void>(() => {});
  React.useEffect(() => {
    stickyTopRef.current = stickyTop;
    requestRef.current();
  }, [stickyTop]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-focus-block]"));
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
      pinned = root.clientWidth >= 720;
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
  }, [count]);

  const s = `[data-focus-scroll="${id}"]`;
  const ease = "cubic-bezier(.4,0,.2,1)";
  const reverse = mediaSide === "right";

  return (
    <div
      ref={rootRef}
      className={cn("@container w-full", className)}
      style={
        {
          "--focus-top": `${stickyTop}px`,
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
        Two layouts, as in the original: the pinned one from 720px and the
        phone carousel below it. Only one is displayed at a time.
        Widths and spacing follow the original's breakpoints (720/960/1220).
      */}
      <style>{`
${s} [data-pinned]{display:none}
@container (min-width:720px){
${s} [data-pinned]{display:flex;align-items:flex-start;gap:40px}
${s} [data-carousel]{display:none}
}
${s} [data-media-col]{flex:0 0 50%;position:sticky;top:var(--focus-top)}
${s} [data-text-col]{flex:0 0 calc(50% - 40px)}
${s} [data-media]{position:absolute;inset:0 auto auto 0;width:100%;opacity:0;pointer-events:none;transition:opacity var(--focus-duration) ${ease}}
${s} [data-media][data-active]{position:relative;opacity:1;pointer-events:auto}
${s} [data-media]>*{display:block;width:100%;height:auto;object-fit:contain}
${s} [data-focus-block]{display:flex;flex-direction:column;flex:1;padding:40px 0;transition:opacity var(--focus-duration) ${ease}}
${s} [data-focus-block]:not([data-active]){opacity:var(--focus-dim)}
@container (min-width:960px){${s} [data-focus-block]{min-height:270px}}
@container (min-width:1220px){
${s} [data-pinned]{gap:var(--focus-gap)}
${s} [data-media-col]{flex-basis:var(--focus-media-w)}
${s} [data-text-col]{flex-basis:calc(100% - var(--focus-media-w) - var(--focus-gap))}
${s} [data-focus-block]{min-height:450px;padding:105px 0 155px}
${s} [data-focus-block][data-last]{padding-bottom:60px}
}
@media (prefers-reduced-motion:reduce){${s} [data-media],${s} [data-focus-block]{transition:none!important}}`}</style>

      <div data-pinned className={cn(reverse && "flex-row-reverse")}>
        <div data-media-col>
          {items.map((item, i) => (
            <div
              key={i}
              data-media
              data-active={i === active ? "" : undefined}
              aria-hidden={wide && i !== active ? true : undefined}
            >
              {item.media}
            </div>
          ))}
        </div>
        <div data-text-col>
          {items.map((item, i) => (
            <div
              key={i}
              data-focus-block
              data-active={i === active ? "" : undefined}
              data-last={i === count - 1 ? "" : undefined}
            >
              {item.content}
              {item.action && <div className="mt-[43px] flex">{item.action}</div>}
            </div>
          ))}
        </div>
      </div>

      <FocusCarousel items={items} duration={slideDuration} theme={theme} />
    </div>
  );
}

/** Phone layout: a row of glass cards, swiped one at a time, with a progress bar. */
function FocusCarousel({
  items,
  duration,
  theme,
}: {
  items: FocusScrollItem[];
  duration: number;
  theme: "dark" | "light";
}) {
  const count = items.length;
  const [index, setIndex] = React.useState(0);
  const [drag, setDrag] = React.useState<number | null>(null);
  const start = React.useRef<{ x: number; y: number; id: number } | null>(null);
  const moved = React.useRef(false);
  const threshold = React.useRef(0);
  // Until when the row is still sliding; moves asked for before then are dropped.
  const busyUntil = React.useRef(0);
  const light = theme === "light";

  const go = (i: number) => {
    const next = Math.min(Math.max(i, 0), count - 1);
    const now = performance.now();
    if (next === index || now < busyUntil.current) return;
    const instant = duration <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    busyUntil.current = instant ? 0 : now + duration;
    setIndex(next);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    moved.current = false;
    // The track's parent is one card wide (including its 10px margins).
    threshold.current = (e.currentTarget as HTMLElement).parentElement!.clientWidth / TOUCH_THRESHOLD;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    if (!moved.current) {
      // Let vertical scrolls through; only claim clearly horizontal drags.
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(e.clientY - s.y)) return;
      moved.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    const atEdge = (dx > 0 && index === 0) || (dx < 0 && index === count - 1);
    setDrag(atEdge ? dx * EDGE_FRICTION : dx);
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    start.current = null;
    if (drag !== null) {
      // While the row is still sliding, go() drops this and the row springs back.
      if (drag <= -threshold.current) go(index + 1);
      else if (drag >= threshold.current) go(index - 1);
    }
    setDrag(null);
  };

  return (
    <div data-carousel role="region" aria-roledescription="carousel">
      <style>{`@media (prefers-reduced-motion:reduce){[data-carousel] [data-track],[data-carousel] [data-progress]{transition:none!important}}`}</style>
      {/* One card wide (100% - 20px), so the next card peeks in; the section clips it. */}
      <div className="w-[calc(100%-20px)]">
        <div
          data-track
          // Each slide is the full 100% - 20px, with its card inset 10px each side;
          // shifting the track 10px left lines the first card up with the edge.
          className="relative -left-2.5 flex touch-pan-y select-none"
          style={{
            transform:
              drag !== null
                ? `translate3d(calc(${-index * 100}% + ${drag}px),0,0)`
                : `translate3d(${-index * 100}%,0,0)`,
            transition: drag !== null ? "none" : `transform ${duration}ms ease`,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onClickCapture={(e) => {
            // A drag shouldn't also click a link inside the card.
            if (moved.current) {
              e.preventDefault();
              e.stopPropagation();
              moved.current = false;
            }
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              inert={i !== index}
              className="flex w-full shrink-0 px-2.5"
            >
              <div
                className={cn(
                  "flex w-full flex-col rounded-[10px] border pt-2.5 pb-[30px] backdrop-blur-[15px]",
                  light ? "border-black/30 bg-black/10" : "border-white/30 bg-white/10",
                )}
              >
                <div className={cn("h-[191px] *:size-full *:object-contain", light && "px-5")}>{item.media}</div>
                <div className="flex flex-1 flex-col px-[30px] pt-[28px]">
                  {item.content}
                  {item.action && <div className="mt-auto flex pt-[39px]">{item.action}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        aria-hidden
        className={cn("mt-5 h-[5px] overflow-hidden rounded-full", light ? "bg-[#001A47]/20" : "bg-[#D9D9D9]/20")}
      >
        <div
          data-progress
          className={cn("h-full rounded-full", light ? "bg-[#001A47]" : "bg-white")}
          style={{ width: `${((index + 1) / Math.max(count, 1)) * 100}%`, transition: `width ${duration}ms ease` }}
        />
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
