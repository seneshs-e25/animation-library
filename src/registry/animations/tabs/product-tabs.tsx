"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ProductTab = {
  /** Tab name, read by screen readers and shown as a tooltip. */
  label: string;
  /** Tab icon. Drawn in `currentColor`, so it follows `iconColor` / `activeIconColor`. */
  icon: React.ReactNode;
  /** Fill colour that slides into the tab when it's active. */
  color: string;
  /** Autoplay progress ring drawn around the active tab's fill. Defaults to a darker `color`. */
  ringColor?: string;
  /** Panel shown in the card while the tab is active. `ProductPanel` lays out the original's. */
  content: React.ReactNode;
};

type ProductTabsProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: ProductTab[];
  /** Tab that starts active. */
  defaultIndex?: number;
  /** Move to the next tab on a timer. Pauses on hover, focus and off screen. */
  autoplay?: boolean;
  /** Time each tab stays active while autoplaying, in ms. */
  interval?: number;
  /** Time the colour fill takes to slide between tabs, and the tab lift to crossfade, in ms. */
  duration?: number;
  /** Easing of the fill slide and lift, any CSS timing function. */
  ease?: string;
  /** Time the card's panels take to crossfade, in ms. */
  fadeDuration?: number;
  /** Time an inactive tab takes to brighten on hover, in ms. */
  hoverDuration?: number;
  /** Tab size from 600px wide, in px (48px below). */
  tabSize?: number;
  /** Space between tabs, in px. */
  gap?: number;
  /** Card width cap, in px. */
  maxWidth?: number;
  /** Card corner radius, in px. */
  radius?: number;
  /** Card, lifted tab and the bridge between them. Inactive tabs are 20% of it with a 40% ring. */
  cardColor?: string;
  /** Inactive icons and the arrows. */
  iconColor?: string;
  /** Icon in the active tab. */
  activeIconColor?: string;
  /** Show the previous / next arrows beside the tabs. */
  arrows?: boolean;
  /** Soft layered drop shadow around the card and tabs together. */
  shadow?: boolean;
  /** While autoplaying, draw a ring around the active tab that closes as its time runs out. */
  progress?: boolean;
  /** Width of the progress ring, in px. */
  ringWidth?: number;
};

/**
 * The original's squircle: four cubic curves through the edge midpoints,
 * starting at top centre and running clockwise (so a dash drawn along it
 * grows clockwise from the top). `h` is the half-size, `c` the centre.
 */
const K1 = 0.66018;
const K2 = 0.7544;
const r3 = (n: number) => Math.round(n * 1000) / 1000;
function squircle(h: number, c = 28) {
  const p = (x: number, y: number) => `${r3(x)} ${r3(y)}`;
  const a = K1 * h;
  const b = K2 * h;
  return (
    `M${p(c, c - h)}` +
    `C${p(c + a, c - h)} ${p(c + h, c - b)} ${p(c + h, c)}` +
    `C${p(c + h, c + b)} ${p(c + a, c + h)} ${p(c, c + h)}` +
    `C${p(c - a, c + h)} ${p(c - h, c + b)} ${p(c - h, c)}` +
    `C${p(c - h, c - b)} ${p(c - a, c - h)} ${p(c, c - h)}Z`
  );
}

/** Tab geometry in a 56×56 box, as in the original: the hole is inset 4. */
const TAB = squircle(28);
const WASH = squircle(24);
const BORDER = squircle(26);
const HOLE = 24;
/** The same shape in a 0–1 box, for clipping the hole and the fill. */
const CLIP = squircle(0.5, 0.5);

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

/**
 * Product tabs: a row of icon tabs above a card. The active tab lifts out
 * in the card's colour and joins the card through a small waisted bridge,
 * and a colour fill slides sideways under the tabs to land in it, as if
 * one blob of colour travels from tab to tab. Used on the Calendly homepage
 * hero.
 *
 * How it works:
 * - Every tab has a rounded hole (inset 4px). Inside each hole sits a copy
 *   of the same fill, shifted by `(active - index) × (tabSize + gap)`, so
 *   the copies line up as one shape that only shows through the hole it's
 *   under. Changing tab transitions that shift (and the fill colour) over
 *   `duration` on `ease`, so the colour visibly passes through the tabs in
 *   between.
 * - The lift (a card-coloured tab, the bridge and a strip into the card)
 *   crossfades from the old tab to the new over the same `duration`. A
 *   drop shadow on the wrapper outlines tabs, bridge and card as one shape.
 * - Panels are stacked in one grid cell and crossfade over `fadeDuration`.
 * - Autoplay: once the fill lands, a ring in a darker shade of the product
 *   colour draws clockwise from the top around the active tab's fill
 *   (`stroke-dashoffset` 1 → 0 on a `pathLength="1"` path, linear) over the
 *   rest of `interval`. When it closes, the next tab opens. Hover, focus
 *   inside, a hidden tab or the component being off screen freezes the ring
 *   where it is.
 *
 * Reduced motion: no autoplay, the fill jumps, lift and panels crossfade.
 */
