"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TextMarqueeProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  /** The words or phrases, in order, each followed by the separator. A string is split on commas. */
  items: React.ReactNode[] | string;
  /** Mark between items (after every item, so the loop joins seamlessly). `null` for none. */
  separator?: React.ReactNode;
  /** Cruising speed, in px per second. */
  speed?: number;
  /** Which way the text travels. */
  direction?: "left" | "right";
  /** Ease to a stop while a mouse is over it, and ease back up on leave. */
  slowOnHover?: boolean;
  /** Page scrolling speeds it up, and scrolling up runs it backwards. */
  scrollBoost?: boolean;
  /** Space between items (and separators), in px. */
  gap?: number;
  /** Width of the fade at each edge, as a % of the strip. 0 turns it off. */
  fade?: number;
};

/** Per-frame smoothing toward the target speed: 10% of the gap per 60fps frame. */
const SMOOTHING = 0.9;
/** px/ms of page scroll → px/s of extra marquee speed. */
const SCROLL_GAIN = 900;

/**
 * Text marquee: a line of big words that slides sideways forever, easing to a
 * stop under the mouse and back up when it leaves. Ported from Weonic's Weo
 * Motion library (pattern 070, Infinite Text Marquee).
 *
 * How it works:
 * - One group holds the items; it's cloned (aria-hidden) until the clones
 *   cover the strip's width plus one spare, re-counted on resize. The group
 *   ends with a trailing gap, so its width is exactly one loop.
 * - A requestAnimationFrame loop moves the track by `speed × dt` and wraps the
 *   offset into one group width, so the jump back is invisible. The current
 *   speed is smoothed toward a target each frame, which is what makes hover
 *   ease to a stop instead of freezing.
 * - With `scrollBoost`, page scroll velocity is added to the speed and its
 *   sign picks the direction, decaying back to cruising when scrolling stops.
 * - The loop only runs while the strip is on screen.
 *
 * Reduced motion: no loop; the clones are hidden and the strip becomes a
 * horizontal scroll area.
 */
export function TextMarquee({
  items,
  separator = "✦",
  speed = 70,
  direction = "left",
  slowOnHover = true,
  scrollBoost = false,
  gap = 40,
  fade = 8,
  className,
  style,
  ...props
}: TextMarqueeProps) {
  const list = typeof items === "string" ? items.split(",").map((s) => s.trim()).filter(Boolean) : items;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const groupRef = React.useRef<HTMLDivElement>(null);
  // One clone on the server; the real count comes from measuring.
  const [clones, setClones] = React.useState(1);

  React.useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const group = groupRef.current;
    if (!root || !track || !group) return;

    let loop = group.offsetWidth || 1;
    const measure = () => {
      loop = group.offsetWidth || 1;
      setClones(Math.max(1, Math.ceil(root.offsetWidth / loop)) + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    ro.observe(group);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => ro.disconnect();
    }

    const dir = direction === "right" ? 1 : -1;
    let offset = 0;
    let current = speed;
    let target = speed;

    // Scroll velocity in px/ms: blended toward each new reading, decaying when idle.
    let velocity = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      velocity += ((window.scrollY - lastY) / dt - velocity) * 0.5;
      lastY = window.scrollY;
      lastT = now;
    };

    let raf = 0;
    let prev = 0;
    const tick = (now: number) => {
      const dt = prev ? Math.min(now - prev, 100) : 16.67;
      prev = now;
      current += (target - current) * (1 - Math.pow(SMOOTHING, dt / 16.67));
      let v = current;
      let d = dir;
      if (scrollBoost) {
        velocity *= Math.pow(0.92, dt / 16.67);
        if (Math.abs(velocity) < 0.001) velocity = 0;
        v += Math.abs(velocity) * SCROLL_GAIN;
        if (velocity) d = velocity > 0 ? dir : -dir;
      }
      offset += (d * v * dt) / 1000;
      // Wrap into (-loop, 0]: one group width is one seamless loop.
      offset = ((offset % loop) - loop) % loop;
      track.style.transform = `translate3d(${offset}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf) return;
      prev = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // Only animate while on screen.
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(root);

    const enter = (e: PointerEvent) => {
      // Touch has no hover: a tap shouldn't stop the strip.
      if (e.pointerType !== "touch") target = 0;
    };
    const leave = () => (target = speed);
    if (slowOnHover) {
      root.addEventListener("pointerenter", enter);
      root.addEventListener("pointerleave", leave);
    }
    if (scrollBoost) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", onScroll);
      track.style.transform = "";
    };
  }, [speed, direction, slowOnHover, scrollBoost, list.length]);

  const mask = fade > 0 ? `linear-gradient(90deg,transparent,#000 ${fade}%,#000 ${100 - fade}%,transparent)` : undefined;

  const content = list.map((item, i) => (
    <React.Fragment key={i}>
      <span>{item}</span>
      {separator != null && <span aria-hidden>{separator}</span>}
    </React.Fragment>
  ));

  return (
    <div
      ref={rootRef}
      className={cn("min-w-0 overflow-hidden whitespace-nowrap motion-reduce:overflow-x-auto", className)}
      style={{ maskImage: mask, WebkitMaskImage: mask, "--tm-gap": `${gap}px`, ...style } as React.CSSProperties}
      {...props}
    >
      <div ref={trackRef} className="flex w-max will-change-transform motion-reduce:will-change-auto">
        <div ref={groupRef} className="flex shrink-0 items-center gap-(--tm-gap) pr-(--tm-gap)">
          {content}
        </div>
        {Array.from({ length: clones }, (_, n) => (
          <div key={n} aria-hidden className="flex shrink-0 items-center gap-(--tm-gap) pr-(--tm-gap) motion-reduce:hidden">
            {content}
          </div>
        ))}
      </div>
    </div>
  );
}
