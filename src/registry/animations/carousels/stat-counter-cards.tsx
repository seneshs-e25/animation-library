"use client";

import * as React from "react";

export type StatCard = {
  /** The number to count to. Decimals are kept: 1.7 counts 0.0 → 1.7. */
  value: number;
  /** Fixed text before the number, e.g. "$". */
  prefix?: React.ReactNode;
  /** Fixed text after the number, e.g. "%", "K" or "M". */
  suffix?: React.ReactNode;
  /** Short label under the number, e.g. "Hours Back to Analysts". */
  label: React.ReactNode;
  /** The longer copy the card reveals when it opens. */
  description: React.ReactNode;
};

type StatCounterCardsProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: StatCard[];
  /** Class for the numbers (font family, size), e.g. the site's display font. */
  numberClassName?: string;
  /** Card height from `minWidth` up, in px. */
  minHeight?: number;
  /** Width of the open card from `minWidth` up, in px. */
  openWidth?: number;
  /** Space between cards, in px. */
  gap?: number;
  /** Card corner radius, in px. */
  radius?: number;
  /** Card background. */
  background?: string;
  /** Card border at rest. */
  borderColor?: string;
  /** Border and shadow colour of the open card. */
  activeColor?: string;
  /** Number colour. */
  numberColor?: string;
  /** Label colour. */
  labelColor?: string;
  /** Description colour. */
  textColor?: string;
  /** Time each number takes to count up, in ms. */
  countDuration?: number;
  /** Easing of the count, any CSS timing function. */
  countEase?: string;
  /** Time a card takes to widen or narrow, in ms. */
  duration?: number;
  /** Easing of the card width and the number's rise, any CSS timing function. */
  ease?: string;
  /** Time the number takes to rise to the top of an opening card, in ms. */
  riseDuration?: number;
  /** Time the number takes to sink back down once a card closes, in ms. */
  sinkDuration?: number;
  /** Wait after a card closes before its number sinks back down, in ms. */
  sinkDelay?: number;
  /** Time the description takes to open and fade in, in ms. */
  revealDuration?: number;
  /** Wait after the card starts opening before its description comes in, in ms. */
  revealDelay?: number;
  /** Time the description takes to fade out, in ms (no delay). */
  revealExitDuration?: number;
  /** Time the border and shadow take to change, in ms. */
  shadowDuration?: number;
  /** How long the pointer can be off a card before it closes, in ms (bridges the gaps). */
  leaveDelay?: number;
  /**
   * Component width (px) from which cards sit in a row and open on hover.
   * Below it they stack, and a tap opens one like an accordion.
   */
  minWidth?: number;
};

// Layout effect on the client so the numbers are zeroed before the first paint.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const decimalsOf = (n: number) => (String(n).split(".")[1] ?? "").length;

/**
 * Stat counter cards: a row of white stat cards whose numbers count up the
 * first time the row scrolls into view. Pointing at a card widens it, lifts
 * its number to the top and reveals a line of copy underneath. Used on the
 * Seemplicity website.
 *
 * How it works:
 * - Count: when 40% of the row is visible, every number counts from 0 to its
 *   value over `countDuration` (2000ms) on `countEase` (expo ease-out, close
 *   to countUp.js's easeOutExpo). Only each number's text node is rewritten,
 *   once per frame. The final value is server-rendered and zeroed before
 *   paint, and the count runs once per page load.
 * - Row (from `minWidth`): cards are flex items sharing the row. The open
 *   card goes to `flex: 0 0 openWidth` (420px) and the others shrink to share
 *   what's left, over `duration` (600ms) on `ease`. A `::before` spacer with
 *   `flex-grow: 1` holds the number at the bottom of a resting card; on open
 *   it collapses over `riseDuration` (300ms), so the number rises to the top
 *   while the description takes the bottom (`margin-top: auto`). On close the
 *   spacer waits `sinkDelay` (300ms), then grows back over `sinkDuration`
 *   (600ms).
 * - Description: a `grid-template-rows: 0fr → 1fr` reveal with a fade,
 *   `revealDuration` (200ms) starting `revealDelay` (150ms) in; out in
 *   `revealExitDuration` (50ms). It has a fixed 240px width, so the copy
 *   never reflows while the card widens.
 * - Pointer enter opens a card at once; leaving waits `leaveDelay` (50ms) so
 *   crossing the gap between cards doesn't collapse the row. Keyboard focus
 *   opens a card too.
 * - Below `minWidth` the cards stack. Clicking (or Enter / Space) toggles one
 *   open, accordion style: border and shadow come in, the description slides
 *   open under the label over `duration`.
 *
 * Reduced motion: no count (the final numbers show), and widths, the rise and
 * the reveal snap; only a 200ms opacity fade stays.
 */
