"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type WaveHeadlineProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** The headline. Plain text only, since it's split into one span per letter. Use "\n" for a hard line break. */
  text: string;
  /** Element to render, e.g. "h1" or "h2". */
  as?: React.ElementType;
  /** Play the first time any part of it is in view (the original), or straight away on mount. */
  trigger?: "view" | "load";
  /** Wait before the first letter starts, in ms. */
  delay?: number;
  /** Gap between one letter starting and the next, in ms. Spaces keep their slot. */
  stagger?: number;
  /** How long each letter takes, in ms. */
  duration?: number;
  /** How far below its seat a letter starts, in em. */
  rise?: number;
  /** How far past its seat a letter overshoots before settling, in em. */
  overshoot?: number;
  /** Blur a letter arrives with, in px. */
  blur?: number;
};

/**
 * Wave headline: a ripple crosses the line left to right and each letter
 * rises out of it: from below its seat, blurred to a cloud and invisible, up
 * through its baseline to a small overshoot, then settles. The stagger is the
 * wave. Ported from the NetApp AI homepage hero (`WaveHeadline` +
 * `hero-headline-wave-char`).
 *
 * How it works:
 * - The text is split into lines → words → letters. Each word is an
 *   unbreakable inline-block (so a narrow headline never breaks mid-word);
 *   spaces stay as text but keep a slot, so the ripple holds its rhythm
 *   across gaps. Screen readers get the headline once, from a hidden copy.
 * - Every letter runs one CSS keyframe with `animation-delay: delay + slot ×
 *   stagger` and `fill-mode: backwards`, so it's held hidden through its own
 *   delay. The animations are armed paused, and released together by a
 *   `data-in-view` stamp on the heading.
 * - Without scripting the animations are released outright; under reduced
 *   motion there's no animation at all, just the settled line.
 */
export function WaveHeadline({
  text,
  as: Tag = "h1",
  trigger = "view",
  delay = 470,
  stagger = 42,
  duration = 500,
  rise = 0.42,
  overshoot = 0.06,
  blur = 14,
  className,
  style,
  ...props
}: WaveHeadlineProps) {
  const ref = React.useRef<HTMLElement>(null);
  // "load" is stamped from the first render, so the CSS wave starts with the
  // server HTML; "view" waits for the observer below.
  const [inView, setInView] = React.useState(trigger === "load");

  React.useEffect(() => {
    const el = ref.current;
    if (!el || trigger === "load") return;
    // One-shot: stamp the first time any part of it is visible, then stop watching.
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      setInView(true);
      io.disconnect();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [trigger]);

  const lines = splitWave(text);

  return (
    <Tag
      ref={ref}
      data-wave-headline=""
      data-in-view={inView ? "" : undefined}
      className={cn(className)}
      style={
        {
          "--wh-delay": `${delay}ms`,
          "--wh-stagger": `${stagger}ms`,
          "--wh-duration": `${duration}ms`,
          "--wh-rise": `${rise}em`,
          "--wh-overshoot": `${-overshoot}em`,
          "--wh-blur": `${blur}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <style>{`
@keyframes wave-headline-char{0%{opacity:0;translate:0 var(--wh-rise);filter:blur(var(--wh-blur))}55%{opacity:1}70%{translate:0 var(--wh-overshoot);filter:blur(0)}100%{opacity:1;translate:0 0;filter:blur(0)}}
@media (prefers-reduced-motion:no-preference){
[data-wave-headline] [data-wave-char]{animation:wave-headline-char var(--wh-duration) cubic-bezier(.22,.61,.36,1) backwards;animation-delay:calc(var(--wh-delay) + var(--wh-slot) * var(--wh-stagger));animation-play-state:paused}
[data-wave-headline][data-in-view] [data-wave-char]{animation-play-state:running}
}
@media (scripting:none){[data-wave-headline] [data-wave-char]{animation-play-state:running}}`}</style>
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      <span aria-hidden className="block">
        {lines.map((pieces, li) => (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {pieces.map((chars, pi) =>
              chars === null ? (
                " "
              ) : (
                <span key={pi} className="inline-block whitespace-nowrap">
                  {chars.map(({ char, slot }) => (
                    <span
                      key={slot}
                      data-wave-char=""
                      className="inline-block"
                      style={{ "--wh-slot": slot } as React.CSSProperties}
                    >
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

type WaveChar = { char: string; slot: number };

/**
 * Lines → words → letters, one slot per character counted across words and
 * lines in reading order. A space takes a slot but no span (`null`).
 */
function splitWave(text: string): (WaveChar[] | null)[][] {
  let slot = 0;
  const lines: (WaveChar[] | null)[][] = [];
  for (const line of text.split("\n")) {
    const pieces: (WaveChar[] | null)[] = [];
    for (const piece of line.split(/(\s+)/)) {
      if (!piece) continue;
      if (/^\s+$/.test(piece)) {
        slot += 1;
        pieces.push(null);
        continue;
      }
      const chars: WaveChar[] = [];
      for (const char of piece) chars.push({ char, slot: slot++ });
      pieces.push(chars);
    }
    lines.push(pieces);
  }
  return lines;
}
