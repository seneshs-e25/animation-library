"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TestimonialItem = {
  /** The result, e.g. "75 hours saved monthly". Top of the open card. */
  headline: React.ReactNode;
  /** The customer's quote, quotation marks included. */
  quote: React.ReactNode;
  /** Who said it. First pill under the quote. */
  name: React.ReactNode;
  /** Their job title and company. Second pill. */
  role?: React.ReactNode;
  /** Portrait photo. Fills the photo panel of the open card (object-cover). */
  image: React.ReactNode;
  /** Photo for the closed side cards. Defaults to `image`. */
  thumbnail?: React.ReactNode;
  /** Accessible name for the story when `headline` isn't plain text. */
  label?: string;
};

type TestimonialSliderProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: TestimonialItem[];
  /** Advance to the next story on a timer. Pauses on hover, focus and off screen. */
  autoplay?: boolean;
  /** Time each story stays open while autoplaying, in ms. */
  interval?: number;
  /** Time the cards take to move and resize, in ms. */
  duration?: number;
  /** Easing of the move, any CSS timing function. */
  ease?: string;
  /** Time the story text and photo take to fade in, in ms (they fade out in half that). */
  fadeDuration?: number;
  /** Time a dot takes to stretch into the progress bar, in ms. */
  dotDuration?: number;
  /** Open card width, in px. Shrinks to fit narrower rows. */
  cardWidth?: number;
  /** Open card height, in px. */
  cardHeight?: number;
  /** Cards next to the open one, in px. */
  sideWidth?: number;
  sideHeight?: number;
  /** Outermost cards, in px. Shown only when the row is wide enough for all five. */
  edgeWidth?: number;
  edgeHeight?: number;
  /** Space between the open card and its neighbours, in px. */
  gap?: number;
  /** Space between the side and edge cards, in px. */
  edgeGap?: number;
  /** Below this row width the open card stacks its photo under the text, in px. */
  compactBelow?: number;
  /** Open card width when stacked, in px. */
  compactWidth?: number;
  /** Open card height when stacked, in px. */
  compactHeight?: number;
  /** Card corner radius, in px. */
  radius?: number;
  /** Photo corner radius, in px. */
  imageRadius?: number;
  /** Draw the little waisted bridges that join neighbouring cards. */
  connectors?: boolean;
  cardColor?: string;
  /** Headline, quote and pills. */
  color?: string;
  /** Progress fill in the active dot. */
  accent?: string;
  /** Dots and the empty part of the progress bar. */
  trackColor?: string;
  /** Classes for the quote, e.g. a serif font. */
  quoteClassName?: string;
};

/** A drag further than this (px) changes story. */
const SWIPE_THRESHOLD = 50;

const mod = (n: number, m: number) => ((n % m) + m) % m;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * Testimonial slider: one open customer story (result, quote, name, photo)
 * between narrow portrait cards. Choosing a portrait, a dot or waiting for
 * the progress bar morphs every card at once: the chosen portrait grows into
 * the open card while the open one shrinks back into a portrait, and the
 * story text slides in behind it. Used on the Calendly homepage.
 *
 * How it works:
 * - Every card is absolutely placed from the row's centre. A card's slot is
 *   its distance from the open story: 0 is open ({cardWidth}×{cardHeight}),
 *   ±1 are side cards, ±2 edge cards and ±3 hidden just off the ends.
 *   Changing story changes each card's `width`, `height` and `transform`
 *   together over `duration` on `ease`, so cards morph between slots.
 * - Cards are keyed by a never-wrapping position, so moving forward mounts a
 *   new hidden card at +3 and the one leaving drops to -3 and fades: the row
 *   slides on forever with no card crossing the screen.
 * - Inside each card, the story is laid out at the open card's full size and
 *   clipped, so it never reflows while the card resizes. It slides in from
 *   one card-width away and fades in over `fadeDuration`; the portrait
 *   thumbnail does the opposite.
 * - Autoplay fills the active dot over `interval` with a CSS animation, then
 *   moves on. Hover, focus inside, a hidden tab or the row being off screen
 *   pauses it.
 * - The row drops the edge cards when it's too narrow for five, and below
 *   `compactBelow` the open card stacks its photo under the text.
 *
 * Reduced motion: no autoplay; cards jump to their slots and the story
 * crossfades.
 */
