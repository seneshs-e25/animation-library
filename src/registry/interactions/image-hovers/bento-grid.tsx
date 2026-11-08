import * as React from "react";

export type BentoTile = {
  /** Card art. It fills the card (object-cover) and zooms on hover when the card links somewhere. */
  image?: string;
  alt?: string;
  title?: React.ReactNode;
  /** CTA label under the title. Shown only with `href`. */
  ctaLabel?: React.ReactNode;
  /** Makes the whole card a link, and turns on its hover zoom. */
  href?: string;
  /** "light" = white copy for dark art (the default), "dark" = dark copy for pale art. */
  tone?: "light" | "dark";
};

type BentoGridProps = React.ComponentProps<"div"> & {
  /** Five tiles fill one bento; more start another bento below it in the same pattern. */
  tiles: BentoTile[];
  /** How far a linked card's art grows on hover (1.04 = 4%). */
  scale?: number;
  /** Zoom duration in milliseconds. */
  duration?: number;
  /** CSS timing function for the zoom. */
  easing?: string;
  /** Card corner radius in px on wide layouts (half that when stacked). */
  radius?: number;
  /** CTA chip colour on hover for light-tone cards (a gradient). */
  chipFrom?: string;
  chipTo?: string;
};

/**
 * Each slot of the five-tile pattern: where it sits in the 3×3 grid, its
 * height when the grid stacks, and whether its copy sits at the top.
 *
 *   ┌────────┬────────┬────────┐
 *   │        │   2    │   3    │  203.5px
 *   │   1    │        ├────────┤
 *   │        │        │   4    │  203.5px
 *   │        ├────────┴────────┤
 *   │        │        5        │  165px
 *   └────────┴─────────────────┘
 *     422fr    398fr    402fr
 */
const SLOTS = [
  { cell: "@[900px]:col-start-1 @[900px]:row-start-1 @[900px]:row-span-3", floor: "min-h-[592px] @[900px]:min-h-0", top: false },
  { cell: "@[900px]:col-start-2 @[900px]:row-start-1 @[900px]:row-span-2", floor: "min-h-[417px] @[900px]:min-h-0", top: true },
  { cell: "@[900px]:col-start-3 @[900px]:row-start-1", floor: "min-h-[204px] @[900px]:min-h-0", top: true },
  { cell: "@[900px]:col-start-3 @[900px]:row-start-2", floor: "min-h-[204px] @[900px]:min-h-0", top: false },
  { cell: "@[900px]:col-start-2 @[900px]:col-span-2 @[900px]:row-start-3", floor: "min-h-[165px] @[900px]:min-h-0", top: false },
];

function Chip({ tone }: { tone: "light" | "dark" }) {
  return (
    <span
      aria-hidden
      className={[
        "relative grid size-5 shrink-0 place-items-center overflow-hidden rounded-full",
        tone === "light"
          ? // Frosted glass disc, as the original's icon-arrow-glass.
            "bg-[linear-gradient(144deg,rgba(255,255,255,0.4)_4%,rgba(255,255,255,0.08)_98%)] shadow-[0_10px_50px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.6),inset_0_0_1px_rgba(255,255,255,0.7)] backdrop-blur-[15px]"
          : "bg-[#2A2A2A] shadow-[inset_0_1px_6px_rgba(255,255,255,0.45)]",
      ].join(" ")}
    >
      {tone === "light" && (
        // The hover disc swaps in instantly, as the original's sprite swap does.
        <span className="absolute inset-0 bg-[linear-gradient(35deg,var(--bento-chip-from),var(--bento-chip-to))] opacity-0 shadow-[inset_0_1px_6px_rgba(255,255,255,0.8)] group-hover:opacity-100 group-focus-visible:opacity-100" />
      )}
      <svg viewBox="0 0 20 20" fill="none" className="relative size-5 text-white">
        <path d="M7.6 7H13V12.4M13 7L7 13" stroke="currentColor" />
      </svg>
    </span>
  );
}

