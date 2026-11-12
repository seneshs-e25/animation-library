"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type BentoCard = {
  /** Card name: the heading on the open card and the small label on a closed one. */
  title: string;
  /** Small label at the bottom left of a closed card. Defaults to `title`. */
  label?: string;
  /** Card colour. */
  color: string;
  /** Heading colour on the open (white) card. Panels default to `color`, strips to black. */
  accent?: string;
  /**
   * The marquee's two halves, with `thumb` between them: ["Hot", "Desks"].
   * Panels default to `title` split at its first space; strips put the whole
   * title before the thumb.
   */
  marquee?: [string, string?];
  /** Small image in the marquee. */
  thumb?: string;
  /** Image on the open card. Defaults to `thumb`. */
  image?: string;
  alt?: string;
  description?: React.ReactNode;
  ctaLabel?: React.ReactNode;
  /** With `ctaLabel`, shows the CTA link on the open card. */
  href?: string;
  /** CSS border-radius of the corner badge and marquee thumb (Hatch's leaf shapes). */
  shape?: string;
};

/** A card in the tall top row. */
export type BentoPanel = BentoCard;
/** A card in the short bottom row. */
export type BentoStrip = BentoCard;

type ExpandingBentoProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The tall top row. Hatch uses four. */
  panels: BentoPanel[];
  /** The short row under it. Hatch uses two. */
  strips?: BentoStrip[];
  /** Height of the top row from 900px of container width, in px. */
  height?: number;
  /** Height of the bottom row from 900px, in px. */
  stripHeight?: number;
  /** How much wider an open panel is than a closed one (410 / 295 in the original). */
  expand?: number;
  /** How much wider an open strip is than a closed one (784 / 528 in the original). */
  stripExpand?: number;
  /** Expand / collapse duration, in ms. */
  duration?: number;
  /** Marquee speed, in px per second. */
  speed?: number;
  /** Space between cards, in px. */
  gap?: number;
  /** Card corner radius, in px. */
  radius?: number;
  /** CTA arrow square colour. */
  ctaColor?: string;
};

/** Hatch's leaf shapes, used for cards that don't set `shape`. */
const SHAPES = ["15px 7.5px 25px 25px", "15px 7.5px", "25px 7.5px 7.5px 15px", "25px 25px 7.5px 7.5px", "7.5px 7.5px 25px 25px"];

const EASE = "cubic-bezier(0.12, 0.23, 0.5, 1)";

const splitTitle = (title: string): [string, string?] => {
  const i = title.indexOf(" ");
  return i < 0 ? [title] : [title.slice(0, i), title.slice(i + 1)];
};

type Variant = "panel" | "strip";

/**
 * Expanding bento: two rows of solid colour cards, each with its name
 * drifting across it as a giant marquee. Hovering a card widens it and fades
 * in a white detail card (heading, image, copy, CTA) while the others in its
 * row narrow to make room. Top-row panels are tall with the image above the
 * copy; bottom-row strips are short with the image beside it. Recreated from
 * the Hatch homepage (a Framer site).
 *
 * How it works:
 * - Each row is a flex row; cards have `flex-grow: 1` and the open one gets
 *   `flex-grow: expand`. Only `flex-grow` transitions, so one rule animates
 *   every card's width, and the sizes scale with the row. Each row keeps its
 *   own open card.
 * - The detail card is laid out at the open card's final width (a `cqw`
 *   calc), so its text never reflows while the card grows; the card clips it.
 * - Each marquee is two identical halves moving by -50% on a CSS keyframe;
 *   the duration comes from the measured unit width, so it runs at `speed`.
 *
 * Below 900px of container width, each row becomes a horizontal scroll-snap
 * row of open cards. Reduced motion: no marquee, and cards switch instantly.
 */
