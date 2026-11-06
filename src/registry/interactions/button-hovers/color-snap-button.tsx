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
  /** Color change duration in milliseconds. The original swaps instantly (0). */
  duration?: number;
};

/**
 * Color snap hover — a solid pill that snaps from its resting color to a
 * bright accent on hover, and to a lighter tint while pressed. The original
 * has no transition: the swap is instant, so it reads as crisp, immediate
 * feedback. Only the background color changes.
 */
export function ColorSnapButton({
  color = "#1C453B",
  hoverColor = "#FF6300",
  activeColor = "#FFB350",
  textColor = "#FFFFFF",
  duration = 0,
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
        "transition-[background-color] duration-(--snap-duration) ease-linear motion-reduce:transition-none",
        "hover:bg-(--snap-hover) focus-visible:bg-(--snap-hover) active:bg-(--snap-active)",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--snap-hover)",
        className
      )}
      style={
        {
          "--snap-color": color,
          "--snap-hover": hoverColor,
          "--snap-active": activeColor,
          "--snap-text": textColor,
          "--snap-duration": `${duration}ms`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </a>
  );
}
