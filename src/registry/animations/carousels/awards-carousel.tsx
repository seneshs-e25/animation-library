"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AwardItem = {
  /** Award badge or logo. Fitted into a 220×100 box in the middle of the card. */
  image: React.ReactNode;
  /** Award name under the card. */
  title: React.ReactNode;
  /** Accessible name for the slide when `title` isn't plain text. */
  label?: string;
  /** Makes the whole card a link, e.g. to the press release. */
  href?: string;
};

type AwardsCarouselProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: AwardItem[];
  /** Section heading, top left. The arrows sit to its right. */
  heading?: React.ReactNode;
  /** Line under the heading. */
  description?: React.ReactNode;
  /** Width of each card, in px. */
  cardWidth?: number;
  /** Space between cards, in px. */
  gap?: number;
  /** Height of the glowing badge box, in px. */
  mediaHeight?: number;
  /** Corner radius of the badge box, in px. */
  radius?: number;
  /** Time the row takes to move one card, in ms. */
  duration?: number;
  /** Colour of the glow in the top-right of each card. */
  glowTop?: string;
  /** Colour of the glow along the bottom-left of each card. */
  glowBottom?: string;
  /** Heading, description, titles and dots. */
  color?: string;
  /** Arrow icon colour. */
  arrowColor?: string;
  /** Content width the heading, arrows and first card line up to, in px. */
  maxWidth?: number;
};

/** A drag further than this (px) changes slide. */
const SWIPE_THRESHOLD = 50;
/** The original switches from the arrow row to swipe + dots below this. */
const WIDE_QUERY = "(min-width: 992px)";

/** The two soft glows behind each badge, as blurred SVG shapes (from the original). */
function glowImage(top: string, bottom: string) {
  const topSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="239" height="200" viewBox="0 0 239 200" preserveAspectRatio="none" fill="none"><filter id="f" x="0" y="-309.6" width="473.1" height="571" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="52.72"/></filter><path filter="url(#f)" opacity=".5" fill="${top}" d="M105.445-123.866C192.665-122.574 304.657 63.213 349.75 155.944L367.681 44.27 290.07-204.164Z"/></svg>`;
  const bottomSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="200" viewBox="0 0 280 200" preserveAspectRatio="none" fill="none"><filter id="f" x="-216.2" y="-47.9" width="567.2" height="412.2" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="52.72"/></filter><path filter="url(#f)" opacity=".3" fill="${bottom}" d="M-105.443 57.557C-71.594 137.951 142.609 172.247 245.479 179.346L148.638 237.78-110.785 258.817Z"/></svg>`;
  const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return `${url(topSvg)} right top / 85.36% 100% no-repeat, ${url(bottomSvg)} left top / 100% 100% no-repeat`;
}

function useMediaQuery(query: string) {
  return React.useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => true,
  );
}

/**
 * Awards carousel: a row of award cards, each a badge on a soft pink and
 * purple glow with the award name underneath. Two pill arrows beside the
 * heading move the row one card at a time. Used on the Seemplicity website.
 *
 * How it works:
 * - The track is a flex row inside a viewport with `overflow: visible`, so
 *   the next card peeks past the content edge; the root clips it at the
 *   section edge. Changing slide moves the track with `translate3d` by
 *   `index × (cardWidth + gap)` over 600ms `ease` (Swiper's defaults).
 * - From 992px it shows as many whole cards as fit and stops when the last
 *   card is in view; the arrow at that end dims to 35% and disables.
 * - Below 992px the arrows hide and swipe plus a row of pill dots move
 *   between cards. Cards keep their width (capped at the row width), so on
 *   tablets two or more show with the next one peeking, and on phones one
 *   card fills the row with the next peeking past the edge.
 * - Left/Right keys work while focus is inside. Tabbing to a card link that
 *   is out of view scrolls the row to it.
 *
 * Reduced motion: the row jumps without a transition.
 */
