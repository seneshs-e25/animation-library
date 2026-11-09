"use client";

import * as React from "react";

type CountUpProps = Omit<React.ComponentProps<"span">, "prefix"> & {
  /** The number to count to. Decimals are kept: 2.6 counts as 0.0 → 2.6. */
  value: number;
  /** Text before the number that never changes, e.g. "$". */
  prefix?: React.ReactNode;
  /** Text after the number that never changes, e.g. "K+" or "TB/s". */
  suffix?: React.ReactNode;
  /** Count duration in milliseconds. */
  duration?: number;
  /**
   * Wait this long after the number comes into view before counting. Give a
   * row of stats `delay={index * duration}` to count them one after another.
   */
  delay?: number;
  /** "linear" (the original: constant speed) or "ease-out" (slows into the final value). */
  easing?: "linear" | "ease-out";
  /** How much of the number must be visible to start, 0–1. */
  threshold?: number;
};

// Layout effect on the client so the number is zeroed before the first paint.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const decimalsOf = (n: number) => (String(n).split(".")[1] ?? "").length;

/**
 * Count up — a number that counts from 0 to `value` the first time it scrolls
 * into view, then stays. It never replays on later scrolls.
 *
 * The final number is server-rendered, so without JavaScript (or under
 * reduced motion) the reader just sees it. On hydration the number is zeroed
 * before paint, so a reader scrolling down meets 0 and watches it count, not
 * the final figure snapping back. Only the number's own text is rewritten,
 * once per frame with requestAnimationFrame; the prefix and suffix never change.
 *
 * Screen readers get the final value once (visually hidden copy); the
 * counting digits are aria-hidden so they aren't announced frame by frame.
 */
export function CountUp({
  value,
  prefix,
  suffix,
  duration = 1000,
  delay = 0,
  easing = "linear",
  threshold = 0.4,
  className,
  style,
  ...props
}: CountUpProps) {
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const numberRef = React.useRef<HTMLSpanElement>(null);
  const decimals = decimalsOf(value);
  const final = value.toFixed(decimals);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const el = numberRef.current;
    if (!root || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.textContent = (0).toFixed(decimals);
    let raf = 0;
    let timer = 0;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = easing === "ease-out" ? 1 - Math.pow(1 - t, 3) : t;
        el.textContent = (value * eased).toFixed(decimals);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        timer = window.setTimeout(run, delay);
      },
      { threshold }
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      el.textContent = final;
    };
  }, [value, duration, delay, easing, threshold, decimals, final]);

  return (
    <span
      ref={rootRef}
      className={["inline-flex items-baseline tabular-nums", className].filter(Boolean).join(" ")}
      style={style}
      {...props}
    >
      <span className="sr-only">
        {prefix}
        {final}
        {suffix}
      </span>
      <span aria-hidden className="contents">
        {prefix}
        <span ref={numberRef}>{final}</span>
        {suffix}
      </span>
    </span>
  );
}