export function ExpandingBento({
  panels,
  strips = [],
  height = 569,
  stripHeight = 200,
  expand = 1.39,
  stripExpand = 1.49,
  duration = 400,
  speed = 100,
  gap = 8,
  radius = 0,
  ctaColor = "#FF562F",
  className,
  style,
  ...props
}: ExpandingBentoProps) {
  return (
    <div
      data-expanding-bento
      className={cn("@container w-full min-w-0", className)}
      style={
        {
          "--eb-duration": `${duration}ms`,
          "--eb-ease": EASE,
          "--eb-gap": `${gap}px`,
          "--eb-radius": `${radius}px`,
          "--eb-cta": ctaColor,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <style href="expanding-bento-keyframes" precedence="default">
        {`@keyframes expanding-bento{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}`}
      </style>

      <div className="flex flex-col gap-(--eb-gap)">
        <Row cards={panels} variant="panel" height={height} expand={expand} speed={speed} shapeOffset={0} />
        {strips.length > 0 && (
          <Row
            cards={strips}
            variant="strip"
            height={stripHeight}
            expand={stripExpand}
            speed={speed}
            shapeOffset={panels.length}
          />
        )}
      </div>
    </div>
  );
}

function Row({
  cards,
  variant,
  height,
  expand,
  speed,
  shapeOffset,
}: {
  cards: BentoCard[];
  variant: Variant;
  height: number;
  expand: number;
  speed: number;
  shapeOffset: number;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const rowRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={rowRef}
      role="list"
      className={cn(
        "flex gap-3 overflow-x-auto [scrollbar-width:none] [scroll-snap-type:x_mandatory] [&::-webkit-scrollbar]:hidden",
        "@[900px]:h-(--eb-row-h) @[900px]:gap-(--eb-gap) @[900px]:overflow-visible"
      )}
      style={{ "--eb-row-h": `${height}px`, "--eb-n": cards.length, "--eb-expand": expand } as React.CSSProperties}
      onPointerLeave={(e) => {
        if (e.pointerType !== "touch") setActive(null);
      }}
      onBlur={(e) => {
        if (!rowRef.current?.contains(e.relatedTarget as Node)) setActive(null);
      }}
    >
      {cards.map((card, i) => (
        <Card
          key={i}
          card={card}
          variant={variant}
          shape={card.shape ?? SHAPES[(shapeOffset + i) % SHAPES.length]}
          open={active === i}
          speed={speed}
          onOpen={() => setActive(i)}
        />
      ))}
    </div>
  );
}

function Card({
  card,
  variant,
  shape,
  open,
  speed,
  onOpen,
}: {
  card: BentoCard;
  variant: Variant;
  shape: string;
  open: boolean;
  speed: number;
  onOpen: () => void;
}) {
  const strip = variant === "strip";
  const [before, after] = card.marquee ?? (strip ? [card.title] : splitTitle(card.title));
  const image = card.image ?? card.thumb;
  const linked = Boolean(card.href && card.ctaLabel);

  return (
    <div
      role="listitem"
      data-active={open ? "" : undefined}
      tabIndex={linked ? undefined : 0}
      aria-label={card.title}
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") onOpen();
      }}
      onFocus={onOpen}
      onClick={onOpen}
      className={cn(
        "group relative isolate flex min-h-[480px] w-[min(85%,360px)] shrink-0 overflow-hidden rounded-(--eb-radius) bg-white outline-none [scroll-snap-align:start]",
        "focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        "@[900px]:h-full @[900px]:min-h-0 @[900px]:w-auto @[900px]:shrink @[900px]:grow @[900px]:basis-0 @[900px]:bg-(--eb-color)",
        "@[900px]:transition-[flex-grow] @[900px]:duration-(--eb-duration) @[900px]:ease-(--eb-ease) @[900px]:data-active:grow-(--eb-expand)",
        "motion-reduce:transition-none!"
      )}
      style={{ "--eb-color": card.color } as React.CSSProperties}
    >
      {/* Closed face: colour, corner badge, marquee and label. 900px+ only. */}
      <div aria-hidden className="absolute inset-0 hidden flex-col text-white @[900px]:flex">
        <span className="absolute top-5 right-5 size-[30px] bg-white/40" style={{ borderRadius: shape }} />
        <div className="flex flex-1 items-center">
          <Marquee
            items={[before, after]}
            thumb={card.thumb}
            shape={shape}
            speed={speed}
            className={
              strip
                ? "text-4xl leading-[1.2] tracking-[-0.04em]"
                : "text-[clamp(48px,7.67cqw,120px)] leading-[1.2] tracking-[-0.04em]"
            }
            thumbClass={strip ? "h-[1.36em]" : "h-[0.79em]"}
          />
        </div>
        <span className={cn("absolute bottom-5 left-5 text-xs leading-none", strip && "font-medium")}>
          {card.label ?? card.title}
        </span>
      </div>

      {/* Open face: a white card laid out at the open width, so nothing reflows as it grows. */}
      <div
        className={cn(
          "relative flex h-full w-full shrink-0 flex-col bg-white p-5",
          "@[900px]:w-[calc((100cqw-(var(--eb-n)-1)*var(--eb-gap))*var(--eb-expand)/(var(--eb-n)-1+var(--eb-expand)))]",
          "@[900px]:opacity-0 @[900px]:transition-opacity @[900px]:duration-(--eb-duration) @[900px]:ease-(--eb-ease) @[900px]:group-data-active:opacity-100",
          "motion-reduce:transition-none!",
          strip && "@[900px]:flex-row @[900px]:gap-5"
        )}
      >
        {strip ? (
          <>
            {image && (
              <Img
                src={image}
                alt={card.alt}
                className="order-2 mt-[19px] min-h-[180px] w-full flex-1 rounded-[80px_80px_16px_16px] @[900px]:order-none @[900px]:mt-0 @[900px]:h-full @[900px]:min-h-0 @[900px]:w-[30%] @[900px]:flex-none"
              />
            )}
            <div className="contents @[900px]:flex @[900px]:min-w-0 @[900px]:flex-1 @[900px]:flex-col @[900px]:justify-center">
              <Heading card={card} className="order-1 @[900px]:order-none" color={card.accent ?? "#000"} size="text-[28px] @[900px]:text-2xl" />
              <Copy card={card} className="order-3 mt-6 text-base @[900px]:order-none @[900px]:mt-4 @[900px]:text-sm" />
              <Cta card={card} linked={linked} className="order-4 @[900px]:order-none" />
            </div>
          </>
        ) : (
          <>
            <Heading card={card} color={card.accent ?? card.color} size="text-[28px]" />
            {image && <Img src={image} alt={card.alt} className="mt-[19px] min-h-[180px] w-full flex-1 rounded-[100px_100px_30px_30px] @[900px]:min-h-0" />}
            <Copy card={card} className="mt-6 text-base" />
            <Cta card={card} linked={linked} />
          </>
        )}
      </div>
    </div>
  );
}

