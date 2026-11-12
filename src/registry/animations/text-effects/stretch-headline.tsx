"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type StretchHeadlineProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** The headline. Plain text only, since it's split into one span per letter. Use "\n" for a hard line break. */
  text: string;
  /** Element to render, e.g. "h1" or "h2". */
  as?: React.ElementType;
  /** Play when it scrolls into view (the original), or straight away on mount. */
  trigger?: "view" | "load";
  /** With `trigger="view"`: reset once it's fully out of view, so it plays again on the way back. */
  replay?: boolean;
  /** Gap between one letter starting and the next, in ms. */
  stagger?: number;
  /** How long each letter takes to stretch and settle, in ms. */
  duration?: number;
  /** How hard the letters squash and stretch. 1 is the original; 0 is a plain fade. */
  intensity?: number;
  /** Which letter leads the stagger. */
  from?: "start" | "center" | "end" | "random";
};

/**
 * The original's keyframes, evenly spaced: wide and flat → tall and narrow →
 * slightly wide → rest. Opacity is only in the first step.
 */
const SCALE_X = [1.9, 0.82, 1.08, 1];
const SCALE_Y = [0.25, 1.3, 0.94, 1];
const OPACITY = [0, 1, 1, 1];
/** GSAP `power2.out` (a cubic ease-out), applied across the whole keyframe run. */
const EASE = "cubic-bezier(0.33, 1, 0.68, 1)";

/** Layout effect on the client, plain effect on the server, no warning. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * Stretch headline: each letter lands like it's made of rubber. It arrives
 * squashed flat and wide, springs up tall and narrow, wobbles once and
 * settles, letter after letter. Ported from Weonic's Weo Motion library
 * (pattern 065, Text Elastic Stretch).
 *
 * How it works:
 * - The text is split into lines → words → letters. Each word is a `nowrap`
 *   inline-block so letters never break mid-word; spaces stay as text.
 *   Screen readers get the headline once, from a visually hidden copy.
 * - Each letter runs one Web Animation (`element.animate`) of `scale(x, y)`
 *   and `opacity`, with the ease on the whole run (as the original does), a
 *   per-letter delay, and `fill: backwards` so it's held hidden until its turn.
 * - A scoped stylesheet hides the letters before they play (so nothing
 *   flashes before hydration), only under `prefers-reduced-motion:
 *   no-preference`; a `<noscript>` rule shows them when JavaScript is off.
 *
 * Reduced motion: the headline is shown in place, no motion.
 */
export function StretchHeadline({
  text,
  as: Tag = "h2",
  trigger = "view",
  replay = true,
  stagger = 50,
  duration = 1100,
  intensity = 1,
  from = "start",
  className,
  ...props
}: StretchHeadlineProps) {
  const ref = React.useRef<HTMLElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.setAttribute("data-played", "");
      return;
    }

    const chars = Array.from(root.querySelectorAll<HTMLElement>("[data-char]"));
    const order = staggerOrder(chars.length, from);
    // Scale each keyframe's distance from 1, never letting a letter flip or vanish.
    const amp = (v: number) => Math.max(0.02, 1 + (v - 1) * intensity);
    const keyframes = SCALE_X.map((x, i) => ({
      transform: `scale(${amp(x)}, ${amp(SCALE_Y[i])})`,
      opacity: OPACITY[i],
    }));

    let running: Animation[] = [];
    const play = () => {
      running.forEach((a) => a.cancel());
      running = chars.map((el, i) =>
        el.animate(keyframes, { duration, delay: order[i] * stagger, easing: EASE, fill: "backwards" }),
      );
      // The animations now hold each letter hidden through its own delay.
      root.setAttribute("data-played", "");
    };
    const reset = () => {
      running.forEach((a) => a.cancel());
      running = [];
      root.removeAttribute("data-played");
    };

    if (trigger === "load") {
      play();
      return reset;
    }

    let shown = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          if (shown) return;
          shown = true;
          play();
          if (!replay) io.disconnect();
        } else if (!entry.isIntersecting && replay && shown) {
          // Fully out of view: reset unseen, ready to play on the way back.
          shown = false;
          reset();
        }
      },
      { threshold: [0, 0.2] },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      reset();
    };
  }, [text, trigger, replay, stagger, duration, intensity, from]);

  const s = `[data-stretch-headline="${id}"]`;

  return (
    <Tag ref={ref} data-stretch-headline={id} className={cn(className)} {...props}>
      <style>{`@media (prefers-reduced-motion:no-preference){${s}:not([data-played]) [data-char]{opacity:0}}`}</style>
      <noscript>
        <style>{`${s} [data-char]{opacity:1!important}`}</style>
      </noscript>
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      <span aria-hidden className="block">
        {text.split("\n").map((line, li) => (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {line.split(/(\s+)/).filter(Boolean).map((token, ti) =>
              /^\s+$/.test(token) ? (
                " "
              ) : (
                <span key={ti} className="inline-block whitespace-nowrap">
                  {Array.from(token).map((char, ci) => (
                    <span key={ci} data-char="" className="inline-block will-change-transform">
                      {char}
                    </span>
                  ))}
                </span>
              ),
            )}
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}

/** Each letter's place in the stagger (0 goes first), like GSAP's `stagger.from`. */
function staggerOrder(n: number, from: "start" | "center" | "end" | "random"): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  if (from === "end") return idx.map((i) => n - 1 - i);
  if (from === "center") return idx.map((i) => Math.abs(i - (n - 1) / 2));
  if (from === "random") {
    const shuffled = [...idx];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  return idx;
}
