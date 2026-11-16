import * as React from "react";
import { cn } from "@/lib/utils";

type ColorSnapButtonProps = Omit<React.ComponentProps<"a">, "color"> & {
  /** Background at rest. */
  color?: string;
  /** Background on hover and keyboard focus. */
  hoverColor?: string;
  /** Background while pressed. */
  activeColor?: string;
  /** Label color. */
  textColor?: string;
  /** Color-in duration in milliseconds (0 snaps instantly, like the original). */
  duration?: number;
  /** Color-in easing (any CSS timing function). */
  ease?: string;
  /** Color-out duration in milliseconds. Quicker than the way in. */
  exitDuration?: number;
  /** Color-out easing (any CSS timing function). */
  exitEase?: string;
  /** Scale while pressed; 1 turns press feedback off. */
  pressScale?: number;
  /** Press dip duration in milliseconds, both ways. */
  pressDuration?: number;
  /** Press dip easing (any CSS timing function). */
  pressEase?: string;
};

/**
 * Color snap hover: a solid pill that turns a bright accent on hover, and a
 * lighter tint plus a slight dip while pressed. Only the background colour
 * and the press scale change.
 *
 * The way in and the way out have their own duration and curve (the way out
 * is quicker), on CSS transitions so leaving mid-change reverses from the
 * current colour. The press (colour and scale) runs on its own timing
 * (`pressDuration` / `pressEase`).
 */
export function ColorSnapButton({
  color = "#1C453B",
  hoverColor = "#FF6300",
  activeColor = "#FFB350",
  textColor = "#FFFFFF",
  duration = 200,
  ease = "cubic-bezier(0.23, 1, 0.32, 1)",
  exitDuration = 150,
  exitEase = "cubic-bezier(0.23, 1, 0.32, 1)",
  pressScale = 0.97,
  pressDuration = 160,
  pressEase = "cubic-bezier(0.23, 1, 0.32, 1)",
  className,
  style,
  children,
  ...props
}: ColorSnapButtonProps) {
  return (
    <a
      className={cn(
        "inline-block w-fit max-w-full rounded-[50px] border-0 bg-(--snap-color) px-[30px] py-[20px]",
        "text-center text-base leading-[1.15] font-semibold text-(--snap-text) no-underline",
        // Leaving: the quicker exit timing. The press has its own timing.
        "[transition-property:background-color,scale]",
        "[transition-duration:var(--snap-out),var(--snap-press-t)]",
        "[transition-timing-function:var(--snap-out-ease),var(--snap-press-ease)]",
        // Arriving: the entry timing (a transition uses the state it's heading to).
        "hover:[transition-duration:var(--snap-in),var(--snap-press-t)] hover:[transition-timing-function:var(--snap-in-ease),var(--snap-press-ease)]",
        "focus-visible:[transition-duration:var(--snap-in),var(--snap-press-t)] focus-visible:[transition-timing-function:var(--snap-in-ease),var(--snap-press-ease)]",
        // Pressing: colour and scale together, quick.
        "active:[transition-duration:var(--snap-press-t),var(--snap-press-t)] active:[transition-timing-function:var(--snap-press-ease),var(--snap-press-ease)]",
        "hover:bg-(--snap-hover) focus-visible:bg-(--snap-hover) active:bg-(--snap-active) active:scale-(--snap-press)",
        "motion-reduce:transition-none! motion-reduce:active:scale-100",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--snap-hover)",
        className
      )}
      style={
        {
          "--snap-color": color,
          "--snap-hover": hoverColor,
          "--snap-active": activeColor,
          "--snap-text": textColor,
          "--snap-in": `${duration}ms`,
          "--snap-in-ease": ease,
          "--snap-out": `${exitDuration}ms`,
          "--snap-out-ease": exitEase,
          "--snap-press": pressScale,
          "--snap-press-t": `${pressDuration}ms`,
          "--snap-press-ease": pressEase,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </a>
  );
}
