"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AccordionTab = {
  /** Tab title, e.g. `Sign`. */
  title: string;
  /** Copy shown under the title while the tab is open. */
  body?: React.ReactNode;
  /** Small link chips under the copy, e.g. feature pages. */
  links?: { label: string; href: string }[];
  /** Fills the media panel: a product video, screenshot or illustration. */
  media: React.ReactNode;
  /** Background behind this tab's media. Falls back to `mediaBackground`. */
  mediaBackground?: string;
};

type AccordionTabsProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: AccordionTab[];
  /** Tab that starts open. */
  defaultIndex?: number;
  /** Step through the tabs on their own from 960px wide. */
  autoplay?: boolean;
  /** Time each tab stays open before advancing, in ms. */
  interval?: number;
  /** Time the open tab takes to expand and collapse, in ms (halved below 960px). */
  duration?: number;
  /** Crossfade between media panels, in ms. 0 swaps them instantly. */
  fade?: number;
  /** Hold the timer while the pointer is over the component. */
  pauseOnHover?: boolean;
  /** Background of the open tab. */
  activeBackground?: string;
  /** Title, copy and progress bar colour. */
  textColor?: string;
  /** Hover colour of closed tab titles. */
  hoverColor?: string;
  /** Default background behind the media. */
  mediaBackground?: string;
  /** Media panel corner radius, in px. */
  radius?: number;
  /** Media panel aspect ratio (width / height) from 960px wide. */
  mediaAspect?: number;
  /** Sticky offset of the media panel from the top of the viewport, in px. */
  stickyTop?: number;
  /** Classes for the tab titles (font family, size). */
  titleClassName?: string;
};

const EASE = "cubic-bezier(0.3, 0.52, 0.49, 0.9)";

/**
 * Accordion tabs: a list of feature titles beside a media panel. The open
 * tab expands to show its copy and link chips on a tinted card, a thin bar
 * fills along its bottom edge as its time runs out, then it collapses as the
 * next one opens and the media swaps. Below 960px it becomes a plain
 * accordion with each tab's media inside it. Ported from PandaDoc's
 * BenefitsTabs section.
 *
 * How it works:
 * - The open index is the only state. Panels open with a CSS grid
 *   `0fr → 1fr` row transition, so nothing is measured.
 * - The progress fill is a CSS animation (`scaleX 0 → 1`, linear,
 *   `interval` long) and its `animationend` advances the tab, so pausing
 *   the animation pauses autoplay exactly.
 * - Autoplay runs only from 960px wide, while at least 20% of the component
 *   is on screen and the browser tab is visible. It waits while keyboard
 *   focus is inside (and, optionally, while hovered). After the last tab it
 *   rewinds to the first.
 * - Media panels are stacked; the incoming one fades in over the outgoing.
 * - Below 960px tabs toggle (tapping the open one closes it) and there's no
 *   autoplay.
 *
 * Reduced motion: no autoplay or progress bar; panels and media switch instantly.
 */
