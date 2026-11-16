"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type PillWord = {
  /** The word shown in the pill. */
  text: string;
  /** Pill background colour while this word shows. */
  background: string;
  /** Dot colour while this word shows. */
  dot: string;
};

type RotatingPillHeadlineProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** Text before the pill. */
  before?: string;
  /** The words the pill cycles through, each with its own colours. */
  words: PillWord[];
  /** Text after the pill. */
  after?: string;
  /** Element to render, e.g. "h1". */
  as?: React.ElementType;
  /** Milliseconds each word stays before the next one. */
  interval?: number;
  /** Milliseconds for the pill to resize to the new word. */
  duration?: number;
  /** Easing for the resize, as a CSS timing function. */
  easing?: string;
  /** Milliseconds for the colours to change. 0 swaps them with the word, as on Notion. */
  colorDuration?: number;
  /** What screen readers hear in place of the pill. Defaults to the words, comma separated. */
  srLabel?: string;
};

/**
 * Rotating pill headline: a headline with a coloured pill in the middle of a
 * line. Every few seconds the pill's word changes, its colours change with
 * it, and the pill resizes to fit the new word while the rest of the line
 * shifts along. Recreated from the "Where teams and agents [Ship] together."
 * hero on notion.com.
 *
 * How it works:
 * - The word sits in a measuring span inside a clipping label. On each change
 *   the new word is measured and the label's `width` set to it in pixels, so
 *   CSS transitions the width. A wider word is clipped on the right until the
 *   label opens up; a narrower one leaves room that closes.
 * - The pill's padding, dot and gap are in `em`, so it scales with the
 *   headline's font size. It's an inline-flex box on the text baseline, so it
 *   wraps with the words around it.
 * - A ResizeObserver re-measures the word when fonts load or the size changes.
 * - It pauses while off screen, and on mount renders at the word's natural
 *   width (no transition) so nothing animates on load.
 * - Screen readers get the sentence once with `srLabel` in place of the
 *   pill; the rotating pill is `aria-hidden`, so changes aren't announced.
 *
 * Reduced motion: no rotation. The first word shows, still.
 */
export function RotatingPillHeadline({
  before = "",
  words,
  after = "",
  as: Tag = "h1",
  interval = 2500,
  duration = 300,
  easing = "cubic-bezier(0.86, 0, 0.07, 1)",
  colorDuration = 0,
  srLabel,
  className,
  style,
  ...props
}: RotatingPillHeadlineProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const labelRef = React.useRef<HTMLSpanElement>(null);
  const measureRef = React.useRef<HTMLSpanElement>(null);
  const [index, setIndex] = React.useState(0);
  const count = words.length;
  const word = words[index % Math.max(count, 1)];

  // Advance on a timer, only while on screen and motion is allowed.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || count < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer = 0;
    let visible = false;
    const stop = () => window.clearInterval(timer);
    const start = () => {
      stop();
      if (!visible || reduce.matches) return;
      timer = window.setInterval(() => setIndex((i) => (i + 1) % count), interval);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    io.observe(root);
    const onReduce = () => {
      if (reduce.matches) setIndex(0);
      start();
    };
    reduce.addEventListener("change", onReduce);
    return () => {
      stop();
      io.disconnect();
      reduce.removeEventListener("change", onReduce);
    };
  }, [count, interval]);

  // Size the label to the word. Set before paint, so the transition runs
  // from the old width to the new one.
  React.useLayoutEffect(() => {
    const label = labelRef.current;
    const measure = measureRef.current;
    if (!label || !measure) return;
    const fit = () => {
      label.style.width = `${measure.getBoundingClientRect().width}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(measure);
    return () => ro.disconnect();
  }, [word?.text]);

  if (!word) return null;

  const colorTransition = colorDuration > 0 ? `background-color ${colorDuration}ms ease` : undefined;

  return (
    <Tag ref={rootRef} className={cn(className)} style={style} {...props}>
      {before && `${before} `}
      <span className="sr-only">{srLabel ?? words.map((w) => w.text).join(", ")}</span>
      <span
        aria-hidden
        className="inline-flex items-baseline gap-[0.167em] rounded-full px-[0.389em] py-[0.111em] align-baseline text-[0.75em] leading-[1.21] tracking-[-0.0278em]"
        style={{ backgroundColor: word.background, transition: colorTransition }}
      >
        <span
          className="block size-[0.444em] shrink-0 self-center rounded-full"
          style={{ backgroundColor: word.dot, transition: colorTransition }}
        />
        <span
          ref={labelRef}
          className="inline-block overflow-hidden whitespace-nowrap motion-safe:transition-[width]"
          style={{ transitionDuration: `${duration}ms`, transitionTimingFunction: easing }}
        >
          <span ref={measureRef} className="inline-block">
            {word.text}
          </span>
        </span>
      </span>
      {after && ` ${after}`}
    </Tag>
  );
}
