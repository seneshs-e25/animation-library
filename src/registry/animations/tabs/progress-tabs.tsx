"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ProgressTab = {
  /** Tab label, e.g. `/context`. */
  label: string;
  /** Fills the rounded media box: a product screenshot, video or illustration. */
  media: React.ReactNode;
  /** Optional block under the media box (title, copy, CTA). */
  content?: React.ReactNode;
};

type ProgressTabsProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: ProgressTab[];
  /** Tab that starts active. */
  defaultIndex?: number;
  /** Advance to the next tab automatically. */
  autoplay?: boolean;
  /** Time each tab stays active before advancing, in ms. */
  interval?: number;
  /** Time the panels take to slide between tabs, in ms. */
  duration?: number;
  /** Show the fill that sweeps across the active tab as its time runs out. */
  progress?: boolean;
  /** Hold the timer while the pointer is over the component. */
  pauseOnHover?: boolean;
  /**
   * Show a pause / play button at the end of the tab bar while autoplay is on.
   * Keep it unless the site offers another way to stop the motion: WCAG 2.2.2
   * needs one for anything that moves on its own for more than 5 seconds.
   */
  pauseButton?: boolean;
  /** Height of the media box from 1200px wide, in px. */
  mediaHeight?: number;
  /** Media box corner radius, in px. */
  radius?: number;
  /** Background behind the media, shown around a screenshot. */
  mediaBackground?: string;
  /** Start and end of the active tab gradient. */
  accentFrom?: string;
  accentTo?: string;
  /** Color of inactive tab labels and the pause button icon. */
  labelColor?: string;
  /** Tint of the tab bar: its 1px border (30%) and background wash (10%). */
  trayTint?: string;
  /** Tab bar background under the tint. */
  trayBackground?: string;
  /** Classes for the tab labels (font family, size, case). */
  tabClassName?: string;
};

/**
 * Progress tabs: a row of tabs over a media panel that autoplays through
 * them. The active tab fills with a gradient and a lighter fill sweeps
 * across it as its time runs out, then the panel slides to the next tab.
 * Used on the Seemplicity website for its AI analyst steps.
 *
 * How it works:
 * - The active tab is the only state. The progress fill is a CSS animation
 *   (scaleX 0 → 1, linear, `interval` long) and its `animationend` advances
 *   to the next tab, so pausing the animation pauses the timer exactly.
 * - Panels sit in one flex track that translates by whole panels over
 *   600ms `ease` with a 10px gap, like the original Swiper.
 * - Autoplay waits while the component is off screen, the browser tab is
 *   hidden, keyboard focus is inside, and (optionally) while hovered. A pause
 *   button at the end of the tab bar stops it until pressed again (WCAG
 *   2.2.2). After the last tab it rewinds to the first.
 * - Tabs follow the WAI-ARIA tabs pattern: arrow keys, Home and End move
 *   between tabs; inactive panels are `inert`.
 *
 * Reduced motion: no autoplay, no progress fill, panels switch instantly.
 */
