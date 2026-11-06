import * as React from "react";
import { cn } from "@/lib/utils";

type GhostFillButtonProps = Omit<React.ComponentProps<"a">, "color"> & {
  /** Border and label color at rest (the button is transparent). */
  color?: string;
  /** Background the pill fills with on hover. */
  fillColor?: string;
  /** Label color once filled. */
  hoverTextColor?: string;
  /** Fill duration in milliseconds. */
  duration?: number;
};

/**
 * Ghost fill hover — a transparent outlined pill that snaps to a solid fill
 * with brand-colored text. A quick, linear color swap: fast enough to read as
 * instant feedback, soft enough not to flash. Only colors animate, and only
 * on devices with a real pointer.
 */
export function GhostFillButton({
  color = "#FFFFFF",
  fillColor = "#FFFFFF",
  hoverTextColor = "#2006F7",
  duration = 100,
  className,
  style,
  children,
  ...props
}: GhostFillButtonProps) {
  return (
    <a
      className={cn(
        "inline-flex w-fit max-w-full items-center justify-center rounded-[30px] border border-solid border-(--ghost-color)",
        "bg-transparent px-[30px] py-[15px] text-base leading-none font-bold tracking-[-0.16px] text-(--ghost-color) no-underline",
        "transition-[background-color,color] duration-(--ghost-duration) ease-linear motion-reduce:transition-none",
        "hover:bg-(--ghost-fill) hover:text-(--ghost-hover-text)",
        "focus-visible:bg-(--ghost-fill) focus-visible:text-(--ghost-hover-text)",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ghost-color)]",
        className
      )}
      style={
        {
          "--ghost-color": color,
          "--ghost-fill": fillColor,
          "--ghost-hover-text": hoverTextColor,
          "--ghost-duration": `${duration}ms`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </a>
  );
}
