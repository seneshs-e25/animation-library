"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ScrollShiftHeadlineProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** First line. Slides left while the section is below centre, right once it's above. */
  headline?: string;
  /** Second line. Slides the opposite way, and is pulled up into the first by `overlap`. */
  headlineSecondary?: string;
  /** Element to render, e.g. "h2" or "h1". */
  as?: React.ElementType;
  /** How far each line travels either side of centre, in em of the font size (scales with the type). */
  travel?: number;
  /** How far the second line is pulled up into the first, in em. 0 = normal line spacing. */
  overlap?: number;
  /**
   * What "centred in the viewport" is measured on: the closest `<section>`
   * around the heading (the original), or the heading itself.
   */
  measure?: "section" | "self";
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Scroll shift headline: two centred display lines that slide horizontally in
 * opposite directions as you scroll, both landing dead centre the moment the
 * section is centred in the viewport. Ported from the eight25 homepage's
 * `onscrollText` section (`ScrollShiftHeading`).
 *
 * It's a scrub, not an animation: one number, `--ssh-progress`, is a pure
 * function of scroll position:
 *   +1  the section is fully below the viewport's middle
 *    0  its centre is on the viewport's middle
 *   -1  it's fully above
 * Line one is shifted by `progress × travel × -1`, line two by
 * `progress × travel`, so they pull apart below centre, close onto it, and
 * cross past it as the section leaves. Nothing moves while the page is still,
 * and scrolling back retraces it.
 *
 * Cost: one `getBoundingClientRect` and at most one custom-property write per
 * scroll frame (rAF-coalesced, skipped when the value hasn't changed), so a
 * section parked off screen, clamped at ±1, costs nothing.
 *
 * Without the property (server HTML, no JS, reduced motion) both lines sit at
 * 0: the designed, centred composition.
 */
export function ScrollShiftHeadline({
  headline,
  headlineSecondary,
  as: Tag = "h2",
  travel = 0.6,
  overlap = 0.35,
  measure = "section",
  className,
  style,
  ...props
}: ScrollShiftHeadlineProps) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = (measure === "section" && el.closest("section")) || el;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Measure against the nearest scroll container (the window, unless the
    // heading sits in a scrolling box).
    const scroller = scrollParent(host);

    let frame = 0;
    let published = "";
    let active = false;

    const update = () => {
      frame = 0;
      const { top, height } = host.getBoundingClientRect();
      const port = scroller ? scroller.getBoundingClientRect() : { top: 0, height: window.innerHeight };
      // Centre-on-middle is (viewport + height) / 2 away from either extreme:
      // the section's top on the viewport's bottom, or its bottom on the top.
      const span = (port.height + height) / 2;
      if (span <= 0) return;
      const progress = clamp((top - port.top + height / 2 - port.height / 2) / span, -1, 1);
      const next = progress.toFixed(4);
      if (next === published) return;
      published = next;
      el.style.setProperty("--ssh-progress", next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!active) return;
      active = false;
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
    const sync = () => {
      if (reduced.matches) {
        stop();
        published = "";
        el.style.removeProperty("--ssh-progress");
        return;
      }
      if (!active) {
        active = true;
        // Capture phase, so scrolling inside a nested scroll container counts too.
        window.addEventListener("scroll", schedule, { passive: true, capture: true });
        window.addEventListener("resize", schedule);
      }
      update();
    };

    sync();
    reduced.addEventListener("change", sync);
    return () => {
      stop();
      reduced.removeEventListener("change", sync);
      el.style.removeProperty("--ssh-progress");
    };
  }, [measure]);

  if (!headline && !headlineSecondary) return null;

  return (
    <Tag
      ref={ref}
      className={cn("text-center", className)}
      style={{ "--ssh-travel": `${travel}em`, ...style } as React.CSSProperties}
      {...props}
    >
      {headline ? (
        <span className="block whitespace-nowrap translate-x-[calc(var(--ssh-progress,0)*var(--ssh-travel)*-1)]">
          {headline}
        </span>
      ) : null}
      {headline && headlineSecondary ? " " : null}
      {headlineSecondary ? (
        <span
          className="block whitespace-nowrap translate-x-[calc(var(--ssh-progress,0)*var(--ssh-travel))]"
          style={headline ? { marginTop: `${-overlap}em` } : undefined}
        >
          {headlineSecondary}
        </span>
      ) : null}
    </Tag>
  );
}

/** Nearest ancestor that scrolls vertically, or null for the window. */
function scrollParent(el: Element): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(p).overflowY)) return p;
  }
  return null;
}
