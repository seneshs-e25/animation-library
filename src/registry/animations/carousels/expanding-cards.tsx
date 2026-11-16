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
  /** Time a card takes to open or close (its width), in ms. */
  duration?: number;
  /** Easing of the card's width, any CSS timing function. */
  ease?: string;
  /** Time a card takes to light up or dim (its opacity), in ms. */
  fadeDuration?: number;
  /**
   * Easing of the card's opacity and of the content's rise and fade, in and
   * out, any CSS timing function.
   */
  fadeEase?: string;
  /** Time the open card's content takes to slide and fade in, in ms. */
  contentDuration?: number;
  /** Wait after the card starts opening before its content comes in, in ms. */
  contentDelay?: number;
  /** Time the closing card's content takes to fade out, in ms (no delay). */
  contentExitDuration?: number;
  /**
   * How long the pointer has to rest on a card before it opens, in ms. Cards
   * the pointer only sweeps across don't open, so the row never flickers.
   */
  hoverDelay?: number;
  /** Darken the bottom-left of each card so white text stays readable. */
  overlay?: boolean;
  /**
   * Viewport width (px) from which cards expand on hover. Below it they turn
   * into a swipeable row of full cards. The original expands from 1200px.
   */
  minWidth?: number;
};

/**
 * Expanding cards: a row of slim, faded cards where the one you hover grows
 * to fill the row and reveals its content. Used on the Ironclad website for
 * customer testimonials.
 *
 * How it works:
 * - Cards are flex items: closed cards are `flex: 0 0 80px` at 20% opacity,
 *   the open card adds `flex-grow: 1` at full opacity. The width runs
 *   `duration` (600ms) on `ease`, a strong ease-out
 *   cubic-bezier(0.23, 1, 0.32, 1) (responds at once, long soft settle); the
 *   opacity runs `fadeDuration` (300ms) on `fadeEase`, the iOS drawer curve
 *   cubic-bezier(0.32, 0.72, 0, 1), so the card lights up before it's done
 *   growing.
 * - The open card's content rises 24px and fades in over `contentDuration`
 *   (500ms) on `fadeEase`, `contentDelay` (200ms) after the card starts
 *   growing. Leaving, it fades out in `contentExitDuration` (150ms) with no
 *   delay, so the old quote is gone before its card closes around it.
 *   Content keeps a fixed min width, so text never reflows while the card
 *   grows; the card clips it instead.
 * - A card opens once the pointer has rested on it for `hoverDelay` (120ms),
 *   so sweeping across the row doesn't open every card on the way. Nothing is
 *   ever blocked: every change is a CSS transition that retargets from where
 *   it is. Leaving the row keeps the last card open. Keyboard focus opens a
 *   card immediately.
 *
 * Below `minWidth`, cards become a horizontal scroll-snap row, all open,
 * at `mobileHeight` (480px) instead of the desktop `height`.
 * Reduced motion: the width and the rise snap; only a fixed 200ms `ease`
 * opacity fade stays.
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
  duration = 600,
  ease = "cubic-bezier(0.23, 1, 0.32, 1)",
  fadeDuration = 300,
  fadeEase = "cubic-bezier(0.32, 0.72, 0, 1)",
  contentDuration = 500,
  contentDelay = 200,
  contentExitDuration = 150,
  hoverDelay = 120,
  overlay = true,
  minWidth = 1200,
  className,
  style,
  ...props
}: ExpandingCardsProps) {
  const [active, setActive] = React.useState(defaultIndex);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  /** Open `i` once the pointer has rested on it; moving on cancels it. */
  const intend = (i: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(i), hoverDelay);
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
          "--xc-ease": ease,
          "--xc-fade": `${fadeDuration}ms`,
          "--xc-fade-ease": fadeEase,
          "--xc-content-duration": `${contentDuration}ms`,
          "--xc-content-delay": `${contentDelay}ms`,
          "--xc-content-exit": `${contentExitDuration}ms`,
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
${s} [data-card]{--xc-card-h:var(--xc-h);flex:0 0 var(--xc-closed);opacity:var(--xc-dim);transition:flex-grow var(--xc-duration) var(--xc-ease),opacity var(--xc-fade) var(--xc-fade-ease)}
${s} [data-card][data-active]{flex-grow:1;opacity:1}
${s} [data-content]{min-width:420px;opacity:0;transform:translateY(24px);transition:opacity var(--xc-content-exit) var(--xc-fade-ease),transform var(--xc-content-exit) var(--xc-fade-ease)}
${s} [data-card][data-active] [data-content]{opacity:1;transform:none;transition-duration:var(--xc-content-duration);transition-delay:var(--xc-content-delay)}
}
@media (prefers-reduced-motion:reduce){${s} [data-card]{transition:opacity 200ms ease!important}${s} [data-content]{transform:none!important;transition:opacity 200ms ease!important}}`}</style>

      <div
        data-row
        // Leaving the row cancels a pending open; the last card stays open.
        onPointerLeave={() => clearTimeout(timer.current)}
      >
        {items.map((item, i) => (
          <div
            key={i}
            data-card
            data-active={i === active ? "" : undefined}
            role="group"
            aria-label={item.label}
            tabIndex={0}
            onPointerEnter={() => intend(i)}
            onFocus={() => {
              // Keyboard users shouldn't wait for hover intent.
              clearTimeout(timer.current);
              setActive(i);
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
