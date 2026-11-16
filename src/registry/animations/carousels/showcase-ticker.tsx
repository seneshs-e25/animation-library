"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ShowcaseItem = {
  /** Screenshot URL. Fills the card (object-cover). */
  src: string;
  alt: string;
  /** "site" is a 700×450 desktop screenshot, "mobile" a 220×450 phone screenshot. */
  kind?: "site" | "mobile";
  /** Card width ÷ height. Overrides `kind`. */
  aspect?: number;
  /** Looping muted video, shown over `src` (which becomes its poster). */
  video?: string;
  /** CSS object-position, e.g. "top" to pin a long page screenshot to its header. */
  position?: string;
  /** Makes the card a link. */
  href?: string;
};

type ShowcaseTickerProps = Omit<React.ComponentProps<"section">, "children"> & {
  /** One array of cards per row (two in the original). Rows alternate direction. */
  rows: ShowcaseItem[][];
  /** Section heading, top left. */
  heading?: React.ReactNode;
  /** Top right, e.g. a "See all" link. */
  action?: React.ReactNode;
  /** How fast each row moves, in px per second. */
  speed?: number;
  /** Direction of the first row. Every other row runs the opposite way. */
  direction?: "left" | "right";
  /** Hold the rows while the pointer is over them or a card link has focus. */
  pauseOnHover?: boolean;
  /** Card height from 1200px of container width, in px. Scales down to 76% / 58% below 1200px / 810px. */
  height?: number;
  /** Space between cards and between rows, in px. */
  gap?: number;
  /** Card and row corner radius, in px. */
  radius?: number;
  /** Section background. */
  background?: string;
  /** 1px card outline. */
  border?: string;
  /** Accessible name for the rows. */
  label?: string;
};

const ASPECT = { site: 700 / 450, mobile: 220 / 450 } as const;

/**
 * Showcase ticker: a heading over two rows of site screenshots, wide desktop
 * shots mixed with narrow phone shots, drifting endlessly in opposite
 * directions at a slow, steady pace. Recreated from the "Shipped with Framer"
 * gallery on the Framer homepage.
 *
 * How it loops: each row's track holds two identical halves, each with enough
 * copies of the cards to cover the row, and moves by exactly -50% before
 * restarting, so the jump lands on an identical frame. Every card carries its
 * own right margin (not a flex gap) so -50% is exact. The duration is measured
 * from the rendered width so each row moves at `speed` px/s. Only `transform`
 * is animated.
 *
 * Reduced motion: the rows stand still and become horizontal scroll areas
 * with one copy of the cards.
 */
