import * as React from "react";
import { cn } from "@/lib/utils";

type FillSweepButtonProps = Omit<React.ComponentProps<"a">, "color"> & {
  /** Edge the fill sweeps in from. */
  direction?: "left" | "bottom";
  /** Sweep duration in milliseconds. */
  duration?: number;
  /** Label color at rest. */
  textColor?: string;
  /** Border color at rest. */
  borderColor?: string;
  /** Color of the fill layer. */
  fillColor?: string;
  /** Label color once the fill has covered the button. */
  hoverTextColor?: string;
};

/**
 * Fill sweep hover — a solid layer scales in from one edge while the label
 * inverts. Transform-only (GPU), hover gated to real pointers, and the
 * motion is removed under prefers-reduced-motion.
 *
 * Renders an <a>, like the other button hovers. The focus outline uses the
 * fill color with an offset, so it works on any background.
 */
export function FillSweepButton({
  direction = "left",
  duration = 400,
  textColor = "#FFFFFF",
  borderColor = "rgba(255, 255, 255, 0.15)",
  fillColor = "#fafafa",
  hoverTextColor = "#0a0a0a",
  className,
  style,
  children,
  ...props
}: FillSweepButtonProps) {
  return (
    <a
      className={cn(
        "group relative isolate inline-flex w-fit max-w-full items-center justify-center overflow-hidden rounded-full",
        "border border-(--sweep-border) px-6 py-3 text-center text-sm font-medium text-(--sweep-rest) no-underline",
        "transition-colors duration-(--sweep-duration) ease-[cubic-bezier(0.23,1,0.32,1)]",
        "hover:text-(--sweep-text) focus-visible:text-(--sweep-text)",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sweep-fill)",
        "motion-reduce:transition-none",
        className
      )}
      style={
        {
          "--sweep-duration": `${duration}ms`,
          "--sweep-rest": textColor,
          "--sweep-border": borderColor,
          "--sweep-fill": fillColor,
          "--sweep-text": hoverTextColor,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 bg-(--sweep-fill)",
          "transition-transform duration-(--sweep-duration) ease-[cubic-bezier(0.23,1,0.32,1)]",
          "motion-reduce:transition-none",
          direction === "left"
            ? "origin-left scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
            : "origin-bottom scale-y-0 group-hover:scale-y-100 group-focus-visible:scale-y-100"
        )}
      />
      {children}
    </a>
  );
}
