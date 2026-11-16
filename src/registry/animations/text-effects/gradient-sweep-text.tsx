"use client";

import * as React from "react";

type GradientSweepTextProps = React.ComponentProps<"span"> & {
  /**
   * The colours of the band that sweeps through the text, left to right, as
   * an array or a comma-separated string. Lovable's: light blue, blue, pink,
   * red, orange.
   */
  colors?: string | string[];
  /**
   * The colour the text settles on. "currentColor" (the default) uses the
   * surrounding text colour, so the words end up matching the rest of the
   * headline.
   */
  color?: string;
  /** Sweep duration in ms. */
  duration?: number;
  /** Wait after the trigger before the sweep starts, in ms. */
  delay?: number;
  /** Easing of the sweep, any CSS timing function. */
  ease?: string;
  /** Blur the text starts with, clearing as it sweeps, in px. 0 turns it off. */
  blur?: number;
  /** "view": the first time the text scrolls into view. "load": on mount. */
  trigger?: "view" | "load";
  /** How much of the text must be visible to start, 0–1 (`trigger="view"`). */
  threshold?: number;
};

// Layout effect on the client so the text is hidden before the first paint.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * Gradient sweep text: words that are invisible until a band of colour
 * sweeps through them from right to left, leaving them in the text colour.
 * Used on the Lovable website to finish each section headline.
 *
 * How it works:
 * - The words are painted by their background (`background-clip: text`, with
 *   a transparent text fill). The background is a 300%-wide gradient in three
 *   parts: the text colour (0–33%), the colour band (33–60%) and transparent
 *   (67–100%).
 * - At rest before the trigger, `background-position: 100%` shows the
 *   transparent third, so the words are invisible but keep their space.
 * - On trigger, one Web Animation moves `background-position` from 100% to 0%
 *   over `duration` (1200ms) on `ease` (quad ease-in-out), `delay` (100ms) in,
 *   while a `blur` (1px) filter clears. The band enters at the right edge of
 *   the words and leaves through the left, and the text colour fills in
 *   behind it.
 * - The final state is server-rendered. The words are hidden in a layout
 *   effect before the first paint, so without JavaScript or under reduced
 *   motion they're just there, in the text colour. It plays once.
 */
export function GradientSweepText({
  colors = ["#82BCFF", "#2483FF", "#FF66F4", "#FF3029", "#FE7B02"],
  color = "currentColor",
  duration = 1200,
  delay = 100,
  ease = "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
  blur = 1,
  trigger = "view",
  threshold = 0.5,
  className,
  style,
  children,
  ...props
}: GradientSweepTextProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const band = (Array.isArray(colors) ? colors : colors.split(",")).map((c) => c.trim()).filter(Boolean);

  // The band spreads evenly from 40% to 60%, between the text colour (to
  // 33.33%) and transparent (from 66.67%), as on Lovable.
  const stops = band.map((c, i) => `${c} ${band.length > 1 ? 40 + (20 * i) / (band.length - 1) : 50}%`);
  const gradient = `linear-gradient(90deg, ${color} 0, ${color} 33.33%, ${[...stops, "transparent 66.67%", "transparent"].join(", ")})`;

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.style.backgroundPosition = "100% 0";
    let animation: Animation | undefined;

    const play = () => {
      animation = el.animate(
        [
          { backgroundPosition: "100% 0", filter: blur ? `blur(${blur}px)` : "none" },
          { backgroundPosition: "0% 0", filter: "none" },
        ],
        { duration, delay, easing: ease, fill: "backwards" }
      );
      // Hand the end state back to the stylesheet once the sweep starts.
      el.style.backgroundPosition = "";
    };

    if (trigger === "load") {
      play();
      return () => {
        animation?.cancel();
        el.style.backgroundPosition = "";
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        play();
      },
      { threshold }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      animation?.cancel();
      el.style.backgroundPosition = "";
    };
  }, [duration, delay, ease, blur, trigger, threshold]);

  return (
    <span
      ref={ref}
      className={[
        // The right padding (pulled back with a negative margin) keeps the
        // last glyph's overhang inside the painted background.
        "-mr-[0.1em] bg-clip-text pr-[0.1em] [-webkit-text-fill-color:transparent] forced-colors:bg-none forced-colors:[-webkit-text-fill-color:CanvasText]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundImage: gradient,
        backgroundSize: "300% 100%",
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
