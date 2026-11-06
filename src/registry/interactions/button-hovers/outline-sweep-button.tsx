import * as React from "react";
import { cn } from "@/lib/utils";

type OutlineSweepButtonProps = Omit<React.ComponentProps<"a">, "color"> & {
  /** Outline and label color at rest. */
  color?: string;
  /** Color of the pill that sweeps in. */
  fillColor?: string;
  /** Label color once the fill has covered the button. */
  hoverTextColor?: string;
  /** Sweep duration in milliseconds. The label color change runs 7/3 as long. */
  duration?: number;
};

/**
 * Outline sweep hover — an outlined pill whose fill sweeps in from the left
 * edge as a rounded pill, while the label fades to white on a slower
 * ease-in-out-quint curve so it flips as the fill passes the middle.
 *
 * The original grows the fill's `width`; this version reveals it with
 * `clip-path: inset(... round)` instead, which keeps the rounded leading edge
 * without triggering layout on every frame.
 */
export function OutlineSweepButton({
  color = "#6B00DF",
  fillColor = "#6B00DF",
  hoverTextColor = "#FFFFFF",
  duration = 300,
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
        "transition-colors duration-(--sweep-text-duration) ease-[cubic-bezier(0.86,0,0.07,1)]",
        "hover:text-(--sweep-text) focus-visible:text-(--sweep-text)",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sweep-color)",
        "motion-reduce:transition-none",
        className
      )}
      style={
        {
          "--sweep-color": color,
          "--sweep-fill": fillColor,
          "--sweep-text": hoverTextColor,
          "--sweep-duration": `${duration}ms`,
          "--sweep-text-duration": `${Math.round((duration * 7) / 3)}ms`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "absolute -inset-px -z-10 rounded-full bg-(--sweep-fill)",
          "[clip-path:inset(0_100%_0_0_round_9999px)]",
          "group-hover:[clip-path:inset(0_0_0_0_round_9999px)] group-focus-visible:[clip-path:inset(0_0_0_0_round_9999px)]",
          "transition-[clip-path] duration-(--sweep-duration) ease-[cubic-bezier(0.42,0,0.58,1)]",
          "motion-reduce:transition-none"
        )}
      />
      {children}
    </a>
  );
}
