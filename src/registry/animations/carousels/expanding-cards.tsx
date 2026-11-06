"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ExpandingCard = {
  /** Fills the whole card behind the content: an image, video or gradient. */
  media?: React.ReactNode;
  /** Sits at the bottom-left of the open card (logo, quote, CTA). */
  content: React.ReactNode;
  /** Accessible name for the card, e.g. the customer's name. */
  label?: string;
};

type ExpandingCardsProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: ExpandingCard[];
  /** Card that starts open. */
  defaultIndex?: number;
  /** Card height from `minWidth` up, in px. */
  height?: number;
  /** Card height below `minWidth`, where cards are a swipeable row, in px. */
  mobileHeight?: number;
  /** Width of a closed card, in px. */
  collapsedWidth?: number;
  /** Space between cards, in px. */
  gap?: number;
  /** Card corner radius, in px. */
  radius?: number;
  /** Card background, shown behind the media. */
  background?: string;
  /** Opacity of closed cards. */
  inactiveOpacity?: number;
  /** Time a card takes to open or close, in ms. */
  duration?: number;
  /** Time the open card's content takes to slide and fade in, in ms. */
  contentDuration?: number;
  /** Darken the bottom-left of each card so white text stays readable. */
  overlay?: boolean;
  /**
   * Viewport width (px) from which cards expand on hover. Below it they turn
   * into a swipeable row of full cards. The original expands from 1200px.
   */
  minWidth?: number;
};

/** After a card opens, hovers are ignored for this long, as in the original. */
const HOVER_LOCK = 800;

/**
 * Expanding cards: a row of slim, faded cards where the one you hover grows
 * to fill the row and reveals its content. Used on the Ironclad website for
 * customer testimonials.
 *
 * How it works:
 * - Cards are flex items: closed cards are `flex: 0 0 80px` at 20% opacity,
 *   the open card adds `flex-grow: 1` at full opacity. Both animate together
 *   over 400ms cubic-bezier(0.4, 0, 1, 1), so the browser handles the width
 *   change in one transition.
 * - The open card's content fades in and rises 50px over 0.8s ease-in-out.
 *   Content keeps a fixed min width, so text never reflows while the card
 *   grows; the card clips it instead.
 * - Hovering a card opens it, then locks for 800ms so a pointer sweeping
 *   across the row doesn't make cards flicker. When the lock ends, the card
 *   under the pointer (if different) opens. Leaving the row keeps the last
 *   card open. Keyboard focus also opens a card.
 *
 * Below `minWidth`, cards become a horizontal scroll-snap row, all open,
 * at `mobileHeight` (480px) instead of the desktop `height`.
 * Reduced motion: cards switch instantly, without width or fade transitions.
 */
export function ExpandingCards({
  items,
  defaultIndex = 0,
  height = 621,
  mobileHeight = 480,
  collapsedWidth = 80,
  gap = 20,
  radius = 20,
  background = "#1C212B",
  inactiveOpacity = 0.2,
  duration = 400,
  contentDuration = 800,
  overlay = true,
  minWidth = 1200,
  className,
  style,
  ...props
}: ExpandingCardsProps) {
  const [active, setActive] = React.useState(defaultIndex);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const locked = React.useRef(false);
  const hovered = React.useRef<number | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeRef = React.useRef(defaultIndex);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const open = (i: number) => {
    if (locked.current || i === activeRef.current) return;
    locked.current = true;
    activeRef.current = i;
    setActive(i);
    timer.current = setTimeout(() => {
      locked.current = false;
      const h = hovered.current;
      if (h !== null && h !== i) open(h);
    }, HOVER_LOCK);
  };

  const s = `[data-expanding-cards="${id}"]`;

  return (
    <div
      className={cn("w-full min-w-0", className)}
      style={
        {
          "--xc-h": `${height}px`,
          "--xc-h-sm": `${mobileHeight}px`,
          "--xc-closed": `${collapsedWidth}px`,
          "--xc-gap": `${gap}px`,
          "--xc-radius": `${radius}px`,
          "--xc-bg": background,
          "--xc-dim": inactiveOpacity,
          "--xc-duration": `${duration}ms`,
          "--xc-content-duration": `${contentDuration}ms`,
          ...style,
        } as React.CSSProperties
      }
      data-expanding-cards={id}
      {...props}
    >
      {/* Media queries can't read CSS variables, so the breakpoint is written here. */}
      <style>{`
${s}>[data-row]{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}
${s}>[data-row]::-webkit-scrollbar{display:none}
${s} [data-card]{flex:0 0 min(85%,420px);scroll-snap-align:start;--xc-card-h:var(--xc-h-sm)}
@media (min-width:${minWidth}px){
${s}>[data-row]{gap:var(--xc-gap);overflow:hidden;justify-content:flex-end}
${s} [data-card]{--xc-card-h:var(--xc-h);flex:0 0 var(--xc-closed);opacity:var(--xc-dim);transition:flex-grow var(--xc-duration) cubic-bezier(.4,0,1,1),opacity var(--xc-duration) cubic-bezier(.4,0,1,1)}
${s} [data-card][data-active]{flex-grow:1;opacity:1}
${s} [data-content]{min-width:420px;opacity:0;transform:translateY(50px);transition:opacity var(--xc-content-duration) ease-in-out,transform var(--xc-content-duration) ease-in-out}
${s} [data-card][data-active] [data-content]{opacity:1;transform:none}
}
@media (prefers-reduced-motion:reduce){${s} [data-card],${s} [data-content]{transition:none!important}}`}</style>

      <div
        data-row
        onPointerLeave={() => {
          hovered.current = null;
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            data-card
            data-active={i === active ? "" : undefined}
            role="group"
            aria-label={item.label}
            tabIndex={0}
            onPointerEnter={() => {
              hovered.current = i;
              open(i);
            }}
            onFocus={() => {
              // Keyboard users shouldn't wait out the hover lock.
              locked.current = false;
              open(i);
            }}
            className="relative isolate min-h-(--xc-card-h) overflow-hidden rounded-(--xc-radius) bg-(--xc-bg) outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
          >
            {item.media && <div className="absolute inset-0 -z-10 *:size-full">{item.media}</div>}
            {overlay && (
              <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-[linear-gradient(246deg,transparent_38.82%,#000_89.91%)]"
              />
            )}
            <div className="flex h-full min-h-(--xc-card-h) flex-col justify-end p-[30px] min-[992px]:p-[60px_120px_60px_60px]">
              <div data-content>{item.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
