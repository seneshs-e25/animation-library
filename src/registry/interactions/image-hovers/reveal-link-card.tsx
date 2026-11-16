import * as React from "react";
import { cn } from "@/lib/utils";

type RevealLinkCardProps = Omit<React.ComponentProps<"a">, "title" | "color"> & {
  /** Image URL. It fills the card (object-cover). */
  src: string;
  /** Alt text. Defaults to "" since the title names the card. */
  alt?: string;
  /** Card title, pinned to the top-left. */
  title: React.ReactNode;
  /** Link label that fades up on hover. */
  linkLabel?: React.ReactNode;
  /** Card background, also used for the bottom gradient behind the label. */
  color?: string;
  /** Title and label color. */
  textColor?: string;
  /** Lift the card 2px with a soft shadow on hover. */
  lift?: boolean;
  /**
   * Label, chevron and lift duration in ms. Also how fast the gradient rises
   * on hover; on the way out the gradient takes twice as long.
   */
  duration?: number;
  /** How long the gradient's opacity takes to fade in on hover, in ms. */
  gradientFade?: number;
  /** CSS timing function for every layer. */
  easing?: string;
  /**
   * Card width in px, or "fill" to take the full width of its grid cell or
   * column. A px width is a maximum: the card still shrinks in a narrower
   * column. The height follows `aspectRatio`.
   */
  width?: number | "fill";
  /** Card shape as width / height, e.g. "220 / 280" (the original) or "3 / 4". */
  aspectRatio?: string;
};

/**
 * Reveal link card — a tall image tile whose "Learn More" link is hidden
 * until hover. On hover:
 *  - the label fades in and rises 5px (`duration`) and its chevron nudges 4px right,
 *  - a gradient in the card color rises from the bottom with the label
 *    (`duration`) but keeps fading in for longer (`gradientFade`), so the
 *    colour washes in softly behind the label,
 *  - the card lifts 2px with a soft shadow (`duration`).
 * On the way out the gradient sinks and fades over 2 × `duration`.
 *
 * The card is fluid: `width` is a maximum (or "fill" for a grid cell) and
 * the height follows `aspectRatio`, so it never overflows a narrow column.
 *
 * Only opacity, translate and the card shadow animate. On devices without hover (touch), the
 * label and gradient are always shown so the link is never hidden.
 */
export function RevealLinkCard({
  src,
  alt = "",
  title,
  linkLabel = "Learn More",
  color = "#19426C",
  textColor = "#FFFFFF",
  lift = true,
  duration = 300,
  gradientFade = 1000,
  easing = "cubic-bezier(0, 0, 0.58, 1)",
  width = 220,
  aspectRatio = "220 / 280",
  className,
  style,
  ...props
}: RevealLinkCardProps) {
  return (
    <a
      className={cn(
        "group relative isolate block w-full max-w-(--reveal-w) overflow-hidden rounded-[14px] bg-(--reveal-color) text-(--reveal-text) no-underline",
        "transition-[translate,box-shadow] duration-(--reveal-duration) ease-(--reveal-ease)",
        lift &&
          "hover:-translate-y-0.5 hover:shadow-[0_18px_20px_rgba(97,97,97,0.4)] focus-visible:-translate-y-0.5 focus-visible:shadow-[0_18px_20px_rgba(97,97,97,0.4)]",
        "outline-none focus-visible:ring-2 focus-visible:ring-(--reveal-color) focus-visible:ring-offset-2",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0",
        className
      )}
      style={
        {
          "--reveal-color": color,
          "--reveal-text": textColor,
          "--reveal-duration": `${duration}ms`,
          "--reveal-ease": easing,
          "--reveal-fade": `${gradientFade}ms`,
          "--reveal-w": width === "fill" ? "none" : `${width}px`,
          aspectRatio,
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
        className="absolute inset-0 -z-10 size-full object-cover"
      />

      <span className="absolute top-[19px] left-5 pr-5 text-[15.5px] leading-[1.4]">{title}</span>

      {/* Bottom gradient in the card color, so the label reads over the image. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-[60%]",
          "bg-[linear-gradient(0deg,var(--reveal-color),var(--reveal-color)_20%,transparent)]",
          // Out: opacity and rise both take 2 × duration. In: the rise keeps pace
          // with the label while the opacity takes the longer gradientFade.
          "translate-y-[30px] opacity-50 transition-[opacity,translate] duration-[calc(var(--reveal-duration)*2)] ease-(--reveal-ease)",
          "group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
          "group-hover:[transition-duration:var(--reveal-fade),var(--reveal-duration)] group-focus-visible:[transition-duration:var(--reveal-fade),var(--reveal-duration)]",
          "[@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
          "motion-reduce:translate-y-0 motion-reduce:transition-opacity"
        )}
      />

      <span
        className={cn(
          "absolute bottom-[22px] left-5 w-[60%] text-base leading-tight",
          "translate-y-[5px] opacity-0 transition-[opacity,translate] duration-(--reveal-duration) ease-(--reveal-ease)",
          "group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
          "[@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
          "motion-reduce:translate-y-0 motion-reduce:transition-opacity"
        )}
      >
        {linkLabel}
        <svg
          aria-hidden
          viewBox="0 0 7 10"
          fill="none"
          className="ml-1 inline-block h-[10px] w-[7px] align-[0.05em] transition-transform duration-(--reveal-duration) ease-(--reveal-ease) group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0"
        >
          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}
