"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type StaggeredTextProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** The text. Plain text only, since it's split into spans. Use "\n" for a hard line break. */
  text: string;
  /** Element to render, e.g. "h1" or "h2". */
  as?: React.ElementType;
  /** What staggers in: each letter, each word, or each rendered line. */
  split?: "letter" | "word" | "line";
  /** Play the first time 20% of it is in view, or straight away on mount. */
  trigger?: "view" | "load";
  /** Wait before the first piece starts, in ms. */
  delay?: number;
  /** Gap between one piece starting and the next, in ms. */
  stagger?: number;
  /** How long each piece takes, in ms. */
  duration?: number;
  /** Easing for each piece, as a CSS timing function. */
  easing?: string;
  /** How far below its seat a piece starts, in em. */
  distance?: number;
  /** Blur a piece arrives with, in px. 0 for a plain fade and rise. */
  blur?: number;
};

/** Layout effect on the client, plain effect on the server, no warning. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * Staggered text: the text arrives piece by piece (letters, words or the
 * lines the browser rendered), each one fading up from slightly below its
 * seat and sharpening out of a blur.
 *
 * How it works:
 * - The text is split into lines → words → letters. Words are unbreakable
 *   inline-blocks, so a narrow heading only wraps between words. Screen
 *   readers get the text once, from a visually hidden copy.
 * - Every piece runs one CSS keyframe with
 *   `animation-delay: delay + slot × stagger` and `fill-mode: backwards`, so
 *   it's held hidden until its turn. The animations are armed paused and
 *   released together by a `data-play` stamp on the element.
 * - Letter and word slots are counted in reading order at render. Line slots
 *   depend on the width, so in line mode each word's rendered row is measured
 *   just before release and written to its `--st-slot`.
 * - Without scripting the animations are released outright; under reduced
 *   motion there's no animation, just the settled text.
 */
export function StaggeredText({
  text,
  as: Tag = "h1",
  split = "word",
  trigger = "view",
  delay = 0,
  stagger = 80,
  duration = 700,
  easing = "cubic-bezier(0.23, 1, 0.32, 1)",
  distance = 0.4,
  blur = 8,
  className,
  style,
  ...props
}: StaggeredTextProps) {
  const ref = React.useRef<HTMLElement>(null);
  const [play, setPlay] = React.useState(false);

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    setPlay(false);

    const release = () => {
      if (split === "line") measureLines(root);
      setPlay(true);
    };

    if (trigger === "load") {
      release();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        release();
      },
      { threshold: 0.2 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [text, split, trigger]);

  const lines = splitText(text, split);

  return (
    <Tag
      ref={ref}
      data-staggered-text=""
      data-play={play ? "" : undefined}
      className={cn(className)}
      style={
        {
          "--st-delay": `${delay}ms`,
          "--st-stagger": `${stagger}ms`,
          "--st-duration": `${duration}ms`,
          "--st-ease": easing,
          "--st-distance": `${distance}em`,
          "--st-blur": `${blur}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <style>{`
@keyframes staggered-text-in{from{opacity:0;translate:0 var(--st-distance);filter:blur(var(--st-blur))}to{opacity:1;translate:0 0;filter:blur(0)}}
@media (prefers-reduced-motion:no-preference){
[data-staggered-text] [data-st-piece]{animation:staggered-text-in var(--st-duration) var(--st-ease) backwards;animation-delay:calc(var(--st-delay) + var(--st-slot,0) * var(--st-stagger));animation-play-state:paused}
[data-staggered-text][data-play] [data-st-piece]{animation-play-state:running}
}
@media (scripting:none){[data-staggered-text] [data-st-piece]{animation-play-state:running}}`}</style>
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      <span aria-hidden className="block">
        {lines.map((words, li) => (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {words.map((word, wi) => (
              <React.Fragment key={wi}>
                {wi > 0 && " "}
                {split === "letter" ? (
                  <span className="inline-block whitespace-nowrap">
                    {word.letters.map(({ char, slot }) => (
                      <span
                        key={slot}
                        data-st-piece=""
                        className="inline-block"
                        style={{ "--st-slot": slot } as React.CSSProperties}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span
                    data-st-piece=""
                    data-st-word=""
                    className="inline-block whitespace-nowrap"
                    // Line slots are written after measuring, so React leaves them alone.
                    style={split === "word" ? ({ "--st-slot": word.slot } as React.CSSProperties) : undefined}
                  >
                    {word.text}
                  </span>
                )}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}

type Word = { text: string; slot: number; letters: { char: string; slot: number }[] };

/**
 * Lines → words, with slots counted in reading order: one per word, or one
 * per letter (a space keeps a letter slot, so the rhythm holds across words).
 */
function splitText(text: string, split: "letter" | "word" | "line"): Word[][] {
  let wordSlot = 0;
  let letterSlot = 0;
  return text.split("\n").map((line) =>
    line
      .split(/\s+/)
      .filter(Boolean)
      .map((w, wi) => {
        if (wi > 0) letterSlot += 1;
        const letters = Array.from(w).map((char) => ({ char, slot: split === "letter" ? letterSlot++ : 0 }));
        return { text: w, slot: wordSlot++, letters };
      }),
  );
}

/** Gives each word the index of the row it rendered on, as `--st-slot`. */
function measureLines(root: HTMLElement) {
  let row = -1;
  let lastTop = -Infinity;
  root.querySelectorAll<HTMLElement>("[data-st-word]").forEach((el) => {
    // offsetTop ignores the `translate` the word starts with.
    const top = el.offsetTop;
    if (top > lastTop + el.offsetHeight / 2) {
      row += 1;
      lastTop = top;
    }
    el.style.setProperty("--st-slot", String(row));
  });
}
