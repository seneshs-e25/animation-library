import * as React from "react";
import { cn } from "@/lib/utils";

export type MarqueeLogo = {
  /** Image URL (SVG recommended). */
  src: string;
  /** Brand name, read once by screen readers. */
  alt: string;
};

type LogoMarqueeProps = Omit<React.ComponentProps<"section">, "children"> & {
  logos: MarqueeLogo[];
  /**
   * Seconds each logo takes to travel one slot. Speed is set per logo, so
   * adding or removing logos never makes the strip faster or slower.
   */
  secondsPerLogo?: number;
  direction?: "left" | "right";
  /** Pause while the pointer is over the strip (mouse and trackpad only). */
  pauseOnHover?: boolean;
  /** Section background. */
  background?: string;
  /** Logo box in px. Every logo is fitted into this box. */
  logoWidth?: number;
  logoHeight?: number;
  /** Space between logos at 992px and wider, in px. Halved below 992px. */
  gap?: number;
  /** Fade logos out at the left and right edges. */
  fadeEdges?: boolean;
  /** Show logos in grayscale, returning to color on hover. */
  grayscale?: boolean;
  /** Accessible name for the section. */
  label?: string;
};

/**
 * One copy of the logos must be at least this wide so the strip never shows
 * a gap on wide screens. Short lists are repeated until they reach it.
 */
const MIN_SET_WIDTH = 2560;

/**
 * Infinite logo marquee: a strip of logos that scrolls sideways forever at a
 * constant speed, used on the Ironclad website.
 *
 * How it loops: the track holds two identical lists side by side and moves
 * left by exactly 50% (the width of one list), then restarts. At that moment
 * the second list sits exactly where the first one began, so the jump can't
 * be seen. Only `transform` is animated, so it runs on the GPU compositor
 * and doesn't trigger layout or paint.
 *
 * Pure CSS, no client JavaScript. With reduced motion turned on, the strip
 * stops and becomes a normal horizontal scroll area instead.
 */
export function LogoMarquee({
  logos,
  secondsPerLogo = 7.35,
  direction = "left",
  pauseOnHover = true,
  background = "#F2F1EE",
  logoWidth = 112,
  logoHeight = 44,
  gap = 80,
  fadeEdges = false,
  grayscale = false,
  label = "Our customers",
  className,
  style,
  ...props
}: LogoMarqueeProps) {
  if (logos.length === 0) return null;

  // Repeat short lists so one copy covers the widest screen.
  const slot = logoWidth + gap;
  const repeats = Math.max(1, Math.ceil(MIN_SET_WIDTH / (logos.length * slot)));
  const set = Array.from({ length: repeats }, () => logos).flat();

  const list = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className={cn("m-0 flex shrink-0 list-none p-0", hidden && "motion-reduce:hidden")}
    >
      {set.map((logo, i) => (
        <li
          key={i}
          // Repeats are copies: screen readers hear each logo once.
          aria-hidden={(!hidden && i >= logos.length) || undefined}
          className="flex shrink-0 items-center px-(--marquee-gap-half) min-[992px]:px-(--marquee-gap)"
        >
          {/* A plain <img> keeps the file portable; swap in the site's Image component if it has one. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.src}
            alt={hidden ? "" : logo.alt}
            width={logoWidth}
            height={logoHeight}
            loading={hidden || i >= logos.length ? "lazy" : undefined}
            decoding="async"
            draggable={false}
            className={cn(
              "block h-(--marquee-logo-h) w-(--marquee-logo-w) max-w-none object-contain select-none",
              grayscale &&
                "grayscale transition-[filter] duration-200 ease-[ease] hover:grayscale-0 motion-reduce:transition-none"
            )}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <section
      aria-label={label}
      className={cn("overflow-hidden bg-(--marquee-bg) py-20", className)}
      style={
        {
          "--marquee-bg": background,
          "--marquee-gap": `${gap / 2}px`,
          "--marquee-gap-half": `${gap / 4}px`,
          "--marquee-logo-w": `${logoWidth}px`,
          "--marquee-logo-h": `${logoHeight}px`,
          "--marquee-duration": `${set.length * secondsPerLogo}s`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* React hoists and dedupes this, so many marquees share one rule. */}
      <style href="logo-marquee-keyframes" precedence="default">
        {"@keyframes logo-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}"}
      </style>
      <div
        className={cn(
          "motion-reduce:overflow-x-auto",
          fadeEdges &&
            "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        )}
      >
        <div
          className={cn(
            "flex w-max animate-[logo-marquee_var(--marquee-duration)_linear_infinite] motion-reduce:animate-none",
            direction === "right" && "[animation-direction:reverse]",
            // Tailwind's hover only applies on devices that can hover, so a
            // tap on a phone never leaves the strip stuck paused.
            pauseOnHover && "hover:[animation-play-state:paused]"
          )}
        >
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}
