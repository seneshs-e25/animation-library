"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SpotlightSlideItem = {
  /** The slide itself. `SpotlightSlide` gives the testimonial layout. */
  content: React.ReactNode;
  /** Accessible name for the slide, e.g. the customer's name. */
  label?: string;
  /** Logo shown in the tab row under the slider (when the slider is 1024px+ wide). */
  tab?: React.ReactNode;
};

type SpotlightSliderProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: SpotlightSlideItem[];
  /** Slide that starts in focus. */
  defaultIndex?: number;
  /** Width of the focused slide on wide screens, in px. */
  slideWidth?: number;
  /** Max width of the area holding the arrows, in px. */
  maxWidth?: number;
  /** Time the row takes to slide to the next card, in ms. */
  duration?: number;
  /** Time a card takes to blur, fade and shrink in or out, in ms. */
  focusDuration?: number;
  /** Opacity of the cards either side. */
  inactiveOpacity?: number;
  /** Blur on the cards either side, in px. */
  inactiveBlur?: number;
  /** Scale of the cards either side. */
  inactiveScale?: number;
  /** Card corner radius, in px. */
  radius?: number;
  /** Arrow icon colour, arrow hover fill and active dot colour. */
  accent?: string;
  /** Card background, behind the slide content. */
  cardBackground?: string;
  /** Hairline between the logo tabs. */
  dividerColor?: string;
  /** Inactive dot colour. */
  dotColor?: string;
  /** Show the logo tabs when the slider is 1024px+ wide (items need a `tab`). */
  showTabs?: boolean;
  /**
   * Show the row of dots. They replace the logo tabs below 1024px, and show
   * at every width when there are no tabs, so phones always get a control
   * besides swiping.
   */
  showDots?: boolean;
  /** Wrap from the last slide to the first. The original stops at the ends. */
  loop?: boolean;
};

/** A drag further than this (px) changes slide. */
const SWIPE_THRESHOLD = 50;

/**
 * Spotlight slider: one card in focus in the middle, the cards either side
 * peeking in blurred, faded and slightly shrunk. Arrows and a row of logo
 * tabs move between them. Used on the Sophos website for case studies.
 *
 * How it works:
 * - The track is a flex row of full-width slides inside a centred viewport
 *   with `overflow: visible`, so neighbours peek past its edges. The root
 *   clips them at the section edge. Changing slide moves the track with
 *   `translateX(-index * 100%)` over 500ms `ease` (Slick's default).
 * - Cards that aren't in focus get `opacity: .3; filter: blur(5px);
 *   scale: .95`, transitioned over 150ms cubic-bezier(.4,0,.2,1), so the
 *   new card sharpens while the row is still moving.
 * - Pointer drag follows the finger and changes slide past 50px. Clicking
 *   a peeking card focuses it. Left/Right keys work when focus is inside.
 * - Off-screen cards are `inert`, so tab order only reaches the focused one.
 *
 * Breakpoints are container queries on the slider's own width (768px for
 * the arrows, 1024px for the logo tabs) and on each card's width for the
 * `SpotlightSlide` layout, so it adapts to the column it sits in.
 *
 * Reduced motion: the row jumps and cards switch without transitions.
 */
