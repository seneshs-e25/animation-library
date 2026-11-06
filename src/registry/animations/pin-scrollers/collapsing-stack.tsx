"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

export type CollapsingStackItem = {
  /** Row heading. Stays whole (one line or three) on a covered row. */
  title: React.ReactNode;
  /** Copy under the heading. Folds away when the next row covers this one. */
  description?: React.ReactNode;
  /** Optional link or button under the copy; folds away with it. */
  action?: React.ReactNode;
  /** Visual (image or video). Fills the art window, top-aligned. */
  media?: React.ReactNode;
};

type CollapsingStackProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: CollapsingStackItem[];
  /** Distance from the top of the scroll area where the pile pins, in px (the site header). */
  stickyTop?: number;
  /** Height of art a covered row keeps showing from 992px wide, in px (79 / 170 below). */
  peek?: number;
  /** Space above and below each row from 992px wide, in px (10 below). */
  padding?: number;
  /** Scroll distance per pixel of card travel. 1.5 = rows move at 2/3 of the scroll speed. */
  speed?: number;
  /** GSAP ScrollTrigger `scrub`: seconds the deal takes to catch up with the scroll. */
  scrub?: number;
  /** Art corner radius from 992px wide, in px (10 below). */
  radius?: number;
  /** Row background. Rows are opaque so each one covers the one below. */
  background?: string;
  /** Colour of the hairline above each row. */
  borderColor?: string;
};

/** Layout effect on the client, plain effect on the server, no warning. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * Collapsing stack: rows (heading + copy, and art) are dealt into a pile as
 * you scroll. Each row travels up, lands at its slot under the header and
 * stays while the next row rises over it, folding its copy away and closing
 * its art to a strip, so the section ends as a pile of headings with the
 * last row open. Ported from the NetApp AI site's `CardStack` (a GSAP
 * ScrollTrigger scrub) and its `vertical-cards` section.
 *
 * How it works:
 * - The list is one `position: sticky` box, the assembled pile's height,
 *   inside a wrapper as tall as the rows laid end to end, plus the extra
 *   scroll `speed` asks for, so switching the stack on never changes the
 *   page's length.
 * - Every row's open height, art height and heading height are MEASURED on
 *   each ScrollTrigger refresh (one deliberate reflow, never per frame).
 *   Each row sits absolute at its slot (the bands above it, summed) and is
 *   dealt by a `y` transform: its remaining travel from where plain flow
 *   would put it, walked to zero by the trigger's progress.
 * - A covered row's copy folds (`grid-template-rows` + opacity) from the
 *   moment the next row overlaps a quarter of it to the moment that row
 *   lands; its art closes with a `clip-path` inset off its bottom edge,
 *   radius riding inside the clip, one pixel per pixel the next row
 *   advances. The image itself never moves or resizes.
 * - Values are rounded to whole pixels and only written when they change.
 *
 * Reduced motion, or a viewport too short to watch the deal
 * (`stickyTop + 2 bands`): every row open, in plain flow. Works inside any
 * scroll container (ScrollTrigger is pointed at the nearest one).
 */