export function ProgressTabs({
  items,
  defaultIndex = 0,
  autoplay = true,
  interval = 4500,
  duration = 600,
  progress = true,
  pauseOnHover = false,
  pauseButton = true,
  mediaHeight = 560,
  radius = 20,
  mediaBackground = "linear-gradient(135deg, #3A0050 0%, #6B0A80 55%, #8E2AA8 100%)",
  accentFrom = "#410051",
  accentTo = "#E3308C",
  labelColor = "#410051",
  trayTint = "#A309BB",
  trayBackground = "#FFFFFF",
  tabClassName = "font-mono text-sm lowercase",
  className,
  style,
  ...props
}: ProgressTabsProps) {
  const [active, setActive] = React.useState(defaultIndex);
  // Bumped on every change so the progress animation restarts even when the
  // same tab is picked again.
  const [cycle, setCycle] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [pageHidden, setPageHidden] = React.useState(false);
  // Set by the pause button; stays until the user presses play.
  const [userPaused, setUserPaused] = React.useState(false);
  // Keyboard focus inside holds the timer, so a tab doesn't move under the user.
  const [focusWithin, setFocusWithin] = React.useState(false);
  const reducedMotion = useReducedMotion();

  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // On narrow screens the tab row scrolls; keep the active tab in view
  // without scrolling the page.
  React.useEffect(() => {
    const list = listRef.current;
    const tab = tabRefs.current[active];
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({
      left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [active, reducedMotion]);

  const count = items.length;
  const autoplays = autoplay && !reducedMotion;
  const playing =
    autoplays && !userPaused && !focusWithin && visible && !pageHidden && !(pauseOnHover && hovered);

  const select = (i: number) => {
    setActive(((i % count) + count) % count);
    setCycle((c) => c + 1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: count - 1,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = ((keys[e.key] % count) + count) % count;
    select(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      ref={rootRef}
      className={cn("w-full min-w-0", className)}
      style={
        {
          "--pt-interval": `${interval}ms`,
          "--pt-duration": `${reducedMotion ? 0 : duration}ms`,
          "--pt-media-h": `${mediaHeight}px`,
          "--pt-radius": `${radius}px`,
          "--pt-media-bg": mediaBackground,
          "--pt-from": accentFrom,
          "--pt-to": accentTo,
          "--pt-label": labelColor,
          "--pt-tint": trayTint,
          "--pt-tray": trayBackground,
          ...style,
        } as React.CSSProperties
      }
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={(e) => {
        if (e.target.matches(":focus-visible")) setFocusWithin(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
      }}
      {...props}
    >
      <style>{`
@keyframes pt-fill-${id}{from{transform:scaleX(0)}to{transform:scaleX(1)}}
[data-progress-tabs="${id}"] [data-fill]{animation:pt-fill-${id} var(--pt-interval) linear forwards}
[data-progress-tabs="${id}"][data-tray-border]{background:linear-gradient(color-mix(in srgb,var(--pt-tint) 30%,transparent),transparent)}
[data-progress-tabs="${id}"] [data-tray]{background:linear-gradient(color-mix(in srgb,var(--pt-tint) 10%,transparent),transparent),var(--pt-tray)}
@media (prefers-reduced-motion:reduce){[data-progress-tabs="${id}"] *{transition:none!important}}`}</style>

      {/* Tab bar: a 1px gradient border around a tinted white tray. */}
      <div
        data-progress-tabs={id}
        data-tray-border
        className="rounded-[20px] p-px"
      >
        <div data-tray className="flex items-center gap-2.5 rounded-[19px] p-2.5">
          <div
            ref={listRef}
            role="tablist"
            aria-orientation="horizontal"
            onKeyDown={onKeyDown}
            className="flex min-w-0 flex-1 gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item, i) => {
              const selected = i === active;
              return (
                <button
                  key={i}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${i}`}
                  aria-selected={selected}
                  aria-controls={`${id}-panel-${i}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(i)}
                  className="group relative isolate flex shrink-0 grow basis-0 cursor-pointer overflow-hidden rounded-[10px] bg-white px-5 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-(--pt-to) focus-visible:ring-offset-2 max-sm:basis-auto"
                >
                  {/* Active gradient, faded in so the swap isn't a hard cut. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-0 -z-20 bg-[linear-gradient(90deg,var(--pt-from)_0%,var(--pt-to)_100%)] transition-opacity duration-300 ease-out",
                      selected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {progress && selected && (
                    <span
                      key={cycle}
                      aria-hidden
                      data-fill
                      onAnimationEnd={(e) => {
                        if (e.target === e.currentTarget) select(active + 1);
                      }}
                      className="absolute inset-0 -z-10 origin-left bg-[linear-gradient(90deg,transparent_0%,var(--pt-to)_100%)] opacity-50"
                      style={{
                        animationPlayState: playing ? "running" : "paused",
                        visibility: reducedMotion ? "hidden" : undefined,
                      }}
                    />
                  )}
                  <span
                    className={cn(
                      "leading-[1.6] whitespace-nowrap transition-colors duration-300 ease-out",
                      selected ? "text-white" : "text-(--pt-label) group-hover:opacity-80",
                      tabClassName
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
          {pauseButton && autoplays && (
            <button
              type="button"
              aria-label={userPaused ? "Play autoplay" : "Pause autoplay"}
              onClick={() => setUserPaused((p) => !p)}
              className="flex w-[45px] shrink-0 self-stretch cursor-pointer items-center justify-center rounded-[10px] bg-white text-(--pt-label) outline-none transition-opacity duration-200 ease-out focus-visible:ring-2 focus-visible:ring-(--pt-to) focus-visible:ring-offset-2 [@media(hover:hover)]:hover:opacity-80"
            >
              <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="currentColor">
                {userPaused ? <path d="M4 2.5v11l9.5-5.5z" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Without the visible fill, a hidden timer keeps autoplay going. */}
      {!progress && (
        <span
          key={`${active}-${cycle}`}
          aria-hidden
          data-progress-tabs={id}
          className="block h-0"
        >
          <span
            data-fill
            className="block h-0"
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) select(active + 1);
            }}
            style={{ animationPlayState: playing ? "running" : "paused" }}
          />
        </span>
      )}

      <div className="mt-2.5 overflow-hidden">
        <div
          className="flex gap-2.5 transition-transform duration-(--pt-duration) ease-[ease]"
          style={{ transform: `translateX(calc(${-active} * (100% + 10px)))` }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              role="tabpanel"
              id={`${id}-panel-${i}`}
              aria-labelledby={`${id}-tab-${i}`}
              inert={i !== active}
              className="w-full shrink-0"
            >
              <div className="relative h-[300px] overflow-hidden rounded-(--pt-radius) [background:var(--pt-media-bg)] bg-cover! bg-center! md:h-[400px] min-[992px]:h-[500px] min-[1200px]:h-(--pt-media-h) *:size-full">
                {item.media}
              </div>
              {item.content && <div className="pt-5 min-[1200px]:pt-[30px]">{item.content}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}
