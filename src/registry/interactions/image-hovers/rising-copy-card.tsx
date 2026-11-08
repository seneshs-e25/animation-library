import * as React from "react";
import { cn } from "@/lib/utils";

type RisingCopyCardProps = Omit<React.ComponentProps<"a">, "title"> & {
  /** Image URL. It fills the card (object-cover) and zooms on hover. */
  src: string;
  /** Alt text. Defaults to "" since the title names the card. */
  alt?: string;
  /** Card headline. Sits above the CTA at rest, moves to the top on hover. */
  title: React.ReactNode;
  /** Tag for the headline. */
  titleAs?: "h2" | "h3" | "h4" | "p" | "span";
  /** Optional copy under the headline, revealed on hover. */
  description?: React.ReactNode;
  /** CTA label at the foot of the card. Omit for a card with no CTA row. */
  ctaLabel?: React.ReactNode;
  /** How far the image grows on hover (1.1 = 10%). */
  scale?: number;
  /** Duration of every part of the hover, in milliseconds. */
  duration?: number;
  /** CSS timing function for every part of the hover. */
  easing?: string;
  /** Colour the art turns toward on hover (a hue blend, so it recolours without darkening). */
  tint?: string;
  /** Card background, seen under the art and if the image fails. */
  color?: string;
  /** CTA chip colour on hover (a gradient from `chipFrom` to `chipTo`). */
  chipFrom?: string;
  chipTo?: string;
  /** Corner radius in px. */
  radius?: number;
  /** Inner padding in px. The headline rises to this inset. */
  padding?: number;
  /**
   * Card width in px, or "fill" to take the full width of its grid cell.
   * A px width is a maximum: the card still shrinks in a narrower column.
   */
  width?: number | "fill";
  /** Card height in px. */
  height?: number;
};

/**
 * Rising copy card — a linked image tile. On hover (or keyboard focus):
 *  - the art zooms inside the rounded card,
 *  - the headline travels from the foot of the card to the top while the CTA
 *    stays at the foot,
 *  - an optional description opens under the headline and fades in,
 *  - the dark copy scrim fades out and a hue tint fades in,
 *  - the CTA chip turns from dark to a bright gradient.
 * All on one duration and curve.
 *
 * `justify-content` can't animate, so two spacers share the free space and
 * swap their `flex-grow` (1 → 0 above the copy, 0 → 1 above the CTA). Their
 * factors always add up to 1, so the copy moves in a straight line. The
 * description opens with a `grid-template-rows: 0fr → 1fr` row, which animates
 * to its natural height without guessing a max-height.
 *
 * No client JavaScript.
 */
export function RisingCopyCard({
  src,
  alt = "",
  title,
  titleAs: Title = "h3",
  description,
  ctaLabel,
  scale = 1.1,
  duration = 500,
  easing = "cubic-bezier(0, 0, 0.2, 1)",
  tint = "#25006D",
  color = "#1E252F",
  chipFrom = "#0054D7",
  chipTo = "#00DDF4",
  radius = 20,
  padding = 40,
  width = 355,
  height = 360,
  className,
  style,
  ...props
}: RisingCopyCardProps) {
  // Every moving part shares the card's duration and curve.
  const motion =
    "duration-(--rc-duration) ease-(--rc-ease) motion-reduce:transition-none";
  // Hover and keyboard focus are the same state (group-hover + group-focus-visible).
  // `hover:` only matches on devices that really hover, so touch never gets stuck open.

  return (
    <a
      className={cn(
        "group @container relative isolate flex w-full max-w-(--rc-w) flex-col overflow-hidden no-underline",
        "rounded-(--rc-radius) bg-(--rc-color) p-(--rc-pad) text-white",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--rc-chip-from)",
        className
      )}
      style={
        {
          "--rc-scale": scale,
          "--rc-duration": `${duration}ms`,
          "--rc-ease": easing,
          "--rc-tint": tint,
          "--rc-color": color,
          "--rc-chip-from": chipFrom,
          "--rc-chip-to": chipTo,
          "--rc-radius": `${radius}px`,
          "--rc-pad": `${padding}px`,
          "--rc-w": width === "fill" ? "none" : `${width}px`,
          height,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* A plain <img> keeps the file portable; swap in the site's Image component if it has one. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          "absolute inset-0 -z-10 size-full object-cover transition-transform",
          motion,
          "group-hover:scale-(--rc-scale) group-focus-visible:scale-(--rc-scale)",
          // Reduced motion: no zoom at all rather than an instant jump.
          "motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
        )}
      />

      {/* Copy scrim: transparent → a third of black, behind the copy. Fades out on hover. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 bg-linear-[240deg] from-transparent from-25% to-black/35 transition-opacity",
          motion,
          "group-hover:opacity-0 group-focus-visible:opacity-0"
        )}
      />

      {/* Hover tint in a hue blend: the art keeps its brightness and only turns toward the tint. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(233deg,transparent_-6%,var(--rc-tint)_105%)] opacity-0 mix-blend-hue transition-opacity",
          motion,
          "group-hover:opacity-100 group-focus-visible:opacity-100"
        )}
      />

      {/* Takes the free space at rest (copy at the foot), gives it up on hover. */}
      <span aria-hidden className={cn("grow transition-[flex-grow]", motion, "group-hover:grow-0 group-focus-visible:grow-0")} />

      <div>
        <Title className="m-0 text-[32px] leading-[1.1] font-light tracking-[-0.01em] text-balance @[240px]:text-[40px]">
          {title}
        </Title>

        {description && (
          // 0fr → 1fr opens the row to the copy's natural height. Nothing clips
          // the copy, so at rest it hangs below the headline (over the CTA and
          // off the card's foot, cut by the card) and rises with it, fading in.
          <div className={cn("grid grid-rows-[0fr] transition-[grid-template-rows]", motion, "group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]")}>
            {/* min-h-0 lets the row collapse; padding stays off it, since padding can't be crushed. */}
            <div className="min-h-0">
              <div
                className={cn(
                  "pt-[15px] text-base leading-[1.6] tracking-[0.02em] opacity-0 transition-opacity",
                  motion,
                  "group-hover:opacity-100 group-focus-visible:opacity-100"
                )}
              >
                {description}
              </div>
            </div>
          </div>
        )}
      </div>

      {ctaLabel && (
        <>
          {/* 30px between copy and CTA at rest; takes all the free space on hover. */}
          <span
            aria-hidden
            className={cn("shrink-0 grow-0 basis-[30px] transition-[flex-grow]", motion, "group-hover:grow group-focus-visible:grow")}
          />
          <span className="flex items-center gap-[15px] text-base leading-[1.6] font-light tracking-[0.02em]">
            <span
              aria-hidden
              className="relative grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-[#2A2A2A] shadow-[inset_0_1px_6px_rgba(255,255,255,0.45)]"
            >
              {/* The hover disc swaps in instantly, as the original's sprite swap does. */}
              <span
                className={cn(
                  "absolute inset-0 bg-[linear-gradient(35deg,var(--rc-chip-from),var(--rc-chip-to))] opacity-0 shadow-[inset_0_1px_6px_rgba(255,255,255,0.8)]",
                  "group-hover:opacity-100 group-focus-visible:opacity-100"
                )}
              />
              <svg viewBox="0 0 20 20" fill="none" className="relative size-5">
                <path d="M7.6 7H13V12.4M13 7L7 13" stroke="currentColor" />
              </svg>
            </span>
            {ctaLabel}
          </span>
        </>
      )}
    </a>
  );
}
