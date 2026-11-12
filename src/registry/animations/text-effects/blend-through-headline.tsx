import * as React from "react";
import { cn } from "@/lib/utils";

type BlendThroughHeadlineProps = Omit<React.HTMLAttributes<HTMLElement>, "color"> & {
  /** The headline. Wrap a lead-in in `<em>` to give it the emphasis colours. Marks and links survive (no splitting). */
  children: React.ReactNode;
  /** Element to render both copies as, e.g. "h1" or "h2". */
  as?: React.ElementType;
  /** What the text looks like over a plain background, as hex. */
  color?: string;
  /** The tint the text picks up over the moving background, as hex. Blended with `hard-light`. */
  tint?: string;
  /** How strongly the tint shows, 0–1. */
  tintOpacity?: number;
  /** Rest colour for `<em>` text, as hex. */
  emphasisColor?: string;
  /** Tint for `<em>` text, as hex. */
  emphasisTint?: string;
  /** Tint strength for `<em>` text, 0–1. */
  emphasisTintOpacity?: number;
};

/**
 * Blend-through headline: the headline picks up the colour of an animated
 * background wherever the background passes behind it, and stays its normal
 * colour everywhere else. Taken from the Stripe homepage hero.
 *
 * How it works:
 * - The headline renders twice in the same grid cell, so the copies line up exactly.
 * - The bottom copy is the real headline that screen readers use. It sits
 *   under the section's background layer (`z-index: 1`), so the background
 *   covers it wherever the background has colour.
 * - The top copy is `inert` (also `aria-hidden`) at `z-index: 2` with
 *   `mix-blend-mode: hard-light` and a semi-transparent tint colour. Over the
 *   background it tints whatever colour is underneath. Over a plain area it
 *   blends with the bottom copy instead.
 * - Nobody sees the bottom copy's own colour. It's solved per channel so
 *   that tint ⊕ bottom = `color` exactly. That's why Stripe's bottom copy is
 *   yellow and still reads as slate grey.
 *
 * The wrapper doesn't create a stacking context, so both copies share one
 * with the background. The section needs `isolation: isolate` (or its own
 * z-index), and the background layer needs `z-index: 1` and
 * `pointer-events: none`.
 */
export function BlendThroughHeadline({
  children,
  as: Tag = "h1",
  color = "#6E7780",
  tint = "#000EFF",
  tintOpacity = 0.5,
  emphasisColor = "#020826",
  emphasisTint = "#2D2564",
  emphasisTintOpacity = 1,
  className,
  style,
  ...props
}: BlendThroughHeadlineProps) {
  const vars = {
    "--bth-base": blendThroughBase(color, tint, tintOpacity),
    "--bth-tint": withAlpha(tint, tintOpacity),
    "--bth-em-base": blendThroughBase(emphasisColor, emphasisTint, emphasisTintOpacity),
    "--bth-em-tint": withAlpha(emphasisTint, emphasisTintOpacity),
  } as React.CSSProperties;

  const copy = "col-start-1 row-start-1 m-0 [&_em]:not-italic";

  return (
    <div className="grid" style={vars}>
      <Tag
        className={cn(copy, "relative text-(--bth-base) [&_em]:text-(--bth-em-base)", className)}
        style={style}
        {...props}
      >
        {children}
      </Tag>
      <Tag
        aria-hidden
        inert
        className={cn(
          copy,
          "relative z-[2] text-(--bth-tint) mix-blend-hard-light [&_em]:text-(--bth-em-tint)",
          className,
        )}
        style={style}
      >
        {children}
      </Tag>
    </div>
  );
}

/**
 * The bottom copy's colour that makes `tint` (hard-light, at `opacity`) land
 * exactly on `target` over it. Each channel is linear in the bottom colour, so
 * it solves directly. Channels that can't reach the target get clamped (a dark
 * tint can't produce a light rest colour, for example). In development this
 * logs a warning.
 */
export function blendThroughBase(target: string, tint: string, opacity: number): string {
  const want = hexToRgb(target);
  const top = hexToRgb(tint);
  const a = Math.min(1, Math.max(0, opacity));
  let clamped = false;
  const base = want.map((f, i) => {
    const t = top[i];
    // hard-light: t ≤ .5 multiplies (2t·b), t > .5 screens ((2t−1) + b(2−2t)).
    const m = t <= 0.5 ? 2 * t : 2 - 2 * t;
    const c = t <= 0.5 ? 0 : 2 * t - 1;
    // Composited at alpha a over the bottom copy: (1−a)·b + a·(m·b + c).
    const k = 1 - a + a * m;
    if (k < 1e-4) return 0; // the bottom copy can't change this channel
    const b = (f - a * c) / k;
    if (b < -0.01 || b > 1.01) clamped = true;
    return Math.min(1, Math.max(0, b));
  });
  if (clamped && process.env.NODE_ENV !== "production") {
    console.warn(
      `BlendThroughHeadline: ${target} can't be reached with tint ${tint} at ${a}. Using the nearest colour instead.`,
    );
  }
  return rgbToHex(base);
}

function hexToRgb(hex: string): number[] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = [...h].map((ch) => ch + ch).join("");
  const n = parseInt(h.slice(0, 6), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
}

function rgbToHex(rgb: number[]): string {
  return `#${rgb.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex).map((v) => Math.round(v * 255));
  return `rgb(${r} ${g} ${b} / ${Math.min(1, Math.max(0, alpha))})`;
}
