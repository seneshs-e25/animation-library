"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type HorizontalScrollProps = Omit<React.ComponentProps<"section">, "children"> & {
  /** One card per child, laid out in a row. */
  children: React.ReactNode;
  /** Optional lead column (e.g. the section heading). It rides along with the row. */
  heading?: React.ReactNode;
  /** Width of the heading column, in px. */
  headingWidth?: number;
  /** Width of each card, in px. */
  cardWidth?: number;
  /** Space between cards, in px. */
  gap?: number;
  /** Wrap the cards in one rounded panel, as in the original. */
  panel?: boolean;
  /** Panel background. */
  panelColor?: string;
  /** Panel corner radius, in px. */
  radius?: number;
  /** Section background. */
  background?: string;
  /** Distance from the top of the viewport where the stage pins, in px (the header height). */
  stickyTop?: number;
  /** Vertical scroll per pixel of horizontal travel. 1 = the row moves as far as you scroll. */
  speed?: number;
  /** How quickly the row catches up with the scroll, per 60fps frame (0–1). 1 = no lag. */
  smoothing?: number;
  /**
   * Viewport width (px) from which the row is scroll-driven. Below it the row
   * is a native swipe row with snap points. Set 0 to pin everywhere.
   */
  minWidth?: number;
};

/**
 * Horizontal scroll section: the section pins for a while, and scrolling down
 * slides a row of cards to the left until the last one is in view. Then the
 * page carries on. Used on the Miro website.
 *
 * How it works:
 * - The section is as tall as the stage (viewport − `stickyTop`) plus the
 *   row's horizontal travel × `speed`. The stage inside it is
 *   `position: sticky`, so it stays put while that extra height scrolls by.
 * - Progress (0 → 1) is how far the section has scrolled past the pin line,
 *   divided by that extra height. The row's target offset is
 *   `-progress × travel`, where travel = row width − stage width.
 * - The displayed offset eases toward the target each frame (`smoothing` per
 *   60fps frame, frame-rate independent), so the row glides and settles
 *   instead of ticking with each wheel step. A rAF loop writes `transform`
 *   straight to the DOM and stops once it has settled; React never
 *   re-renders on scroll.
 * - Travel and section height are re-measured with a ResizeObserver.
 *
 * Works inside any scroll container, not just the window. Reduced motion: the
 * row still follows the scroll (it's user-driven), but 1:1 with no lag.
 */
