import * as React from "react";
import { cn } from "@/lib/utils";

type CircleRevealButtonProps = Omit<React.ComponentProps<"a">, "color"> & {
  /** Resting background of the pill. */
  color?: string;
  /** Gradient start color (bottom-right of the 315deg gradient). */
  gradientFrom?: string;
  /** Gradient end color (top-left of the 315deg gradient). */
  gradientTo?: string;
  /** Label color. */
  textColor?: string;
  /** Reveal duration in milliseconds. */
  duration?: number;
};

/**
 * Circle reveal hover — a diagonal gradient opens out of the center of the
 * pill as an expanding circle until it covers the whole button.
 *
 * The gradient layer sits under the label and is clipped with
 * `circle(0% at 50% 50%)`. On hover it animates to `circle(100%)`; a
 * percentage radius is measured against the box diagonal, so 100% always
 * reaches every corner regardless of the button's width. `clip-path` is
 * composited, so the reveal doesn't trigger layout or paint on the pill.
 */
export function CircleRevealButton({
  color = "#E3308C",
  gradientFrom = "#410051",
  gradientTo = "#E3308C",
  textColor = "#FFFFFF",
  duration = 500,
  className,
  style,
  children,
  ...props
}: CircleRevealButtonProps) {
  return (
    <a
      className={cn(
        "group relative isolate inline-flex w-fit max-w-full items-center justify-center overflow-hidden rounded-[120px]",
        "bg-(--reveal-color) px-[30px] py-[17px] text-center text-base leading-none font-bold text-(--reveal-text) no-underline",
        "outline-none focus-visible:ring-2 focus-visible:ring-(--reveal-color) focus-visible:ring-offset-2",
        className
      )}
      style={
        {
          "--reveal-color": color,
          "--reveal-from": gradientFrom,
          "--reveal-to": gradientTo,
          "--reveal-text": textColor,
          "--reveal-duration": `${duration}ms`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10",
          "bg-[linear-gradient(315deg,var(--reveal-from)_0%,var(--reveal-to)_100%)]",
          "[clip-path:circle(0%_at_50%_50%)] will-change-[clip-path]",
          "transition-[clip-path] duration-(--reveal-duration) ease-[cubic-bezier(0.4,0,0.2,1)]",
          "group-hover:[clip-path:circle(100%_at_50%_50%)] group-focus-visible:[clip-path:circle(100%_at_50%_50%)]",
          "motion-reduce:transition-none"
        )}
      />
      <span>{children}</span>
    </a>
  );
}
