"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type StackingCardsProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** One card per child. Each child is placed inside a sticky card. */
  children: React.ReactNode;
  /** Distance from the top of the viewport where cards stick, in px (header height + 80). */
  stickyTop?: number;
  /** Space between cards before they stack, in px. */
  gap?: number;
  /** Minimum card height, in px. */
  cardHeight?: number;
  /** Card corner radius, in px. */
  radius?: number;
  /** Card background. */
  background?: string;
  /** How far a covered card slides up, in px. */
  offsetY?: number;
  /** Scale a covered card shrinks to. */
  scale?: number;
  /** Blur a covered card reaches, in px. */
  blur?: number;
  /** Fade covered cards out. */
  fade?: boolean;
  /**
   * Viewport width (px) from which cards stack. Below it they render as a
   * plain list. The original stacks from 992px; set 0 to stack everywhere.
   */
  minWidth?: number;
};

/** Per-frame smoothing toward the scroll position, as in the original (0.2 at 60fps). */
const SMOOTHING = 0.2;

/**
 * Stacking cards on scroll: each card sticks under the header and, as the
 * next card slides over it, slides up, shrinks, blurs and fades away. Used on
 * the Seemplicity website.
 *
 * How it works:
 * - Every card is `position: sticky` at the same top, so later cards scroll
 *   up and cover earlier ones. That part is pure CSS.
 * - A covered card's progress runs 0 → 1 between the moment it sticks and the
 *   moment the next card sticks (one card height + gap of scroll). Progress is
 *   eased with smoothstep, t²(3 − 2t), then drives translateY, scale, blur and
 *   opacity. The last card never changes.
 * - The value eases toward the scroll position each frame (0.2 per 60fps
 *   frame, frame-rate independent), and a 0.2s linear CSS transition smooths
 *   it further, matching the original's feel.
 * - Styles are written straight to the DOM in a rAF loop that stops once
 *   every card has settled, so React never re-renders while scrolling. Only
 *   transform, opacity and filter change, so there is no layout work.
 *
 * Works inside any scroll container, not just the window. Reduced motion:
 * cards still stack, but nothing slides, scales, blurs or fades.
 */
export function StackingCards({
  children,
  stickyTop = 160,
  gap = 30,
  cardHeight = 420,
  radius = 20,
  background = "#0B0623",
  offsetY = 60,
  scale = 0.96,
  blur = 10,
  fade = true,
  minWidth = 992,
  className,
  style,
  ...props
}: StackingCardsProps) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const requestRef = React.useRef<() => void>(() => {});
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const cards = React.Children.toArray(children);

  // Latest motion settings, read inside the rAF loop without restarting it.
  const settings = React.useRef({ stickyTop, offsetY, scale, blur, fade });
  React.useEffect(() => {
    settings.current = { stickyTop, offsetY, scale, blur, fade };
  });

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const els = Array.from(list.querySelectorAll<HTMLElement>(":scope > [data-card]"));
    const current = els.map(() => 0);
    const media = window.matchMedia(`(min-width: ${minWidth}px)`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scroller = scrollParent(list);
    let frame = 0;
    let last = 0;

    const reset = () => {
      for (const el of els) {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.filter = "";
      }
      current.fill(0);
    };

    const tick = (now: number) => {
      frame = 0;
      if (!media.matches || reduced.matches) return reset();

      const { stickyTop, offsetY, scale, blur, fade } = settings.current;
      // Lerp factor for the time since the last frame, so 120Hz screens
      // settle at the same speed as 60Hz ones.
      const dt = last ? Math.min(now - last, 100) : 16.67;
      last = now;
      const k = 1 - Math.pow(1 - SMOOTHING, dt / 16.67);

      // Where the list's top sits inside the scroll viewport.
      const viewportTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const listTop = list.getBoundingClientRect().top - viewportTop;
      // Natural (unstuck) card offsets, from heights + gap, like the original.
      const rowGap = parseFloat(getComputedStyle(list).rowGap) || 0;
      let moving = false;
      let top = 0;

      els.forEach((el, i) => {
        const next = top + el.offsetHeight + rowGap;
        if (i === els.length - 1) return;
        const target = clamp((stickyTop - listTop - top) / Math.max(next - top, 1));
        top = next;

        current[i] += (target - current[i]) * k;
        if (Math.abs(current[i] - target) < 0.001) current[i] = target;
        else moving = true;

        const p = current[i];
        const e = p * p * (3 - 2 * p);
        const b = blur * e;
        el.style.transform = `translate3d(0, ${-offsetY * e}px, 0) scale(${1 - (1 - scale) * e})`;
        el.style.opacity = fade ? String(Math.round(100 * (1 - e)) / 100) : "";
        el.style.filter = b > 0.1 ? `blur(${b.toFixed(1)}px)` : "";
      });

      if (moving) frame = requestAnimationFrame(tick);
      else last = 0;
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    requestRef.current = request;
    const target = scroller ?? window;
    target.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    media.addEventListener("change", request);
    reduced.addEventListener("change", request);
    request();

    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      media.removeEventListener("change", request);
      reduced.removeEventListener("change", request);
      reset();
    };
  }, [minWidth, cards.length]);

  // Re-apply styles when props change without a scroll.
  React.useEffect(() => {
    requestRef.current();
  }, [stickyTop, offsetY, scale, blur, fade]);

  return (
    <div
      ref={listRef}
      className={cn("mx-auto flex w-full max-w-[1280px] flex-col gap-(--stack-gap)", className)}
      style={
        {
          "--stack-gap": `${gap}px`,
          "--stack-top": `${stickyTop}px`,
          "--stack-h": `${cardHeight}px`,
          "--stack-radius": `${radius}px`,
          "--stack-bg": background,
          ...style,
        } as React.CSSProperties
      }
      data-stacking-cards={id}
      {...props}
    >
      {/* Media queries can't read CSS variables, so the breakpoint is written here. */}
      <style>{`@media (min-width:${minWidth}px){[data-stacking-cards="${id}"]>[data-card]{position:sticky;top:var(--stack-top);transition:transform .2s linear,opacity .2s linear,filter .2s linear;will-change:transform,opacity,filter}}@media (prefers-reduced-motion:reduce){[data-stacking-cards="${id}"]>[data-card]{transition:none}}`}</style>
      {cards.map((card, i) => (
        <div
          key={i}
          data-card
          // Covered cards shrink toward their top edge, as in the original.
          className="relative min-h-(--stack-h) origin-top overflow-hidden rounded-(--stack-radius) bg-(--stack-bg)"
        >
          {card}
        </div>
      ))}
    </div>
  );
}

function clamp(v: number) {
  return Math.min(Math.max(v, 0), 1);
}

/** Nearest ancestor that scrolls vertically, or null for the window. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if (/(auto|scroll|overlay)/.test(overflowY)) return p;
  }
  return null;
}