export function HorizontalScroll({
  children,
  heading,
  headingWidth = 420,
  cardWidth = 800,
  gap = 32,
  panel = true,
  panelColor = "#FFFFFF",
  radius = 24,
  background = "#F7F7F5",
  stickyTop = 0,
  speed = 1,
  smoothing = 0.12,
  minWidth = 992,
  className,
  style,
  ...props
}: HorizontalScrollProps) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const requestRef = React.useRef<() => void>(() => {});
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const cards = React.Children.toArray(children);

  // Latest settings, read inside the rAF loop without restarting it.
  const settings = React.useRef({ stickyTop, speed, smoothing });
  React.useEffect(() => {
    settings.current = { stickyTop, speed, smoothing };
  });

  React.useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!section || !stage || !track) return;
    const media = window.matchMedia(`(min-width: ${minWidth}px)`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scroller = scrollParent(section);
    let frame = 0;
    let last = 0;
    let current = 0;
    let travel = 0;
    let height = "";

    const reset = () => {
      track.style.transform = "";
      section.style.height = "";
      height = "";
      current = 0;
    };

    // Section height = stage height + travel × speed.
    const measure = () => {
      if (!media.matches) return reset();
      const { stickyTop, speed } = settings.current;
      const viewport = scroller ? scroller.clientHeight : window.innerHeight;
      // Row end = last item's right edge + the track's right padding
      // (scrollWidth leaves that padding out when the row overflows).
      const end = track.lastElementChild as HTMLElement | null;
      const padEnd = parseFloat(getComputedStyle(track).paddingRight) || 0;
      const rowWidth = end ? end.offsetLeft + end.offsetWidth + padEnd : 0;
      travel = Math.max(rowWidth - stage.clientWidth, 0);
      const next = `${Math.round(viewport - stickyTop + travel * speed)}px`;
      if (next !== height) section.style.height = height = next;
      section.style.setProperty("--hs-stage", `${viewport - stickyTop}px`);
    };

    const tick = (now: number) => {
      frame = 0;
      if (!media.matches) return reset();

      const { stickyTop, speed, smoothing } = settings.current;
      const dt = last ? Math.min(now - last, 100) : 16.67;
      last = now;
      const k = reduced.matches ? 1 : 1 - Math.pow(1 - smoothing, dt / 16.67);

      const viewportTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const top = section.getBoundingClientRect().top - viewportTop;
      const distance = Math.max(travel * speed, 1);
      const target = -travel * clamp((stickyTop - top) / distance);

      current += (target - current) * k;
      const settled = Math.abs(target - current) < 0.1;
      if (settled) current = target;
      track.style.transform = `translate3d(${current.toFixed(2)}px, 0, 0)`;

      if (!settled) frame = requestAnimationFrame(tick);
      else last = 0;
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const remeasure = () => {
      measure();
      request();
    };

    requestRef.current = remeasure;
    const target = scroller ?? window;
    const observer = new ResizeObserver(remeasure);
    observer.observe(stage);
    observer.observe(track);
    if (scroller) observer.observe(scroller);
    target.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", remeasure);
    media.addEventListener("change", remeasure);
    reduced.addEventListener("change", request);
    remeasure();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      target.removeEventListener("scroll", request);
      window.removeEventListener("resize", remeasure);
      media.removeEventListener("change", remeasure);
      reduced.removeEventListener("change", request);
      reset();
    };
  }, [minWidth, cards.length]);

  // Re-measure when props change the layout or the scroll length.
  React.useEffect(() => {
    requestRef.current();
  }, [stickyTop, speed, cardWidth, gap, headingWidth, panel]);

  return (
    <section
      ref={sectionRef}
      className={cn("relative w-full bg-(--hs-bg)", className)}
      style={
        {
          "--hs-bg": background,
          "--hs-top": `${stickyTop}px`,
          "--hs-card": `${cardWidth}px`,
          "--hs-heading": `${headingWidth}px`,
          "--hs-gap": `${gap}px`,
          "--hs-panel": panelColor,
          "--hs-radius": `${radius}px`,
          ...style,
        } as React.CSSProperties
      }
      data-horizontal-scroll={id}
      {...props}
    >
      {/* Media queries can't read CSS variables, so the breakpoint is written here. */}
      <style>{`[data-horizontal-scroll="${id}"] [data-hs-track]{overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}[data-horizontal-scroll="${id}"] [data-hs-card]{scroll-snap-align:start}@media (min-width:${minWidth}px){[data-horizontal-scroll="${id}"] [data-hs-stage]{position:sticky;top:var(--hs-top);height:var(--hs-stage,100vh);overflow:hidden}[data-horizontal-scroll="${id}"] [data-hs-track]{overflow:visible;scroll-snap-type:none;flex-direction:row;align-items:center;will-change:transform}[data-horizontal-scroll="${id}"] [data-hs-heading]{flex:0 0 var(--hs-heading);align-self:flex-start;padding-top:32px}}`}</style>
      <div ref={stageRef} data-hs-stage className="flex items-center">
        <div
          ref={trackRef}
          data-hs-track
          className="relative flex w-full flex-col gap-8 px-5 py-10 md:px-[60px]"
        >
          {heading != null && (
            <div data-hs-heading className="shrink-0">
              {heading}
            </div>
          )}
          <div
            className={cn(
              "flex w-max shrink-0 gap-(--hs-gap)",
              panel && "rounded-(--hs-radius) bg-(--hs-panel) p-(--hs-gap)",
            )}
          >
            {cards.map((card, i) => (
              <div
                key={i}
                data-hs-card
                className="w-[min(var(--hs-card),calc(100vw-80px))] shrink-0"
              >
                {card}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function clamp(v: number) {
  return Math.min(Math.max(v, 0), 1);
}

/** Nearest ancestor that scrolls vertically, or null for the window. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if (/(auto|scroll|overlay)/.test(overflowY)) return p;
  }
  return null;
}
