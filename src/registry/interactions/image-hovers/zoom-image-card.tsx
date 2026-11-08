import * as React from "react";
import { cn } from "@/lib/utils";

type ZoomImageCardProps = Omit<React.ComponentProps<"a">, "title"> & {
  /** Photo URL. It fills the frame (object-cover) and zooms on hover. */
  src: string;
  /** Photo alt text. Defaults to "" since the title describes the card. */
  alt?: string;
  /** Optional logo pinned to the frame's top-left corner. It doesn't zoom. */
  logo?: string;
  /** Logo alt text, e.g. the customer's name. */
  logoAlt?: string;
  /** Caption under the frame. */
  title?: React.ReactNode;
  /** How far the photo grows on hover (1.04 = 4%). */
  scale?: number;
  /** Zoom duration in milliseconds. */
  duration?: number;
  /** CSS timing function for the zoom. */
  easing?: string;
  /** Corner radius of the frame in px. */
  radius?: number;
  /** Frame shape as width / height, e.g. "301 / 360" (the original) or "16 / 9". */
  aspectRatio?: string;
  /** Darken the top-left corner so a white logo reads over the photo. */
  scrim?: boolean;
  /** Frame colour, seen under the photo while it loads. */
  frameColor?: string;
  /** Caption colour. Also the focus ring colour. */
  titleColor?: string;
};

/**
 * Zoom image card — a linked customer tile: a photo in a rounded frame with a
 * logo in its corner and a caption below. Hovering anywhere on the card (or
 * focusing it with the keyboard) slowly grows the photo inside the frame; the
 * frame, the corner scrim and the logo stay put.
 *
 * Only `transform` animates. The frame clips with `overflow: hidden` plus
 * `isolation: isolate`, which keeps the rounded corners intact in Safari while
 * the photo is scaled. Under reduced motion there's no zoom at all.
 *
 * No client JavaScript.
 */
export function ZoomImageCard({
  src,
  alt = "",
  logo,
  logoAlt = "",
  title,
  scale = 1.04,
  duration = 500,
  easing = "cubic-bezier(0, 0, 0.2, 1)",
  radius = 20,
  aspectRatio = "301 / 360",
  scrim = true,
  frameColor = "#0054D7",
  titleColor = "#000000",
  className,
  style,
  ...props
}: ZoomImageCardProps) {
  return (
    <a
      className={cn(
        "group flex flex-col gap-5 no-underline outline-none",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--zoom-title) focus-visible:rounded-(--zoom-radius)",
        className
      )}
      style={
        {
          "--zoom-scale": scale,
          "--zoom-duration": `${duration}ms`,
          "--zoom-ease": easing,
          "--zoom-radius": `${radius}px`,
          "--zoom-frame": frameColor,
          "--zoom-title": titleColor,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className="relative isolate w-full overflow-hidden rounded-(--zoom-radius) bg-(--zoom-frame)"
        style={{ aspectRatio }}
      >
        {/* A plain <img> keeps the file portable; swap in the site's Image component if it has one. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "absolute inset-0 size-full object-cover",
            "transition-transform duration-(--zoom-duration) ease-(--zoom-ease)",
            // motion-safe: under reduced motion there's no zoom at all, not an instant jump.
            "motion-safe:group-hover:scale-(--zoom-scale) motion-safe:group-focus-visible:scale-(--zoom-scale)"
          )}
        />

        {/* Corner scrim: black in the top-left fading out by ~80% across, at 70% opacity. */}
        {scrim && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(322deg,transparent_21.7%,#000_97%)] opacity-70"
          />
        )}

        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={logoAlt}
            loading="lazy"
            decoding="async"
            className="absolute top-[30px] left-[30px] h-auto max-h-[60px] w-auto max-w-[205px]"
          />
        )}
      </div>

      {title && (
        <span className="text-base leading-[1.625] tracking-[0.01em] text-(--zoom-title) xl:text-xl xl:leading-[1.6]">
          {title}
        </span>
      )}
    </a>
  );
}
