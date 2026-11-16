"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type VerticalTabSliderItem = {
  /** Tab label, and the small title at the top of the card. */
  title: string;
  /** Large copy at the bottom of the card (clamped to 5 lines). */
  description?: string;
  /** Card photo. Use the raw photo: the component lays its own dark scrim over it. */
  image: string;
  imageAlt?: string;
  /** Where the card's plus links to. No href, no plus. */
  href?: string;
  /** Accessible name for the plus link. Defaults to the title. */
  linkLabel?: string;
};

type VerticalTabSliderProps = Omit<React.ComponentProps<"section">, "children"> & {
  items: VerticalTabSliderItem[];
  /** Headline, intro copy or anything else above the row. It inherits the section's text colour. */
  children?: React.ReactNode;
  /** Card track slide, in ms. */
  slideDuration?: number;
  /** Card track easing, a CSS timing function. The original: cubic-bezier(0.23, 1, 0.32, 1). */
  slideEase?: string;
  /** Glow photo crossfade when the active card changes, in ms. */
  fadeDuration?: number;
  /** Easing for the glow crossfade. The original: cubic-bezier(0.23, 1, 0.32, 1). */
  fadeEase?: string;
  /** Small steps: the tab stepping left and brightening, its leader rule, the narrow card growing, the plus wipe and the progress fill, in ms. */
  stepDuration?: number;
  /** Easing for those small steps. The original: cubic-bezier(0.23, 1, 0.32, 1). */
  stepEase?: string;
  /** Easing for the narrow progress bar fill. The original: cubic-bezier(0.4, 0, 0.2, 1). */
  progressEase?: string;
  /** How far the active tab steps left, in px. */
  tabShift?: number;
  /** Opacity of the tabs that aren't active. */
  inactiveOpacity?: number;
  /** Blurred copy of the active card's photo glowing behind the card column. */
  glow?: boolean;
  /** Section background. */
  background?: string;
  /** Section text colour (tab titles, leader rule, progress bar and anything in `children`). */
  color?: string;
};

/** Card height (520) + track gap (10): how far the desktop track moves per card. */
const SLIDE_STEP = 530;
/** The original's dark scrim over each card photo: a corner shade, a shade up from the bottom left, and a flat 20% black. */
const SCRIM =
  "linear-gradient(-14.432deg, rgb(0 0 0 / 0) 70.131%, rgb(0 0 0 / 0.6) 92.224%), linear-gradient(222.36deg, rgb(0 0 0 / 0) 24.396%, rgb(0 0 0 / 0.6) 86.192%), linear-gradient(rgb(0 0 0 / 0.2), rgb(0 0 0 / 0.2))";

/**
 * Vertical tab slider: a 400×520 card window on the left and a column of tab
 * titles on the right. Hovering a title (or clicking it) slides the card track
 * to that card, steps the title left with a leader rule running into it from
 * behind the card, and crossfades a blurred glow of the card's photo. Ported
 * from the eight25 homepage's services section (`VerticalTabSlider`), without
 * its fade to a dark plate on scroll: the section simply uses the plate's
 * colours.
 *
 * Below a 960px-wide container the same cards become a native scroll-snap
 * carousel with a progress bar and counter, and the active card is read back
 * out of the scroll position.
 *
 * Timing: the track slides over `slideDuration` (500ms) on `slideEase`; the
 * glow crossfades over `fadeDuration` (700ms) on `fadeEase`; the tab step,
 * leader rule, card grow and plus wipe take `stepDuration` (300ms) on
 * `stepEase`, and the progress fill the same 300ms on `progressEase`.
 */
