"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ScrollTextRevealProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** The text to reveal. Plain text only, since it's split into spans. Use "\n" for a hard line break. */
  text: string;
  /** Element to render, e.g. "h2" or "p". */
  as?: React.ElementType;
  /** Reveal one character at a time (the original), or one word at a time. */
  split?: "char" | "word";
  /** Opacity of text that hasn't been revealed yet. */
  dimOpacity?: number;
  /**
   * Where the reveal starts and ends, as % of the timeline's `cover` range:
   * 0 = the top of the measured element meets the bottom of the viewport,
   * 100 = its bottom leaves the top.
   */
  start?: number;
  end?: number;
  /**
   * What the scroll progress is measured on: the closest `<section>` around
   * the text (the original), or the text element itself.
   */
  timeline?: "section" | "self";
  /** Fade the block up once as it enters the viewport. */
  rise?: boolean;
  /** Distance the block rises, in px. */
  riseDistance?: number;
  /** Duration of the rise, in ms. */
  riseDuration?: number;
};

/** How much of the text must be showing before the rise plays (as in the original). */
const RISE_THRESHOLD = 0.2;

/**
 * Scroll text reveal: a block of text sits dimmed and fills in, character by
 * character, as its section scrolls through the viewport. Ported from the
 * NetApp AI site's Gartner stats headline (`RevealHeadline`).
 *
 * How it works:
 * - The text is split into spans (screen readers get the full text once,
 *   from a visually hidden copy). Every span runs `opacity: dim → 1` on a
 *   CSS view timeline, each over its own slice of
 *   `animation-range: cover start% … end%`, numbered across lines, so the
 *   fill sweeps through the text in reading order.
 * - The timeline is the closest `<section>` (the component names it), so
 *   20% → 45% means "while the section scrolls from just inside the
 *   viewport to just short of centred", whatever the text's own height.
 * - Browsers without scroll-driven animations, and WebKit (Safari freezes
 *   some of ~100 concurrent scroll-driven animations at their first frame),
 *   get the same sweep from a passive scroll listener that writes each
 *   span's opacity once per frame, as the original does.
 * - The block also fades up 48px over 1.4s the first time 20% of it is in
 *   view. It's only hidden after hydration, and only if it starts fully off
 *   screen, so the server HTML always shows the text and nothing flashes.
 *
 * Reduced motion: text is fully shown, with no fill and no rise.
 */
export function ScrollTextReveal({
  text,
  as: Tag = "h2",
  split = "char",
  dimOpacity = 0.2,
  start = 20,
  end = 45,
  timeline = "section",
  rise = true,
  riseDistance = 48,
  riseDuration = 1400,
  className,
  style,
  ...props
}: ScrollTextRevealProps) {
  const ref = React.useRef<HTMLElement>(null);
  const linesRef = React.useRef<HTMLSpanElement>(null);
  // "idle" until mounted, so server HTML (and a page whose JS hasn't loaded)
  // shows the text. Fully off screen it goes "pending" (hidden) and then
  // "shown" (rises in) when 20% of it is in view.
  const [phase, setPhase] = React.useState<"idle" | "pending" | "shown">("idle");
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const timelineName = `--str-${id}`;

  // Split into lines, then units. Slots run across lines in reading order;
  // line breaks themselves take no slot.
  const lines = text.split("\n").map((line) =>
    split === "word" ? line.split(/(\s+)/).filter(Boolean) : Array.from(line),
  );
  const count = lines.reduce((n, units) => n + units.length, 0);
  const step = (end - start) / Math.max(count, 1);

  // The rise: arm only a block that is entirely off screen, then play it once.
  React.useEffect(() => {
    const el = linesRef.current;
    if (!rise || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) return;
    setPhase("pending");
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setPhase("shown");
        io.disconnect();
      },
      { threshold: RISE_THRESHOLD },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rise]);

  // The fill: name the timeline on the section, and run the scroll fallback
  // where the CSS path is missing or unreliable.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = (timeline === "section" && el.closest("section")) || el;
    const previousName = target.style.getPropertyValue("view-timeline-name");
    target.style.setProperty("view-timeline-name", timelineName);

    // WebKit is recognised by what its UA lacks: Blink adds "Chrome"/"Chromium"
    // and Android WebView adds "Android"; every iOS browser is WebKit.
    const ua = navigator.userAgent;
    const isWebKit =
      ua.includes("AppleWebKit") && !ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Android");
    if (!isWebKit && CSS.supports("animation-timeline: view()")) {
      return () => target.style.setProperty("view-timeline-name", previousName);
    }

    const units = Array.from(el.querySelectorAll<HTMLElement>("[data-unit]"));
    // A running CSS animation would beat the inline opacity, so detach it.
    for (const u of units) u.style.animation = "none";
    // A view timeline measures against the nearest scroll container, so the
    // fallback does too (the window, unless the text sits in a scrolling box).
    const scroller = scrollParent(target);
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = target.getBoundingClientRect();
      const port = scroller ? scroller.getBoundingClientRect() : { top: 0, height: window.innerHeight };
      const vh = port.height;
      // The same progress a `cover` range measures.
      const progress = ((vh - (r.top - port.top)) / (vh + r.height)) * 100;
      for (const u of units) {
        const slot = Number(u.dataset.unit);
        const from = start + step * slot;
        const t = Math.min(1, Math.max(0, (progress - from) / step));
        u.style.opacity = String(dimOpacity + (1 - dimOpacity) * t);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      target.style.setProperty("view-timeline-name", previousName);
      for (const u of units) {
        u.style.opacity = "";
        u.style.animation = "";
      }
    };
  }, [timeline, timelineName, start, step, dimOpacity]);

  const s = `[data-scroll-text-reveal="${id}"]`;
  let slot = 0;

  return (
    <Tag
      ref={ref}
      className={cn("whitespace-pre-wrap", className)}
      style={
        {
          "--str-dim": dimOpacity,
          "--str-rise": `${riseDistance}px`,
          "--str-rise-duration": `${riseDuration}ms`,
          ...style,
        } as React.CSSProperties
      }
      data-scroll-text-reveal={id}
      data-rise={rise && phase !== "idle" ? phase : undefined}
      {...props}
    >
      <style>{`
@keyframes str-fill{from{opacity:var(--str-dim)}to{opacity:1}}
@keyframes str-rise{from{opacity:0;translate:0 var(--str-rise)}to{opacity:1;translate:0 0}}
@media (prefers-reduced-motion:no-preference){
@supports (animation-timeline:view()){
${s} [data-unit]{opacity:var(--str-dim);animation:str-fill 1ms linear both;animation-timeline:${timelineName};animation-range:cover var(--f) cover var(--t)}
}
${s}[data-rise=pending]>[data-lines]{opacity:0;translate:0 var(--str-rise)}
${s}[data-rise=shown]>[data-lines]{animation:str-rise var(--str-rise-duration) cubic-bezier(.25,.46,.45,.94) both}
}`}</style>
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      <span ref={linesRef} aria-hidden data-lines className="block">
        {lines.map((units, li) => (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {units.map((unit) => {
              const i = slot++;
              return (
                <span
                  key={i}
                  data-unit={i}
                  style={
                    {
                      "--f": `${(start + step * i).toFixed(3)}%`,
                      "--t": `${(start + step * (i + 1)).toFixed(3)}%`,
                    } as React.CSSProperties
                  }
                >
                  {unit}
                </span>
              );
            })}
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}

/** Nearest ancestor that scrolls vertically, or null for the window. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(p).overflowY)) return p;
  }
  return null;
}
