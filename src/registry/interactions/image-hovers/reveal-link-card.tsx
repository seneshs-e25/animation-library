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
 *  - the label fades in and rises 5px (300ms) and its chevron nudges 4px right,
 *  - a gradient in the card color rises from the bottom (600ms) so the label
 *    stays readable over the image,
 *  - the card lifts 2px with a soft shadow (300ms).
 *
 * The card is fluid: `width` is a maximum (or "fill" for a grid cell) and
 * the height follows `aspectRatio`, so it never overflows a narrow column.
 *
 * Only opacity and transform animate. On devices without hover (touch), the
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
        "transition-[transform,box-shadow] duration-300 ease-[ease]",
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
          "translate-y-[30px] opacity-50 transition-[opacity,transform] duration-600 ease-[ease]",
          "group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
          "[@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
          "motion-reduce:translate-y-0 motion-reduce:transition-opacity"
        )}
      />

      <span
        className={cn(
          "absolute bottom-[22px] left-5 w-[60%] text-base leading-tight",
          "translate-y-[5px] opacity-0 transition-[opacity,transform] duration-300 ease-[ease]",
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
          className="ml-1 inline-block h-[10px] w-[7px] align-[0.05em] transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0"
        >
          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}
