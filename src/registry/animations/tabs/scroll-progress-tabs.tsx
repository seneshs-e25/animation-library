"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ScrollProgressTab = {
  /** Tab label, e.g. `Workshop planning`. */
  label: string;
  /** Fills the canvas screen while this tab is active: a screenshot, video or live board. */
  content: React.ReactNode;
};

type ScrollProgressTabsProps = Omit<React.ComponentProps<"section">, "children"> & {
  items: ScrollProgressTab[];
  /** Distance from the top of the viewport where the stage pins, in px (the header height). */
  stickyTop?: number;
  /** Scroll per tab, as a fraction of the viewport height. The original: 0.5 (50svh). */
  stepLength?: number;
  /** Zoom the canvas out before the tabs appear. */
  intro?: boolean;
  /** Scroll the zoom-out takes, as a fraction of the viewport height. The original: 1.1 (110svh). */
  introLength?: number;
  /** Canvas scale when the zoom-out starts; it ends at 1. The original: 1.28 (1 → 0.78 there). */
  introScale?: number;
  /** Tab bar fade when it appears or hides, in ms. */
  fadeDuration?: number;
  /** Tab bar drop into place when it appears, in ms. */
  riseDuration?: number;
  /** How far above its resting place the tab bar starts, in px. */
  rise?: number;
  /** Easing for the tab bar entrance and the panel swap. The original: cubic-bezier(0.16, 1, 0.3, 1). */
  ease?: string;
  /** Crossfade between panels when the active tab changes, in ms. */
  panelDuration?: number;
  /** Tab shadow lift on hover, in ms. */
  hoverDuration?: number;
  /** Widest the canvas gets, in px (it also shrinks to fit the stage height). */
  canvasWidth?: number;
  /** Width / height of the canvas screen. The original: 850 / 560. */
  ratio?: number;
  /** Screen background behind the content. */
  screenColor?: string;
  /** Dot grid on the screen, like a whiteboard. */
  dots?: boolean;
  /** Tab background. */
  tabColor?: string;
  /** Colour that fills a tab as you scroll through it. */
  fillColor?: string;
  /** Tab label colour. */
  labelColor?: string;
  /** Classes for the tab labels (font family, size, weight). */
  tabClassName?: string;
};

/**
 * Scroll progress tabs: a canvas pins in place, zooms out, and a row of tabs
 * drops in over its top edge. From there, scrolling steps through the tabs:
 * the active tab fills from left to right with the scroll, and when it's
 * full the next tab takes over and the canvas swaps to its content. Rebuilt
 * from the Miro Intelligent Canvas hero.
 *
 * How it works:
 * - The section is as tall as the stage (viewport − `stickyTop`) plus the
 *   intro (`introLength` × viewport) plus one step (`stepLength` × viewport)
 *   per tab. The stage inside is `position: sticky`, so it holds while that
 *   extra height scrolls by. The last tab fills just as the stage unpins.
 * - Intro: the canvas scales linearly from `introScale` to 1 (origin centre
 *   top) across the intro's scroll. When it lands, the tab bar fades in
 *   (`fadeDuration`, 280ms) and drops `rise` px into place (`riseDuration`,
 *   360ms) on `ease`; scrolling back into the intro hides it again.
 * - Steps: position past the intro / step length gives the active tab
 *   (whole part) and its fill (fraction). The fill is a layer clipped with
 *   `clip-path: inset(0 (1 − fill) × 100% 0 0)`; passed tabs stay full,
 *   upcoming ones empty. The fill is scroll-linked, 1:1, no easing.
 * - Panels are stacked in one cell and crossfade (`panelDuration`) when
 *   the active tab changes.
 * - A passive scroll listener writes the scale and the fill straight to the
 *   DOM once per frame; React only re-renders when the active tab changes
 *   or the tab bar shows or hides.
 * - Clicking a tab (or arrow keys, Home, End) scrolls the page to the start
 *   of that tab's step, so scroll and tabs never disagree.
 * - When the tabs don't fit the canvas width, the row scrolls sideways
 *   (scrollbar hidden) and keeps the active tab centred.
 *
 * Works inside any scroll container, not just the window. Reduced motion:
 * nothing pins or zooms; the tabs are ordinary click tabs, the active one
 * fully filled, and panels swap instantly.
 */
