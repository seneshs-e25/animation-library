import * as React from "react";
import { cn } from "@/lib/utils";

type CornerBloomButtonProps = Omit<React.ComponentProps<"a">, "color"> & {
  /** Resting background of the pill. */
  color?: string;
  /** Color of the ellipse that blooms in on hover. */
  bloomColor?: string;
  /** Label and arrow color. */
  textColor?: string;
  /** Bloom-in duration in milliseconds. */
  duration?: number;
  /** Bloom-in easing (any CSS timing function). */
  ease?: string;
  /** Bloom-out duration in milliseconds. Quicker than the way in. */
  exitDuration?: number;
  /** Bloom-out easing (any CSS timing function). */
  exitEase?: string;
  /** Scale while pressed; 1 turns press feedback off. */
  pressScale?: number;
  /** Press dip duration in milliseconds, both ways. */
  pressDuration?: number;
  /** Press dip easing (any CSS timing function). */
  pressEase?: string;
  /** Reduced motion only: how long the bloom fades in and out, in milliseconds. */
  reducedFade?: number;
  /** Reduced motion only: the fade's easing (any CSS timing function). */
  reducedFadeEase?: string;
  /** Show the trailing arrow. */
  arrow?: boolean;
};

/**
 * Corner bloom hover — an ellipse grows out of a point just past the
 * bottom-right corner until it covers the pill.
 *
 * The ellipse is sized to the button + 100px on each axis and anchored 50px
 * outside the bottom-right corner, so at full size it's centered and covers
 * every corner of the pill. It scales from that corner (transform only, GPU),
 * which is visually identical to growing its width/height from 0.
 *
 * The way in and the way out have their own duration and curve (the way out
 * is quicker), on CSS transitions so leaving mid-bloom reverses from where
 * it is. A slight press scale (`pressDuration` / `pressEase`) confirms the click.
 *
 * Reduced motion: no growth and no press; the bloom fades in and out over
 * `reducedFade` (150ms, `ease`) instead, so the change is still soft
 * rather than a hard swap.
 */
export function CornerBloomButton({
  color = "#308970",
  bloomColor = "#1C212B",
  textColor = "#F2F1EE",
  duration = 300,
  ease = "cubic-bezier(0.23, 1, 0.32, 1)",
  exitDuration = 200,
  exitEase = "cubic-bezier(0.32, 0.72, 0, 1)",
  pressScale = 0.97,
  pressDuration = 160,
  pressEase = "cubic-bezier(0.23, 1, 0.32, 1)",
  reducedFade = 150,
  reducedFadeEase = "ease",
  arrow = true,
  className,
  style,
  children,
  ...props
}: CornerBloomButtonProps) {
  return (
    <a
      className={cn(
        "group relative isolate inline-flex w-fit max-w-full items-center justify-center gap-[15px] overflow-hidden rounded-[50px]",
        "bg-(--bloom-color) px-[30px] py-[18px] text-lg leading-[1.2] font-medium text-(--bloom-text) no-underline",
        // Keeps the rounded clip in Safari while the child transforms.
        "[mask-image:radial-gradient(white,black)]",
        "transition-transform duration-(--bloom-press-t) ease-(--bloom-press-ease) active:scale-(--bloom-press)",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        "outline-none focus-visible:ring-2 focus-visible:ring-(--bloom-color) focus-visible:ring-offset-2",
        className
      )}
      style={
        {
          "--bloom-color": color,
          "--bloom-fill": bloomColor,
          "--bloom-text": textColor,
          "--bloom-in": `${duration}ms`,
          "--bloom-in-ease": ease,
          "--bloom-out": `${exitDuration}ms`,
          "--bloom-out-ease": exitEase,
          "--bloom-press": pressScale,
          "--bloom-press-t": `${pressDuration}ms`,
          "--bloom-press-ease": pressEase,
          "--bloom-fade": `${reducedFade}ms`,
          "--bloom-fade-ease": reducedFadeEase,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-[50px] -bottom-[50px] -z-10 h-[calc(100%+100px)] w-[calc(100%+100px)]",
          "origin-bottom-right scale-0 rounded-[50%] bg-(--bloom-fill)",
          // Leaving: the quicker exit timing.
          "[transition-property:scale,transform] [transition-duration:var(--bloom-out)] [transition-timing-function:var(--bloom-out-ease)]",
          // Arriving: the entry timing (a transition uses the state it's heading to).
          "group-hover:[transition-duration:var(--bloom-in)] group-hover:[transition-timing-function:var(--bloom-in-ease)]",
          "group-focus-visible:[transition-duration:var(--bloom-in)] group-focus-visible:[transition-timing-function:var(--bloom-in-ease)]",
          "group-hover:scale-100 group-focus-visible:scale-100",
          // Reduced motion: no growth, just a quick fade of the full bloom.
          "motion-reduce:scale-100 motion-reduce:opacity-0 motion-reduce:[transition:opacity_var(--bloom-fade)_var(--bloom-fade-ease)]!",
          "motion-reduce:group-hover:opacity-100 motion-reduce:group-focus-visible:opacity-100"
        )}
      />
      <span className="min-w-0 text-center">{children}</span>
      {arrow && (
        <svg
          aria-hidden
          viewBox="0 0 18 15"
          fill="none"
          className="h-[15px] w-[18px] shrink-0"
        >
          <path
            d="M1 7.5H17M17 7.5L9.9624 14M17 7.5L9.9624 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </a>
  );
}