export function StatCounterCards({
  items,
  numberClassName,
  minHeight = 320,
  openWidth = 420,
  gap = 10,
  radius = 20,
  background = "#FFFFFF",
  borderColor = "rgba(65, 0, 81, 0.1)",
  activeColor = "rgba(65, 0, 81, 0.2)",
  numberColor = "#A309BB",
  labelColor = "#410051",
  textColor = "#0B0623",
  countDuration = 2000,
  countEase = "cubic-bezier(0.16, 1, 0.3, 1)",
  duration = 600,
  ease = "ease",
  riseDuration = 300,
  sinkDuration = 600,
  sinkDelay = 300,
  revealDuration = 200,
  revealDelay = 150,
  revealExitDuration = 50,
  shadowDuration = 300,
  leaveDelay = 50,
  minWidth = 960,
  className,
  style,
  ...props
}: StatCounterCardsProps) {
  const [active, setActive] = React.useState<number | null>(null);
  const [expanded, setExpanded] = React.useState<number | null>(null);
  const rowRef = React.useRef<HTMLDivElement>(null);
  const leaveTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const s = `[data-stat-cards="${id}"]`;

  React.useEffect(() => () => clearTimeout(leaveTimer.current), []);

  // Count every number up once, the first time 40% of the row is visible.
  const values = items.map((item) => item.value).join(",");
  useIsomorphicLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const nums = Array.from(row.querySelectorAll<HTMLElement>("[data-count]"));
    const targets = nums.map((el) => Number(el.dataset.count));
    const finals = targets.map((v) => v.toFixed(decimalsOf(v)));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    nums.forEach((el, i) => (el.textContent = (0).toFixed(decimalsOf(targets[i]))));
    const curve = cssEase(countEase) ?? ((t: number) => t);
    let raf = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / countDuration, 1);
          const k = curve(t);
          nums.forEach((el, i) => (el.textContent = (targets[i] * k).toFixed(decimalsOf(targets[i]))));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(row);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      nums.forEach((el, i) => (el.textContent = finals[i]));
    };
  }, [values, countDuration, countEase]);

  const open = (i: number) => {
    clearTimeout(leaveTimer.current);
    setActive(i);
  };
  const close = () => {
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setActive(null), leaveDelay);
  };
  const toggle = (i: number) => setExpanded((e) => (e === i ? null : i));

  return (
    <div
      className={["w-full min-w-0 @container", className].filter(Boolean).join(" ")}
      style={
        {
          "--sc-n": items.length,
          "--sc-min-h": `${minHeight}px`,
          "--sc-open": `${openWidth}px`,
          "--sc-gap": `${gap}px`,
          "--sc-radius": `${radius}px`,
          "--sc-bg": background,
          "--sc-border": borderColor,
          "--sc-active": activeColor,
          "--sc-number": numberColor,
          "--sc-label": labelColor,
          "--sc-text": textColor,
          "--sc-duration": `${duration}ms`,
          "--sc-ease": ease,
          "--sc-rise": `${riseDuration}ms`,
          "--sc-sink": `${sinkDuration}ms`,
          "--sc-sink-delay": `${sinkDelay}ms`,
          "--sc-reveal": `${revealDuration}ms`,
          "--sc-reveal-delay": `${revealDelay}ms`,
          "--sc-reveal-exit": `${revealExitDuration}ms`,
          "--sc-shadow": `${shadowDuration}ms`,
          ...style,
        } as React.CSSProperties
      }
      data-stat-cards={id}
      {...props}
    >
      {/* Container queries can't read CSS variables, so the breakpoint is written here. */}
      <style>{`
${s}>[data-row]{display:flex;flex-direction:column;gap:var(--sc-gap)}
${s} [data-card]{position:relative;display:flex;flex-direction:column;overflow:hidden;padding:20px;border:1px solid var(--sc-border);border-radius:var(--sc-radius);background:var(--sc-bg);cursor:pointer;outline:none;transition:border-color var(--sc-duration) var(--sc-ease),box-shadow var(--sc-duration) var(--sc-ease)}
${s} [data-card][data-expanded]{z-index:2;border-color:var(--sc-active);box-shadow:0 10px 50px 0 var(--sc-active)}
${s} [data-card]:focus-visible{outline:2px solid var(--sc-number);outline-offset:2px}
${s} [data-desc]{display:grid;grid-template-rows:0fr;opacity:0;margin-top:0;transition:grid-template-rows var(--sc-duration) var(--sc-ease),opacity var(--sc-duration) var(--sc-ease),margin-top var(--sc-duration) var(--sc-ease)}
${s} [data-card][data-expanded] [data-desc]{grid-template-rows:1fr;opacity:1;margin-top:15px;transition-delay:50ms}
@container (min-width:${minWidth}px){
${s}>[data-row]{flex-direction:row;align-items:stretch}
${s} [data-card]{flex:0 1 calc((100% - (var(--sc-n) - 1) * var(--sc-gap)) / var(--sc-n));min-height:var(--sc-min-h);padding:clamp(24px,3.4cqi,40px);cursor:default;transition:flex var(--sc-duration) var(--sc-ease),border-color var(--sc-shadow) var(--sc-ease),box-shadow var(--sc-shadow) var(--sc-ease)}
${s} [data-card][data-expanded]:not([data-active]){z-index:auto;border-color:var(--sc-border);box-shadow:none}
${s} [data-card]::before{content:"";display:block;flex:1 1 0;min-height:0;transition:flex var(--sc-sink) var(--sc-ease) var(--sc-sink-delay)}
${s} [data-card][data-active]{z-index:2;flex:0 0 var(--sc-open);border-color:var(--sc-active);box-shadow:0 10px 50px 0 var(--sc-active)}
${s} [data-card][data-active]::before{flex:0 0 0;transition:flex var(--sc-rise) var(--sc-ease)}
${s}>[data-row][data-has-active] [data-card]:not([data-active]){flex:0 1 calc((100% - var(--sc-open) - (var(--sc-n) - 1) * var(--sc-gap)) / (var(--sc-n) - 1))}
${s} [data-label]{min-height:2lh;max-width:140px}
${s} [data-desc],${s} [data-card][data-expanded] [data-desc]{grid-template-rows:0fr;opacity:0;margin-top:0;transition:grid-template-rows var(--sc-reveal-exit) var(--sc-ease),opacity var(--sc-reveal-exit) var(--sc-ease)}
${s} [data-card][data-active] [data-desc]{grid-template-rows:1fr;opacity:1;margin-top:auto;padding-top:20px;transition:grid-template-rows var(--sc-reveal) var(--sc-ease) var(--sc-reveal-delay),opacity var(--sc-reveal) var(--sc-ease) var(--sc-reveal-delay)}
${s} [data-desc]>div{width:240px}
}
@media (prefers-reduced-motion:reduce){${s} [data-card],${s} [data-card]::before{transition:none!important}${s} [data-desc]{transition:opacity 200ms ease!important}}`}</style>

      <div
        ref={rowRef}
        data-row
        data-has-active={active !== null ? "" : undefined}
        // Leaving the whole row closes at once.
        onPointerLeave={() => {
          clearTimeout(leaveTimer.current);
          setActive(null);
        }}
      >
        {items.map((item, i) => {
          const final = item.value.toFixed(decimalsOf(item.value));
          return (
            <div
              key={i}
              data-card
              data-active={i === active ? "" : undefined}
              data-expanded={i === expanded ? "" : undefined}
              tabIndex={0}
              onPointerEnter={(e) => e.pointerType === "mouse" && open(i)}
              onPointerLeave={(e) => e.pointerType === "mouse" && close()}
              onFocus={() => open(i)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setActive((a) => (a === i ? null : a));
              }}
              onClick={() => toggle(i)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                toggle(i);
              }}
            >
              <p
                className={["m-0 mb-1 whitespace-nowrap tabular-nums text-(--sc-number)", numberClassName].filter(Boolean).join(" ")}
              >
                <span className="sr-only">
                  {item.prefix}
                  {final}
                  {item.suffix}
                </span>
                <span aria-hidden>
                  {item.prefix}
                  <span data-count={item.value}>{final}</span>
                  {item.suffix}
                </span>
              </p>
              <p data-label className="m-0 max-w-[160px] text-base leading-[1.4] text-(--sc-label)">
                {item.label}
              </p>
              <div data-desc>
                <div className="min-h-0 overflow-hidden text-sm leading-[1.4] text-(--sc-text)">{item.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CSS_KEYWORDS: Record<string, number[]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

/**
 * A CSS timing function (`cubic-bezier(x1, y1, x2, y2)` or a keyword) as an
 * easing function for the count. Solves the curve's x for t by bisection.
 * Anything it can't read returns undefined (linear).
 */
function cssEase(css: string): ((t: number) => number) | undefined {
  const m = css.trim().match(/^cubic-bezier\(([^)]*)\)$/);
  const p = m ? m[1].split(",").map(Number) : CSS_KEYWORDS[css.trim()];
  if (!p || p.length !== 4 || p.some((n) => !Number.isFinite(n))) return undefined;
  const [x1, y1, x2, y2] = p;
  const at = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  return (t) => {
    if (t <= 0 || t >= 1) return t <= 0 ? 0 : 1;
    let lo = 0;
    let hi = 1;
    let s = t;
    for (let i = 0; i < 24; i++) {
      s = (lo + hi) / 2;
      if (at(x1, x2, s) < t) lo = s;
      else hi = s;
    }
    return at(y1, y2, s);
  };
}
