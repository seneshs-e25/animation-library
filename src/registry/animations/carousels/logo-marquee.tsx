"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type MarqueeLogo = {
  /** Image URL (SVG recommended). Shown at a fixed height, natural width. */
  src: string;
  /** Brand name, read once by screen readers. */
  alt: string;
  /** Optional link. Linked logos grow on hover and pause the strip. */
  href?: string;
  /** Open the link in a new tab. */
  newTab?: boolean;
};

type LogoMarqueeProps = Omit<React.ComponentProps<"section">, "children"> & {
  logos: MarqueeLogo[];
  /** Optional heading above the strip. */
  heading?: React.ReactNode;
  /** How fast the strip moves, in px per second. */
  speed?: number;
  direction?: "left" | "right";
  /** Pause while the pointer is over a linked logo (or a link has keyboard focus). */
  pauseOnHover?: boolean;
  /** Scale a linked logo grows to on hover (1024px+). 1 turns it off. */
  hoverScale?: number;
  /** Section background. */
  background?: string;
  /** Logo height from 1024px wide, in px. Width follows each logo's shape. */
  logoHeight?: number;
  /** Logo height below 1024px, in px. */
  mobileLogoHeight?: number;
  /** Space between logos, in px. */
  gap?: number;
  /** Accessible name for the section. */
  label?: string;
};

/** The original renders six copies and moves three of them per loop. */
const COPIES = 6;
/** The original clamps the loop to between 10s and 200s. */
const MIN_DURATION = 10;
const MAX_DURATION = 200;

/**
 * Infinite logo marquee: a strip of logos that scrolls sideways forever at a
 * steady pace. Rebuilt from the Sophos website's "Logo carousel".
 *
 * How it loops: the track holds six identical copies of the logos with the
 * same gap between every logo, and moves left by `50% + gap / 2`, exactly
 * three copies, then restarts. At that moment copy four sits exactly where
 * copy one began, so the jump can't be seen. Only `transform` is animated,
 * so it runs on the compositor.
 *
 * Speed: the loop's duration is measured from the rendered width, so the
 * strip moves at `speed` px/s (30 by default) whatever the logos, clamped to
 * a 10-200s loop as in the original.
 *
 * Hovering a linked logo scales it to 1.1 (300ms) and pauses the strip.
 * Reduced motion: the strip stops and becomes a horizontal scroll area.
 */
export function LogoMarquee({
  logos,
  heading,
  speed = 30,
  direction = "left",
  pauseOnHover = true,
  hoverScale = 1.1,
  background = "#EDF2F9",
  logoHeight = 80,
  mobileLogoHeight = 60,
  gap = 70,
  label = "Logo carousel",
  className,
  style,
  ...props
}: LogoMarqueeProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  // The original starts at its 200s ceiling until it has measured.
  const [duration, setDuration] = React.useState(MAX_DURATION);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      // One copy: the six copies plus their gaps, divided by six (as the original).
      const set = track.scrollWidth / COPIES;
      const seconds = (3 * set) / Math.max(speed, 0.1);
      setDuration(Math.max(MIN_DURATION, Math.min(MAX_DURATION, seconds)));
    };
    measure();
    // Re-measure when logos load or the layout changes.
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [speed, logos.length]);

  if (logos.length === 0) return null;

  const copy = (n: number) =>
    logos.map((logo, i) => {
      const hidden = n > 0;
      const img = (
        // A plain <img> keeps the file portable; swap in the site's Image component if it has one.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.src}
          alt={hidden ? "" : logo.alt}
          loading={hidden ? "lazy" : undefined}
          decoding="async"
          draggable={false}
          className="block h-(--marquee-logo-h-sm) w-auto max-w-none object-contain select-none min-[1024px]:h-(--marquee-logo-h)"
        />
      );
      const key = `${n}-${i}`;
      return logo.href ? (
        <a
          key={key}
          href={logo.href}
          target={logo.newTab ? "_blank" : undefined}
          rel={logo.newTab ? "noopener noreferrer" : undefined}
          tabIndex={hidden ? -1 : undefined}
          aria-hidden={hidden || undefined}
          data-marquee-link
          className={cn(
            "block flex-none rounded-sm outline-offset-4 transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)] [backface-visibility:hidden] min-[1024px]:[@media(hover:hover)]:hover:scale-(--marquee-hover-scale) motion-reduce:transition-none",
            // With reduced motion only the first copy shows, as a scroll area.
            hidden && "motion-reduce:hidden",
          )}
        >
          {img}
        </a>
      ) : (
        <div
          key={key}
          aria-hidden={hidden || undefined}
          className={cn("block flex-none [backface-visibility:hidden]", hidden && "motion-reduce:hidden")}
        >
          {img}
        </div>
      );
    });

  return (
    <section
      aria-label={label}
      // overflow-hidden here (not only on the strip) also keeps the section from
      // growing to the strip's full width when it sits in a flex or grid parent.
      className={cn("min-w-0 overflow-hidden bg-(--marquee-bg) py-5 min-[1024px]:py-[180px]", className)}
      style={
        {
          "--marquee-bg": background,
          "--marquee-gap": `${gap}px`,
          "--marquee-logo-h": `${logoHeight}px`,
          "--marquee-logo-h-sm": `${mobileLogoHeight}px`,
          "--marquee-hover-scale": hoverScale,
          "--marquee-duration": `${duration}s`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* React hoists and dedupes this, so many marquees share one rule. */}
      <style href="logo-marquee-keyframes" precedence="default">
        {`@keyframes logo-marquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(calc(-50% - var(--marquee-gap) / 2),0,0)}}
[data-marquee-track][data-pause]:has([data-marquee-link]:focus-visible){animation-play-state:paused}
@media (hover:hover){[data-marquee-track][data-pause]:has([data-marquee-link]:hover){animation-play-state:paused}}`}
      </style>
      {heading && (
        <div className="mx-auto mb-10 max-w-[310px] px-5 text-center min-[1024px]:max-w-max">{heading}</div>
      )}
      {/* 5px of vertical room so a hovered logo's 1.1 scale isn't clipped. */}
      <div className="overflow-hidden py-[5px] motion-reduce:overflow-x-auto">
        <div
          ref={trackRef}
          data-marquee-track
          data-pause={pauseOnHover ? "" : undefined}
          className={cn(
            "flex w-max items-center gap-(--marquee-gap) whitespace-nowrap will-change-transform",
            "animate-[logo-marquee_var(--marquee-duration)_linear_infinite] motion-reduce:animate-none",
            direction === "right" && "[animation-direction:reverse]",
          )}
        >
          {Array.from({ length: COPIES }, (_, n) => copy(n))}
        </div>
      </div>
    </section>
  );
}
