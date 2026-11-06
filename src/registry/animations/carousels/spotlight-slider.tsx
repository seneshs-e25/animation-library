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
  /** Width of the focused slide when the slider is 1280px+ wide, in px. */
  slideWidth?: number;
  /** Max width of the area holding the arrows, in px. */
  maxWidth?: number;
  /** Time the row takes to slide to the next card, in ms. */
  duration?: number;
  /** Time a card takes to blur, fade and shrink in or out, in ms. */
  focusDuration?: number;
  /** Opacity of the cards either side (1024px+; narrower, they only blur and shrink). */
  inactiveOpacity?: number;
  /** Blur on the cards either side, in px. */
  inactiveBlur?: number;
  /** Scale of the cards either side (1024px+; narrower, they scale 0.9 × 0.95). */
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
  /**
   * Move to the next slide on a timer once the slider is 30% in view. Any
   * arrow, dot, tab, swipe or key press stops it for good; hovering the
   * slides pauses it. Off under reduced motion.
   */
  autoplay?: boolean;
  /** Time each slide stays in focus while autoplaying, in ms. */
  interval?: number;
};

/** A drag further than this (px) changes slide. */
const SWIPE_THRESHOLD = 50;

/**
 * Spotlight slider: one card in focus in the middle, the cards either side
 * peeking in blurred and slightly shrunk (and faded on wide screens).
 * Arrows, dots and a row of logo tabs move between them, and it autoplays
 * until someone uses it. Rebuilt from the Sophos website's "Slider with logo
 * tabs" (react-slick there; no dependencies here).
 *
 * How it works:
 * - The track is a flex row of full-width slides inside a centred viewport
 *   with `overflow: visible`, so neighbours peek past its edges. The root
 *   clips them at the section edge. Changing slide moves the track with
 *   `translateX(-index * 100%)` over 500ms `ease` (Slick's default).
 * - Cards that aren't in focus get `filter: blur(5px); scale: .9 .95`, and
 *   from 1024px also `opacity: .3; scale: .95`, transitioned over 150ms
 *   cubic-bezier(.4,0,.2,1), so the new card sharpens while the row is
 *   still moving.
 * - Autoplay advances every 5s once 30% of the slider is in view, pauses
 *   while the pointer is over the slides, stops at the last slide (unless
 *   `loop`), and stops for good on any interaction.
 * - Pointer drag follows the finger and changes slide past 50px. Left/Right
 *   keys work when focus is inside. Off-screen cards are `inert`, so tab
 *   order only reaches the focused one. A `<video>` in a slide plays when
 *   its slide comes into focus and pauses when it leaves.
 *
 * Breakpoints are container queries on the slider's own width (768px for
 * the arrows, 1024px for the logo tabs and fade) and on each card's width
 * for the `SpotlightSlide` layout, so it adapts to the column it sits in.
 *
 * Reduced motion: no autoplay; the row jumps and cards switch without
 * transitions.
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
  dividerColor = "#BBCFDE",
  dotColor = "#BBCFDE",
  showTabs = true,
  showDots = true,
  loop = false,
  autoplay = true,
  interval = 5000,
  className,
  style,
  ...props
}: SpotlightSliderProps) {
  const count = items.length;
  const [index, setIndex] = React.useState(() => Math.min(Math.max(defaultIndex, 0), count - 1));
  const [drag, setDrag] = React.useState<number | null>(null);
  // Autoplay runs until the first interaction, then never again (as in the original).
  const [stopped, setStopped] = React.useState(false);
  const playing = autoplay && !stopped;
  const [inView, setInView] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
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

  /** A user action: move, and stop autoplay for good. */
  const goByUser = (i: number) => {
    setStopped(true);
    go(i);
  };

  const canPrev = loop || index > 0;
  const canNext = loop || index < count - 1;

  // Start autoplay only once the slider is 30% in view.
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || !playing || inView) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [playing, inView]);

  // Autoplay timer. Restarts after every slide change, so each slide gets the full interval.
  React.useEffect(() => {
    if (!playing || !inView || hovered || drag !== null || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!loop && index >= count - 1) return;
    const t = window.setTimeout(() => go(index + 1), interval);
    return () => window.clearTimeout(t);
  }, [playing, inView, hovered, drag, index, count, loop, interval, go]);

  // Videos follow focus: the focused slide's video plays once the row has
  // settled, the others pause straight away. Nothing plays on first load.
  const firstRender = React.useRef(true);
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-slide]"));
    slides.forEach((slide, i) => {
      if (i !== index) slide.querySelectorAll("video").forEach((v) => v.pause());
    });
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      slides[index]?.querySelectorAll("video").forEach((v) => {
        v.play().catch(() => {});
      });
    }, duration);
    return () => window.clearTimeout(t);
  }, [index, duration]);

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
      setStopped(true);
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
      goByUser(index - 1);
    } else if (e.key === "ArrowRight" && canNext) {
      e.preventDefault();
      goByUser(index + 1);
    }
  };

  const s = `[data-spotlight-slider="${id}"]`;
  const hasTabs = showTabs && items.some((item) => item.tab);
  const hasDots = showDots && count > 1;
  const ease = "cubic-bezier(.4,0,.2,1)";

  return (
    <div
      ref={rootRef}
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
      {/* Slide widths follow the original: 320, 620, 830, then slideWidth (1012). */}
      <style>{`
${s} [data-viewport]{width:min(320px,100% - 40px)}
@container (min-width:768px){${s} [data-viewport]{width:620px}}
@container (min-width:1024px){${s} [data-viewport]{width:830px}}
@container (min-width:1280px){${s} [data-viewport]{width:min(var(--ss-w),100% - 160px)}}
${s} [data-track]{transition:transform var(--ss-duration) ease}
${s} [data-track][data-dragging]{transition:none}
${s} [data-card]{transition:opacity var(--ss-focus-duration) ${ease},filter var(--ss-focus-duration) ${ease},scale var(--ss-focus-duration) ${ease}}
${s} [data-slide]:not([data-active]) [data-card]{filter:blur(var(--ss-blur));scale:.9 .95}
@container (min-width:1024px){${s} [data-slide]:not([data-active]) [data-card]{opacity:var(--ss-dim);scale:var(--ss-scale)}}
@media (prefers-reduced-motion:reduce){${s} [data-track],${s} [data-card]{transition:none!important}}`}</style>

      <div className="relative mx-auto w-full max-w-(--ss-max)">
        <div
          data-viewport
          className="mx-auto"
          onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
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
                return;
              }
              // Clicking the focused card (e.g. its play button) stops autoplay.
              setStopped(true);
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
                >
                  <div
                    data-card
                    inert={!active}
                    className="relative isolate flex w-full overflow-hidden rounded-(--ss-radius) bg-(--ss-card-bg)"
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
          onClick={() => goByUser(index - 1)}
          className="left-0"
        />
        <ArrowButton
          direction="next"
          disabled={!canNext}
          onClick={() => goByUser(index + 1)}
          className="right-0"
        />
      </div>

      {hasTabs && (
        <div className="mt-[30px] hidden min-h-[60px] items-center justify-center gap-20 @min-[1024px]:flex">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}${item.label ? `: ${item.label}` : ""}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => goByUser(i)}
              className={cn(
                "relative flex h-[28px] items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-(--ss-accent) focus-visible:ring-offset-4 @min-[1280px]:h-[35px]",
                "*:h-full *:w-auto *:object-contain",
                // Colour logos are grey until active; hover brings the colour back from 1280px.
                i === index
                  ? "*:opacity-100"
                  : "*:opacity-90 *:grayscale @min-[1280px]:[@media(hover:hover)]:hover:*:opacity-100 @min-[1280px]:[@media(hover:hover)]:hover:*:grayscale-0",
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
              onClick={() => goByUser(i)}
              className={cn(
                "h-2.5 rounded-[5px] transition-[width] duration-150 ease-[cubic-bezier(.4,0,.2,1)]",
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
  /** Photo, video still or `<video>`; fills the right of the card. */
  media?: React.ReactNode;
  /** Shows a play button over the media when set. */
  onPlay?: () => void;
  /** Replaces the default round play button's icon, e.g. an image of the site's own. */
  playIcon?: React.ReactNode;
  /**
   * Decorative pattern over the card's right side. `wide` shows when the
   * card is 800px+ (1012×569 in the original), `narrow` below (327px wide).
   */
  pattern?: { wide?: string; narrow?: string };
  /** Accent for the default play icon. */
  accent?: string;
  /** Colour of the opening quote mark; fades out towards its bottom right. */
  quoteMarkColor?: string;
  className?: string;
};

/**
 * The Sophos testimonial layout: black card, text column on the left, media
 * on the right fading into black under a left-to-right gradient, a play
 * button over the media and an optional pattern overlay.
 */
export function SpotlightSlide({
  logo,
  quote,
  name,
  role,
  media,
  onPlay,
  playIcon,
  pattern,
  accent = "#2006F7",
  quoteMarkColor = "#00F2B3",
  className,
}: SpotlightSlideProps) {
  const gradientId = `ss-quote-${React.useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  return (
    // Its own container: the layout follows the card's width, not the window's.
    <div className="@container flex w-full">
      <div className={cn("relative flex w-full flex-col text-white @min-[800px]:min-h-[460px]", className)}>
        {pattern && (
          <span aria-hidden className="pointer-events-none absolute right-0 bottom-0 z-2 h-full w-[327px] @min-[800px]:h-[569px] @min-[800px]:w-[1012px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {pattern.narrow && <img src={pattern.narrow} alt="" className="size-full @min-[800px]:hidden" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {pattern.wide && <img src={pattern.wide} alt="" className="hidden size-full @min-[800px]:block" />}
          </span>
        )}

        {media && (
          <div className="absolute inset-x-0 bottom-0 z-0 h-[212px] @min-[600px]:h-[349px] @min-[800px]:inset-y-0 @min-[800px]:right-[-72px] @min-[800px]:left-auto @min-[800px]:h-full @min-[800px]:w-[868px]">
            <div className="absolute inset-0 *:size-full *:object-cover">{media}</div>
            <span
              aria-hidden
              className="absolute inset-x-0 -top-[2px] h-[122px] bg-linear-to-b from-black to-transparent @min-[800px]:inset-y-0 @min-[800px]:-left-[2px] @min-[800px]:h-full @min-[800px]:w-[489px] @min-[800px]:bg-linear-to-r"
            />
            {onPlay && (
              <button
                type="button"
                aria-label="Play video"
                onClick={onPlay}
                className="group/play absolute inset-0 z-3 flex items-center justify-center outline-none"
              >
                <span className="flex size-[60px] items-center justify-center rounded-full transition-transform duration-200 ease-[cubic-bezier(.4,0,.2,1)] group-focus-visible/play:ring-3 group-focus-visible/play:ring-white/70 @min-[800px]:size-[90px] @min-[800px]:[@media(hover:hover)]:group-hover/play:scale-110">
                  {playIcon ?? (
                    <span className="flex size-full items-center justify-center rounded-full bg-white drop-shadow-[0_54px_81px_rgba(0,26,71,0.5)]">
                      <svg aria-hidden viewBox="0 0 24 24" className="ml-1 size-6 @min-[800px]:size-9" fill={accent}>
                        <path d="M6 3.5v17l14-8.5z" />
                      </svg>
                    </span>
                  )}
                </span>
              </button>
            )}
          </div>
        )}

        <div className="pointer-events-none relative z-2 p-[30px] pb-[200px] @min-[600px]:pb-[260px] @min-[800px]:flex @min-[800px]:h-full @min-[800px]:w-[480px] @min-[800px]:flex-1 @min-[800px]:flex-col @min-[800px]:justify-end @min-[800px]:p-10">
          {logo && (
            <div className="mb-10 h-[38px] *:h-full *:w-auto *:max-w-[180px] *:object-contain *:brightness-0 *:invert @min-[800px]:mb-auto">
              {logo}
            </div>
          )}
          <blockquote className="relative mb-10 text-[24px] leading-[1.15] font-light tracking-[-0.08em] @min-[800px]:mt-10">
            {/* The Sophos quote mark: outlined, fading out to the bottom right. */}
            <svg
              aria-hidden
              viewBox="5 259 45 35"
              className="absolute -top-4 -left-[17px] h-[35px] w-[45px] @min-[800px]:-top-5"
              fill="none"
            >
              <defs>
                <linearGradient id={gradientId} x1="10.56" y1="261.69" x2="37.84" y2="294.81" gradientUnits="userSpaceOnUse">
                  <stop stopColor={quoteMarkColor} />
                  <stop offset="0.385" stopColor={quoteMarkColor} stopOpacity="0.9" />
                  <stop offset="0.648" stopColor={quoteMarkColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M7 294V273.609L13.249 260H21.792L15.6885 273.291L15.3633 274H25.2861V294H7ZM32.7139 294V273.611L38.9639 260H47.5059L41.4023 273.291L41.0772 274H51V294H32.7139Z"
                stroke={`url(#${gradientId})`}
              />
            </svg>
            {quote}&rdquo;
          </blockquote>
          {(name || role) && (
            <div>
              {name && <p className="mb-[5px] text-[18px] leading-[1.25] tracking-[-0.08em]">{name}</p>}
              {role && <p className="text-[14px] leading-[1.8] tracking-[0.02em]">{role}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