export function AwardsCarousel({
  items,
  heading,
  description,
  cardWidth = 280,
  gap = 40,
  mediaHeight = 200,
  radius = 20,
  duration = 600,
  glowTop = "#E3308C",
  glowBottom = "#A309BB",
  color = "#410051",
  arrowColor = "#0B0623",
  maxWidth = 1280,
  className,
  style,
  ...props
}: AwardsCarouselProps) {
  const count = items.length;
  const wide = useMediaQuery(WIDE_QUERY);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = React.useState(0);
  const [index, setIndex] = React.useState(0);
  const [drag, setDrag] = React.useState<number | null>(null);
  const start = React.useRef<{ x: number; y: number; id: number } | null>(null);
  const moved = React.useRef(false);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Step one card at a time, but clamp the last step so the final card ends
  // flush with the content edge (as Swiper does). A card is never wider than
  // the row, so on a phone one card fills it and the next peeks in.
  const card = viewportWidth > 0 ? Math.min(cardWidth, viewportWidth) : cardWidth;
  const step = card + gap;
  const overflow = Math.max(0, count * step - gap - viewportWidth);
  const visible = Math.max(1, Math.floor((viewportWidth + gap) / step));
  const maxIndex =
    viewportWidth === 0 ? Math.max(0, count - 1) : Math.ceil(overflow / step - 0.01);
  const current = Math.min(index, maxIndex);
  const offset = viewportWidth > 0 ? Math.min(current * step, overflow) : null;

  const go = React.useCallback(
    (i: number) => setIndex(Math.min(Math.max(i, 0), maxIndex)),
    [maxIndex],
  );

  const canPrev = current > 0;
  const canNext = current < maxIndex;

  const onPointerDown = (e: React.PointerEvent) => {
    // The original only swipes below 992px; on wide screens allow touch and pen.
    if (e.button !== 0 || (wide && e.pointerType === "mouse")) return;
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
      if (drag <= -SWIPE_THRESHOLD && canNext) go(current + 1);
      else if (drag >= SWIPE_THRESHOLD && canPrev) go(current - 1);
    }
    setDrag(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" && canPrev) {
      e.preventDefault();
      go(current - 1);
    } else if (e.key === "ArrowRight" && canNext) {
      e.preventDefault();
      go(current + 1);
    }
  };

  const s = `[data-awards-carousel="${id}"]`;
  const glow = React.useMemo(() => glowImage(glowTop, glowBottom), [glowTop, glowBottom]);
  const arrows = maxIndex > 0 && (
    <div className="hidden shrink-0 gap-[15px] min-[992px]:flex">
      <ArrowButton direction="prev" disabled={!canPrev} onClick={() => go(current - 1)} />
      <ArrowButton direction="next" disabled={!canNext} onClick={() => go(current + 1)} />
    </div>
  );

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      className={cn("w-full min-w-0 overflow-x-clip px-5", className)}
      style={
        {
          "--ac-card": `${cardWidth}px`,
          "--ac-gap": `${gap}px`,
          "--ac-media-h": `${mediaHeight}px`,
          "--ac-radius": `${radius}px`,
          "--ac-duration": `${duration}ms`,
          "--ac-color": color,
          "--ac-arrow": arrowColor,
          "--ac-max": `${maxWidth}px`,
          "--ac-i": current,
          ...(offset !== null && { "--ac-offset": `${-offset}px` }),
          "--ac-drag": `${drag ?? 0}px`,
          color,
          ...style,
        } as React.CSSProperties
      }
      data-awards-carousel={id}
      onKeyDown={onKeyDown}
      {...props}
    >
      <style>{`
${s} [data-track]{transform:translate3d(calc(var(--ac-offset,calc(var(--ac-i) * -1 * (var(--ac-card) + var(--ac-gap)))) + var(--ac-drag)),0,0);transition:transform var(--ac-duration) ease}
${s} [data-slide]{width:min(var(--ac-card),100%)}
${s} [data-track][data-dragging]{transition:none}
@media (prefers-reduced-motion:reduce){${s} [data-track]{transition:none}}`}</style>

      <div className="mx-auto w-full max-w-(--ac-max)">
        {(heading || description || arrows) && (
          <div className="mb-10 flex items-end justify-between gap-10 min-[992px]:mb-[65px]">
            <div className="max-w-[600px] min-[992px]:max-w-[860px]">
              {heading && (
                <h2 className="text-[36px] leading-[1.2] font-normal tracking-[-0.72px] min-[992px]:text-[66px] min-[992px]:leading-none min-[992px]:font-light min-[992px]:tracking-[-1.72px]">
                  {heading}
                </h2>
              )}
              {description && (
                <p className={cn("text-[18px] leading-[1.6]", heading && "mt-4")}>{description}</p>
              )}
            </div>
            {arrows}
          </div>
        )}

        <div ref={viewportRef}>
          <div
            data-track
            data-dragging={drag !== null ? "" : undefined}
            className="flex touch-pan-y gap-(--ac-gap) select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onClickCapture={(e) => {
              // A drag shouldn't also follow a card link.
              if (moved.current) {
                e.preventDefault();
                e.stopPropagation();
                moved.current = false;
              }
            }}
          >
            {items.map((item, i) => {
              const name = item.label ?? (typeof item.title === "string" ? item.title : undefined);
              const card = (
                <>
                  <div
                    className="relative isolate flex h-(--ac-media-h) items-center justify-center overflow-hidden rounded-(--ac-radius) p-[30px] *:h-[100px] *:w-auto *:max-w-[220px] *:object-contain"
                    style={{ background: glow }}
                  >
                    {item.image}
                  </div>
                  <h3 className="pt-[21px] text-[22px] leading-[1.2] font-normal tracking-[-0.56px] min-[992px]:text-[28px]">
                    {item.title}
                  </h3>
                </>
              );
              return (
                <div
                  key={i}
                  data-slide
                  role="group"
                  aria-roledescription="slide"
                  aria-label={name ? `${name}, ${i + 1} of ${count}` : `${i + 1} of ${count}`}
                  className="shrink-0"
                  onFocus={() => {
                    if (i < current || i >= current + visible) go(i);
                  }}
                >
                  {item.href ? (
                    <a
                      href={item.href}
                      draggable={false}
                      className="block w-(--ac-card) max-w-full rounded-(--ac-radius) outline-none focus-visible:ring-2 focus-visible:ring-(--ac-color) focus-visible:ring-offset-4"
                    >
                      {card}
                    </a>
                  ) : (
                    <div className="w-(--ac-card) max-w-full">{card}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {maxIndex > 0 && (
          <div className="mt-8 flex justify-center gap-2.5 min-[992px]:hidden">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
                onClick={() => go(i)}
                className={cn(
                  "h-2.5 rounded-[10px] bg-(--ac-color) transition-[width,opacity] duration-300 ease-in-out",
                  i === current ? "w-[30px]" : "w-2.5 opacity-20",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-[70px] w-[120px] items-center justify-center rounded-[45px] border border-[rgba(160,160,160,0.3)] text-(--ac-arrow) outline-none",
        "transition-[opacity,background-color,scale] duration-200 ease-out disabled:opacity-35",
        "focus-visible:ring-2 focus-visible:ring-(--ac-color) focus-visible:ring-offset-2",
        "enabled:active:scale-[0.97] enabled:[@media(hover:hover)]:hover:bg-[rgba(160,160,160,0.08)]",
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 31 23"
        className={cn("h-[23px] w-[31px]", direction === "prev" && "rotate-180")}
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
      >
        <path d="M0 11.357h30m0 0L18.75.357M30 11.357l-11.25 11" />
      </svg>
    </button>
  );
}
