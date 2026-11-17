"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type BlurHighlightProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /**
   * The copy. Wrap each key phrase in square brackets to highlight it:
   * "Our [cutting-edge technology] transforms how businesses [analyze data]."
   */
  text: string;
  /** Element to render, e.g. "p", "h2". */
  as?: React.ElementType;
  /** Fill colour of the highlight. */
  highlightColor?: string;
  /** Text colour inside a highlight. Left out, it keeps the paragraph's colour. */
  highlightTextColor?: string;
  /** Which edge the highlight sweeps in from. */
  direction?: "left" | "right" | "top" | "bottom";
  /** Blur in px before it reveals. */
  blur?: number;
  /** Opacity before it reveals (0 = invisible). */
  inactiveOpacity?: number;
  /** Seconds before the blur-in starts. */
  blurDelay?: number;
  /** Seconds the blur-in takes. */
  blurDuration?: number;
  /** Easing for the blur-in, as a CSS timing function. */
  blurEase?: string;
  /** Seconds after the blur-in starts that the highlights start sweeping. */
  highlightDelay?: number;
  /** Seconds each highlight takes to sweep across. */
  highlightDuration?: number;
  /** Easing for the highlight sweep, as a CSS timing function. */
  highlightEase?: string;
  /** Seconds between one highlight starting and the next. 0 sweeps them all together. */
  highlightStagger?: number;
  /** Play once (true), or reverse when it leaves the viewport and play again on the way back (false). */
  once?: boolean;
  /** Share of the element that must be visible (0-1) before it plays. */
  amount?: number;
};

type Part = { text: string; mark: boolean };

/** "a [b] c" -> [{a}, {b, mark}, {c}]. An unclosed "[" is kept as text. */
function parse(text: string): Part[] {
  const parts: Part[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), mark: false });
    parts.push({ text: m[1], mark: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), mark: false });
  return parts;
}

/** background-size / position for each sweep direction, hidden -> shown. */
const SWEEP = {
  left: { from: "0% 100%", position: "0% 0%" },
  right: { from: "0% 100%", position: "100% 0%" },
  top: { from: "100% 0%", position: "0% 0%" },
  bottom: { from: "100% 0%", position: "0% 100%" },
} as const;

/**
 * Blur highlight: a paragraph that comes into focus (blur and opacity to
 * clear) as it scrolls into view, then a marker-style highlight sweeps across
 * each key phrase.
 *
 * How it works:
 * - Plain CSS transitions keyed off a `data-active` attribute, which an
 *   IntersectionObserver sets when `amount` of the element is on screen (the
 *   viewport's bottom 20% doesn't count, so it plays a little after the
 *   paragraph appears).
 * - The whole element transitions `filter: blur()` and `opacity`. One filter
 *   on one element is cheap; per-word blur would be a layer per word.
 * - Each phrase is a `<mark>` whose fill is a solid `linear-gradient` with
 *   `background-size` growing from 0% to 100% on one axis.
 *   `box-decoration-break: clone` makes a phrase that wraps onto two lines get
 *   a rounded, padded fill on each line, and the sweep runs line by line.
 * - Delays only apply on the way in: leaving (with `once` off) reverses
 *   straight away, so it's reset by the time it's out of view.
 * - Before hydration the hidden state is set by CSS, only under
 *   `prefers-reduced-motion: no-preference`; a `<noscript>` rule shows it.
 *
 * Reduced motion: no blur or fade; the text and highlights are shown at rest.
 */
export function BlurHighlight({
  text,
  as: Tag = "p",
  highlightColor = "#7C3AED",
  highlightTextColor,
  direction = "left",
  blur = 8,
  inactiveOpacity = 0,
  blurDelay = 0,
  blurDuration = 0.8,
  blurEase = "cubic-bezier(0.23, 1, 0.32, 1)",
  highlightDelay = 0.4,
  highlightDuration = 1,
  highlightEase = "cubic-bezier(0.32, 0.72, 0, 1)",
  highlightStagger = 0,
  once = false,
  amount = 0.5,
  className,
  style,
  ...props
}: BlurHighlightProps) {
  const ref = React.useRef<HTMLElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const parts = React.useMemo(() => parse(text), [text]);

  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.setAttribute("data-active", "");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        // `amount` of the element, or `amount` of the viewport for an element
        // taller than the viewport (on a phone), which could never show half of itself.
        const visible = entry.intersectionRect.height;
        const needed = Math.min(entry.boundingClientRect.height, entry.rootBounds?.height ?? Infinity) * amount;
        if (entry.isIntersecting && visible >= needed - 1) {
          root.setAttribute("data-active", "");
          if (once) io.disconnect();
        } else if (!once) {
          root.removeAttribute("data-active");
        }
      },
      // Bottom 20% of the viewport doesn't count, so it plays once it's settled in view.
      // Fine thresholds so the check above re-runs as it scrolls.
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20), rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [once, amount]);

  const sweep = SWEEP[direction];
  const s = `[data-blur-highlight="${id}"]`;
  const css =
    `@media (prefers-reduced-motion:no-preference){` +
    `${s}{opacity:${inactiveOpacity};filter:blur(${blur}px);transition:opacity ${blurDuration}s ${blurEase},filter ${blurDuration}s ${blurEase}}` +
    `${s}[data-active]{opacity:1;filter:blur(0px);transition-delay:${blurDelay}s}` +
    `${s} .bh-mark{background-size:${sweep.from};transition:background-size ${highlightDuration}s ${highlightEase}}` +
    `${s}[data-active] .bh-mark{background-size:100% 100%;transition-delay:calc(${blurDelay + highlightDelay}s + var(--i) * ${highlightStagger}s)}` +
    `}`;

  let markIndex = 0;

  return (
    <>
      {/* Siblings, not children, so the text content stays just the copy. */}
      <style>{css}</style>
      <noscript>
        <style>{`${s}{opacity:1!important;filter:none!important}${s} .bh-mark{background-size:100% 100%!important}`}</style>
      </noscript>
      <Tag ref={ref} data-blur-highlight={id} className={cn(className)} style={style} {...props}>
        {parts.map((part, i) =>
          part.mark ? (
            <mark
              key={i}
              className="bh-mark"
              style={
                {
                  "--i": markIndex++,
                  color: highlightTextColor ?? "inherit",
                  backgroundColor: "transparent",
                  backgroundImage: `linear-gradient(${highlightColor}, ${highlightColor})`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: sweep.position,
                  borderRadius: "0.2em",
                  padding: "0.02em 0.25em",
                  boxDecorationBreak: "clone",
                  WebkitBoxDecorationBreak: "clone",
                } as React.CSSProperties
              }
            >
              {part.text}
            </mark>
          ) : (
            <React.Fragment key={i}>{part.text}</React.Fragment>
          ),
        )}
      </Tag>
    </>
  );
}
