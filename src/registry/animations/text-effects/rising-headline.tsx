"use client";

import * as React from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

type RisingHeadlineProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** The headline. Plain text only, since it's split into one span per letter. Use "\n" for a hard line break. */
  text: string;
  /** Element to render, e.g. "h1" or "h2". */
  as?: React.ElementType;
  /** Play once on mount (the original, for a hero), or the first time it scrolls into view. */
  trigger?: "load" | "view";
  /** Seconds between one letter starting and the next. */
  stagger?: number;
  /** Seconds each letter takes to fill and rise. */
  duration?: number;
  /** How far each letter rises, in px. */
  distance?: number;
};

/**
 * Fully clipped from the top, so pulling the top inset up fills bottom → top.
 * The box is padded past the letter (-20% / -10%) so descenders, ascenders and
 * overhangs aren't cut off under tight display leading.
 */
const CLIP_HIDDEN = "inset(120% -10% -20% -10%)";
const CLIP_SHOWN = "inset(-20% -10% -20% -10%)";

/** Layout effect on the client, plain effect on the server, no warning. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * Rising headline: each letter fills from the bottom up (a clip-path wipe)
 * while rising into place, staggered left to right. Ported from the eight25
 * homepage hero (`AnimatedHeadline`).
 *
 * How it works:
 * - The text is split into words → letters. Words are `nowrap` wrappers so
 *   inline-block letters never break mid-word. Screen readers get the full
 *   text once, from a visually hidden copy.
 * - A scoped stylesheet hides the letters (clipped, pushed down) before
 *   hydration, so nothing flashes. It only applies under
 *   `prefers-reduced-motion: no-preference`, and a `<noscript>` rule shows
 *   the text when JavaScript is off.
 * - One GSAP tween runs `clip-path` + `y` on every letter with a per-letter
 *   stagger, then clears the inline styles.
 *
 * Reduced motion: the text is shown in place, no motion.
 */
export function RisingHeadline({
  text,
  as: Tag = "h1",
  trigger = "load",
  stagger = 0.11,
  duration = 1.2,
  distance = 32,
  className,
  style,
  ...props
}: RisingHeadlineProps) {
  const ref = React.useRef<HTMLElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const lines = text.split("\n");

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const finish = () => root.setAttribute("data-done", "");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    root.removeAttribute("data-done");

    const ctx = gsap.context(() => {
      const chars = root.querySelectorAll<HTMLElement>("[data-char]");
      if (chars.length === 0) return;
      const tween = gsap.fromTo(
        chars,
        { clipPath: CLIP_HIDDEN, y: distance },
        {
          clipPath: CLIP_SHOWN,
          y: 0,
          duration,
          stagger,
          ease: "power2.out",
          paused: true,
          onComplete: () => {
            finish();
            gsap.set(chars, { clearProps: "all" });
          },
        },
      );

      if (trigger === "load") {
        tween.play();
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io.disconnect();
          tween.play();
        },
        { threshold: 0.2 },
      );
      io.observe(root);
      return () => io.disconnect();
    }, root);

    return () => ctx.revert();
  }, [text, trigger, stagger, duration, distance]);

  const s = `[data-rising-headline="${id}"]`;

  return (
    <Tag
      ref={ref}
      data-rising-headline={id}
      className={cn(className)}
      style={{ "--rh-distance": `${distance}px`, ...style } as React.CSSProperties}
      {...props}
    >
      <style>{`@media (prefers-reduced-motion:no-preference){${s}:not([data-done]) [data-char]{clip-path:${CLIP_HIDDEN};transform:translateY(var(--rh-distance))}}`}</style>
      <noscript>
        <style>{`${s} [data-char]{clip-path:none!important;transform:none!important}`}</style>
      </noscript>
      <span className="sr-only">{lines.join(" ")}</span>
      <span aria-hidden className="block">
        {lines.map((line, li) => (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {line.split(/(\s+)/).filter(Boolean).map((token, ti) =>
              /^\s+$/.test(token) ? (
                // A space is a letter too, so the stagger keeps its rhythm across words.
                <span key={ti} data-char="" className="inline-block w-[0.3em]">
                  {" "}
                </span>
              ) : (
                <span key={ti} className="inline-block whitespace-nowrap">
                  {Array.from(token).map((char, ci) => (
                    <span key={ci} data-char="" className="inline-block will-change-[clip-path,transform]">
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
