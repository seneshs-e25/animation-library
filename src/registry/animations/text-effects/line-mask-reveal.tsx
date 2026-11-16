"use client";

import * as React from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { cn } from "@/lib/utils";

gsap.registerPlugin(SplitText);

type LineMaskRevealProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** The copy. Plain text only, since it's split into lines at runtime. Use "\n" for a hard line break. */
  text: string;
  /** Element to render, e.g. "p", "h2". */
  as?: React.ElementType;
  /** Play on mount, or when it scrolls into view. */
  trigger?: "load" | "view";
  /** With `trigger="view"`: reset once it's fully out of view, so it plays again on the way back. */
  replay?: boolean;
  /** Seconds between one line starting and the next. */
  stagger?: number;
  /** Seconds each line takes to slide up. */
  duration?: number;
  /**
   * Easing for each line, as a CSS timing function (`cubic-bezier(...)` or a
   * keyword). The default is GSAP's `power4.out`, the original's ease. A GSAP
   * ease name (e.g. "expo.out") also works.
   */
  ease?: string;
  /** Which line leads the stagger. */
  from?: "start" | "center" | "end" | "random";
};

/** Layout effect on the client, plain effect on the server, no warning. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * Line mask reveal: the copy is split into its rendered lines, each line sits
 * in its own clipping mask, and the lines slide up into view one after
 * another, as if they were tucked under the line above.
 *
 * How it works:
 * - GSAP SplitText splits by line with `mask: "lines"` (each line gets an
 *   `overflow: clip` wrapper) and `autoSplit`, so it re-splits when the width
 *   changes or the font loads, keeping the tween's progress. SplitText also
 *   puts the full text on an `aria-label` and hides the split spans.
 * - Lines are pushed down 125% of their own height inside their mask (the
 *   mask is padded 0.12em so descenders survive tight leading, so 110% would
 *   leave a sliver showing), then
 *   one staggered tween brings them to 0. The ease is a CSS cubic-bezier,
 *   turned into an easing function for GSAP by `cssEase` below.
 * - Before hydration the element is `visibility: hidden` (lines don't exist
 *   until it's measured), only under `prefers-reduced-motion: no-preference`;
 *   a `<noscript>` rule shows it when JavaScript is off.
 *
 * Reduced motion: the text is never split and shows in place.
 */
export function LineMaskReveal({
  text,
  as: Tag = "p",
  trigger = "view",
  replay = true,
  stagger = 0.12,
  duration = 1,
  ease = "cubic-bezier(0.22, 1, 0.36, 1)",
  from = "start",
  className,
  ...props
}: LineMaskRevealProps) {
  const ref = React.useRef<HTMLElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.setAttribute("data-ready", "");
      return;
    }

    let tween: gsap.core.Tween | null = null;
    let shown = trigger === "load";

    const split = SplitText.create(root, {
      type: "lines",
      mask: "lines",
      linesClass: "lmr-line",
      autoSplit: true,
      onSplit(self) {
        const wasDone = tween?.progress() === 1;
        tween = gsap.fromTo(
          self.lines,
          { yPercent: 125 },
          { yPercent: 0, duration, ease: cssEase(ease) ?? ease, stagger: { each: stagger, from }, paused: !shown },
        );
        // A finished paragraph that re-wraps into more lines stays finished.
        if (wasDone) return void tween.progress(1);
        // Otherwise returned so SplitText carries its progress across re-splits.
        return tween;
      },
    });
    root.setAttribute("data-ready", "");

    if (trigger === "load") {
      return () => split.revert();
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          if (shown) return;
          shown = true;
          tween?.restart();
          if (!replay) io.disconnect();
        } else if (!entry.isIntersecting && replay && shown) {
          // Fully out of view: reset unseen, ready to play on the way back.
          shown = false;
          tween?.pause(0);
        }
      },
      { threshold: [0, 0.2] },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      split.revert();
    };
  }, [text, trigger, replay, stagger, duration, ease, from]);

  const s = `[data-line-mask-reveal="${id}"]`;

  return (
    <>
      {/* Siblings, not children: anything inside the element gets split. */}
      <style>{`@media (prefers-reduced-motion:no-preference){${s}:not([data-ready]){visibility:hidden}}${s} .lmr-line-mask{padding-block:0.12em;margin-block:-0.12em}`}</style>
      <noscript>
        <style>{`${s}{visibility:visible!important}`}</style>
      </noscript>
      <Tag ref={ref} data-line-mask-reveal={id} className={cn(className)} {...props}>
        {text.split("\n").map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </Tag>
    </>
  );
}

const CSS_KEYWORDS: Record<string, number[]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

/**
 * A CSS timing function (`cubic-bezier(x1, y1, x2, y2)` or a keyword) as an
 * easing function, since GSAP can't read CSS curves without CustomEase.
 * Solves the curve's x for t by bisection. Anything else returns undefined
 * (so a GSAP ease name like "power2.out" can still be passed straight through).
 */
function cssEase(css: string): ((t: number) => number) | undefined {
  const m = css.trim().match(/^cubic-bezier\(([^)]*)\)$/);
  const p = m ? m[1].split(",").map(Number) : CSS_KEYWORDS[css.trim()];
  if (!p || p.length !== 4 || p.some((n) => !Number.isFinite(n))) return undefined;
  const [x1, y1, x2, y2] = p;
  const at = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  return (t) => {
    if (t <= 0 || t >= 1) return t <= 0 ? 0 : 1;
    let lo = 0;
    let hi = 1;
    let s = t;
    for (let i = 0; i < 24; i++) {
      s = (lo + hi) / 2;
      if (at(x1, x2, s) < t) lo = s;
      else hi = s;
    }
    return at(y1, y2, s);
  };
}