export function ScrollProgressTabs({
  items,
  stickyTop = 0,
  stepLength = 0.5,
  intro = true,
  introLength = 1.1,
  introScale = 1.28,
  fadeDuration = 280,
  riseDuration = 360,
  rise = 28,
  ease = "cubic-bezier(0.16, 1, 0.3, 1)",
  panelDuration = 400,
  hoverDuration = 160,
  canvasWidth = 1030,
  ratio = 850 / 560,
  screenColor = "#F4F4F1",
  dots = true,
  tabColor = "#FFFFFF",
  fillColor = "#F4F4F1",
  labelColor = "#191812",
  tabClassName = "text-base font-medium",
  className,
  style,
  ...props
}: ScrollProgressTabsProps) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const geometry = React.useRef({ introPx: 0, stepPx: 0 });
  const requestRef = React.useRef<() => void>(() => {});
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const count = items.length;
  const reduced = useReducedMotion();

  const [active, setActive] = React.useState(0);
  const [shown, setShown] = React.useState(!intro);

  // Latest settings, read inside the frame loop without restarting it.
  const settings = React.useRef({ stickyTop, stepLength, intro, introLength, introScale });
  React.useEffect(() => {
    settings.current = { stickyTop, stepLength, intro, introLength, introScale };
  });

  React.useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const tabs = tabsRef.current;
    if (!section || !canvas || !tabs) return;

    if (reduced) {
      section.style.height = "";
      canvas.style.transform = "";
      tabs.style.setProperty("--spt-fill", "1");
      return;
    }

    const scroller = scrollParent(section);
    let frame = 0;
    let current = -1;
    let isShown: boolean | null = null;

    const measure = () => {
      const { stickyTop, stepLength, intro, introLength } = settings.current;
      const viewport = scroller ? scroller.clientHeight : window.innerHeight;
      const stage = Math.max(viewport - stickyTop, 0);
      const introPx = intro ? introLength * viewport : 0;
      const stepPx = Math.max(stepLength * viewport, 1);
      geometry.current = { introPx, stepPx };
      section.style.setProperty("--spt-stage", `${stage}px`);
      section.style.height = `${Math.round(stage + introPx + count * stepPx)}px`;
    };

    const tick = () => {
      frame = 0;
      const { stickyTop, intro, introScale } = settings.current;
      const { introPx, stepPx } = geometry.current;
      const viewportTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const scrolled = stickyTop - (section.getBoundingClientRect().top - viewportTop);

      const zoom = intro ? clamp(scrolled / Math.max(introPx, 1)) : 1;
      const scale = introScale + (1 - introScale) * zoom;
      canvas.style.transform = scale === 1 ? "" : `scale(${scale.toFixed(4)})`;

      const step = (scrolled - introPx) / stepPx;
      const index = Math.min(Math.max(Math.floor(step), 0), count - 1);
      const fill = clamp(step - index);
      tabs.style.setProperty("--spt-fill", fill.toFixed(4));

      if (index !== current) {
        current = index;
        setActive(index);
      }
      const show = !intro || zoom >= 1;
      if (show !== isShown) {
        isShown = show;
        setShown(show);
      }
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const remeasure = () => {
      measure();
      request();
    };

    requestRef.current = remeasure;
    const target = scroller ?? window;
    const observer = new ResizeObserver(remeasure);
    observer.observe(section);
    if (scroller) observer.observe(scroller);
    target.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", remeasure);
    remeasure();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      target.removeEventListener("scroll", request);
      window.removeEventListener("resize", remeasure);
      requestRef.current = () => {};
      section.style.height = "";
      canvas.style.transform = "";
    };
  }, [reduced, count]);

  // Re-measure when props change the scroll length.
  React.useEffect(() => {
    requestRef.current();
  }, [stickyTop, stepLength, intro, introLength, introScale]);

  // When the tab row is wider than the canvas it scrolls sideways; keep the
  // active tab in view without scrolling the page.
  React.useEffect(() => {
    const list = tabsRef.current;
    const tab = tabRefs.current[active];
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({
      left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [active, reduced]);

  /** Scroll to the start of tab i's step (or just select it under reduced motion). */
  const select = (i: number) => {
    const next = Math.min(Math.max(i, 0), count - 1);
    const section = sectionRef.current;
    if (reduced || !section) {
      setActive(next);
      return;
    }
    const scroller = scrollParent(section);
    const viewportTop = scroller ? scroller.getBoundingClientRect().top : 0;
    const top = section.getBoundingClientRect().top - viewportTop;
    const { introPx, stepPx } = geometry.current;
    // +1px lands inside the step, so the tab is active with an empty fill.
    const delta = top - stickyTop + introPx + next * stepPx + 1;
    (scroller ?? window).scrollBy({ top: delta, behavior: "smooth" });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: count - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = Math.min(Math.max(keys[e.key], 0), count - 1);
    select(next);
    tabRefs.current[next]?.focus();
  };

  // Under reduced motion there is no intro, so the tabs are always there.
  const tabsShown = reduced || shown;
  const s = `[data-scroll-progress-tabs="${id}"]`;

  return (
    <section
      ref={sectionRef}
      data-scroll-progress-tabs={id}
      className={cn("relative w-full", className)}
      style={
        {
          "--spt-top": `${stickyTop}px`,
          "--spt-fade": `${fadeDuration}ms`,
          "--spt-rise-d": `${riseDuration}ms`,
          "--spt-rise": `${rise}px`,
          "--spt-ease": ease,
          "--spt-panel": `${panelDuration}ms`,
          "--spt-hover": `${hoverDuration}ms`,
          "--spt-w": `${canvasWidth}px`,
          "--spt-ratio": ratio,
          "--spt-screen": screenColor,
          "--spt-tab": tabColor,
          "--spt-fill-color": fillColor,
          "--spt-label": labelColor,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <style>{`
${s} [data-stage]{position:sticky;top:var(--spt-top);height:var(--spt-stage,100vh);overflow:hidden}
${s} [data-tabs]{opacity:0;transform:translate(-50%,calc(-50% - var(--spt-rise)));transition:opacity var(--spt-fade) var(--spt-ease),transform var(--spt-rise-d) var(--spt-ease)}
${s} [data-tabs][data-shown]{opacity:1;transform:translate(-50%,-50%)}
${s} [data-tab]{box-shadow:0 4px 24px rgba(110,79,3,.08),0 1px 2px rgba(110,79,3,.04);transition:box-shadow var(--spt-hover) var(--spt-ease)}
@media (hover:hover){${s} [data-tab]:hover{box-shadow:0 16px 48px rgba(110,79,3,.12),0 4px 12px rgba(110,79,3,.06)}}
${s} [data-fill]{clip-path:inset(0 100% 0 0)}
${s} [data-tab][data-state=active] [data-fill]{clip-path:inset(0 calc((1 - var(--spt-fill,0)) * 100%) 0 0)}
${s} [data-tab][data-state=passed] [data-fill]{clip-path:none}
${s} [data-panel]{opacity:0;transition:opacity var(--spt-panel) var(--spt-ease)}
${s} [data-panel][data-active]{opacity:1}
@media (prefers-reduced-motion:reduce){
${s} [data-stage]{position:relative;top:auto;height:auto;overflow:visible;padding-block:48px}
${s} *{transition:none!important}
}`}</style>

      {/* Top padding leaves room for the tab bar, which sits half above the canvas. */}
      <div data-stage className="flex items-center justify-center px-4 pt-20 pb-10">
        <div
          ref={canvasRef}
          className="relative origin-top will-change-transform"
          style={{
            // As wide as allowed, but short enough for the whole canvas (screen + 22px frame)
            // to fit the stage inside its 80px top and 40px bottom padding.
            width: "min(var(--spt-w), 100%, calc((var(--spt-stage, 100vh) - 142px) * var(--spt-ratio) + 22px))",
          }}
        >
          {/* Tab bar, centred on the canvas's top edge. */}
          <div
            ref={tabsRef}
            role="tablist"
            aria-orientation="horizontal"
            data-tabs
            data-shown={tabsShown ? "" : undefined}
            inert={!tabsShown}
            onKeyDown={onKeyDown}
            className="absolute top-0 left-1/2 z-10 -my-6 flex w-max max-w-[calc(100%-24px)] gap-2.5 overflow-x-auto px-1 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item, i) => {
              const selected = i === active;
              return (
                <button
                  key={i}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${i}`}
                  aria-selected={selected}
                  aria-controls={`${id}-panel-${i}`}
                  tabIndex={selected ? 0 : -1}
                  data-tab
                  data-state={i < active ? "passed" : selected ? "active" : "upcoming"}
                  onClick={() => select(i)}
                  className="relative isolate inline-flex cursor-pointer items-center overflow-hidden rounded-xl border-[3px] border-(--spt-tab) bg-(--spt-tab) px-[17px] py-[13px] text-(--spt-label) outline-none focus-visible:ring-2 focus-visible:ring-[#4262FF] focus-visible:ring-offset-2 max-sm:px-3 max-sm:py-2"
                >
                  <span aria-hidden data-fill className="absolute inset-0 -z-10 rounded-[9px] bg-(--spt-fill-color)" />
                  <span className={cn("leading-5 whitespace-nowrap max-sm:text-sm", tabClassName)}>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Glass frame around the screen. */}
          <div
            className="rounded-3xl border border-white/55 bg-[linear-gradient(160deg,rgba(255,255,255,0.5),rgba(255,255,255,0.22))] p-2.5 backdrop-blur-[8px] backdrop-saturate-[1.2]"
            style={{
              boxShadow:
                "inset 0 1px rgba(255,255,255,.85),inset 0 -1px rgba(255,255,255,.25),0 1px rgba(110,79,3,.04),0 16px 48px rgba(110,79,3,.12),0 4px 12px rgba(110,79,3,.06)",
            }}
          >
            <div
              className="grid aspect-(--spt-ratio) overflow-hidden rounded-2xl border border-black/[0.06] bg-(--spt-screen) shadow-[inset_0_1px_2px_rgba(110,79,3,0.05)]"
              style={
                dots
                  ? { backgroundImage: "radial-gradient(rgba(25,24,18,.14) 1px, transparent 0)", backgroundSize: "18px 18px" }
                  : undefined
              }
            >
              {items.map((item, i) => (
                <div
                  key={i}
                  role="tabpanel"
                  id={`${id}-panel-${i}`}
                  aria-labelledby={`${id}-tab-${i}`}
                  data-panel
                  data-active={i === active ? "" : undefined}
                  inert={i !== active}
                  className="col-start-1 row-start-1 min-h-0 min-w-0 *:size-full"
                >
                  {item.content}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
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

function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}