export function ShowcaseTicker({
  rows,
  heading,
  action,
  speed = 32,
  direction = "left",
  pauseOnHover = false,
  height = 450,
  gap = 10,
  radius = 15,
  background = "#000000",
  border = "rgb(255 255 255 / 0.1)",
  label = "Showcase",
  className,
  style,
  ...props
}: ShowcaseTickerProps) {
  const filled = rows.filter((row) => row.length > 0);
  if (filled.length === 0) return null;

  return (
    <section
      data-st
      data-pause={pauseOnHover ? "" : undefined}
      className={cn("@container w-full min-w-0 bg-(--st-bg) px-5 py-[120px] text-white", className)}
      style={
        {
          "--st-bg": background,
          "--st-h": `${height}px`,
          "--st-gap": `${gap}px`,
          "--st-radius": `${radius}px`,
          "--st-border": border,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* React hoists and dedupes this, so many tickers share one rule. */}
      <style href="showcase-ticker-keyframes" precedence="default">
        {`@keyframes showcase-ticker{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
[data-st-track]{animation:showcase-ticker var(--st-duration) linear infinite var(--st-direction)}
@media (prefers-reduced-motion:reduce){[data-st-track]{animation:none}}
[data-st][data-pause]:has([data-st-card]:focus-visible) [data-st-track]{animation-play-state:paused}
@media (hover:hover){[data-st][data-pause]:has([data-st-row]:hover) [data-st-track]{animation-play-state:paused}}`}
      </style>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10">
        {(heading || action) && (
          <header className="flex items-center justify-between gap-6">
            {heading && <div className="min-w-0">{heading}</div>}
            {action && <div className="shrink-0">{action}</div>}
          </header>
        )}
        <div
          role="region"
          aria-label={label}
          className={cn(
            "flex flex-col gap-(--st-gap)",
            // Cards scale with the container: 58% below 810px, 76% below 1200px.
            "[--st-card-h:calc(var(--st-h)*0.578)] @min-[810px]:[--st-card-h:calc(var(--st-h)*0.756)] @min-[1200px]:[--st-card-h:var(--st-h)]"
          )}
        >
          {filled.map((items, i) => (
            <Row key={i} items={items} speed={speed} reverse={(direction === "right") !== (i % 2 === 1)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Row({ items, speed, reverse }: { items: ShowcaseItem[]; speed: number; reverse: boolean }) {
  const viewRef = React.useRef<HTMLDivElement>(null);
  const setRef = React.useRef<HTMLDivElement>(null);
  const [copies, setCopies] = React.useState(1);
  const [duration, setDuration] = React.useState(60);

  React.useEffect(() => {
    const view = viewRef.current;
    const set = setRef.current;
    if (!view || !set) return;
    const measure = () => {
      const setWidth = set.offsetWidth;
      if (!setWidth) return;
      const needed = Math.max(1, Math.ceil(view.clientWidth / setWidth));
      setCopies(needed);
      setDuration((needed * setWidth) / Math.max(speed, 0.1));
    };
    measure();
    // Re-measure when the layout changes or the card size steps at a breakpoint.
    const ro = new ResizeObserver(measure);
    ro.observe(view);
    ro.observe(set);
    return () => ro.disconnect();
  }, [speed, items.length]);

  const renderSet = (copy: number) => (
    <div
      key={copy}
      ref={copy === 0 ? setRef : undefined}
      aria-hidden={copy > 0 || undefined}
      className={cn("flex shrink-0", copy > 0 && "motion-reduce:hidden")}
    >
      {items.map((item, i) => (
        <Card key={i} item={item} hidden={copy > 0} />
      ))}
    </div>
  );

  return (
    <div
      ref={viewRef}
      data-st-row
      // The row clips with the cards' radius, so a card sliding out at either edge keeps a rounded corner.
      className="overflow-hidden rounded-(--st-radius) motion-reduce:overflow-x-auto"
    >
      <div
        data-st-track
        className="flex w-max will-change-transform"
        style={
          {
            "--st-duration": `${duration}s`,
            "--st-direction": reverse ? "reverse" : "normal",
          } as React.CSSProperties
        }
      >
        {Array.from({ length: copies * 2 }, (_, n) => renderSet(n))}
      </div>
    </div>
  );
}

function Card({ item, hidden }: { item: ShowcaseItem; hidden: boolean }) {
  const aspect = item.aspect ?? ASPECT[item.kind ?? "site"];
  const className =
    "relative mr-(--st-gap) block h-(--st-card-h) w-[calc(var(--st-card-h)*var(--st-aspect))] shrink-0 overflow-hidden rounded-(--st-radius) bg-white/5 [backface-visibility:hidden]";
  const media = (
    <>
      {/* A plain <img> keeps the file portable; swap in the site's Image component if it has one. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={hidden || item.video ? "" : item.alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 size-full object-cover select-none"
        style={{ objectPosition: item.position }}
      />
      {item.video && (
        <video
          src={item.video}
          poster={item.src}
          autoPlay
          muted
          loop
          playsInline
          aria-label={hidden ? undefined : item.alt}
          aria-hidden={hidden || undefined}
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: item.position }}
        />
      )}
      {/* Outline drawn over the image so it stays crisp on light screenshots. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] border border-(--st-border)" />
    </>
  );
  const style = { "--st-aspect": aspect } as React.CSSProperties;

  return item.href ? (
    <a
      href={item.href}
      tabIndex={hidden ? -1 : undefined}
      data-st-card
      className={cn(className, "outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset")}
      style={style}
    >
      {media}
    </a>
  ) : (
    <div className={className} style={style}>
      {media}
    </div>
  );
}
