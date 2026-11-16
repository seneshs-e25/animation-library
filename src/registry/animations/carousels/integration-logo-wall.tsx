"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type IntegrationLogo = {
  /** Image URL (SVG recommended). Fitted inside the card's padding, centred. */
  src: string;
  /** Brand name, read once by screen readers. */
  alt: string;
  /** Optional link, e.g. the integration's own page. */
  href?: string;
  /** Open the link in a new tab. */
  newTab?: boolean;
};

type IntegrationLogoWallProps = Omit<React.ComponentProps<"section">, "children"> & {
  /** One array of logos per column (two in the original). */
  columns: IntegrationLogo[][];
  /** The copy beside the columns: heading, paragraph, CTA. */
  children?: React.ReactNode;
  /** How fast each column moves, in px per second. */
  speed?: number;
  /** Direction of the first column. Every other column runs the opposite way. */
  direction?: "up" | "down";
  /** Offset between neighbouring columns, in px, so their cards don't line up. */
  stagger?: number;
  /** Hold the columns while the pointer is over them or a card link has focus. */
  pauseOnHover?: boolean;
  /** Card size from 1024px wide, in px (200px wide below). */
  cardWidth?: number;
  cardHeight?: number;
  /** Space between cards, in px (16px below 1024px). */
  gap?: number;
  /** Card corner radius, in px. */
  radius?: number;
  /** Height of the column window from 1024px, in px. */
  columnHeight?: number;
  /** Length of the fade at each end of a column, in px. 0 turns it off. */
  fade?: number;
  /** Section background. */
  background?: string;
  /** Card background. */
  cardBackground?: string;
  /** Accessible name for the logo columns. */
  label?: string;
};

/**
 * Integration logo wall: a copy column beside two columns of logo cards that
 * scroll endlessly, the first one up and the second one down, at a slow
 * steady pace. Rebuilt from the UJET homepage ("Seamless integration with key
 * customer service solutions"). When the section is under 1024px wide (a
 * container query, so it adapts to its slot, not the viewport) the columns turn into two
 * full-width rows that slide left and right.
 *
 * How it loops: each column's track holds two identical halves, each with
 * enough copies of the logos to fill the window, and moves by exactly -50%
 * before restarting, so the jump lands on an identical frame. Every card
 * carries its own margin (not a flex gap) so -50% is exact. The duration is
 * measured from the rendered size so the column moves at `speed` px/s, and
 * the stagger is a negative `animation-delay`, so columns start offset
 * without any layout shift. Only `transform` is animated.
 *
 * Reduced motion: the columns stand still and become scroll areas showing
 * one copy of the logos.
 */
