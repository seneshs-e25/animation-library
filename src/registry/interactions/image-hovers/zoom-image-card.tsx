import * as React from "react";
import { cn } from "@/lib/utils";

type ZoomImageCardProps = Omit<React.ComponentProps<"a">, "title"> & {
  /** Image URL. */
  src: string;
  /** Alt text. Pass "" when the title already describes the image. */
  alt?: string;
  /** Small label above the title, e.g. the resource type. */
  eyebrow?: React.ReactNode;
  /** Card title. */
  title?: React.ReactNode;
  /** How far the image grows on hover (1.1 = 10%). */
  scale?: number;
  /** Zoom duration in milliseconds. */
  duration?: number;
  /** CSS timing function for the zoom, e.g. "ease" or "cubic-bezier(0.23, 1, 0.32, 1)". */
  easing?: string;
  /** Corner radius of the image frame in px. */
  radius?: number;
  /** Image frame aspect ratio, e.g. "2 / 1" or "16 / 9". */
  aspectRatio?: string;
  /** Eyebrow color. */
  eyebrowColor?: string;
  /** Title color. */
  titleColor?: string;
};

/**
 * Zoom image card — the whole card is a link; hovering anywhere on it scales
 * the image inside its rounded frame, so the picture grows while the frame
 * stays put.
 *
 * Only `transform` animates (compositor-only). The frame clips with
 * `overflow: hidden` plus `isolation: isolate`, which keeps the rounded
 * corners intact in Safari while the child is transformed. The hover is
 * gated to devices that can hover (Tailwind's `hover:` variant), and keyboard
 * focus triggers the same zoom.
 */
export function ZoomImageCard({
  src,
  alt = "",
  eyebrow,
  title,
  scale = 1.1,
  duration = 300,
  easing = "ease",
  radius = 20,
  aspectRatio = "2 / 1",
  eyebrowColor = "#E3308C",
  titleColor = "#0B0623",
  className,
  style,
  ...props
}: ZoomImageCardProps) {
  return (
    <a
      className={cn(
        "group flex flex-col gap-4 no-underline outline-none",
        "focus-visible:ring-2 focus-visible:ring-(--zoom-title) focus-visible:ring-offset-4 focus-visible:rounded-(--zoom-radius)",
        className
      )}
      style={
        {
          "--zoom-scale": scale,
          "--zoom-duration": `${duration}ms`,
          "--zoom-ease": easing,
          "--zoom-radius": `${radius}px`,
          "--zoom-eyebrow": eyebrowColor,
          "--zoom-title": titleColor,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className="relative isolate w-full overflow-hidden rounded-(--zoom-radius)"
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
            "size-full object-cover",
            "transition-transform duration-(--zoom-duration) ease-(--zoom-ease)",
            "group-hover:scale-(--zoom-scale) group-focus-visible:scale-(--zoom-scale)",
            // Reduced motion: no zoom at all rather than an instant jump.
            "motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
          )}
        />
      </div>
      {(eyebrow || title) && (
        <div className="flex flex-col gap-2">
          {eyebrow && (
            <span className="font-mono text-sm leading-[1.6] tracking-[-0.05em] text-(--zoom-eyebrow) lowercase">
              /{eyebrow}
            </span>
          )}
          {title && (
            <h3 className="text-[clamp(22px,19.77px+0.57vw,28px)] leading-[1.2] font-normal tracking-[-0.02em] text-(--zoom-title)">
              {title}
            </h3>
          )}
        </div>
      )}
    </a>
  );
}
