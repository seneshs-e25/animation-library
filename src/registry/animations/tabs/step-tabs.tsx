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
  /** Image slide-in, in ms. */
  slideDuration?: number;
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
 * - Cards crossfade on `opacity` ({fadeDuration}ms `ease`, Swiper's fade).
 *   The image inside each card moves on `transform` (`translateX(offset%)` →
 *   0, {slideDuration}ms easeOutCubic) inside a clipped, rounded box, both
 *   ways, so a fast click retargets from wherever it is.
 * - Tabs follow the WAI-ARIA tabs pattern: arrow keys, Home and End move
 *   between tabs; inactive panels are `inert`.
 *
 * Reduced motion: the crossfade stays, the image doesn't slide.
 */
export function StepTabs({
  items,
  defaultIndex = 0,
  fadeDuration = 600,
  slideDuration = 700,
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
          "--st-slide": `${slideDuration}ms`,
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
[data-step-tabs="${id}"] [data-media]{transform:translateX(var(--st-offset));transition:transform var(--st-slide) cubic-bezier(.33,1,.68,1)}
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
                  "relative isolate flex min-h-10 shrink-0 cursor-pointer items-center gap-[5px] rounded-full border border-[rgb(65_0_81/0.1)] bg-white px-[13px] py-[9px] outline-none transition-[border-color,box-shadow] duration-300 ease-out focus-visible:ring-2 focus-visible:ring-(--st-to) focus-visible:ring-offset-2 md:min-h-14 md:gap-[15px] md:px-[29px] md:py-[11px] min-[1200px]:px-[30px] min-[1200px]:py-[15px]",
                  selected && "border-transparent shadow-[0_5px_20px_rgb(65_0_81/0.4)]"
                )}
              >
                {/* Active gradient, faded in so the swap isn't a hard cut. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -inset-px -z-10 rounded-full bg-[linear-gradient(90deg,var(--st-from)_0%,var(--st-to)_100%)] transition-opacity duration-300 ease-out",
                    selected ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.icon && (
                  <span
                    aria-hidden
                    className={cn(
                      "flex w-[15px] shrink-0 md:w-[26px] *:h-auto *:w-full [&_img]:transition-[filter] [&_img]:duration-300",
                      selected && "[&_img]:brightness-0 [&_img]:invert"
                    )}
                  >
                    {item.icon}
                  </span>
                )}
                <span
                  className={cn(
                    "text-xs leading-[1.4] font-semibold whitespace-nowrap transition-colors duration-300 ease-out md:text-base md:font-bold",
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
                "col-start-1 row-start-1 grid min-w-0 grid-cols-1 items-start rounded-[20px] border border-(--st-border) bg-(--st-card) shadow-[0_10px_30px_rgb(65_0_81/0.2)] transition-opacity duration-(--st-fade) ease-[ease] md:grid-cols-2 min-[992px]:grid-cols-[5fr_7fr]",
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
