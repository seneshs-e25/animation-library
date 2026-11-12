"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type HoverListTag = {
  /** ~10px icon before the label, e.g. `<HourglassIcon />`. */
  icon?: React.ReactNode;
  label: React.ReactNode;
};

export type HoverListItem = {
  title: React.ReactNode;
  /** Arch-shaped thumbnail at the start of the row. */
  thumb?: string;
  /** Photo on the detail card. Defaults to `thumb`. */
  image?: string;
  alt?: string;
  /** White pills under the photo (duration, capacity...). */
  tags?: HoverListTag[];
  /** Bullet list under the tags. */
  bullets?: React.ReactNode[];
  /** Makes the row a link. */
  href?: string;
};

export type HoverListGroup = {
  /** Toggle label, e.g. a location. */
  label: string;
  items: HoverListItem[];
};

type HoverCardListProps = Omit<React.ComponentProps<"section">, "children"> & {
  /** One list, or several behind a toggle (one per group). */
  groups: HoverListGroup[];
  heading?: React.ReactNode;
  /** Hovered row background and detail card colour. */
  accent?: string;
  /** Page background behind the rows. */
  background?: string;
  /** Row tint duration, in ms. */
  duration?: number;
  /** Detail card fade / scale-in duration, in ms (0 = it just appears, as on Hatch). */
  cardDuration?: number;
  /** Show the 01, 02... index at the end of each row. */
  numbered?: boolean;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Hover card list: a list of big titles with arch thumbnails. Hovering a row
 * tints it and pops a detail card (photo, tag pills, bullets) out beside the
 * title, overlapping the rows above and below. An optional toggle switches
 * between lists. Recreated from Hatch's meeting rooms (a Framer site).
 *
 * How it works:
 * - Pure CSS hover: each row is a `group`; its tint and its card react to
 *   `:hover` (pointer devices only) and `:focus-within`. The card is a child of
 *   the row, so the pointer can move onto the card without losing the row.
 * - The card is absolutely positioned, centred on the row (`top: 50%;
 *   translateY(-50%)`). Hidden cards use `visibility: hidden` so they never
 *   catch the pointer over the neighbouring rows.
 * - Below 900px of container width (and on touch), rows become an accordion:
 *   tapping a row opens its details inline.
 *
 * Reduced motion: tint and card change instantly.
 */
export function HoverCardList({
  groups,
  heading,
  accent = "#CDCEA6",
  background = "#FAFAFA",
  duration = 400,
  cardDuration = 200,
  numbered = true,
  className,
  style,
  ...props
}: HoverCardListProps) {
  const [group, setGroup] = React.useState(0);
  const [open, setOpen] = React.useState<number | null>(null);
  const pointer = React.useRef<string>("mouse");
  const rootRef = React.useRef<HTMLElement>(null);
  const items = groups[group]?.items ?? [];
  const tabsId = React.useId();

  return (
    <section
      ref={rootRef}
      className={cn("@container w-full min-w-0 text-black", className)}
      style={
        {
          "--hl-accent": accent,
          "--hl-bg": background,
          "--hl-duration": `${duration}ms`,
          "--hl-card": `${cardDuration}ms`,
          "--hl-ease": EASE,
          backgroundColor: background,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {(heading || groups.length > 1) && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 pb-10 @[900px]:px-[60px] @[900px]:pb-[120px]">
          {heading && (
            <h2 className="m-0 text-[28px] leading-[1.2] font-medium tracking-[-0.02em] text-[#232323] @[900px]:text-[38px]">
              {heading}
            </h2>
          )}
          {groups.length > 1 && (
            <div role="tablist" className="flex gap-1 rounded-2xl bg-[#F3F3F3] p-2 @[900px]:px-4 @[900px]:py-3">
              {groups.map((g, i) => (
                <button
                  key={g.label}
                  type="button"
                  role="tab"
                  id={`${tabsId}-tab-${i}`}
                  aria-selected={i === group}
                  aria-controls={`${tabsId}-panel`}
                  onClick={() => {
                    setGroup(i);
                    setOpen(null);
                  }}
                  className={cn(
                    "cursor-pointer rounded-md border-0 px-4 py-2.5 text-base leading-none font-medium outline-none @[900px]:px-5 @[900px]:py-3.5 @[900px]:text-lg",
                    "transition-[background-color,color] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-black motion-reduce:transition-none",
                    i === group ? "bg-white text-black" : "bg-transparent text-black/50 hover:text-black"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <ul
        id={`${tabsId}-panel`}
        role={groups.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={groups.length > 1 ? `${tabsId}-tab-${group}` : undefined}
        className="m-0 list-none border-t border-(--hl-accent) p-0"
      >
        {items.map((item, i) => (
          <Row
            key={`${group}-${i}`}
            item={item}
            index={i}
            numbered={numbered}
            open={open === i}
            onPointerDown={(type) => {
              pointer.current = type;
            }}
            onToggle={() => {
              // From 900px a mouse already gets the hover card; taps, keys and narrow layouts toggle.
              const wide = (rootRef.current?.clientWidth ?? 0) >= 900;
              if (pointer.current === "mouse" && wide) return;
              setOpen((o) => (o === i ? null : i));
            }}
          />
        ))}
      </ul>
    </section>
  );
}

function Row({
  item,
  index,
  numbered,
  open,
  onPointerDown,
  onToggle,
}: {
  item: HoverListItem;
  index: number;
  numbered: boolean;
  open: boolean;
  onPointerDown: (type: string) => void;
  onToggle: () => void;
}) {
  const image = item.image ?? item.thumb;
  const hasDetails = Boolean(image || item.tags?.length || item.bullets?.length);
  const detailsId = React.useId();

  const head = (
    <>
      {item.thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumb}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-[50px] shrink-0 rounded-[27px_27px_13px_13px] object-cover @[900px]:size-[112px] @[900px]:rounded-[60px_60px_30px_30px]"
        />
      )}
      <span className="min-w-0 flex-1 text-[28px] leading-[1.2] tracking-[-0.03em] @[900px]:text-[clamp(40px,4.3cqw,62px)]">
        {item.title}
      </span>
      {numbered && (
        <span className="shrink-0 text-xl leading-[1.2] tabular-nums @[900px]:text-[38px]">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
    </>
  );

  const headClass =
    "flex w-full cursor-pointer items-center gap-6 border-0 bg-transparent p-0 text-left text-inherit no-underline outline-none @[900px]:gap-[34px]";

  return (
    <li
      data-open={open ? "" : undefined}
      className={cn(
        "group relative border-b border-(--hl-accent) bg-(--hl-bg) px-5 py-[18px] @[900px]:py-8 @[900px]:pr-[60px] @[900px]:pl-[75px]",
        "transition-colors duration-(--hl-duration) ease-(--hl-ease) motion-reduce:transition-none",
        "hover:z-10 hover:bg-(--hl-accent) focus-within:z-10 focus-within:bg-(--hl-accent) data-open:bg-(--hl-accent)"
      )}
      onPointerDown={(e) => onPointerDown(e.pointerType)}
    >
      {item.href ? (
        <a href={item.href} className={cn(headClass, "focus-visible:underline")}>
          {head}
        </a>
      ) : (
        <button
          type="button"
          aria-expanded={hasDetails ? open : undefined}
          aria-controls={hasDetails ? detailsId : undefined}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onPointerDown("keyboard");
          }}
          className={cn(headClass, "focus-visible:underline")}
        >
          {head}
        </button>
      )}

      {hasDetails && (
        <>
          {/* Floating card, 900px+: shown on hover or focus, centred on the row. */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none invisible absolute top-1/2 right-[159px] z-10 hidden w-[330px] origin-center -translate-y-1/2 scale-[0.96] opacity-0 @[900px]:block",
              "transition-[opacity,scale,visibility] duration-(--hl-card) ease-out motion-reduce:transition-none",
              "group-hover:pointer-events-auto group-hover:visible group-hover:scale-100 group-hover:opacity-100",
              "group-focus-within:visible group-focus-within:scale-100 group-focus-within:opacity-100",
              "group-data-open:visible group-data-open:scale-100 group-data-open:opacity-100"
            )}
          >
            <Details item={item} image={image} className="bg-(--hl-accent) px-4 pt-[15px] pb-5" />
          </div>

          {/* Inline accordion, below 900px. */}
          <div
            id={detailsId}
            className={cn(
              "grid grid-rows-[0fr] opacity-0 @[900px]:hidden",
              "transition-[grid-template-rows,opacity] duration-(--hl-duration) ease-(--hl-ease) motion-reduce:transition-none",
              "group-data-open:grid-rows-[1fr] group-data-open:opacity-100"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <Details item={item} image={image} className="pt-5" />
            </div>
          </div>
        </>
      )}
    </li>
  );
}

function Details({ item, image, className }: { item: HoverListItem; image?: string; className?: string }) {
  return (
    <div className={className}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={item.alt ?? ""}
          loading="lazy"
          decoding="async"
          className="aspect-[299/222] w-full rounded-[0_34px_0_0] object-cover"
        />
      )}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-[15px] flex flex-wrap gap-2.5">
          {item.tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex h-[25px] items-center gap-1 rounded-full bg-white px-1.5 text-[10px] leading-none font-medium text-[#43454B] [&_svg]:size-2.5"
            >
              {tag.icon}
              {tag.label}
            </span>
          ))}
        </div>
      )}
      {item.bullets && item.bullets.length > 0 && (
        <ul className="m-0 mt-4 list-disc pl-[18px] text-base leading-[1.2] text-[#666] marker:text-[#666]">
          {item.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Tabler "hourglass-low" (MIT), for a duration tag. */
export function HourglassIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 17h11" />
      <path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" />
      <path d="M6 4v2a6 6 0 1 0 12 0V4a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
    </svg>
  );
}

/** Tabler "armchair" (MIT), for a capacity tag. */
export function ArmchairIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 11a2 2 0 0 1 2 2v2h10v-2a2 2 0 1 1 4 0v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" />
      <path d="M5 11V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5" />
      <path d="M6 19v2" />
      <path d="M18 19v2" />
    </svg>
  );
}