function Heading({ card, color, size, className }: { card: BentoCard; color: string; size: string; className?: string }) {
  return (
    <h3 className={cn("m-0 leading-[1.2] font-medium tracking-[-0.04em] capitalize", size, className)} style={{ color }}>
      {card.title}
    </h3>
  );
}

function Img({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" className={cn("object-cover", className)} />;
}

function Copy({ card, className }: { card: BentoCard; className?: string }) {
  if (!card.description) return null;
  return <div className={cn("leading-[1.2] tracking-[-0.02em] text-[#717171]", className)}>{card.description}</div>;
}

function Cta({ card, linked, className }: { card: BentoCard; linked: boolean; className?: string }) {
  if (!linked) return null;
  return (
    <a
      href={card.href}
      className={cn(
        "mt-4 inline-flex items-center gap-2.5 self-start text-sm leading-[1.1] font-semibold tracking-[-0.02em] text-black no-underline outline-none focus-visible:underline",
        className
      )}
    >
      {card.ctaLabel}
      <svg aria-hidden viewBox="0 0 17 17" className="size-[17px] shrink-0">
        <rect width="17" height="17" fill="var(--eb-cta)" />
        <path
          d="M12.47 8.17a.47.47 0 0 1 0 .66l-2.99 3a.47.47 0 0 1-.67-.67l2.66-2.66-2.66-2.66a.47.47 0 0 1 .67-.67l2.99 3ZM4.86 8.03h7.28v.94H4.86z"
          fill="#fff"
        />
      </svg>
    </a>
  );
}

/**
 * One unit is `before · thumb · after` (or `before · thumb` when there's no
 * `after`). The track holds two identical halves of `copies` units each and
 * moves by -50%, so the loop restarts on an identical frame. Copies are
 * counted against the whole component's width, so they don't change (and
 * the loop doesn't jump) while a card grows.
 */
function Marquee({
  items: [before, after],
  thumb,
  shape,
  speed,
  className,
  thumbClass,
}: {
  items: [string, string?];
  thumb?: string;
  shape: string;
  speed: number;
  className?: string;
  thumbClass?: string;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const unitRef = React.useRef<HTMLDivElement>(null);
  const [copies, setCopies] = React.useState(2);
  const [seconds, setSeconds] = React.useState(10);

  React.useEffect(() => {
    const root = rootRef.current;
    const unit = unitRef.current;
    const host = root?.closest<HTMLElement>("[data-expanding-bento]");
    if (!root || !unit || !host) return;
    const measure = () => {
      const w = unit.offsetWidth;
      if (!w) return;
      const k = Math.max(1, Math.ceil(host.clientWidth / w));
      setCopies(k);
      setSeconds((k * w) / Math.max(speed, 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    ro.observe(unit);
    return () => ro.disconnect();
  }, [speed]);

  const thumbEl = thumb ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumb} alt="" decoding="async" className={cn("aspect-square w-auto shrink-0 object-cover", thumbClass)} style={{ borderRadius: shape }} />
  ) : null;

  const unit = (key: number) => (
    <div key={key} ref={key === 0 ? unitRef : undefined} className="flex shrink-0 items-center gap-[0.08em] pr-[0.08em]">
      <span className="whitespace-nowrap">{before}</span>
      {thumbEl}
      {after && <span className="whitespace-nowrap">{after}</span>}
    </div>
  );

  return (
    <div ref={rootRef} className={cn("w-full min-w-0 overflow-hidden", className)}>
      <div
        className="flex w-max animate-[expanding-bento_var(--eb-loop)_linear_infinite] will-change-transform motion-reduce:animate-none"
        style={{ "--eb-loop": `${seconds}s` } as React.CSSProperties}
      >
        {Array.from({ length: copies * 2 }, (_, i) => unit(i))}
      </div>
    </div>
  );
}