export function AccordionTabs({
  items,
  defaultIndex = 0,
  autoplay = true,
  interval = 12000,
  duration = 400,
  fade = 600,
  pauseOnHover = false,
  activeBackground = "#F8F5F3",
  textColor = "#242424",
  hoverColor = "#248567",
  mediaBackground = "#F8F5F3",
  radius = 12,
  mediaAspect = 1.52,
  stickyTop = 80,
  titleClassName = "text-[20px] sm:text-[28px] font-bold",
  className,
  style,
  ...props
}: AccordionTabsProps) {
  const [active, setActive] = React.useState<number | null>(defaultIndex);
  // Bumped on every pick so the progress bar restarts even on the same tab.
  const [cycle, setCycle] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const [pageHidden, setPageHidden] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [focusWithin, setFocusWithin] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 960px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const count = items.length;

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.2,
    });
    io.observe(el);
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Desktop always has one tab open.
  const current = isDesktop ? (active ?? 0) : active;
  const autoplays = autoplay && isDesktop && !reducedMotion && count > 1;
  const playing = autoplays && visible && !pageHidden && !focusWithin && !(pauseOnHover && hovered);

  const open = (i: number) => {
    setActive(((i % count) + count) % count);
    setCycle((c) => c + 1);
  };

  const onTabClick = (i: number) => {
    // On mobile, tapping the open tab closes it.
    if (!isDesktop && active === i) setActive(null);
    else open(i);
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const keys: Record<string, number> = {
      ArrowDown: i + 1,
      ArrowUp: i - 1,
      Home: 0,
      End: count - 1,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = ((keys[e.key] % count) + count) % count;
    open(next);
    tabRefs.current[next]?.focus();
  };

  const roving = current ?? 0;
  const panelDuration = reducedMotion ? 0 : isDesktop ? duration : Math.round(duration / 2);

  return (
    <div
      ref={rootRef}
      data-accordion-tabs={id}
      className={cn("w-full min-w-0 text-(--at-text)", className)}
      style={
        {
          "--at-interval": `${interval}ms`,
          "--at-duration": `${panelDuration}ms`,
          "--at-fade": `${reducedMotion ? 0 : fade}ms`,
          "--at-ease": EASE,
          "--at-active": activeBackground,
          "--at-text": textColor,
          "--at-hover": hoverColor,
          "--at-media-bg": mediaBackground,
          "--at-radius": `${radius}px`,
          "--at-aspect": String(mediaAspect),
          "--at-sticky": `${stickyTop}px`,
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
@keyframes at-fill-${id}{from{transform:scaleX(0)}to{transform:scaleX(1)}}
[data-accordion-tabs="${id}"] [data-fill]{animation:at-fill-${id} var(--at-interval) linear forwards}`}</style>

      <div className="flex flex-col min-[960px]:flex-row min-[960px]:gap-[3.125%]">
        <div className="w-full min-w-0 min-[960px]:w-[31.25%]">
          {items.map((item, i) => {
            const isOpen = current === i;
            const panelId = `${id}-panel-${i}`;
            const tabId = `${id}-tab-${i}`;
            return (
              <div
                key={i}
                className={cn(
                  "relative border-t border-[color-mix(in_srgb,var(--at-text)_10%,transparent)] min-[960px]:border-t-0 min-[960px]:px-6",
                  isOpen && "min-[960px]:bg-(--at-active)"
                )}
              >
                <button
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  id={tabId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  tabIndex={i === roving ? 0 : -1}
                  onClick={() => onTabClick(i)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className={cn(
                    "flex min-h-[57.59px] w-full cursor-pointer items-center justify-between gap-6 py-3 text-left leading-[1.3] outline-none focus-visible:ring-2 focus-visible:ring-(--at-hover) focus-visible:ring-offset-2 min-[960px]:pt-4 min-[960px]:pb-[17px]",
                    isOpen
                      ? "min-[960px]:cursor-default"
                      : "min-[960px]:text-[color-mix(in_srgb,var(--at-text)_55%,transparent)] min-[960px]:[@media(hover:hover)]:hover:text-(--at-hover)",
                    titleClassName
                  )}
                >
                  <span className="min-w-0 flex-1">{item.title}</span>
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className={cn(
                      "size-[22px] shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none sm:size-7 min-[960px]:hidden",
                      isOpen && "-rotate-180"
                    )}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {/* 0fr → 1fr opens to the content's natural height. */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-(--at-duration) ease-(--at-ease)",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={tabId}
                    inert={!isOpen}
                    className={cn("min-h-0 overflow-hidden", isOpen ? "opacity-100" : "opacity-0")}
                  >
                    <div className="pb-[18px] min-[960px]:pb-[22px]">
                      {item.body && (
                        <div className="text-base leading-[1.6] text-[color-mix(in_srgb,var(--at-text)_70%,transparent)] min-[960px]:-mt-0.5">
                          {item.body}
                        </div>
                      )}
                      {item.links && item.links.length > 0 && (
                        <div className="mt-[18px] flex flex-wrap gap-2">
                          {item.links.map((link) => (
                            <a
                              key={link.label}
                              href={link.href}
                              className="inline-flex max-w-full items-center rounded-[4px] border border-transparent bg-(--at-active) px-3 py-3 text-base leading-none text-[color-mix(in_srgb,var(--at-text)_70%,transparent)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-(--at-hover) min-[960px]:bg-white min-[960px]:px-[13px] [@media(hover:hover)]:hover:border-(--at-text) [@media(hover:hover)]:hover:text-(--at-text)"
                            >
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}
                      {!isDesktop && (
                        <div
                          className="mt-6 w-full overflow-hidden rounded-(--at-radius) *:block *:w-full"
                          style={{ background: item.mediaBackground ?? "var(--at-media-bg)" }}
                        >
                          {item.media}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {autoplays && isOpen && (
                  <div
                    aria-hidden
                    className="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden bg-[color-mix(in_srgb,var(--at-text)_10%,transparent)]"
                  >
                    <span
                      key={cycle}
                      data-fill
                      onAnimationEnd={(e) => {
                        if (e.target === e.currentTarget) open(i + 1);
                      }}
                      className="block h-full w-full origin-left bg-(--at-text)"
                      style={{ animationPlayState: playing ? "running" : "paused" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isDesktop && (
          <div className="w-[65.625%] shrink-0">
            <div className="sticky top-(--at-sticky) grid aspect-(--at-aspect) overflow-hidden rounded-(--at-radius)">
              {items.map((item, i) => {
                const isOpen = current === i;
                return (
                  <div
                    key={i}
                    aria-hidden={!isOpen}
                    className={cn(
                      "col-start-1 row-start-1 overflow-hidden *:size-full",
                      // The incoming panel fades in on top; the outgoing one
                      // stays put underneath until it's covered.
                      isOpen
                        ? "z-10 opacity-100 transition-opacity duration-(--at-fade) ease-[cubic-bezier(0.25,1,0.5,1)]"
                        : "z-0 opacity-0 transition-opacity delay-(--at-fade) duration-0"
                    )}
                    style={{ background: item.mediaBackground ?? "var(--at-media-bg)" }}
                  >
                    {item.media}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function useMediaQuery(query: string) {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