export function IntegrationLogoWall({
  columns,
  children,
  speed = 22.5,
  direction = "up",
  stagger = 45,
  pauseOnHover = false,
  cardWidth = 260,
  cardHeight = 70,
  gap = 20,
  radius = 4,
  columnHeight = 550,
  fade = 70,
  background = "#F3F4FE",
  cardBackground = "#FFFFFF",
  label = "Integrations",
  className,
  style,
  ...props
}: IntegrationLogoWallProps) {
  const filled = columns.filter((column) => column.length > 0);
  if (filled.length === 0) return null;

  return (
    <section
      data-ilw
      data-pause={pauseOnHover ? "" : undefined}
      className={cn(
        "@container w-full min-w-0 overflow-hidden bg-(--ilw-bg) py-10 @min-[1024px]:pt-[120px] @min-[1024px]:pb-[50px]",
        className
      )}
      style={
        {
          "--ilw-bg": background,
          "--ilw-card-bg": cardBackground,
          "--ilw-w": `${cardWidth}px`,
          "--ilw-h": `${cardHeight}px`,
          "--ilw-gap": `${gap}px`,
          "--ilw-radius": `${radius}px`,
          "--ilw-col-h": `${columnHeight}px`,
          "--ilw-fade": `${fade}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* React hoists and dedupes this, so many walls share one rule. */}
      <style href="integration-logo-wall-keyframes" precedence="default">
        {`@keyframes ilw-x{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
@keyframes ilw-y{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,-50%,0)}}
[data-ilw-track]{animation:ilw-x var(--ilw-duration) linear var(--ilw-delay) infinite var(--ilw-direction)}
@container (min-width:1024px){[data-ilw-track]{animation-name:ilw-y}}
@media (prefers-reduced-motion:reduce){[data-ilw-track]{animation:none}}
[data-ilw][data-pause]:has([data-ilw-card]:focus-visible) [data-ilw-track]{animation-play-state:paused}
@media (hover:hover){[data-ilw][data-pause]:has([data-ilw-col]:hover) [data-ilw-track]{animation-play-state:paused}}`}
      </style>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 @min-[1024px]:flex-row @min-[1024px]:items-center @min-[1024px]:justify-between @min-[1024px]:gap-10 @min-[1024px]:px-5">
        {children && <div className="min-w-0 px-5 @min-[1024px]:max-w-[570px] @min-[1024px]:flex-1 @min-[1024px]:px-0">{children}</div>}
        <div
          role="region"
          aria-label={label}
          className="flex min-w-0 flex-col @min-[1024px]:shrink-0 @min-[1024px]:flex-row @min-[1024px]:gap-6"
        >
          {filled.map((logos, i) => {
            const reverse = (direction === "down") !== (i % 2 === 1);
            return (
              <Column
                key={i}
                logos={logos}
                speed={speed}
                reverse={reverse}
                offset={stagger * i}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Column({
  logos,
  speed,
  reverse,
  offset,
}: {
  logos: IntegrationLogo[];
  speed: number;
  reverse: boolean;
  offset: number;
}) {
  const viewRef = React.useRef<HTMLDivElement>(null);
  const setRef = React.useRef<HTMLDivElement>(null);
  const [copies, setCopies] = React.useState(1);
  const [duration, setDuration] = React.useState(60);

  React.useEffect(() => {
    const view = viewRef.current;
    const set = setRef.current;
    if (!view || !set) return;
    const measure = () => {
      // The set stacks its cards in a column from 1024px and in a row below.
      const vertical = getComputedStyle(set).flexDirection === "column";
      const setLength = vertical ? set.offsetHeight : set.offsetWidth;
      const viewLength = vertical ? view.clientHeight : view.clientWidth;
      if (!setLength) return;
      const needed = Math.max(1, Math.ceil(viewLength / setLength));
      setCopies(needed);
      setDuration((needed * setLength) / Math.max(speed, 0.1));
    };
    measure();
    // Re-measure when logos load, the layout changes or the breakpoint flips.
    const ro = new ResizeObserver(measure);
    ro.observe(view);
    ro.observe(set);
    return () => ro.disconnect();
  }, [speed, logos.length]);

  const renderSet = (copy: number) => (
    <div
      key={copy}
      ref={copy === 0 ? setRef : undefined}
      aria-hidden={copy > 0 || undefined}
      className={cn("flex shrink-0 flex-row @min-[1024px]:flex-col", copy > 0 && "motion-reduce:hidden")}
    >
      {logos.map((logo, i) => (
        <Card key={i} logo={logo} hidden={copy > 0} />
      ))}
    </div>
  );

  return (
    <div
      ref={viewRef}
      data-ilw-col
      className={cn(
        // Padding keeps the cards' shadows inside the clipped window.
        "overflow-hidden px-5 py-4 motion-reduce:overflow-x-auto",
        "@min-[1024px]:h-(--ilw-col-h) @min-[1024px]:w-[calc(var(--ilw-w)+32px)] @min-[1024px]:px-4 @min-[1024px]:py-0 @min-[1024px]:motion-reduce:overflow-x-hidden @min-[1024px]:motion-reduce:overflow-y-auto",
        "[mask-image:linear-gradient(to_right,transparent,#000_var(--ilw-fade),#000_calc(100%-var(--ilw-fade)),transparent)]",
        "@min-[1024px]:[mask-image:linear-gradient(to_bottom,transparent,#000_var(--ilw-fade),#000_calc(100%-var(--ilw-fade)),transparent)]"
      )}
    >
      <div
        data-ilw-track
        className="flex w-max flex-row will-change-transform @min-[1024px]:w-auto @min-[1024px]:flex-col"
        style={
          {
            "--ilw-duration": `${duration}s`,
            // A negative delay starts the loop part-way, so columns sit offset.
            "--ilw-delay": `${-offset / Math.max(speed, 0.1)}s`,
            "--ilw-direction": reverse ? "reverse" : "normal",
          } as React.CSSProperties
        }
      >
        {Array.from({ length: copies * 2 }, (_, n) => renderSet(n))}
      </div>
    </div>
  );
}

function Card({ logo, hidden }: { logo: IntegrationLogo; hidden: boolean }) {
  const className = cn(
    "mr-4 flex h-(--ilw-h) w-[200px] shrink-0 items-center justify-center rounded-(--ilw-radius) bg-(--ilw-card-bg) px-[30px] py-5 shadow-[0_6px_15px_rgb(0_8_67/0.15)] [backface-visibility:hidden]",
    "@min-[1024px]:mr-0 @min-[1024px]:mb-(--ilw-gap) @min-[1024px]:w-(--ilw-w) @min-[1024px]:px-[50px]"
  );
  const img = (
    // A plain <img> keeps the file portable; swap in the site's Image component if it has one.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.src}
      alt={hidden ? "" : logo.alt}
      loading={hidden ? "lazy" : undefined}
      decoding="async"
      draggable={false}
      className="block h-full w-full object-contain select-none"
    />
  );
  return logo.href ? (
    <a
      href={logo.href}
      target={logo.newTab ? "_blank" : undefined}
      rel={logo.newTab ? "noopener noreferrer" : undefined}
      tabIndex={hidden ? -1 : undefined}
      data-ilw-card
      className={cn(className, "outline-none focus-visible:ring-2 focus-visible:ring-[#FF4E33]")}
    >
      {img}
    </a>
  ) : (
    <div className={className}>{img}</div>
  );
}
