"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ScrollTextRevealProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** The text to reveal. Plain text only, since it's split into spans. */
  text: string;
  /** Element to render, e.g. "h2" or "p". */
  as?: React.ElementType;
  /** Reveal one character at a time, or one word at a time. */
  split?: "char" | "word";
  /** Opacity of text that hasn't been revealed yet. */
  dimOpacity?: number;
  /**
   * Where the reveal starts and ends, as % of the element's `cover` scroll
   * range: 0 = its top meets the bottom of the viewport, 100 = its bottom
   * leaves the top.
   */
  start?: number;
  end?: number;
  /** Fade the block up once as it enters the viewport. */
  rise?: boolean;
  /** Distance the block rises, in px. */
  riseDistance?: number;
  /** Duration of the rise, in ms. */
  riseDuration?: number;
};

/**
 * Scroll text reveal: a block of text sits dimmed and fills in, character by
 * character, as it scrolls through the viewport. Used on the NetApp AI site
 * for a stat callout.
 *
 * How it works:
 * - The text is split into spans (screen readers get the full text once,
 *   from a visually hidden copy). The root defines a CSS `view-timeline`.
 * - Every span runs the same `opacity: dim → 1` keyframes on that timeline,
 *   each over its own slice of `animation-range: cover start% … end%`, so
 *   the fill sweeps through the text in reading order. No scroll listeners:
 *   the browser drives it on the compositor.
 * - Optionally the whole block fades up 48px over 1.4s the first time it
 *   enters the viewport (an IntersectionObserver adds one attribute). It is
 *   only hidden after hydration and only when it starts below the fold, so
 *   the server HTML always shows the text and a block already in view at
 *   load doesn't flash.
 *
 * Browsers without scroll-driven animations (Firefox today) show the text
 * at full opacity. Reduced motion: text is fully shown, with no rise.
 */
export function ScrollTextReveal({
  text,
  as: Tag = "h2",
  split = "char",
  dimOpacity = 0.2,
  start = 20,
  end = 45,
  rise = true,
  riseDistance = 48,
  riseDuration = 1400,
  className,
  style,
  ...props
}: ScrollTextRevealProps) {
  const ref = React.useRef<HTMLElement>(null);
  // "idle" until mounted, so server HTML (and a page whose JS hasn't loaded)
  // shows the text. Below the fold it goes "pending" (hidden) and then
  // "shown" (rises in) when it enters the viewport.
  const [phase, setPhase] = React.useState<"idle" | "pending" | "shown">("idle");
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const timeline = `--str-${id}`;

  React.useEffect(() => {
    const el = ref.current;
    if (!rise || !el) return;
    let first = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (first) {
          first = false;
          // Already on screen when it mounts: leave it as it is rather than
          // hide text the reader can see and fade it back in.
          if (entry.isIntersecting) io.disconnect();
          else setPhase("pending");
          return;
        }
        if (entry.isIntersecting) {
          setPhase("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rise]);

  // Split into words, keeping the spaces so the text wraps naturally.
  const tokens = text.split(/(\s+)/).filter(Boolean);
  const units = split === "word" ? tokens : Array.from(text);
  const count = units.length;
  const step = (end - start) / Math.max(count, 1);

  const s = `[data-scroll-text-reveal="${id}"]`;

  return (
    <Tag
      ref={ref}
      className={cn("whitespace-pre-wrap", className)}
      style={
        {
          "--str-dim": dimOpacity,
          "--str-rise": `${riseDistance}px`,
          "--str-rise-duration": `${riseDuration}ms`,
          ...style,
        } as React.CSSProperties
      }
      data-scroll-text-reveal={id}
      data-rise={rise && phase !== "idle" ? phase : undefined}
      {...props}
    >
      <style>{`
@keyframes str-fill{from{opacity:var(--str-dim)}to{opacity:1}}
@keyframes str-rise{from{opacity:0;translate:0 var(--str-rise)}to{opacity:1;translate:0 0}}
@media (prefers-reduced-motion:no-preference){
${s}{view-timeline:${timeline} block}
@supports (animation-timeline:view()){
${s} [data-unit]{opacity:var(--str-dim);animation:str-fill 1ms linear both;animation-timeline:${timeline};animation-range:cover var(--f) cover var(--t)}
}
${s}[data-rise=pending]>[data-lines]{opacity:0;translate:0 var(--str-rise)}
${s}[data-rise=shown]>[data-lines]{animation:str-rise var(--str-rise-duration) cubic-bezier(.25,.46,.45,.94) both}
}`}</style>
      <span className="sr-only">{text}</span>
      <span aria-hidden data-lines className="block">
        {units.map((unit, i) => (
          <span
            key={i}
            data-unit
            style={
              {
                "--f": `${(start + step * i).toFixed(3)}%`,
                "--t": `${(start + step * (i + 1)).toFixed(3)}%`,
              } as React.CSSProperties
            }
          >
            {unit}
          </span>
        ))}
      </span>
    </Tag>
  );
}