export function TestimonialSlider({
  items,
  autoplay = true,
  interval = 6000,
  duration = 650,
  ease = "cubic-bezier(0.32, 0.72, 0, 1)",
  fadeDuration = 300,
  dotDuration = 300,
  cardWidth = 762,
  cardHeight = 513,
  sideWidth = 105,
  sideHeight = 344,
  edgeWidth = 74,
  edgeHeight = 205,
  gap = 20,
  edgeGap = 16,
  compactBelow = 768,
  compactWidth = 320,
  compactHeight = 538,
  radius = 64,
  imageRadius = 48,
  connectors = true,
  cardColor = "#FFFFFF",
  color = "#071A31",
  accent = "#4890E3",
  trackColor = "rgba(7, 26, 49, 0.1)",
  quoteClassName,
  className,
  style,
  "aria-label": ariaLabel = "Customer stories",
  ...props
}: TestimonialSliderProps) {
  const count = items.length;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const [pos, setPos] = React.useState(0);
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [onScreen, setOnScreen] = React.useState(true);
  const [docHidden, setDocHidden] = React.useState(false);
  const reduced = usePrefersReducedMotion();
  const swipe = React.useRef<{ x: number; y: number; id: number; moved: boolean } | null>(null);
  const swallowClick = React.useRef(false);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    const onVisibility = () => setDocHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const active = count > 0 ? mod(pos, count) : 0;

  // Layout for the current row width.
  const measured = width > 0 ? width : cardWidth + 2 * (gap + sideWidth + edgeGap + edgeWidth);
  const compact = measured < compactBelow;
  // Room for the open card with all four portraits beside it. Five cards
  // show while that leaves the open card at least 600px (or its full width).
  const fiveRoom = measured - 2 * (gap + sideWidth + edgeGap + edgeWidth);
  const fitsFive = !compact && fiveRoom >= Math.min(cardWidth, 600);
  const W = compact
    ? Math.max(200, Math.min(compactWidth, measured - 2 * (gap + 16)))
    : Math.max(320, Math.min(cardWidth, fitsFive ? fiveRoom : measured - 2 * (gap + sideWidth)));
  const H = compact ? compactHeight : cardHeight;
  // How many cards show on each side of the open one.
  const sides = Math.min(fitsFive ? 2 : 1, Math.floor((count - 1) / 2));

  const size = (slot: number): [number, number] => {
    const a = Math.abs(slot);
    if (a === 0) return [W, H];
    if (a === 1) return [sideWidth, sideHeight];
    return [edgeWidth, edgeHeight];
  };
  // Left edge of each slot, measured from the row's centre.
  const left = (slot: number) => {
    const a = Math.abs(slot);
    if (a === 0) return -W / 2;
    let edge = W / 2 + gap;
    if (a >= 2) edge += sideWidth + edgeGap;
    if (a >= 3) edge += edgeWidth + edgeGap;
    const [w] = size(slot);
    return slot > 0 ? edge : -edge - w;
  };
  // Space between this slot and the next one to its right.
  const gapAfter = (slot: number) => (slot === -1 || slot === 0 ? gap : edgeGap);
  const shown = (slot: number) => Math.abs(slot) <= sides;

  const go = React.useCallback(
    (target: number) => {
      if (count < 2) return;
      setPos((p) => {
        let delta = mod(target - mod(p, count), count);
        if (delta > count / 2) delta -= count;
        return p + delta;
      });
    },
    [count],
  );
  const step = React.useCallback((by: number) => setPos((p) => p + by), []);

  const playing = autoplay && !reduced && count > 1 && !hovered && !focused && onScreen && !docHidden;
  const timed = autoplay && !reduced && count > 1;

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = active + 1;
    else if (e.key === "ArrowLeft") next = active - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    if (next === null) return;
    e.preventDefault();
    const n = mod(next, count);
    go(n);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[n]?.focus();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || count < 2) return;
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = swipe.current;
    if (!s || s.id !== e.pointerId || s.moved) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
      s.moved = true;
      swallowClick.current = true;
      step(dx < 0 ? 1 : -1);
    }
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    if (swipe.current?.id === e.pointerId) swipe.current = null;
    setTimeout(() => (swallowClick.current = false), 0);
  };

  const s = `[data-testimonial-slider="${id}"]`;
  const slots = count > 0 ? [-3, -2, -1, 0, 1, 2, 3] : [];

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      data-testimonial-slider={id}
      className={cn("relative flex w-full min-w-0 flex-col items-center gap-10 overflow-x-clip", className)}
      style={
        {
          "--ts-duration": `${duration}ms`,
          "--ts-ease": ease,
          "--ts-fade": `${fadeDuration}ms`,
          "--ts-fade-out": `${Math.round(fadeDuration / 2)}ms`,
          "--ts-dot": `${dotDuration}ms`,
          "--ts-interval": `${interval}ms`,
          "--ts-radius": `${radius}px`,
          "--ts-image-radius": `${imageRadius}px`,
          "--ts-card": cardColor,
          "--ts-color": color,
          "--ts-accent": accent,
          "--ts-track": trackColor,
          ...style,
        } as React.CSSProperties
      }
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      {...props}
    >
      <style>{`
${s} [data-card]{transition:width var(--ts-duration) var(--ts-ease),height var(--ts-duration) var(--ts-ease),transform var(--ts-duration) var(--ts-ease),opacity var(--ts-duration) var(--ts-ease)}
@starting-style{${s} [data-card]{opacity:0}}
${s} [data-pane]{transition:transform var(--ts-duration) var(--ts-ease),opacity var(--ts-fade-out) ease-out}
${s} [data-open] [data-pane]{transition:transform var(--ts-duration) var(--ts-ease),opacity var(--ts-fade) ease-out}
${s} [data-thumb]{transition:opacity var(--ts-fade) ease-out}
${s} [data-bridge]{transition:width var(--ts-duration) var(--ts-ease),opacity var(--ts-fade) ease-out}
${s} [data-dot]{transition:width var(--ts-dot) cubic-bezier(0.23,1,0.32,1)}
${s} [data-fill]{animation:ts-fill-${id} var(--ts-interval) linear forwards}
@keyframes ts-fill-${id}{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@supports (corner-shape:superellipse(2)){${s} [data-squircle]{corner-shape:superellipse(2)}}
@media (prefers-reduced-motion:reduce){
${s} [data-card],${s} [data-bridge]{transition:opacity var(--ts-fade) ease}
${s} [data-pane]{transition:opacity var(--ts-fade) ease}
}`}</style>

      <div
        className="relative w-full touch-pan-y select-none"
        style={{ height: H }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={(e) => {
          if (swallowClick.current) {
            e.preventDefault();
            e.stopPropagation();
            swallowClick.current = false;
          }
        }}
      >
        {slots.map((slot) => {
          const virtual = pos + slot;
          const i = mod(virtual, count);
          const item = items[i];
          const open = slot === 0;
          const visible = shown(slot);
          const [w, h] = size(slot);
          const name = item.label ?? (typeof item.headline === "string" ? item.headline : undefined);
          const bridge = connectors && visible && shown(slot + 1) && slot < 3;
          return (
            <div
              key={virtual}
              data-card
              data-open={open ? "" : undefined}
              data-squircle
              role={open ? "group" : undefined}
              aria-roledescription={open ? "slide" : undefined}
              aria-label={open ? `${name ? `${name}, ` : ""}${i + 1} of ${count}` : undefined}
              aria-hidden={open ? undefined : true}
              onClick={open || !visible ? undefined : () => go(i)}
              className={cn(
                "absolute top-1/2 left-1/2 rounded-(--ts-radius) bg-(--ts-card) text-(--ts-color) shadow-[0_4px_12px_rgba(95,109,119,0.06)]",
                !open && visible && "cursor-pointer",
              )}
              style={{
                width: w,
                height: h,
                transform: `translate3d(${left(slot)}px, ${-h / 2}px, 0)`,
                opacity: visible ? 1 : 0,
                zIndex: 10 - Math.abs(slot),
                pointerEvents: visible ? undefined : "none",
              }}
            >
              <div data-squircle className="absolute inset-0 overflow-clip rounded-[inherit] [contain:layout_paint]">
                {/* Portrait shown while the card is closed. */}
                <div data-thumb className="absolute inset-0 p-4" style={{ opacity: open ? 0 : 1 }}>
                  <div
                    data-squircle
                    className="size-full overflow-clip rounded-(--ts-image-radius) bg-black/5 *:size-full *:object-cover"
                  >
                    {item.thumbnail ?? item.image}
                  </div>
                </div>

                {/* The story, laid out at the open size so it never reflows while the card resizes. */}
                <div
                  className="absolute top-1/2 left-1/2"
                  style={{ width: W, height: H, transform: "translate(-50%, -50%)" }}
                >
                  <div
                    data-pane
                    inert={!open}
                    className="size-full"
                    style={{
                      opacity: open ? 1 : 0,
                      transform: open ? "none" : `translateX(${slot < 0 ? "-" : ""}calc(100% + 60px))`,
                    }}
                  >
                    <Story item={item} compact={compact} quoteClassName={quoteClassName} />
                  </div>
                </div>
              </div>

              {bridge && (
                <Bridge
                  className="absolute inset-y-0 my-auto h-7"
                  style={{ left: "calc(100% - 1px)", width: gapAfter(slot) + 2 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div ref={tabsRef} role="tablist" aria-label="Stories" className="flex items-center gap-1.5" onKeyDown={onTabKeyDown}>
          {items.map((item, i) => {
            const selected = i === active;
            const name = item.label ?? (typeof item.headline === "string" ? item.headline : `Story ${i + 1}`);
            return (
              <button
                key={i}
                type="button"
                role="tab"
                data-dot
                aria-selected={selected}
                aria-label={name}
                tabIndex={selected ? 0 : -1}
                onClick={() => go(i)}
                className={cn(
                  "relative h-2 overflow-hidden rounded-[3px] bg-(--ts-track) outline-none",
                  "focus-visible:ring-2 focus-visible:ring-(--ts-accent) focus-visible:ring-offset-2",
                  selected ? "w-20" : "w-2 cursor-pointer",
                )}
              >
                {selected && (
                  <span
                    key={pos}
                    data-fill={timed ? "" : undefined}
                    aria-hidden
                    className="absolute inset-0 origin-left rounded-[3px] bg-(--ts-accent)"
                    style={{ animationPlayState: playing ? "running" : "paused" }}
                    onAnimationEnd={() => step(1)}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Story({
  item,
  compact,
  quoteClassName,
}: {
  item: TestimonialItem;
  compact: boolean;
  quoteClassName?: string;
}) {
  const people = (
    <div className={cn("flex min-w-0 max-w-full", compact ? "flex-col items-center" : "items-center")}>
      <Pill>{item.name}</Pill>
      {item.role && (
        <>
          <Bridge className={cn("shrink-0 opacity-100", compact ? "h-2 w-3.5 rotate-90" : "h-3.5 w-2")} tint />
          <Pill truncate>{item.role}</Pill>
        </>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="flex size-full flex-col gap-4 p-4 text-center">
        <div className="flex flex-col items-center gap-4 px-2 pt-3">
          <h3 className="line-clamp-2 text-[22px] leading-[1.15] font-medium tracking-[-0.5px] text-balance">{item.headline}</h3>
          <p className={cn("line-clamp-3 text-[20px] leading-[1.2] font-medium", quoteClassName)}>{item.quote}</p>
          {people}
        </div>
        <div data-squircle className="min-h-0 flex-1 overflow-clip rounded-(--ts-image-radius) bg-black/5 *:size-full *:object-cover">
          {item.image}
        </div>
      </div>
    );
  }

  return (
    <div className="flex size-full gap-4 p-4">
      <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-4 p-4">
        <h3 className="line-clamp-4 text-[36px] leading-[1.1] font-medium tracking-[-1px] text-balance">{item.headline}</h3>
        <div className="flex w-full min-w-0 flex-col gap-4">
          <p className={cn("line-clamp-5 text-[28px] leading-[1.2] font-medium", quoteClassName)}>{item.quote}</p>
          {people}
        </div>
      </div>
      <div
        data-squircle
        className="relative shrink-0 self-stretch overflow-clip rounded-(--ts-image-radius) bg-black/5 *:size-full *:object-cover"
        style={{ width: "clamp(200px, 50%, 361px)" }}
      >
        {item.image}
      </div>
    </div>
  );
}

function Pill({ children, truncate }: { children: React.ReactNode; truncate?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block max-w-full rounded-[4px] bg-[color-mix(in_srgb,var(--ts-color)_6%,transparent)] px-2 py-[3px] text-[12px] leading-[1.4] font-medium whitespace-nowrap opacity-80",
        truncate ? "min-w-0 truncate" : "shrink-0",
      )}
    >
      {children}
    </span>
  );
}

/** The waisted bridge that joins two neighbouring cards (or two pills). */
function Bridge({ className, style, tint }: { className?: string; style?: React.CSSProperties; tint?: boolean }) {
  return (
    <svg
      aria-hidden
      data-bridge={tint ? undefined : ""}
      viewBox="0 0 16 28"
      preserveAspectRatio="none"
      overflow="visible"
      className={cn("block", className)}
      style={style}
    >
      <path
        d="M0 0C0 0 .99 10.18 8 10.18 15.01 10.18 16 0 16 0V28C16 28 15.01 17.82 8 17.82.99 17.82 0 28 0 28V0Z"
        fill={tint ? "color-mix(in srgb, var(--ts-color) 6%, transparent)" : "var(--ts-card)"}
      />
    </svg>
  );
}
