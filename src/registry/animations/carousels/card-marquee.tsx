"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type MarqueeCard = {
  /** ~32px icon at the top of the card (an `img` or `svg`). */
  icon?: React.ReactNode;
  /** Card heading, at the bottom. Clamped to 3 lines. */
  title: React.ReactNode;
  /** Copy revealed under the heading on hover / focus. */
  description?: React.ReactNode;
  /** Makes the card a link. */
  href?: string;
};

type CardMarqueeProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: MarqueeCard[];
  /** How fast the row moves, in px per second. */
  speed?: number;
  direction?: "left" | "right";
  /** Hold the row while the pointer is over it or a card has keyboard focus. */
  pauseOnHover?: boolean;
  /** Card width, in px. */
  cardWidth?: number;
  /** Card height at rest from 992px, in px (240px below). */
  cardHeight?: number;
  /** How much taller a hovered card grows, in px (split above and below). */
  hoverGrow?: number;
  /** Hover grow / reveal duration, in ms. */
  hoverDuration?: number;
  /** Card background at rest, and on hover. */
  restBackground?: string;
  hoverBackground?: string;
  /** Hovered card's 1px border. */
  hoverBorder?: string;
  /** Accessible name for the row. */
  label?: string;
};

/**
 * Card marquee: an endless row of tall icon cards drifting sideways at a
 * steady pace. Hovering a card pauses the row, and the card grows taller,
 * turns white with a border and shadow, and reveals its copy under the
 * heading. Used on the Seemplicity "Centralize exposure data" page.
 *
 * How it loops: the track holds two identical halves, each with enough
 * copies of the cards to cover the viewport, and moves left by exactly
 * -50% before restarting, so the jump lands on an identical frame. Every card
 * carries its own right margin (not a flex gap) so -50% is exact. The loop's
 * duration is measured from the rendered width so the row moves at `speed`
 * px/s. Only `transform` is animated on the track.
 *
 * Hover: the card sits centred in a fixed-height slot and grows `hoverGrow`
 * px (half above, half below) over `hoverDuration`ms `ease`, so neighbours
 * never move. The copy opens with a `grid-template-rows: 0fr → 1fr` reveal
 * and fades in, pushing the heading up in step with the grow.
 *
 * Reduced motion: no marquee; the row becomes a horizontal scroll area with
 * one copy of the cards, and hover changes are instant.
 */
export function CardMarquee({
  items,
  speed = 77,
  direction = "left",
  pauseOnHover = true,
  cardWidth = 340,
  cardHeight = 324,
  hoverGrow = 58,
  hoverDuration = 300,
  restBackground = "rgb(163 9 187 / 0.05)",
  hoverBackground = "#FFFFFF",
  hoverBorder = "#D9CCDC",
  label = "Highlights",
  className,
  style,
  ...props
}: CardMarqueeProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const setRef = React.useRef<HTMLDivElement>(null);
  // Copies of the card set in each half; enough to cover the viewport.
  const [copies, setCopies] = React.useState(2);
  const [duration, setDuration] = React.useState(60);

  React.useEffect(() => {
    const root = rootRef.current;
    const set = setRef.current;
    if (!root || !set) return;
    const measure = () => {
      const setWidth = set.offsetWidth;
      if (!setWidth) return;
      const needed = Math.max(1, Math.ceil(root.clientWidth / setWidth));
      setCopies(needed);
      setDuration((needed * setWidth) / Math.max(speed, 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    ro.observe(set);
    return () => ro.disconnect();
  }, [speed, items.length]);

  if (items.length === 0) return null;

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
      ref={rootRef}
      role="region"
      aria-label={label}
      className={cn("min-w-0 overflow-hidden motion-reduce:overflow-x-auto", className)}
      style={
        {
          "--cm-duration": `${duration}s`,
          "--cm-w": `${cardWidth}px`,
          "--cm-h": `${cardHeight}px`,
          "--cm-grow": `${hoverGrow}px`,
          "--cm-hover": `${hoverDuration}ms`,
          "--cm-rest-bg": restBackground,
          "--cm-hover-bg": hoverBackground,
          "--cm-border": hoverBorder,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* React hoists and dedupes this, so many marquees share one rule. */}
      <style href="card-marquee-keyframes" precedence="default">
        {`@keyframes card-marquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
[data-card-marquee][data-pause]:has(a:focus-visible,[data-card]:focus-visible){animation-play-state:paused}
@media (hover:hover){[data-card-marquee][data-pause]:hover{animation-play-state:paused}}`}
      </style>
      {/* Vertical padding leaves room for a hovered card's grow and shadow. */}
      <div
        data-card-marquee
        data-pause={pauseOnHover ? "" : undefined}
        className={cn(
          "flex w-max py-[calc(var(--cm-grow)/2+20px)] will-change-transform",
          "animate-[card-marquee_var(--cm-duration)_linear_infinite] motion-reduce:animate-none",
          direction === "right" && "[animation-direction:reverse]"
        )}
      >
        {Array.from({ length: copies * 2 }, (_, n) => renderSet(n))}
      </div>
    </div>
  );
}

function Card({ item, hidden }: { item: MarqueeCard; hidden: boolean }) {
  const Tag = item.href ? "a" : "div";
  return (
    // Fixed slot: the card grows inside it, so the row never shifts.
    <div className="relative mr-5 h-60 w-(--cm-w) shrink-0 min-[992px]:mr-[30px] min-[992px]:h-(--cm-h)">
      <Tag
        {...(item.href ? { href: item.href } : {})}
        data-card
        tabIndex={hidden ? -1 : item.href ? undefined : 0}
        className={cn(
          "group absolute inset-x-0 top-1/2 flex h-full -translate-y-1/2 flex-col justify-between overflow-hidden rounded-[20px] border border-transparent bg-(--cm-rest-bg) p-[30px] text-inherit no-underline outline-none min-[992px]:p-10",
          "transition-[height,background-color,border-color,box-shadow] duration-(--cm-hover) ease-[ease] motion-reduce:transition-none",
          "hover:h-[calc(100%+var(--cm-grow))] hover:border-(--cm-border) hover:bg-(--cm-hover-bg) hover:shadow-[0_8px_28px_rgb(11_6_35/0.12)]",
          "focus-visible:h-[calc(100%+var(--cm-grow))] focus-visible:border-(--cm-border) focus-visible:bg-(--cm-hover-bg) focus-visible:shadow-[0_8px_28px_rgb(11_6_35/0.12)] focus-visible:ring-2 focus-visible:ring-[#E3308C]"
        )}
      >
        {item.icon && (
          <span aria-hidden className="mb-5 flex size-8 shrink-0 *:size-full *:object-contain min-[992px]:mb-[30px]">
            {item.icon}
          </span>
        )}
        <div className="min-w-0">
          <div className="line-clamp-3">{item.title}</div>
          {item.description && (
            <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-(--cm-hover) ease-[ease] group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-visible:grid-rows-[1fr] group-focus-visible:opacity-100 motion-reduce:transition-none">
              <div className="min-h-0 overflow-hidden">
                <div className="pt-[15px]">{item.description}</div>
              </div>
            </div>
          )}
        </div>
      </Tag>
    </div>
  );
}