export function CollapsingStack({
  items,
  stickyTop = 100,
  peek = 200,
  padding = 30,
  speed = 1.5,
  scrub = 1,
  radius = 20,
  background = "#FFFFFF",
  borderColor = "#F4F1ED",
  className,
  style,
  ...props
}: CollapsingStackProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const count = items.length;
  const last = count - 1;

  // Runs before paint, so the first thing on screen is already the deck.
  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const list = listRef.current;
    if (!wrap || !list) return;
    const cards = Array.from(list.querySelectorAll<HTMLElement>("[data-vc-row]"));
    // One card is a pile of one: nothing to travel, nothing to cover it.
    if (cards.length < 2) return;

    gsap.registerPlugin(ScrollTrigger);
    // A phone hiding its address bar resizes the viewport mid-scroll; don't re-measure for it.
    ScrollTrigger.config({ ignoreMobileResize: true });

    const lastIndex = cards.length - 1;
    const heads = cards.map((c) => c.querySelector<HTMLElement>("[data-vc-heading]"));
    const descs = cards.map((c) => c.querySelector<HTMLElement>("[data-vc-desc]"));
    const arts = cards.map((c) => c.querySelector<HTMLElement>("[data-vc-art]"));
    const scroller = scrollParent(wrap);

    /** Every card open: what both fallbacks show, and what `measure` reads. */
    const openAll = () => {
      cards.forEach((c) => {
        c.setAttribute("data-vc-open", "");
        c.setAttribute("data-vc-copy", "");
      });
      descs.forEach((d) => d?.removeAttribute("inert"));
    };

    /** The server's composition: the end of the deal, last card open. */
    const restoreSettled = () => {
      cards.forEach((c, i) => {
        if (i === lastIndex) {
          c.setAttribute("data-vc-open", "");
          c.setAttribute("data-vc-copy", "");
        } else {
          c.removeAttribute("data-vc-open");
          c.removeAttribute("data-vc-copy");
        }
      });
      descs.forEach((d, i) => {
        if (!d) return;
        if (i === lastIndex) d.removeAttribute("inert");
        else d.setAttribute("inert", "");
      });
    };

    /** Every inline value this component writes, taken back off. */
    const clearAll = () => {
      wrap.style.removeProperty("--vc-flow-h");
      wrap.style.removeProperty("--vc-pile-h");
      cards.forEach((c) => {
        c.style.removeProperty("--vc-card-h-live");
        c.style.removeProperty("--vc-slot");
        gsap.set(c, { clearProps: "transform" });
      });
      descs.forEach((d) => d && gsap.set(d, { clearProps: "gridTemplateRows,opacity" }));
      arts.forEach((a) => a && gsap.set(a, { clearProps: "clipPath" }));
    };

    const mm = gsap.matchMedia();

    // Reduced motion: every card open (not the settled pile, which would leave
    // the earlier cards' copy folded away with no way to reach it).
    mm.add("(prefers-reduced-motion: reduce)", () => {
      openAll();
      return () => restoreSettled();
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Measured on refresh; never read from a scrub frame.
      let pitch = 0;
      let pin = 0;
      let artClosed = Number.NaN;
      let artRadius = 0;
      let copyClosed = 0;
      let descBelow = false;
      let maxDealt = 0;
      let runway = 0;
      let fits = true;
      let bands: number[] = [];
      let slots: number[] = [];
      let flowTop: number[] = [];
      let foldSpans: number[] = [];
      let artOpens: number[] = [];
      let descHeights: number[] = [];

      // What each write last wrote, so a frame that lands on the same numbers writes nothing.
      let lastDealt = Number.NaN;
      let lastOpen = -1;
      const lastTravel = cards.map(() => Number.NaN);
      const lastDescFold = cards.map(() => Number.NaN);
      const lastArtCut = cards.map(() => Number.NaN);
      const invalidate = () => {
        lastDealt = Number.NaN;
        lastOpen = -1;
        lastTravel.fill(Number.NaN);
        lastDescFold.fill(Number.NaN);
        lastArtCut.fill(Number.NaN);
      };

      const measure = () => {
        const wrapStyles = getComputedStyle(wrap);
        const cardStyles = getComputedStyle(cards[0]);
        pitch = parseFloat(wrapStyles.getPropertyValue("--vc-pitch"));
        const pace = parseFloat(wrapStyles.getPropertyValue("--vc-speed")) || 1;
        artClosed = parseFloat(cardStyles.getPropertyValue("--vc-art-closed"));
        copyClosed = parseFloat(cardStyles.getPropertyValue("--vc-copy-closed")) || 0;
        // 1 while the copy stands above the art (the column layout), 0 beside it.
        descBelow = parseFloat(cardStyles.getPropertyValue("--vc-desc-below")) === 1;

        // THE ONE DELIBERATE REFLOW: every card back in flow and open, so each
        // row's own natural open geometry is read. Nothing paints in between.
        const wasOpen = cards.map((c) => [c.hasAttribute("data-vc-open"), c.hasAttribute("data-vc-copy")]);
        wrap.removeAttribute("data-vc-stack");
        clearAll();
        openAll();

        // A stacked card carries the row gap as its own padding-bottom.
        const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
        const heights = cards.map((c) => c.getBoundingClientRect().height + gap);
        artOpens = arts.map((a) => a?.getBoundingClientRect().height ?? 0);
        // How much taller each heading is than the one-line allowance the pitch is drawn around.
        const headExcess = heads.map((h) => (h ? Math.max(0, h.scrollHeight - copyClosed) : 0));
        descHeights = descs.map((d) => d?.firstElementChild?.scrollHeight ?? 0);

        cards.forEach((c, i) => {
          if (!wasOpen[i][0]) c.removeAttribute("data-vc-open");
          if (!wasOpen[i][1]) c.removeAttribute("data-vc-copy");
        });
        // Back to the pile before the pin and radius are read (they only resolve while it's on).
        wrap.dataset.vcStack = "on";

        const artEl = arts.find(Boolean) ?? null;
        artRadius = artEl ? parseFloat(getComputedStyle(artEl).borderTopLeftRadius) || 0 : 0;

        // Each card's band: the pitch, plus any extra heading lines where the
        // title sits over the art (beside it, it costs nothing until it's
        // taller than the art's closed band).
        const bandSlack = descBelow ? 0 : Math.max(0, artClosed - copyClosed);
        bands = cards.map((_, i) => pitch + Math.max(0, (headExcess[i] ?? 0) - bandSlack));

        // Where each card comes to rest: the bands above it, summed.
        slots = [];
        let stacked = 0;
        for (let i = 0; i <= lastIndex; i += 1) {
          slots[i] = stacked;
          stacked += bands[i];
        }
        cards.forEach((c, i) => c.style.setProperty("--vc-slot", `${slots[i]}px`));

        // Where flow would put each card, so how far it travels to its slot.
        flowTop = [];
        heights.reduce((sum, h, i) => {
          flowTop[i] = sum;
          return sum + h;
        }, 0);
        maxDealt = Math.max(0, flowTop[lastIndex] - slots[lastIndex]);
        // The fold starts when the next card has overlapped a quarter of this one.
        foldSpans = heights.map((h, i) => Math.max(1, 0.75 * h - bands[i]));

        // A card is the lid on every card above it, so it reserves at least as
        // far down as the tallest of them reaches.
        const reserved = heights.map((h, i) => {
          let need = h;
          for (let above = 0; above < i; above += 1) {
            need = Math.max(need, heights[above] - (slots[i] - slots[above]));
          }
          return need;
        });
        cards.forEach((c, i) => c.style.setProperty("--vc-card-h-live", `${reserved[i]}px`));

        const flowH = Math.max(0, flowTop[lastIndex] + heights[lastIndex] - gap);
        const pileH = slots[lastIndex] + reserved[lastIndex];
        wrap.style.setProperty("--vc-flow-h", `${flowH}px`);
        wrap.style.setProperty("--vc-pile-h", `${pileH}px`);

        // `speed` px of scroll per px of travel; the wrapper grows by the difference.
        runway = maxDealt * Math.max(1, pace);
        wrap.style.setProperty("--vc-runway", `${runway - maxDealt}px`);

        // Can the deal be watched at all? The pin plus the two bands in play.
        pin = parseFloat(getComputedStyle(list).top) || 0;
        const available = scroller ? scroller.clientHeight : (window.visualViewport?.height ?? window.innerHeight);
        fits = pin + 2 * Math.max(...bands) <= available && maxDealt > 0;
        if (fits) {
          wrap.dataset.vcStack = "on";
        } else {
          delete wrap.dataset.vcStack;
          clearAll();
          openAll();
        }
      };

      /** A card's travel. A docked card loses its transform (an identity transform would still layer it and shimmer its text). */
      const deal = (card: HTMLElement, i: number, travel: number) => {
        if (travel === lastTravel[i]) return;
        lastTravel[i] = travel;
        if (travel) gsap.set(card, { y: travel });
        else gsap.set(card, { clearProps: "transform" });
      };

      /** The copy, folded away bottom-to-top, faded in step, inert once gone. The heading is never touched. */
      const foldCopy = (i: number, fold: number, standing: number) => {
        if (fold === lastDescFold[i]) return;
        lastDescFold[i] = fold;
        const desc = descs[i];
        if (!desc) return;
        gsap.set(desc, { gridTemplateRows: `${standing}fr`, opacity: standing });
        if (fold >= 1) desc.setAttribute("inert", "");
        else desc.removeAttribute("inert");
      };

      /** The art window, clipped shut by the incoming card (less the copy still standing above it on the column layout). */
      const squeezeArt = (i: number, cover: number, standing: number) => {
        const art = arts[i];
        const artOpen = artOpens[i];
        if (!art || !artOpen || !Number.isFinite(artClosed)) return;
        const above = descBelow ? descHeights[i] * standing : 0;
        const artH = Math.max(artClosed, Math.min(artOpen, artClosed + cover - above));
        const cut = Math.round(artOpen - artH);
        if (cut === lastArtCut[i]) return;
        lastArtCut[i] = cut;
        if (cut) gsap.set(art, { clipPath: `inset(0px 0px ${cut}px 0px round ${artRadius}px)` });
        else gsap.set(art, { clearProps: "clipPath" });
      };

      /** One scrub frame: the trigger's progress applied to the deck. */
      const apply = (progress: number) => {
        if (!fits || maxDealt <= 0) return;
        const dealt = Math.round(progress * maxDealt);
        if (dealt === lastDealt) return;
        lastDealt = dealt;

        let open = 0;
        const travels = cards.map((_, i) => {
          const travel = Math.max(0, Math.round(flowTop[i] - slots[i] - dealt));
          if (travel === 0) open = i;
          return travel;
        });
        cards.forEach((card, i) => {
          const travel = travels[i];
          deal(card, i, travel);
          // How much closer the next card is than plain flow puts it. The last card is never covered.
          const cover = i < lastIndex ? travels[i + 1] - travel : Infinity;
          const fold = Math.min(1, Math.max(0, 1 - cover / foldSpans[i]));
          const standing = 1 - fold;
          foldCopy(i, fold, standing);
          squeezeArt(i, cover, standing);
        });
        if (open !== lastOpen) {
          lastOpen = open;
          cards.forEach((c, i) => {
            if (i >= open) c.setAttribute("data-vc-open", "");
            else c.removeAttribute("data-vc-open");
          });
        }
      };

      const trigger = ScrollTrigger.create({
        trigger: wrap,
        scroller: scroller ?? undefined,
        // The deal begins the moment the list pins and spends exactly the runway.
        start: () => `top top+=${pin}`,
        end: () => `+=${Math.max(1, runway)}`,
        // A soft scrub: progress eases toward the scroll, still fully reversible.
        scrub,
        onRefreshInit: measure,
        onRefresh: (self) => {
          invalidate();
          apply(self.progress);
        },
        onUpdate: (self) => apply(self.progress),
      });

      // Pinch zoom and mobile chrome change the visual viewport without a
      // resize event; re-measure once it settles (debounced).
      const vv = window.visualViewport;
      let viewportTimer = 0;
      const onViewport = () => {
        window.clearTimeout(viewportTimer);
        viewportTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
      };
      vv?.addEventListener("resize", onViewport);
      // Web fonts change heading heights: re-measure when they arrive.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => {
        window.clearTimeout(viewportTimer);
        vv?.removeEventListener("resize", onViewport);
        trigger.kill();
        wrap.style.removeProperty("--vc-runway");
        clearAll();
        restoreSettled();
        delete wrap.dataset.vcStack;
      };
    });

    return () => {
      mm.revert();
      clearAll();
      restoreSettled();
      delete wrap.dataset.vcStack;
    };
  }, [count, stickyTop, peek, padding, speed, scrub]);

  const s = `[data-collapsing-stack="${id}"]`;
  const lgPitch = padding * 2 + peek;

  return (
    <div
      ref={wrapRef}
      className={cn("w-full", className)}
      data-collapsing-stack={id}
      style={
        {
          "--vc-count": count,
          "--vc-top": `${stickyTop}px`,
          "--vc-pad": `${padding}px`,
          "--vc-peek": `${peek}px`,
          "--vc-pitch-lg": `${lgPitch}px`,
          "--vc-radius": `${radius}px`,
          "--vc-bg": background,
          "--vc-border": borderColor,
          "--vc-speed": speed,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/*
        Layout and states from the original's vertical-cards section. The pile
        metrics are its frames: a 150px band and 376px card on phones, 240px
        from 768px, `padding + peek + padding` (260px) and 593px from 992px.
      */}
      <style>{`
${s}{--vc-pitch:150px;--vc-card-h:376px}
@media (min-width:768px){${s}{--vc-pitch:240px}}
@media (min-width:992px){${s}{--vc-pitch:var(--vc-pitch-lg);--vc-card-h:593px}}
${s}[data-vc-stack]{height:calc(var(--vc-flow-h,calc(var(--vc-count) * var(--vc-card-h))) + var(--vc-runway,0px))}
${s}>ul{display:flex;flex-direction:column;gap:10px;margin:0;padding:0;list-style:none}
${s}[data-vc-stack]>ul{position:sticky;top:var(--vc-top);gap:0;height:var(--vc-pile-h,calc((var(--vc-count) - 1) * var(--vc-pitch) + var(--vc-card-h)))}
${s} [data-vc-row]{--vc-copy-closed:31px;--vc-art-closed:79px;--vc-art-h:var(--vc-art-closed);--vc-desc-below:1;display:flex;flex-direction:column;gap:20px;border-top:1px solid var(--vc-border);background:var(--vc-bg);padding-top:9px}
${s} [data-vc-row][data-vc-open]{--vc-art-h:auto}
${s}[data-vc-stack] [data-vc-row]{position:absolute;left:0;right:0;top:var(--vc-slot,calc(var(--vc-index) * var(--vc-pitch)));min-height:var(--vc-card-h-live,var(--vc-card-h));padding-bottom:10px}
${s} [data-vc-copycol]{flex-shrink:0}
${s} [data-vc-desc]{display:grid;grid-template-rows:0fr;opacity:0}
${s} [data-vc-row][data-vc-copy] [data-vc-desc]{grid-template-rows:1fr;opacity:1}
${s} [data-vc-desc]>div{min-height:0;overflow:hidden}
${s} [data-vc-desc]>div>div{display:flex;flex-direction:column;align-items:flex-start;gap:20px;padding-top:15.85px}
${s} [data-vc-art]{position:relative;aspect-ratio:330/211;height:var(--vc-art-h);overflow:hidden;border-radius:10px}
${s}[data-vc-stack] [data-vc-art]{height:auto}
${s} [data-vc-art]>*{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
@media (min-width:768px){${s} [data-vc-row]{--vc-art-closed:170px}}
@media (min-width:992px){
${s}>ul{gap:30px}
${s} [data-vc-row]{--vc-copy-closed:40px;--vc-art-closed:var(--vc-peek);--vc-desc-below:0;flex-direction:row;align-items:flex-start;gap:80px;padding-top:calc(var(--vc-pad) - 1px)}
${s}[data-vc-stack] [data-vc-row]{padding-bottom:var(--vc-pad)}
${s} [data-vc-copycol]{width:367px}
${s} [data-vc-desc]>div>div{gap:40px;padding-top:40px}
${s} [data-vc-art]{aspect-ratio:833/533;min-width:0;flex:1;border-radius:var(--vc-radius)}
}`}</style>
      <ul ref={listRef}>
        {items.map((item, i) => (
          <li
            key={i}
            data-vc-row
            style={{ "--vc-index": i } as React.CSSProperties}
            // The settled state: the end of the deal, with the last card open.
            {...(i === last ? { "data-vc-open": "", "data-vc-copy": "" } : {})}
          >
            <div data-vc-copycol>
              <div data-vc-heading>{item.title}</div>
              {(item.description || item.action) && (
                <div data-vc-desc inert={i !== last}>
                  <div>
                    <div>
                      {item.description}
                      {item.action}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div data-vc-art className={cn(!item.media && "bg-black")}>
              {item.media}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Nearest ancestor that scrolls vertically, or null for the window. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(p).overflowY)) return p;
  }
  return null;
}