export function SpotlightSlider({
  items,
  defaultIndex = 0,
  slideWidth = 1012,
  maxWidth = 1220,
  duration = 500,
  focusDuration = 150,
  inactiveOpacity = 0.3,
  inactiveBlur = 5,
  inactiveScale = 0.95,
  radius = 10,
  accent = "#2006F7",
  cardBackground = "#000000",
  dividerColor = "#C9D4E2",
  dotColor = "#BBCFDE",
  showTabs = true,
  showDots = true,
  loop = false,
  className,
  style,
  ...props
}: SpotlightSliderProps) {
  const count = items.length;
  const [index, setIndex] = React.useState(() => Math.min(Math.max(defaultIndex, 0), count - 1));
  const [drag, setDrag] = React.useState<number | null>(null);
  const start = React.useRef<{ x: number; y: number; id: number } | null>(null);
  const moved = React.useRef(false);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");

  const go = React.useCallback(
    (i: number) => {
      if (count === 0) return;
      setIndex(loop ? (i + count) % count : Math.min(Math.max(i, 0), count - 1));
    },
    [count, loop],
  );

  const canPrev = loop || index > 0;
  const canNext = loop || index < count - 1;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    moved.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    if (!moved.current) {
      // Let vertical scrolls through; only claim clearly horizontal drags.
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(e.clientY - s.y)) return;
      moved.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    // Resist past the ends, like a rubber band.
    const atEdge = (dx > 0 && !canPrev) || (dx < 0 && !canNext);
    setDrag(atEdge ? dx * 0.25 : dx);
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    start.current = null;
    if (drag !== null) {
      if (drag <= -SWIPE_THRESHOLD && canNext) go(index + 1);
      else if (drag >= SWIPE_THRESHOLD && canPrev) go(index - 1);
    }
    setDrag(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" && canPrev) {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "ArrowRight" && canNext) {
      e.preventDefault();
      go(index + 1);
    }
  };

  const s = `[data-spotlight-slider="${id}"]`;
  const hasTabs = showTabs && items.some((item) => item.tab);
  const hasDots = showDots && count > 1;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      className={cn("@container w-full min-w-0 overflow-x-clip", className)}
      style={
        {
          "--ss-w": `${slideWidth}px`,
          "--ss-max": `${maxWidth}px`,
          "--ss-duration": `${duration}ms`,
          "--ss-focus-duration": `${focusDuration}ms`,
          "--ss-dim": inactiveOpacity,
          "--ss-blur": `${inactiveBlur}px`,
          "--ss-scale": inactiveScale,
          "--ss-radius": `${radius}px`,
          "--ss-accent": accent,
          "--ss-card-bg": cardBackground,
          "--ss-divider": dividerColor,
          "--ss-dot": dotColor,
          ...style,
        } as React.CSSProperties
      }
      data-spotlight-slider={id}
      onKeyDown={onKeyDown}
      {...props}
    >
      <style>{`
${s} [data-viewport]{width:calc(100% - 40px)}
@container (min-width:768px){${s} [data-viewport]{width:min(var(--ss-w),100% - 160px)}}
${s} [data-track]{transition:transform var(--ss-duration) ease}
${s} [data-track][data-dragging]{transition:none}
${s} [data-card]{transition:opacity var(--ss-focus-duration) cubic-bezier(.4,0,.2,1),filter var(--ss-focus-duration) cubic-bezier(.4,0,.2,1),scale var(--ss-focus-duration) cubic-bezier(.4,0,.2,1)}
${s} [data-slide]:not([data-active]) [data-card]{opacity:var(--ss-dim);filter:blur(var(--ss-blur));scale:var(--ss-scale)}
@media (prefers-reduced-motion:reduce){${s} [data-track],${s} [data-card]{transition:none!important}}`}</style>

      <div className="relative mx-auto w-full max-w-(--ss-max)">
        <div data-viewport className="mx-auto">
          <div
            data-track
            data-dragging={drag !== null ? "" : undefined}
            className="flex touch-pan-y select-none"
            style={{
              transform:
                drag !== null
                  ? `translate3d(calc(${-index * 100}% + ${drag}px),0,0)`
                  : `translate3d(${-index * 100}%,0,0)`,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onClickCapture={(e) => {
              // A drag shouldn't also click a link inside the slide.
              if (moved.current) {
                e.preventDefault();
                e.stopPropagation();
                moved.current = false;
              }
            }}
          >
            {items.map((item, i) => {
              const active = i === index;
              return (
                <div
                  key={i}
                  data-slide
                  data-active={active ? "" : undefined}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={item.label ? `${item.label}, ${i + 1} of ${count}` : `${i + 1} of ${count}`}
                  className="flex w-full shrink-0"
                  onClick={active ? undefined : () => go(i)}
                >
                  <div
                    data-card
                    inert={!active}
                    className={cn(
                      "relative isolate flex w-full overflow-hidden rounded-(--ss-radius) bg-(--ss-card-bg)",
                      !active && "cursor-pointer",
                    )}
                  >
                    {item.content}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <ArrowButton
          direction="prev"
          disabled={!canPrev}
          onClick={() => go(index - 1)}
          className="left-0"
        />
        <ArrowButton
          direction="next"
          disabled={!canNext}
          onClick={() => go(index + 1)}
          className="right-0"
        />
      </div>

      {hasTabs && (
        <div className="mt-6 hidden items-center justify-center gap-20 @min-[1024px]:flex">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}${item.label ? `: ${item.label}` : ""}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
              className={cn(
                "relative flex h-[35px] items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-(--ss-accent) focus-visible:ring-offset-4",
                "*:h-full *:w-auto *:transition-[filter,opacity] *:duration-200",
                i === index
                  ? "*:opacity-100"
                  : "*:opacity-90 *:grayscale [@media(hover:hover)]:hover:*:opacity-100 [@media(hover:hover)]:hover:*:grayscale-0",
                i < count - 1 &&
                  "after:pointer-events-none after:absolute after:top-1/2 after:-right-10 after:h-[60px] after:w-px after:-translate-y-1/2 after:bg-(--ss-divider)",
              )}
            >
              {item.tab}
            </button>
          ))}
        </div>
      )}

      {hasDots && (
        <div className={cn("mt-10 flex justify-center gap-2.5", hasTabs && "@min-[1024px]:hidden")}>
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}${item.label ? `: ${item.label}` : ""}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
              className={cn(
                "h-2.5 rounded-[5px] transition-[width,background-color] duration-200 ease-out",
                i === index ? "w-[30px] bg-(--ss-accent)" : "w-2.5 bg-(--ss-dot)",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
  className,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group absolute top-1/2 z-2 hidden size-[50px] -translate-y-1/2 items-center justify-center rounded-full bg-white text-(--ss-accent) shadow-[0_34px_40px_rgba(0,26,71,0.1),0_5px_20px_rgba(0,26,71,0.05)] outline-none transition-colors duration-300 ease-in-out @min-[768px]:flex",
        "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--ss-accent)",
        "enabled:[@media(hover:hover)]:hover:bg-(--ss-accent) enabled:[@media(hover:hover)]:hover:text-white disabled:cursor-default",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 12 22"
        className={cn("h-[21px] w-[11px]", direction === "next" && "-scale-x-100")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path d="M11 1 1 11l10 10" />
      </svg>
    </button>
  );
}

type SpotlightSlideProps = {
  /** Customer logo, top left. Shown white. */
  logo?: React.ReactNode;
  /** The quote, without quotation marks. */
  quote: React.ReactNode;
  name?: React.ReactNode;
  role?: React.ReactNode;
  /** Photo or video still; fills the right of the card. */
  media?: React.ReactNode;
  /** Shows a play button over the media when set. */
  onPlay?: () => void;
  /** Accent for the play icon and quote mark. */
  accent?: string;
  /** Colour of the opening quote mark. */
  quoteMarkColor?: string;
  className?: string;
};

/**
 * The Sophos testimonial layout: black card, text column on the left, media
 * on the right fading into black under a left-to-right gradient, and a play
 * button over the media.
 */
export function SpotlightSlide({
  logo,
  quote,
  name,
  role,
  media,
  onPlay,
  accent = "#2006F7",
  quoteMarkColor = "#00F2B3",
  className,
}: SpotlightSlideProps) {
  return (
    // Its own container: the layout follows the card's width, not the window's.
    <div className="@container flex w-full">
      <div className={cn("relative flex w-full flex-col text-white @min-[900px]:min-h-[460px]", className)}>
        {media && (
          <div className="absolute inset-x-0 bottom-0 z-0 h-[212px] @min-[600px]:h-[349px] @min-[900px]:inset-y-0 @min-[900px]:right-[-72px] @min-[900px]:left-auto @min-[900px]:h-full @min-[900px]:w-[868px]">
            <div className="absolute inset-0 *:size-full *:object-cover">{media}</div>
            <span
              aria-hidden
              className="absolute inset-x-0 -top-px h-[122px] bg-linear-to-b from-black to-transparent @min-[900px]:inset-y-0 @min-[900px]:-left-px @min-[900px]:h-full @min-[900px]:w-[489px] @min-[900px]:bg-linear-to-r"
            />
            {onPlay && (
              <button
                type="button"
                aria-label="Play video"
                onClick={onPlay}
                className="group/play absolute inset-0 z-1 flex items-center justify-center outline-none"
              >
                <span className="flex size-[60px] items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-out group-focus-visible/play:ring-3 group-focus-visible/play:ring-white/70 @min-[900px]:size-[90px] [@media(hover:hover)]:group-hover/play:scale-110">
                  <svg aria-hidden viewBox="0 0 24 24" className="ml-1 size-6 @min-[900px]:size-9" fill={accent}>
                    <path d="M6 3.5v17l14-8.5z" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        )}

        <div className="pointer-events-none relative z-2 p-5 pb-[240px] @min-[600px]:pb-[380px] @min-[900px]:flex @min-[900px]:h-full @min-[900px]:w-[480px] @min-[900px]:flex-1 @min-[900px]:flex-col @min-[900px]:justify-end @min-[900px]:p-10 @min-[900px]:pb-10">
          {logo && (
            <div className="mb-10 h-[36px] *:h-full *:w-auto *:max-w-[180px] *:object-contain *:brightness-0 *:invert @min-[900px]:mb-auto">
              {logo}
            </div>
          )}
          <blockquote className="relative mb-10 text-[20px] leading-[1.15] font-light tracking-[-0.08em] @min-[900px]:mt-10 @min-[900px]:text-[24px]">
            <svg
              aria-hidden
              viewBox="0 0 45 35"
              className="absolute -top-4 -left-[17px] h-[35px] w-[45px] @min-[900px]:-top-5"
              fill="none"
              stroke={quoteMarkColor}
              strokeWidth="1.5"
            >
              <path d="M14 1 4 18v16M30 1 20 18" />
            </svg>
            {quote}&rdquo;
          </blockquote>
          {(name || role) && (
            <div>
              {name && <p className="mb-1 text-[18px] leading-[1.25] tracking-[-0.08em]">{name}</p>}
              {role && <p className="text-[14px] leading-[1.8] tracking-[0.02em]">{role}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
