"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";

export type ExpertItem = {
  /** Headshot. Shown as a 220×220 circle (object-cover) at the top of the card. */
  image: React.ReactNode;
  /** Person's name, under the photo and at the top of the bio side. */
  name: React.ReactNode;
  /** Job title under the name. */
  role: React.ReactNode;
  /** Short bio shown on the back of the card. */
  bio: React.ReactNode;
  /** LinkedIn profile URL. Shows the LinkedIn button in the card footer. */
  href?: string;
  /** Accessible name for the slide when `name` isn't plain text. */
  label?: string;
};

type ExpertCardCarouselProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: ExpertItem[];
  /** Most cards shown at once. Fewer show when the row is narrower than `minCardWidth` per card. */
  perView?: number;
  /** Narrowest a card may get before one fewer card shows, in px. */
  minCardWidth?: number;
  /** Space between cards, in px. */
  gap?: number;
  /** Card height, in px. */
  cardHeight?: number;
  /** Radius of the top-right and bottom-left corners, in px (the other two stay square). */
  radius?: number;
  /** Time the row takes to move one card, in ms. */
  duration?: number;
  /** Easing of the row, any CSS timing function. */
  ease?: string;
  /** Time a card takes to flip to its bio and back, in ms. */
  flipDuration?: number;
  /** Easing of the flip, any CSS timing function. */
  flipEase?: string;
  /** Time the Bio icon takes to swap, in ms. */
  iconDuration?: number;
  /** Easing of the Bio icon swap, any CSS timing function. */
  iconEase?: string;
  /** Time an arrow takes to grow on hover or dip on press, in ms. */
  arrowDuration?: number;
  /** Easing of the arrows, any CSS timing function. */
  arrowEase?: string;
  /** Front of the card. */
  cardColor?: string;
  /** Back (bio side) of the card. */
  backColor?: string;
  /** The Bio label and its icon. */
  accent?: string;
  /** Names, roles and bios. */
  color?: string;
  /** Loop past the last card back to the first. */
  loop?: boolean;
};

/** A drag further than this (px) changes slide. */
const SWIPE_THRESHOLD = 50;

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Expert card carousel: a row of people cards (photo, name, role) that two
 * round arrows on the row's edges move one card at a time, looping forever.
 * The Bio button in a card's footer flips that card over in 3D to show a
 * short bio. Used on the Medrio website.
 *
 * How it works:
 * - Up to `perView` (4) cards share the row with `gap` (40px) between them;
 *   one fewer shows whenever a card would drop under `minCardWidth`, so the
 *   row goes 4 → 3 → 2 → 1 as it narrows.
 * - Looping: the cards are rendered three times in one track. The track sits
 *   on the middle copy and moves with `translate3d` over `duration` (500ms)
 *   on `ease`. When a move ends in the first or last copy, the track jumps
 *   by one copy with its transition off, which looks identical, so the row
 *   never runs out.
 * - Drag (mouse, touch or pen) follows the pointer 1:1. On release the row
 *   moves by as many cards as were dragged, at least one past 50px.
 * - Flip: each card has a front and a back face with `backface-visibility:
 *   hidden` inside a 1000px perspective. Bio turns both faces 180° on Y over
 *   `flipDuration` (600ms) on `flipEase`. One card is flipped at a time, and
 *   any slide change turns it back. The footer (LinkedIn and Bio) doesn't
 *   flip; the Bio icon crossfades from a turn arrow to a close mark over
 *   `iconDuration` (200ms).
 * - Arrows grow slightly on hover and dip on press over `arrowDuration`.
 * - Left/Right keys work while focus is inside. Cards out of view are inert.
 *
 * Reduced motion: the row jumps and the flip becomes a crossfade.
 */