export function ProductTabs({
  items,
  defaultIndex = 0,
  autoplay = true,
  interval = 6000,
  duration = 600,
  ease = "cubic-bezier(0.5, 0, 0.5, 1)",
  fadeDuration = 200,
  hoverDuration = 150,
  tabSize = 56,
  gap = 8,
  maxWidth = 920,
  radius = 48,
  cardColor = "#FCFBF8",
  iconColor = "#EDF5FF",
  activeIconColor = "#071A31",
  arrows = true,
  shadow = true,
  progress = true,
  ringWidth = 3,
  className,
  style,
  "aria-label": ariaLabel = "Products",
  ...props
}: ProductTabsProps) {
  const count = items.length;
  const [active, setActive] = React.useState(() => Math.min(Math.max(defaultIndex, 0), Math.max(count - 1, 0)));
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [onScreen, setOnScreen] = React.useState(true);
  const [docHidden, setDocHidden] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const current = count > 0 ? Math.min(active, count - 1) : 0;

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    const mq = window.matchMedia(reducedMotionQuery);
    const onMotion = () => setReduced(mq.matches);
    onMotion();
    mq.addEventListener("change", onMotion);
    const onVisibility = () => setDocHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      mq.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const go = React.useCallback((i: number) => count > 0 && setActive(((i % count) + count) % count), [count]);

  // Autoplay runs on the progress ring's CSS animation: it waits for the fill
  // to land, draws over the rest of the interval, and its `animationend`
  // moves to the next tab. Pausing freezes the ring where it is.
  const timed = autoplay && !reduced && count > 1;
  const playing = timed && !hovered && !focused && onScreen && !docHidden;
  const ringDelay = Math.min(duration, interval - 500);
  const ringTime = interval - ringDelay;

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = current + 1;
    else if (e.key === "ArrowLeft") next = current - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    if (next === null) return;
    e.preventDefault();
    const n = ((next % count) + count) % count;
    go(n);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[n]?.focus();
  };

  const s = `[data-product-tabs="${id}"]`;
  const fill = items[current]?.color ?? "transparent";

  return (
    <div
      ref={rootRef}
      data-product-tabs={id}
      className={cn("@container w-full min-w-0", className)}
      style={
        {
          "--pt-duration": `${duration}ms`,
          "--pt-ease": ease,
          "--pt-fade": `${fadeDuration}ms`,
          "--pt-hover": `${hoverDuration}ms`,
          "--pt-gap": `${Math.max(0, gap - 1)}px`,
          "--pt-radius": `${radius}px`,
          "--pt-card": cardColor,
          "--pt-icon": iconColor,
          "--pt-icon-active": activeIconColor,
          "--pt-fill": fill,
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
${s}{--pt-size:48px}
@container (min-width:600px){${s} [data-row]{--pt-size:${tabSize}px;--pt-gap:${gap}px}}
${s} [data-wash]{fill:color-mix(in srgb,var(--pt-card) 20%,transparent);transition:fill var(--pt-hover) ease}
@media (hover:hover){${s} [role=tab]:not([aria-selected=true]):hover [data-wash]{fill:color-mix(in srgb,var(--pt-card) 40%,transparent)}}
${s} [data-clip]{clip-path:url(#${id}-squircle)}
${s} [data-lift]{transition:opacity var(--pt-duration) var(--pt-ease)}
${s} [data-blob]{transition:transform var(--pt-duration) var(--pt-ease),background-color var(--pt-duration) var(--pt-ease)}
${s} [data-icon]{transition:color var(--pt-duration) var(--pt-ease)}
${s} [data-panel]{transition:opacity var(--pt-fade) ease,visibility 0s linear var(--pt-fade)}
${s} [data-panel][data-active]{transition:opacity var(--pt-fade) ease,visibility 0s}
${s} [data-progress]{animation:pt-ring-${id} ${ringTime}ms linear ${ringDelay}ms both}
@keyframes pt-ring-${id}{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@supports (corner-shape:superellipse(2)){${s} [data-squircle]{corner-shape:superellipse(1.6)}}
${s} [data-progress]{stroke-dasharray:1 1}
@media (prefers-reduced-motion:reduce){${s} [data-blob]{transition:background-color var(--pt-fade) ease}}
`}</style>
      <svg aria-hidden className="pointer-events-none absolute size-0">
        <clipPath id={`${id}-squircle`} clipPathUnits="objectBoundingBox">
          <path d={CLIP} />
        </clipPath>
      </svg>

      <div
        className="mx-auto w-full"
        style={{
          maxWidth,
          filter: shadow
            ? "drop-shadow(0 4px 5px rgba(95,109,119,0.04)) drop-shadow(0 10px 15px rgba(95,109,119,0.04)) drop-shadow(0 40px 50px rgba(95,109,119,0.1))"
            : undefined,
          transform: "translate3d(0,0,0)",
        }}
      >
        <div data-row className="mx-auto flex w-fit items-center justify-center gap-2">
          {arrows && count > 1 && <Arrow direction="prev" onClick={() => go(current - 1)} />}
          <div
            ref={tabsRef}
            role="tablist"
            aria-label={ariaLabel}
            className="relative flex items-end gap-(--pt-gap)"
            onKeyDown={onTabKeyDown}
          >
            {items.map((item, i) => {
              const selected = i === current;
              return (
                <button
                  key={i}
                  id={`${id}-tab-${i}`}
                  type="button"
                  role="tab"
                  title={item.label}
                  aria-label={item.label}
                  aria-selected={selected}
                  aria-controls={`${id}-panel-${i}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => go(i)}
                  className={cn(
                    "group relative grid size-(--pt-size) shrink-0 place-items-center rounded-[40%] outline-none",
                    "focus-visible:ring-2 focus-visible:ring-(--pt-icon-active) focus-visible:ring-offset-2",
                    !selected && "cursor-pointer",
                  )}
                >
                  {/* Resting tab: a 4px border at 40% around a 20% wash of the card colour. */}
                  <svg aria-hidden viewBox="0 0 56 56" className="absolute inset-0 size-full overflow-visible">
                    <path data-wash d={WASH} />
                    <path
                      d={BORDER}
                      fill="none"
                      stroke="color-mix(in srgb, var(--pt-card) 40%, transparent)"
                      strokeWidth={4}
                    />
                  </svg>

                  {/* Lift: the tab in the card colour, joined to the card by a waisted bridge. */}
                  <span data-lift aria-hidden className="absolute inset-0" style={{ opacity: selected ? 1 : 0 }}>
                    <svg viewBox="0 0 56 56" className="absolute inset-0 size-full">
                      <path d={TAB} fill="var(--pt-card)" />
                    </svg>
                    <svg
                      viewBox="0 0 32 14"
                      preserveAspectRatio="none"
                      className="absolute top-[calc(100%-1px)] left-1/2 h-[15px] w-8 -translate-x-1/2"
                    >
                      <path
                        d="M25.05 0S20.36.87 20.36 7C20.36 13.13 32 14 32 14H0S11.64 13.13 11.64 7C11.64.87 6.95 0 6.95 0H25.05Z"
                        fill="var(--pt-card)"
                      />
                    </svg>
                  </span>

                  {/* The hole the travelling colour shows through. */}
                  <span data-clip aria-hidden className="absolute inset-[7.143%]">
                    <span
                      data-blob
                      data-clip
                      className="absolute inset-0 bg-(--pt-fill)"
                      style={{ transform: `translateX(calc(${current - i} * (var(--pt-size) + var(--pt-gap))))` }}
                    />
                  </span>

                  <span
                    data-icon
                    aria-hidden
                    className="relative grid size-[57%] place-items-center *:size-full"
                    style={{ color: selected ? "var(--pt-icon-active)" : "var(--pt-icon)" }}
                  >
                    {item.icon}
                  </span>

                  {/* Autoplay progress: a ring that closes around the fill, then moves on. */}
                  {selected && timed && (
                    <svg
                      aria-hidden
                      viewBox="0 0 56 56"
                      className="pointer-events-none absolute inset-0 size-full"
                      style={{ opacity: progress ? 1 : 0 }}
                    >
                      {/* Traced just inside the hole's edge, so the stroke lines its rim. */}
                      <path
                        key={current}
                        data-progress
                        d={squircle(HOLE - ringWidth / 2)}
                        pathLength={1}
                        fill="none"
                        stroke={item.ringColor ?? `color-mix(in srgb, ${item.color} 72%, #000)`}
                        strokeWidth={ringWidth}
                        style={{ animationPlayState: playing ? "running" : "paused" }}
                        onAnimationEnd={() => go(current + 1)}
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          {arrows && count > 1 && <Arrow direction="next" onClick={() => go(current + 1)} />}
        </div>

        <div
          data-squircle
          className="relative mt-[14px] grid rounded-(--pt-radius) bg-(--pt-card) p-8 @min-[600px]:p-12"
        >
          {items.map((item, i) => {
            const selected = i === current;
            return (
              <div
                key={i}
                id={`${id}-panel-${i}`}
                role="tabpanel"
                aria-labelledby={`${id}-tab-${i}`}
                data-panel
                data-active={selected ? "" : undefined}
                inert={!selected}
                className="col-start-1 row-start-1 min-w-0"
                style={{ opacity: selected ? 1 : 0, visibility: selected ? "visible" : "hidden" }}
              >
                {item.content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Arrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous tab" : "Next tab"}
      onClick={onClick}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full text-(--pt-icon) outline-none",
        "transition-[translate] duration-(--pt-hover) ease-out focus-visible:ring-2 focus-visible:ring-(--pt-icon)",
        direction === "prev" ? "[@media(hover:hover)]:hover:-translate-x-0.5" : "[@media(hover:hover)]:hover:translate-x-0.5",
      )}
    >
      <svg aria-hidden viewBox="0 0 24 24" fill="none" className={cn("size-6", direction === "prev" && "rotate-180")}>
        <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/**
 * The original's panel layout: product name with its icon and an optional
 * badge, a headline, a short paragraph and a "Learn more" link on the
 * left; media on the right (stacked under 768px).
 */
export function ProductPanel({
  icon,
  color,
  name,
  badge,
  heading,
  body,
  href,
  linkLabel = "Learn more",
  media,
  className,
}: {
  icon?: React.ReactNode;
  /** Background of the small icon square beside the name. */
  color?: string;
  name: React.ReactNode;
  badge?: React.ReactNode;
  heading: React.ReactNode;
  body?: React.ReactNode;
  href?: string;
  linkLabel?: React.ReactNode;
  /** Fills the media box (object-cover). */
  media?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid content-center items-center gap-6 text-[#071A31] @min-[600px]:gap-8 @min-[768px]:grid-cols-2 @min-[768px]:gap-14",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col items-start gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <span
              data-squircle
              className="grid size-8 place-items-center rounded-[10px] p-1 text-[#071A31] *:size-full"
              style={{ background: color }}
            >
              {icon}
            </span>
          )}
          <span className="text-[16px] leading-none font-medium">{name}</span>
          {badge && (
            <span className="rounded-[6px] bg-[#071A31]/[0.06] px-2 py-1 text-[12px] leading-none font-medium text-[#476788]">
              {badge}
            </span>
          )}
        </div>
        <h2 className="text-[28px] leading-[1.1] font-medium tracking-[-0.75px] text-balance @min-[600px]:text-[36px] @min-[600px]:tracking-[-1px]">
          {heading}
        </h2>
        {body && <p className="max-w-[46ch] text-[16px] leading-[1.4] text-[#5F6D77]">{body}</p>}
        {href && (
          <a
            href={href}
            className="group/link mt-2 inline-flex items-center gap-2 border-b-2 border-current pb-1 text-[16px] font-medium"
          >
            {linkLabel}
            <span aria-hidden className="transition-[translate] duration-200 ease-out group-hover/link:translate-x-1">
              →
            </span>
          </a>
        )}
      </div>
      {media && (
        <div data-squircle className="aspect-[4/3] w-full overflow-hidden rounded-[32px] *:size-full *:object-cover">
          {media}
        </div>
      )}
    </div>
  );
}
