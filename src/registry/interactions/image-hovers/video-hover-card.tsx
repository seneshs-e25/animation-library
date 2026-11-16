"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type VideoHoverCardProps = Omit<React.ComponentProps<"a">, "title"> & {
  /** Video URL (MP4). Muted, looped, and played only while the card is hovered or focused. */
  video: string;
  /** Still image shown at rest, ideally a frame from the video. */
  poster: string;
  /** Alt text for the still, describing the scene. */
  alt?: string;
  /** Big stat in the top-left, e.g. "3.6x". */
  stat?: React.ReactNode;
  /** Line under the stat, e.g. "faster time to market". */
  label?: React.ReactNode;
  /** Logo pinned to the bottom-left. Use a white logo on a transparent background. */
  logo?: string;
  /** Logo alt text, e.g. the customer's name. */
  logoAlt?: string;
  /** How far the video grows on hover, from its bottom edge (1.05 = 5%). */
  zoom?: number;
  /** Crossfade and zoom duration in ms. */
  duration?: number;
  /** CSS timing function for the crossfade and zoom. */
  easing?: string;
  /** Corner radius in px. */
  radius?: number;
  /** Card shape as width / height. The original: 304 / 481. */
  aspectRatio?: string;
  /** Darken the top so the white stat reads over any frame. */
  scrim?: boolean;
  /** On touch screens (no hover), play the video while the card is on screen. */
  autoplayOnTouch?: boolean;
};

/**
 * Video hover card: a customer-story tile that shows a still photo at rest.
 * Hovering it (or focusing it) crossfades the still into a muted looping
 * video that grows slightly from its bottom edge; leaving pauses the video
 * where it is and fades the still back. Used on the Miro website.
 *
 * How it works:
 * - The video sits under the still. On hover/focus it's played; once it's
 *   actually playing the still fades out (opacity), so a slow network shows
 *   the still rather than a black frame.
 * - The video layer scales up from its bottom centre (transform only).
 * - Leaving pauses without rewinding, so the next hover resumes the clip.
 * - On devices that can't hover, the video plays while the card is in view
 *   (IntersectionObserver), as on the original's mobile layout.
 *
 * Reduced motion: no zoom, and no autoplay on touch; the crossfade and
 * hover-to-play stay, since playback is user-initiated.
 */
export function VideoHoverCard({
  video,
  poster,
  alt = "",
  stat,
  label,
  logo,
  logoAlt = "",
  zoom = 1.05,
  duration = 400,
  easing = "cubic-bezier(0.23, 1, 0.32, 1)",
  radius = 12,
  aspectRatio = "304 / 481",
  scrim = true,
  autoplayOnTouch = true,
  className,
  style,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: VideoHoverCardProps) {
  const cardRef = React.useRef<HTMLAnchorElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [active, setActive] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);

  // Play while active, pause (without rewinding) otherwise.
  React.useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active) el.play().catch(() => {});
    else el.pause();
  }, [active]);

  // Touch screens: no hover, so play while the card is in view.
  React.useEffect(() => {
    const card = cardRef.current;
    if (!card || !autoplayOnTouch) return;
    const hover = window.matchMedia("(hover: hover)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (hover.matches || reduced.matches) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      threshold: 0.5,
    });
    io.observe(card);
    return () => io.disconnect();
  }, [autoplayOnTouch]);

  const canHover = () => window.matchMedia("(hover: hover)").matches;
  const shown = active && playing;

  return (
    <a
      ref={cardRef}
      className={cn(
        "group relative isolate block overflow-hidden rounded-(--vh-radius) bg-neutral-900 no-underline outline-none",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current",
        className,
      )}
      style={
        {
          aspectRatio,
          "--vh-radius": `${radius}px`,
          "--vh-zoom": zoom,
          "--vh-duration": `${duration}ms`,
          "--vh-ease": easing,
          ...style,
        } as React.CSSProperties
      }
      data-active={shown || undefined}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse" || canHover()) setActive(true);
        onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse" || canHover()) setActive(false);
        onPointerLeave?.(e);
      }}
      onFocus={(e) => {
        if (e.currentTarget.matches(":focus-visible")) setActive(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setActive(false);
        onBlur?.(e);
      }}
      {...props}
    >
      <video
        ref={videoRef}
        src={video}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={cn(
          "absolute inset-0 size-full origin-bottom object-cover",
          "transition-[scale] duration-(--vh-duration) ease-(--vh-ease)",
          "motion-safe:group-data-active:scale-(--vh-zoom)",
        )}
      />

      {/* The still sits over the video and fades out once the video plays. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          "absolute inset-0 size-full object-cover",
          "transition-opacity duration-(--vh-duration) ease-(--vh-ease)",
          "group-data-active:opacity-0",
        )}
      />

      {scrim && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[35%] bg-linear-to-b from-[rgb(18_18_18/0.25)] to-transparent"
        />
      )}

      {(stat || label) && (
        <div className="absolute top-6 left-6 right-6 text-white">
          {stat && <p className="text-5xl leading-[1.2]">{stat}</p>}
          {label && <p className="mt-0 text-base leading-[1.2]">{label}</p>}
        </div>
      )}

      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={logoAlt}
          loading="lazy"
          decoding="async"
          className="absolute bottom-6 left-6 h-auto max-h-14 w-auto max-w-[158px]"
        />
      )}
    </a>
  );
}
