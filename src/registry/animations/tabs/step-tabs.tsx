"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type StepTab = {
  /** Pill label, e.g. `Collect`. */
  label: string;
  /**
   * Small icon before the label (an `img` or inline `svg`, ~26px). On the
   * active pill an `img` turns white (`brightness(0) invert(1)`) and an `svg`
   * using `currentColor` follows the white label.
   */
  icon?: React.ReactNode;
  /** Left column of the card: heading, copy, CTA. */
  content: React.ReactNode;
  /** Right column of the card: a screenshot or video, slid in from the right. */
  media: React.ReactNode;
};

type StepTabsProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: StepTab[];
  /** Tab that starts active. */
  defaultIndex?: number;
  /** Crossfade between cards, in ms. */
  fadeDuration?: number;
  /** Card crossfade easing, a CSS timing function. The original (Swiper fade): ease. */
  fadeEase?: string;
  /** Image slide-in, in ms. */
  slideDuration?: number;
  /** Image slide easing. The original: easeOutCubic, cubic-bezier(0.33, 1, 0.68, 1). */
  slideEase?: string;
  /** Pill change: gradient fade, label colour, border and shadow, icon whitening, in ms. */
  tabDuration?: number;
  /** Pill change easing. The original: cubic-bezier(0.23, 1, 0.32, 1). */
  tabEase?: string;
  /** Easing of the icon whitening on the active pill. The original: cubic-bezier(0.4, 0, 0.2, 1). */
  iconEase?: string;
  /** How far right the image starts, as a % of its own width. */
  slideOffset?: number;
  /** Show the dotted gradient line between pills. */
  connectors?: boolean;
  /** Start and end of the active pill and connector gradients. */
  accentFrom?: string;
  accentTo?: string;
  /** Start of the connector gradient (it ends on `accentTo`). */
  connectorFrom?: string;
  /** Inactive pill label colour. */
  labelColor?: string;
  /** Card background and 1px border. */
  cardBackground?: string;
  cardBorder?: string;
  /** Classes for the pill labels (font family, weight). */
  tabClassName?: string;
};

/**
 * Step tabs: a centred row of pill tabs joined by dotted gradient lines,
 * over a white card with copy on the left and media on the right. Picking a
 * pill crossfades the card, and the new card's image slides in from the
 * right while the old one slides back out. Used on the Seemplicity "Why"
 * page for its Collect / Contextualize / Close steps.
 *
 * How it works:
 * - The active tab is the only state. Every card sits in the same grid cell,
 *   so the stack is as tall as the tallest card and never jumps.
 * - Cards crossfade on `opacity` (`fadeDuration`, 600ms, on `fadeEase`,
 *   CSS `ease`, Swiper's fade).
 *   The image inside each card moves on `transform` (`translateX(offset%)` →
 *   0, `slideDuration`, 700ms, on `slideEase`, easeOutCubic) inside a clipped, rounded box, both
 *   ways, so a fast click retargets from wherever it is.
 * - Tabs follow the WAI-ARIA tabs pattern: arrow keys, Home and End move
 *   between tabs; inactive panels are `inert`.
 * - The pills change over `tabDuration` (300ms) on `tabEase`; an `img` icon
 *   whitens over the same 300ms on `iconEase`.
 *
 * Reduced motion: the crossfade stays, the image doesn't slide.
 */
