import * as React from "react";
import { cn } from "@/lib/utils";

type CornerBloomButtonProps = Omit<React.ComponentProps<"a">, "color"> & {
  /** Resting background of the pill. */
  color?: string;
  /** Color of the ellipse that blooms in on hover. */
  bloomColor?: string;
  /** Label and arrow color. */
  textColor?: string;
  /** Bloom duration in milliseconds. */
  duration?: number;
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
 */
export function CornerBloomButton({
  color = "#308970",
  bloomColor = "#1C212B",
  textColor = "#F2F1EE",
  duration = 400,
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
        "outline-none focus-visible:ring-2 focus-visible:ring-(--bloom-color) focus-visible:ring-offset-2",
        className
      )}
      style={
        {
          "--bloom-color": color,
          "--bloom-fill": bloomColor,
          "--bloom-text": textColor,
          "--bloom-duration": `${duration}ms`,
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
          "transition-transform duration-(--bloom-duration) ease-[ease-in-out]",
          "group-hover:scale-100 group-focus-visible:scale-100",
          "motion-reduce:transition-none"
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