function Card({ tile, slot }: { tile: BentoTile; slot: (typeof SLOTS)[number] }) {
  const tone = tile.tone ?? "light";
  const linked = Boolean(tile.href);
  const hasCopy = Boolean(tile.title || (linked && tile.ctaLabel));

  const body = (
    <>
      {tile.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tile.image}
          alt={tile.alt ?? ""}
          loading="lazy"
          decoding="async"
          className={[
            "pointer-events-none absolute inset-0 -z-10 size-full object-cover",
            linked &&
              "transition-transform duration-(--bento-duration) ease-(--bento-ease) motion-safe:group-hover:scale-(--bento-scale) motion-safe:group-focus-visible:scale-(--bento-scale)",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      )}

      {/* Pale cards get a faint hairline so they don't melt into a white page. */}
      {tone === "dark" && (
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] border border-[#D2CEEB]/30" />
      )}

      {hasCopy && (
        <div className={["flex flex-col gap-5", tone === "light" ? "text-white" : "text-[#1E252F]"].join(" ")}>
          {tile.title && <h3 className="m-0 text-[22px] leading-[1.1] font-light @[900px]:text-[28px]">{tile.title}</h3>}
          {linked && tile.ctaLabel && (
            <span className="flex items-center gap-[15px] text-base leading-[1.6] font-light tracking-[0.02em]">
              <Chip tone={tone} />
              {tile.ctaLabel}
            </span>
          )}
        </div>
      )}
    </>
  );

  const shell = [
    "group relative isolate flex h-full w-full flex-col overflow-hidden bg-white p-[30px] no-underline",
    "rounded-[calc(var(--bento-radius)/2)] @[900px]:rounded-(--bento-radius)",
    slot.floor,
    slot.top ? "justify-start" : "justify-end",
  ].join(" ");

  return linked ? (
    <a
      href={tile.href}
      className={`${shell} outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0054D7]`}
    >
      {body}
    </a>
  ) : (
    <div className={shell}>{body}</div>
  );
}

/**
 * Bento grid — five image cards in NetApp's bento: a tall card, a two-row
 * card, two short cards and a wide card along the bottom. Hovering a linked
 * card slowly zooms its art inside the rounded card (and turns a light card's
 * glass CTA chip bright); the card itself stays put. Cards without `href` are
 * static.
 *
 * Below 900px of container width the grid stacks into one column, each card
 * keeping a minimum height for its slot. Only `transform` animates.
 *
 * No client JavaScript.
 */
export function BentoGrid({
  tiles,
  scale = 1.04,
  duration = 500,
  easing = "cubic-bezier(0, 0, 0.2, 1)",
  radius = 20,
  chipFrom = "#0054D7",
  chipTo = "#00DDF4",
  className,
  style,
  ...props
}: BentoGridProps) {
  const blocks: BentoTile[][] = [];
  for (let i = 0; i < tiles.length; i += SLOTS.length) blocks.push(tiles.slice(i, i + SLOTS.length));

  return (
    <div
      className={["@container w-full", className].filter(Boolean).join(" ")}
      style={
        {
          "--bento-scale": scale,
          "--bento-duration": `${duration}ms`,
          "--bento-ease": easing,
          "--bento-radius": `${radius}px`,
          "--bento-chip-from": chipFrom,
          "--bento-chip-to": chipTo,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div role="list" className="flex flex-col gap-5 @[900px]:gap-2.5">
        {blocks.map((block, b) => (
          <div
            key={b}
            role="presentation"
            className="flex flex-col gap-5 @[900px]:grid @[900px]:grid-cols-[422fr_398fr_402fr] @[900px]:grid-rows-[203.5px_203.5px_165px] @[900px]:gap-2.5"
          >
            {block.map((tile, i) => (
              <div key={i} role="listitem" className={SLOTS[i].cell}>
                <Card tile={tile} slot={SLOTS[i]} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
