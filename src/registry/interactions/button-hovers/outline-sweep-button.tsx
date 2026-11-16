import * as React from "react";
import { cn } from "@/lib/utils";

type OutlineSweepButtonProps = Omit<React.ComponentProps<"a">, "color"> & {
  /** Outline and label color at rest. */
  color?: string;
  /** Color of the pill that sweeps in. */
  fillColor?: string;
  /** Label color on the fill. */
  hoverTextColor?: string;
  /** Sweep-in duration in milliseconds. */
  duration?: number;
  /** Sweep-in easing (any CSS timing function). */
  ease?: string;
  /** Sweep-out duration in milliseconds. Quicker than the way in. */
  exitDuration?: number;
  /** Sweep-out easing (any CSS timing function). */
  exitEase?: string;
  /** Scale while pressed; 1 turns press feedback off. */
  pressScale?: number;
  /** Press dip duration in milliseconds, both ways. */
  pressDuration?: number;
  /** Press dip easing (any CSS timing function). */
  pressEase?: string;
};

/**
 * Outline sweep hover: an outlined pill whose fill sweeps in from the left
 * edge as a rounded pill, and the label flips colour exactly at the fill's
 * edge.
 *
 * How it works:
 * - The filled state is a second copy of the label on the fill colour, laid
 *   exactly over the first and revealed with `clip-path: inset(... round)`,
 *   which keeps the rounded leading edge without triggering layout. One clip
 *   reveals the fill and its label together, so they can't drift apart.
 * - The way in and the way out have their own duration and curve (by default
 *   `ease-in-out` as on eight25: 300ms in, a quicker 200ms out), on CSS transitions so leaving mid-sweep reverses from
 *   where it is. A slight press scale (on its own
 *   `pressDuration` / `pressEase` timing) confirms the click.
 */
export function OutlineSweepButton({
  color = "#6B00DF",
  fillColor = "#6B00DF",
  hoverTextColor = "#FFFFFF",
  duration = 300,
  ease = "ease-in-out",
  exitDuration = 200,
  exitEase = "ease-in-out",
  pressScale = 0.97,
  pressDuration = 160,
  pressEase = "cubic-bezier(0.23, 1, 0.32, 1)",
  className,
  style,
  children,
  ...props
}: OutlineSweepButtonProps) {
  return (
    <a
      className={cn(
        "group relative isolate inline-flex w-fit max-w-full items-center justify-center overflow-hidden",
        "rounded-full border border-(--sweep-color) bg-transparent px-[39px] py-[22px]",
        "text-center text-xl leading-none font-normal tracking-[-0.1px] text-(--sweep-color) no-underline",
        "transition-transform duration-(--sweep-press-t) ease-(--sweep-press-ease) active:scale-(--sweep-press)",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sweep-color)",
        className
      )}
      style={
        {
          "--sweep-color": color,
          "--sweep-fill": fillColor,
          "--sweep-text": hoverTextColor,
          "--sweep-in": `${duration}ms`,
          "--sweep-in-ease": ease,
          "--sweep-out": `${exitDuration}ms`,
          "--sweep-out-ease": exitEase,
          "--sweep-press": pressScale,
          "--sweep-press-t": `${pressDuration}ms`,
          "--sweep-press-ease": pressEase,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
      {/* The filled state: the same label on the fill, revealed by the clip.
          It covers the 1px border too, so its padding is 1px wider. */}
      <span
        aria-hidden
        className={cn(
          "absolute -inset-px flex items-center justify-center rounded-full bg-(--sweep-fill) px-[40px] text-(--sweep-text)",
          "[clip-path:inset(0_100%_0_0_round_9999px)]",
          "group-hover:[clip-path:inset(0_0_0_0_round_9999px)] group-focus-visible:[clip-path:inset(0_0_0_0_round_9999px)]",
          // Leaving: the quicker exit timing.
          "[transition:clip-path_var(--sweep-out)_var(--sweep-out-ease)]",
          // Arriving: the entry timing (a transition uses the state it's heading to).
          "group-hover:[transition-duration:var(--sweep-in)] group-hover:[transition-timing-function:var(--sweep-in-ease)]",
          "group-focus-visible:[transition-duration:var(--sweep-in)] group-focus-visible:[transition-timing-function:var(--sweep-in-ease)]",
          "motion-reduce:transition-none!"
        )}
      >
        {children}
      </span>
    </a>
  );
}