export function ExpertCardCarousel({
  items,
  perView = 4,
  minCardWidth = 250,
  gap = 40,
  cardHeight = 406,
  radius = 16,
  duration = 500,
  ease = "cubic-bezier(0.77, 0, 0.175, 1)",
  flipDuration = 600,
  flipEase = "cubic-bezier(0.77, 0, 0.175, 1)",
  iconDuration = 200,
  iconEase = "cubic-bezier(0.23, 1, 0.32, 1)",
  arrowDuration = 200,
  arrowEase = "cubic-bezier(0.23, 1, 0.32, 1)",
  cardColor = "#FFFFFF",
  backColor = "#F0F0F0",
  accent = "#F55001",
  color = "#000000",
  loop = true,
  className,
  style,
  "aria-label": ariaLabel = "Experts",
  ...props
}: ExpertCardCarouselProps) {
  const count = items.length;
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // How many cards fit, and how wide each one is.
  const shown =
    width > 0
      ? Math.max(1, Math.min(perView, Math.floor((width + gap) / (minCardWidth + gap))))
      : perView;
  const card = width > 0 ? (width - gap * (shown - 1)) / shown : 0;
  const step = card + gap;

  // Loop only when there's more than a row's worth of cards.
  const looping = loop && count > shown;
  const copies = looping ? 3 : 1;
  const base = looping ? count : 0;
  const maxIndex = looping ? Infinity : Math.max(0, count - shown);

  const [index, setIndex] = React.useState(base);
  const [drag, setDrag] = React.useState<number | null>(null);
  const [flipped, setFlipped] = React.useState<number | null>(null);
  const start = React.useRef<{ x: number; y: number; id: number } | null>(null);
  const moved = React.useRef(false);

  // Keep the index valid when looping switches on or off (e.g. on resize).
  const current = looping
    ? index < 0 || index >= count * 3
      ? base
      : index
    : Math.min(Math.max(index, 0), maxIndex);

  // A move that ends in the first or last copy jumps back to the middle one.
  const normalize = React.useCallback(
    (i: number) => (looping ? (((i - count) % count) + count) % count + count : i),
    [looping, count],
  );

  const go = React.useCallback(
    (i: number) => {
      setFlipped(null);
      if (!looping) {
        setIndex(Math.min(Math.max(i, 0), maxIndex));
        return;
      }
      // No transition means no transitionend, so wrap straight away.
      if (reducedMotion() || duration <= 0) {
        setIndex(normalize(i));
        return;
      }
      // Stay inside the three copies even if someone clicks faster than the
      // row can wrap.
      setIndex(Math.min(Math.max(i, 0), count * 3 - shown));
    },
    [looping, maxIndex, normalize, duration, count, shown],
  );

  const onTransitionEnd = (e: React.TransitionEvent) => {
    const el = trackRef.current;
    if (!el || e.target !== el || e.propertyName !== "transform" || !looping) return;
    const n = normalize(current);
    if (n === current) return;
    // Jump to the same cards in the middle copy with the transition off:
    // render the new position now, force a layout, then hand the
    // transition back to the stylesheet.
    el.style.transition = "none";
    flushSync(() => setIndex(n));
    el.getBoundingClientRect();
    el.style.transition = "";
  };

  const canPrev = looping || current > 0;
  const canNext = looping || current < maxIndex;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (!looping && maxIndex === 0)) return;
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
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // The pointer is already gone; the drag still works without capture.
      }
    }
    // Without a loop, resist past the ends like a rubber band.
    const atEdge = (dx > 0 && !canPrev) || (dx < 0 && !canNext);
    setDrag(atEdge ? dx * 0.25 : dx);
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    start.current = null;
    if (drag !== null && step > 0) {
      let cards = Math.round(-drag / step);
      if (cards === 0 && Math.abs(drag) >= SWIPE_THRESHOLD) cards = drag < 0 ? 1 : -1;
      if (cards !== 0) go(current + cards);
    }
    setDrag(null);
    // The click that ends a drag is swallowed below; after it, clear the flag
    // so a later keyboard press of Bio or a link still works.
    setTimeout(() => (moved.current = false), 0);
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

  const offset = width > 0 ? -current * step : 0;
  const s = `[data-expert-carousel="${id}"]`;
  const slots = Array.from({ length: count * copies }, (_, n) => n);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className={cn("relative w-full min-w-0", className)}
      style={
        {
          "--ec-gap": `${gap}px`,
          "--ec-card": card > 0 ? `${card}px` : `calc((100% - ${gap * (perView - 1)}px) / ${perView})`,
          "--ec-h": `${cardHeight}px`,
          "--ec-radius": `${radius}px`,
          "--ec-duration": `${duration}ms`,
          "--ec-ease": ease,
          "--ec-flip-duration": `${flipDuration}ms`,
          "--ec-flip-ease": flipEase,
          "--ec-icon-duration": `${iconDuration}ms`,
          "--ec-icon-ease": iconEase,
          "--ec-arrow-duration": `${arrowDuration}ms`,
          "--ec-arrow-ease": arrowEase,
          "--ec-card-bg": cardColor,
          "--ec-back-bg": backColor,
          "--ec-accent": accent,
          "--ec-color": color,
          "--ec-x": `${offset + (drag ?? 0)}px`,
          ...style,
        } as React.CSSProperties
      }
      data-expert-carousel={id}
      onKeyDown={onKeyDown}
      {...props}
    >
      <style>{`
${s} [data-track]{transform:translate3d(var(--ec-x),0,0);transition:transform var(--ec-duration) var(--ec-ease)}
${s} [data-track][data-still]{transition:none}
${s} [data-face]{transition:transform var(--ec-flip-duration) var(--ec-flip-ease);backface-visibility:hidden;-webkit-backface-visibility:hidden}
${s} [data-face="back"]{transform:rotateY(180deg)}
${s} [data-flipped] [data-face="front"]{transform:rotateY(180deg)}
${s} [data-flipped] [data-face="back"]{transform:rotateY(0deg)}
${s} [data-bio]{scrollbar-width:thin;scrollbar-color:#888 transparent}
@media (prefers-reduced-motion:reduce){
${s} [data-track]{transition:none}
${s} [data-face],${s} [data-face="back"],${s} [data-flipped] [data-face]{transform:none;transition:opacity var(--ec-flip-duration) ease}
${s} [data-face="back"]{opacity:0}
${s} [data-flipped] [data-face="front"]{opacity:0}
${s} [data-flipped] [data-face="back"]{opacity:1}
}`}</style>

      <div ref={viewportRef} className="overflow-hidden">
        <div
          ref={trackRef}
          data-track
          data-still={drag !== null || width === 0 ? "" : undefined}
          className="flex touch-pan-y gap-(--ec-gap) select-none"
          onTransitionEnd={onTransitionEnd}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onClickCapture={(e) => {
            // A drag shouldn't also press a button or follow a link.
            if (moved.current) {
              e.preventDefault();
              e.stopPropagation();
              moved.current = false;
            }
          }}
        >
          {slots.map((slot) => {
            const i = slot % count;
            const item = items[i];
            const visible = slot >= current && slot < current + shown;
            const isFlipped = flipped === slot;
            const name = item.label ?? (typeof item.name === "string" ? item.name : undefined);
            const backId = `${id}-bio-${slot}`;
            return (
              <div
                key={slot}
                role="group"
                aria-roledescription="slide"
                aria-label={name ? `${name}, ${i + 1} of ${count}` : `${i + 1} of ${count}`}
                aria-hidden={visible ? undefined : true}
                inert={!visible}
                data-flipped={isFlipped ? "" : undefined}
                className="relative h-(--ec-h) w-(--ec-card) shrink-0 overflow-hidden rounded-[0_var(--ec-radius)] bg-(--ec-card-bg) text-(--ec-color) perspective-[1000px]"
              >
                {/* Front: photo, name, role. */}
                <div
                  data-face="front"
                  inert={isFlipped}
                  className="absolute inset-0 flex flex-col items-center p-[35px] text-center"
                >
                  <div className="size-[220px] max-w-full shrink-0 overflow-hidden rounded-full *:size-full *:object-cover">
                    {item.image}
                  </div>
                  <h3 className="text-[20px] leading-8 font-normal tracking-[-0.2px] text-balance">{item.name}</h3>
                  <p className="text-[13px] leading-[17px]">{item.role}</p>
                </div>

                {/* Back: name, role, bio. Leaves room at the foot for the footer. */}
                <div
                  id={backId}
                  data-face="back"
                  inert={!isFlipped}
                  className="absolute inset-0 flex flex-col rounded-[0_var(--ec-radius)] bg-(--ec-back-bg) p-[35px] pb-[96px]"
                >
                  <h3 className="text-[20px] leading-8 font-normal tracking-[-0.2px]">{item.name}</h3>
                  <p className="mb-3 text-[13px] leading-[17px]">{item.role}</p>
                  <div data-bio className="min-h-0 flex-1 overflow-y-auto pr-1 text-[16px] leading-5 font-light">
                    {item.bio}
                  </div>
                </div>

                {/* Footer stays put while the card flips under it. */}
                <div className="absolute inset-x-0 bottom-[35px] z-10 flex items-center justify-between px-[35px]">
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      draggable={false}
                      aria-label={name ? `${name} on LinkedIn` : "LinkedIn profile"}
                      className="rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-(--ec-accent) focus-visible:ring-offset-2"
                    >
                      <LinkedInIcon />
                    </a>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    aria-expanded={isFlipped}
                    aria-controls={backId}
                    aria-label={`${isFlipped ? "Hide" : "Show"} bio${name ? ` for ${name}` : ""}`}
                    onClick={() => setFlipped(isFlipped ? null : slot)}
                    className="group/bio flex items-center gap-2 rounded-full text-[16px] font-medium text-(--ec-accent) outline-none focus-visible:ring-2 focus-visible:ring-(--ec-accent) focus-visible:ring-offset-2"
                  >
                    Bio
                    <span className="relative size-6">
                      <TurnIcon
                        className={cn(
                          "absolute inset-0 transition-opacity duration-(--ec-icon-duration) ease-(--ec-icon-ease)",
                          isFlipped && "opacity-0",
                        )}
                      />
                      <CloseIcon
                        className={cn(
                          "absolute inset-0 transition-opacity duration-(--ec-icon-duration) ease-(--ec-icon-ease)",
                          !isFlipped && "opacity-0",
                        )}
                      />
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(looping || maxIndex > 0) && (
        <>
          <ArrowButton direction="prev" disabled={!canPrev} onClick={() => go(current - 1)} />
          <ArrowButton direction="next" disabled={!canNext} onClick={() => go(current + 1)} />
        </>
      )}
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
      aria-label={direction === "prev" ? "Previous expert" : "Next expert"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "absolute top-[calc(var(--ec-h)/2)] z-20 flex size-[49px] -translate-y-1/2 items-center justify-center rounded-full bg-white text-black outline-none",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.25)] transition-[scale,opacity] duration-(--ec-arrow-duration) ease-(--ec-arrow-ease) disabled:opacity-35",
        "focus-visible:ring-2 focus-visible:ring-(--ec-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "enabled:active:scale-[0.94] enabled:[@media(hover:hover)]:hover:scale-[1.06]",
        direction === "prev" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
      )}
    >
      <svg
        aria-hidden
        viewBox="19 16 11 18"
        className={cn("h-[18px] w-[10px]", direction === "prev" && "rotate-180")}
        fill="currentColor"
      >
        <path d="M19.5006 33.5343C19.5072 33.6297 19.5409 33.7212 19.5979 33.798C19.6548 33.8748 19.7326 33.9336 19.822 33.9675C19.9113 34.0014 20.0086 34.009 20.1021 33.9893C20.1956 33.9696 20.2816 33.9235 20.3497 33.8564L29.3437 25.3598C29.3931 25.3131 29.4324 25.2568 29.4593 25.1943C29.4861 25.1319 29.5 25.0646 29.5 24.9966C29.5 24.9286 29.4861 24.8614 29.4593 24.7989C29.4324 24.7365 29.3931 24.6802 29.3437 24.6335L20.3497 16.1368C20.302 16.0917 20.2459 16.0564 20.1846 16.033C20.1233 16.0095 20.058 15.9984 19.9924 16.0002C19.9267 16.002 19.8621 16.0167 19.8022 16.0435C19.7423 16.0703 19.6882 16.1086 19.6431 16.1563C19.598 16.204 19.5627 16.2601 19.5393 16.3215C19.5158 16.3828 19.5047 16.4481 19.5065 16.5138C19.5083 16.5794 19.5231 16.644 19.5499 16.704C19.5766 16.7639 19.615 16.818 19.6626 16.8631L28.2721 24.9966L19.6626 33.1302C19.6134 33.1753 19.5737 33.2298 19.5459 33.2904C19.5181 33.3511 19.5027 33.4168 19.5006 33.4835Z" />
      </svg>
    </button>
  );
}