export function StepTabs({
  items,
  defaultIndex = 0,
  fadeDuration = 600,
  fadeEase = "ease",
  slideDuration = 700,
  slideEase = "cubic-bezier(0.33, 1, 0.68, 1)",
  tabDuration = 300,
  tabEase = "cubic-bezier(0.23, 1, 0.32, 1)",
  iconEase = "cubic-bezier(0.4, 0, 0.2, 1)",
  slideOffset = 80,
  connectors = true,
  accentFrom = "#410051",
  accentTo = "#E3308C",
  connectorFrom = "#A309BB",
  labelColor = "#410051",
  cardBackground = "#FFFFFF",
  cardBorder = "#D9CCDC",
  tabClassName = "font-bold",
  className,
  style,
  ...props
}: StepTabsProps) {
  const [active, setActive] = React.useState(defaultIndex);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const listRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const count = items.length;

  // On narrow screens the pill row scrolls; keep the active pill in view
  // without scrolling the page.
  React.useEffect(() => {
    const list = listRef.current;
    const tab = tabRefs.current[active];
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({
      left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active]);

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
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      data-step-tabs={id}
      className={cn("w-full min-w-0", className)}
      style={
        {
          "--st-fade": `${fadeDuration}ms`,
          "--st-fade-ease": fadeEase,
          "--st-slide": `${slideDuration}ms`,
          "--st-slide-ease": slideEase,
          "--st-tab": `${tabDuration}ms`,
          "--st-tab-ease": tabEase,
          "--st-icon-ease": iconEase,
          "--st-offset": `${slideOffset}%`,
          "--st-from": accentFrom,
          "--st-to": accentTo,
          "--st-line": connectorFrom,
          "--st-label": labelColor,
          "--st-card": cardBackground,
          "--st-border": cardBorder,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <style>{`
[data-step-tabs="${id}"] [data-media]{transform:translateX(var(--st-offset));transition:transform var(--st-slide) var(--st-slide-ease)}
[data-step-tabs="${id}"] [data-active] [data-media]{transform:none}
@media (prefers-reduced-motion:reduce){[data-step-tabs="${id}"] [data-media]{transform:none;transition:none}}`}</style>

      {/* Pill row. Scrolls sideways when it doesn't fit; centred when it does. */}
      <div
        ref={listRef}
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="flex justify-[safe_center] overflow-x-auto px-5 pt-[15px] pb-[29px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => {
          const selected = i === active;
          const last = i === count - 1;
          return (
            <React.Fragment key={i}>
              <button
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${i}`}
                aria-selected={selected}
                aria-controls={`${id}-panel-${i}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                className={cn(
                  "relative isolate flex min-h-10 shrink-0 cursor-pointer items-center gap-[5px] rounded-full border border-[rgb(65_0_81/0.1)] bg-white px-[13px] py-[9px] outline-none transition-[border-color,box-shadow] duration-(--st-tab) ease-(--st-tab-ease) focus-visible:ring-2 focus-visible:ring-(--st-to) focus-visible:ring-offset-2 md:min-h-14 md:gap-[15px] md:px-[29px] md:py-[11px] min-[1200px]:px-[30px] min-[1200px]:py-[15px]",
                  selected && "border-transparent shadow-[0_5px_20px_rgb(65_0_81/0.4)]"
                )}
              >
                {/* Active gradient, faded in so the swap isn't a hard cut. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -inset-px -z-10 rounded-full bg-[linear-gradient(90deg,var(--st-from)_0%,var(--st-to)_100%)] transition-opacity duration-(--st-tab) ease-(--st-tab-ease)",
                    selected ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.icon && (
                  <span
                    aria-hidden
                    className={cn(
                      "flex w-[15px] shrink-0 md:w-[26px] *:h-auto *:w-full [&_img]:transition-[filter] [&_img]:duration-(--st-tab) [&_img]:ease-(--st-icon-ease)",
                      selected && "[&_img]:brightness-0 [&_img]:invert"
                    )}
                  >
                    {item.icon}
                  </span>
                )}
                <span
                  className={cn(
                    "text-xs leading-[1.4] font-semibold whitespace-nowrap transition-colors duration-(--st-tab) ease-(--st-tab-ease) md:text-base md:font-bold",
                    selected ? "text-white" : "text-(--st-label)",
                    tabClassName
                  )}
                >
                  {item.label}
                </span>
              </button>
              {!last && (
                <span
                  aria-hidden
                  className={cn(
                    "relative mx-[1px] flex w-[30px] shrink-0 items-center self-center md:mx-[4px] md:w-[72px]",
                    !connectors && "invisible"
                  )}
                >
                  <Connector />
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Cards: all in one grid cell, crossfaded. Padding leaves room for the shadow. */}
      <div className="grid overflow-hidden px-[30px] pt-[30px] pb-10">
        {items.map((item, i) => {
          const selected = i === active;
          return (
            <div
              key={i}
              role="tabpanel"
              id={`${id}-panel-${i}`}
              aria-labelledby={`${id}-tab-${i}`}
              inert={!selected}
              data-active={selected || undefined}
              className={cn(
                "col-start-1 row-start-1 grid min-w-0 grid-cols-1 items-start rounded-[20px] border border-(--st-border) bg-(--st-card) shadow-[0_10px_30px_rgb(65_0_81/0.2)] transition-opacity duration-(--st-fade) ease-(--st-fade-ease) md:grid-cols-2 min-[992px]:grid-cols-[5fr_7fr]",
                selected ? "z-10 opacity-100" : "opacity-0"
              )}
            >
              <div className="min-w-0 p-5 min-[992px]:pt-[50px] min-[992px]:pr-[88px] min-[992px]:pb-[60px] min-[992px]:pl-[60px]">
                {item.content}
              </div>
              <div className="min-w-0 p-5">
                <div className="aspect-[730/460] overflow-hidden rounded-[10px] md:-ml-[23px]">
                  <div data-media className="size-full *:size-full *:object-cover">
                    {item.media}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A 1px gradient line with a 6px dot at each end. */
function Connector() {
  return (
    <span className="relative block h-1.5 w-full">
      <span className="absolute inset-x-[3px] top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(90deg,var(--st-line),var(--st-to))] opacity-90" />
      <span className="absolute top-0 left-0 size-1.5 rounded-full bg-(--st-line)" />
      <span className="absolute top-0 right-0 size-1.5 rounded-full bg-(--st-to)" />
    </span>
  );
}
