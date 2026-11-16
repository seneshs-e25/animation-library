import * as React from "react";
import { cn } from "@/lib/utils";

type GhostFillButtonProps = Omit<React.ComponentProps<"a">, "color"> & {
  /** Border and label color at rest (the button is transparent). */
  color?: string;
  /** Background the pill fills with on hover. */
  fillColor?: string;
  /** Label color once filled. */
  hoverTextColor?: string;
  /** Fill-in duration in milliseconds. */
  duration?: number;
  /** Fill-in easing (any CSS timing function). */
  ease?: string;
  /** Fill-out duration in milliseconds. Quicker than the way in. */
  exitDuration?: number;
  /** Fill-out easing (any CSS timing function). */
  exitEase?: string;
  /** Scale while pressed; 1 turns press feedback off. */
  pressScale?: number;
  /** Press dip duration in milliseconds, both ways. */
  pressDuration?: number;
  /** Press dip easing (any CSS timing function). */
  pressEase?: string;
};

/**
 * Ghost fill hover — a transparent outlined pill that snaps to a solid fill
 * with brand-colored text. Only colors animate (plus a slight press scale),
 * and hover only applies on devices with a real pointer.
 *
 * The way in and the way out have their own duration and curve (the way out
 * is quicker), on CSS transitions so leaving mid-fill reverses from where it
 * is. The press runs on its own timing (`pressDuration` / `pressEase`).
 */
export function GhostFillButton({
  color = "#FFFFFF",
  fillColor = "#FFFFFF",
  hoverTextColor = "#2006F7",
  duration = 300,
  ease = "cubic-bezier(0.23, 1, 0.32, 1)",
  exitDuration = 210,
  exitEase = "cubic-bezier(0.16, 1, 0.3, 1)",
  pressScale = 0.97,
  pressDuration = 160,
  pressEase = "cubic-bezier(0.23, 1, 0.32, 1)",
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
        // Leaving: the quicker exit timing. The press has its own timing.
        "[transition-property:background-color,color,scale]",
        "[transition-duration:var(--ghost-out),var(--ghost-out),var(--ghost-press-t)]",
        "[transition-timing-function:var(--ghost-out-ease),var(--ghost-out-ease),var(--ghost-press-ease)]",
        // Arriving: the entry timing (a transition uses the state it's heading to).
        "hover:[transition-duration:var(--ghost-in),var(--ghost-in),var(--ghost-press-t)] hover:[transition-timing-function:var(--ghost-in-ease),var(--ghost-in-ease),var(--ghost-press-ease)]",
        "focus-visible:[transition-duration:var(--ghost-in),var(--ghost-in),var(--ghost-press-t)] focus-visible:[transition-timing-function:var(--ghost-in-ease),var(--ghost-in-ease),var(--ghost-press-ease)]",
        "active:scale-(--ghost-press)",
        "motion-reduce:transition-none! motion-reduce:active:scale-100",
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
          "--ghost-in": `${duration}ms`,
          "--ghost-in-ease": ease,
          "--ghost-out": `${exitDuration}ms`,
          "--ghost-out-ease": exitEase,
          "--ghost-press": pressScale,
          "--ghost-press-t": `${pressDuration}ms`,
          "--ghost-press-ease": pressEase,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </a>
  );
}