function LinkedInIcon() {
  return (
    <svg aria-hidden viewBox="0 0 36 36" className="block size-9">
      <rect width="36" height="36" rx="3" fill="#0A66C2" />
      <path
        fill="#D8E6ED"
        d="M13.478 26H10V15.091h3.478V26Zm-1.738-12.364c-.962 0-1.74-.815-1.74-1.818 0-1.004.779-1.818 1.74-1.818.958 0 1.738.815 1.738 1.818 0 1.003-.78 1.818-1.738 1.818ZM26 26h-3.344v-5.309c0-1.266-.023-2.894-1.738-2.894-1.742 0-2.01 1.378-2.01 2.802V26h-3.343V15.083h3.21v1.492h.045c.447-.858 1.538-1.763 3.166-1.763 3.388 0 4.014 2.261 4.014 5.2V26Z"
      />
    </svg>
  );
}

/** Turn arrows on an accent circle: "flip to the bio". */
function TurnIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      <rect width="24" height="24" rx="12" fill="var(--ec-accent)" />
      <path
        fill="#fff"
        d="M12 5.333a6.66 6.66 0 0 0-5.772 3.34l-.255-.862a.667.667 0 0 0-1.279.378l.796 2.691a.667.667 0 0 0 .814.454l2.539-.69a.667.667 0 1 0-.351-1.287l-1.293.352A5.33 5.33 0 0 1 12 6.667a5.33 5.33 0 0 1 5.03 3.556.667.667 0 1 0 1.256-.445A6.67 6.67 0 0 0 12 5.333Zm5.86 7.334a.67.67 0 0 0-.163.023l-2.54.692a.667.667 0 1 0 .352 1.286l1.281-.349A5.33 5.33 0 0 1 12 17.333a5.33 5.33 0 0 1-5.03-3.555.667.667 0 1 0-1.256.445A6.67 6.67 0 0 0 12 18.667a6.66 6.66 0 0 0 5.767-3.332l.26.879a.667.667 0 1 0 1.279-.378l-.796-2.691a.667.667 0 0 0-.65-.478Z"
      />
    </svg>
  );
}

/** A close mark on a white circle: "back to the photo". */
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      <rect width="24" height="24" rx="12" fill="#fff" />
      <path
        fill="var(--ec-accent)"
        d="M16.432 7a.56.56 0 0 0-.387.17L12 11.216 7.955 7.17a.56.56 0 1 0-.785.785L11.216 12 7.17 16.045a.56.56 0 1 0 .785.785L12 12.784l4.045 4.046a.56.56 0 1 0 .785-.785L12.784 12l4.046-4.045A.56.56 0 0 0 16.432 7Z"
      />
    </svg>
  );
}