export function VerticalTabSlider({
  items,
  children,
  slideDuration = 500,
  slideEase = "cubic-bezier(0.23, 1, 0.32, 1)",
  fadeDuration = 700,
  fadeEase = "cubic-bezier(0.23, 1, 0.32, 1)",
  stepDuration = 300,
  stepEase = "cubic-bezier(0.23, 1, 0.32, 1)",
  progressEase = "cubic-bezier(0.4, 0, 0.2, 1)",
  tabShift = 40,
  inactiveOpacity = 0.4,
  glow = true,
  background = "#290044",
  color = "#FFFFFF",
  className,
  style,
  ...props
}: VerticalTabSliderProps) {
  const [active, setActive] = React.useState(0);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  // Carousel (narrow) only: the card nearest the scroller's centre is active.
  // On the desktop layout the scroller is overflow-hidden and never scrolls.
  const onScroll = React.useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const box = scroller.getBoundingClientRect();
    const centre = box.left + box.width / 2;
    let best = 0;
    let bestDistance = Infinity;
    scroller.querySelectorAll<HTMLElement>("[data-slide]").forEach((slide, i) => {
      const r = slide.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - centre);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    setActive(best);
  }, []);

  if (items.length === 0) return null;
  const current = Math.min(active, items.length - 1);

  return (
    <section
      className={cn("@container relative overflow-hidden", className)}
      style={
        {
          "--vts-fade": `${fadeDuration}ms`,
          "--vts-fade-ease": fadeEase,
          "--vts-step": `${stepDuration}ms`,
          "--vts-step-ease": stepEase,
          "--vts-progress-ease": progressEase,
          backgroundColor: background,
          color,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children ? <div className="relative z-10">{children}</div> : null}

      <div
        className={cn(
          "relative @min-[960px]:flex @min-[960px]:min-h-[445px] @min-[960px]:justify-between @min-[960px]:gap-[150px]",
          children ? "mt-[50px] @min-[960px]:mt-[140px]" : "",
        )}
      >
        {glow ? (
          // The active card's own photo, blurred 75px, mirrored, at 40%, behind the card column.
          <div
            aria-hidden
            className="pointer-events-none absolute top-[calc(50%+50px)] left-[41px] h-[565px] w-[518px] -translate-x-1/2 -translate-y-1/2 opacity-40 @min-[960px]:left-[61px] @min-[960px]:h-[1024px] @min-[960px]:w-[938px]"
          >
            <div className="relative h-full w-full -scale-x-100 overflow-hidden rounded-tl-[222px] @min-[960px]:rounded-tl-[403px] blur-[41px] @min-[960px]:blur-[75px]">
              {items.map((item, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={item.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-(--vts-fade) ease-(--vts-fade-ease)"
                  style={{ opacity: i === current ? 1 : 0 }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* The card window: a horizontal snap carousel when narrow, a 400×520 vertical track when wide. */}
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="relative z-10 -mx-5 snap-x snap-mandatory scroll-px-5 overflow-x-auto px-5 [scrollbar-width:none] @min-[720px]:scroll-px-0 @min-[720px]:px-0 @min-[960px]:mx-0 @min-[960px]:-my-[37.5px] @min-[960px]:h-[520px] @min-[960px]:w-[400px] @min-[960px]:shrink-0 @min-[960px]:snap-none @min-[960px]:self-center @min-[960px]:overflow-hidden [&::-webkit-scrollbar]:hidden"
        >
          <ul
            className="flex w-max items-center gap-5 @min-[720px]:px-[calc(50%-150px)] @min-[960px]:translate-y-(--vts-y) @min-[960px]:flex-col @min-[960px]:items-stretch @min-[960px]:gap-[10px] @min-[960px]:px-0 @min-[960px]:transition-transform @min-[960px]:ease-(--vts-slide-ease)"
            style={
              {
                "--vts-y": `-${current * SLIDE_STEP}px`,
                "--vts-slide-ease": slideEase,
                transitionDuration: `${slideDuration}ms`,
              } as React.CSSProperties
            }
          >
            {items.map((item, i) => (
              <li
                key={i}
                data-slide
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${items.length}`}
                className="flex h-[420px] w-[300px] shrink-0 snap-start items-center @min-[720px]:snap-center @min-[960px]:block @min-[960px]:h-[520px] @min-[960px]:w-[400px]"
              >
                <article
                  className={cn(
                    "relative flex w-full flex-col justify-between overflow-hidden p-5 text-white transition-[height] duration-(--vts-step) ease-(--vts-step-ease) @min-[960px]:h-full @min-[960px]:p-[30px]",
                    i === current ? "h-[420px]" : "h-[400px]",
                  )}
                >
                  {/* The photo is drawn larger than the card and cropped by it, with the scrim in the same box. */}
                  <div className="absolute top-[-18px] left-[-1px] h-[446px] w-[408px] @min-[960px]:top-[-10.5px] @min-[960px]:left-0 @min-[960px]:h-[531px] @min-[960px]:w-[487px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.imageAlt ?? ""} className="h-full w-full object-cover" />
                    <span aria-hidden className="absolute inset-0" style={{ backgroundImage: SCRIM }} />
                  </div>

                  <h3 className="relative text-[18px] leading-[1.4] font-bold whitespace-pre-line @min-[960px]:text-[14px] @min-[960px]:leading-[1.6]">
                    {item.title}
                  </h3>

                  <div className="relative flex items-end gap-5 @min-[960px]:gap-10">
                    <p className="line-clamp-5 min-w-0 flex-1 text-[18px] leading-[1.4] @min-[960px]:text-[24px]">
                      {item.description}
                    </p>
                    {item.href ? (
                      <a href={item.href} className="group/plus relative block size-[22px] shrink-0">
                        <PlusGlyph />
                        <span className="sr-only">{item.linkLabel ?? item.title}</span>
                      </a>
                    ) : (
                      <span aria-hidden className="size-[22px] shrink-0" />
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>

        {/* Narrow: progress bar + counter. */}
        <div className="relative mt-5 flex items-center gap-5 @min-[720px]:justify-center @min-[960px]:hidden">
          <span className="relative block h-[5px] w-[300px] bg-current/30">
            <span
              className="absolute inset-y-0 left-0 bg-current transition-[width] duration-(--vts-step) ease-(--vts-progress-ease)"
              style={{ width: `${((current + 1) / items.length) * 100}%` }}
            />
          </span>
          <span className="flex text-[14px] font-semibold tabular-nums">
            <span>{current + 1}</span>
            <span className="w-5 text-center font-normal opacity-50">/</span>
            <span>{items.length}</span>
          </span>
        </div>

        {/* Wide: the tab column. Hover selects (mouse only); click is the fallback; focus doesn't select. */}
        <div
          role="group"
          aria-label="Choose a slide"
          className="hidden @min-[960px]:relative @min-[960px]:z-[6] @min-[960px]:flex @min-[960px]:w-[730px] @min-[960px]:min-w-0 @min-[960px]:flex-col @min-[960px]:gap-[60px] @min-[960px]:self-end"
        >
          {items.map((item, i) => {
            const isActive = i === current;
            return (
              <button
                key={i}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActive(i)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setActive(i);
                }}
                className="relative cursor-pointer text-left text-[34px] leading-[1.1] tracking-[-1px] transition duration-(--vts-step) ease-(--vts-step-ease) focus-visible:opacity-100!"
                style={{
                  opacity: isActive ? 1 : inactiveOpacity,
                  transform: isActive ? `translateX(-${tabShift}px)` : undefined,
                }}
              >
                {/* Leader rule from behind the card into the active title, in the title's own colour. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-[-729px] h-px w-[729px] -translate-y-1/2 bg-linear-to-r from-current from-85% to-transparent transition-opacity duration-(--vts-step) ease-(--vts-step-ease)"
                  style={{ opacity: isActive ? 1 : 0 }}
                />
                {item.title}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** White disc with a purple plus; a violet disc wipes in from the bottom-left corner on hover. */
function PlusGlyph() {
  const plus = (bar: string) => (
    <>
      <span className={cn("absolute top-1/2 left-1/2 h-[1.5px] w-[10px] -translate-x-1/2 -translate-y-1/2", bar)} />
      <span className={cn("absolute top-1/2 left-1/2 h-[10px] w-[1.5px] -translate-x-1/2 -translate-y-1/2", bar)} />
    </>
  );
  return (
    <>
      <span aria-hidden className="absolute inset-0 rounded-full bg-white">
        {plus("bg-[#4E008E]")}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-[#6B00DF] [clip-path:circle(0%_at_0%_100%)] transition-[clip-path] duration-(--vts-step) ease-(--vts-step-ease) group-hover/plus:[clip-path:circle(150%_at_0%_100%)] motion-reduce:transition-none"
      >
        {plus("bg-white")}
      </span>
    </>
  );
}
