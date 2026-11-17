"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CipherRevealHandle = {
  /** Decode the headline again from the `from` state. */
  replay: () => void;
};

type CipherRevealProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** The headline. Plain text; changing it decodes the new words in place. */
  text: string;
  /** Element to render, e.g. "h2". */
  as?: React.ElementType;
  /** Colour of the decoded letters. Unset, it inherits. */
  color?: string;
  /** Colour of the letters while they're scrambled. Unset, the text colour. */
  scrambleColor?: string;
  /** Opacity of a scrambled letter as it starts; it brightens to 1 as it locks. */
  scrambleOpacity?: number;
  /**
   * Characters to scramble with. "auto" picks characters of the same case and
   * a similar width as each letter; any other string is used as is.
   */
  charset?: string;
  /** When the first reveal plays: into view, on mount, or only via `replay()`. */
  trigger?: "view" | "mount" | "manual";
  /** Order the letters decode in. */
  order?: "left" | "right" | "center" | "random";
  /** Start from nothing (letters type in as cipher) or a fully scrambled line. */
  from?: "blank" | "scrambled";
  /** Milliseconds for the whole headline to decode. */
  duration?: number;
  /** Milliseconds each letter scrambles before it locks. */
  scramble?: number;
  /** How many times per second a scrambled character changes. */
  rate?: number;
  /** Milliseconds a locked letter takes to fade to full opacity. */
  lockFade?: number;
  /** "trail" re-scrambles the letters under the pointer; "replay" decodes it all again on enter. */
  hover?: "trail" | "replay" | "none";
  /** Reach of the hover trail, in em. */
  hoverRadius?: number;
  /** Decode again every `interval` ms while on screen. */
  loop?: boolean;
  /** Milliseconds between reveals when `loop` is on. */
  interval?: number;
  /** Called when a reveal finishes (not after a hover trail). */
  onComplete?: () => void;
  ref?: React.Ref<CipherRevealHandle>;
};

const POOLS = {
  lowerNarrow: "fijlrt",
  lowerWide: "mw",
  lower: "abcdeghknopqsuvxyz",
  upperNarrow: "IJ1",
  upperWide: "MWQ",
  upper: "ABCDEFGHKLNOPRSTUVXYZ",
  digit: "0123456789",
  symbol: "#%&*+=<>/\\?$@",
};

/** The "auto" pool for one letter: same case, similar width. */
function autoPool(ch: string): string {
  for (const [key, set] of Object.entries(POOLS)) {
    if (key !== "symbol" && set.includes(ch)) return set.length > 2 ? set : set + set.toUpperCase();
  }
  if (/[a-z]/.test(ch)) return POOLS.lower;
  if (/[A-Z]/.test(ch)) return POOLS.upper;
  if (/\d/.test(ch)) return POOLS.digit;
  return POOLS.symbol;
}

type Letter = {
  ch: string;
  pool: string[];
  /** Fraction of the reveal before this letter starts, 0 to 1. */
  rank: number;
  /** Offset so letters don't all change glyph on the same frame. */
  phase: number;
  startAt: number;
  lockAt: number;
  state: "hidden" | "scramble" | "locked";
  glyph: string;
};

/**
 * Cipher reveal: a headline that decodes out of scrambled characters, letter
 * by letter. Recreated from React Bits Pro's Cipher Reveal.
 *
 * How it works:
 * - Each letter is an inline-block holding the real character (the "face")
 *   and an absolutely positioned "mask" on top that shows the scramble glyph.
 *   The face keeps its space at all times, so nothing reflows.
 * - Every mask glyph is scaled on X to its letter's exact width (widths come
 *   from a canvas `measureText`, cached), so the line never shifts.
 * - One requestAnimationFrame loop writes opacity, transform and text
 *   straight to the DOM; React only renders the letters once per text.
 *   The loop stops as soon as every letter is locked.
 * - Words are `nowrap` spans, so lines only break between words.
 * - Screen readers get the text once; the letters are `aria-hidden`.
 *
 * Reduced motion: the text shows from the first paint; no scramble, no hover.
 */
export function CipherReveal({
  text,
  as: Tag = "h2",
  color,
  scrambleColor,
  scrambleOpacity = 0.42,
  charset = "auto",
  trigger = "view",
  order = "left",
  from = "blank",
  duration = 1400,
  scramble = 450,
  rate = 14,
  lockFade = 200,
  hover = "trail",
  hoverRadius = 0.6,
  loop = false,
  interval = 5000,
  onComplete,
  ref,
  className,
  style,
  onPointerMove,
  onPointerEnter,
  ...props
}: CipherRevealProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const words = text.split(/(\s+)/);

  // Everything the frame loop reads lives in refs, so tuning a prop never
  // restarts a reveal half way.
  // Loop settings are read when a reveal ends, so they also apply without a replay.
  const latest = { scrambleOpacity, scrambleColor, rate, lockFade, scramble, duration, order, from, charset, hoverRadius, loop, interval, onComplete };
  const opts = React.useRef(latest);
  React.useLayoutEffect(() => {
    opts.current = latest;
  });

  const api = React.useRef<{ play: () => void; trail: (x: number, y: number) => void } | null>(null);

  React.useImperativeHandle(ref, () => ({ replay: () => api.current?.play() }), []);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cells = Array.from(root.querySelectorAll<HTMLElement>("[data-cell]"));
    const faces = cells.map((c) => c.firstElementChild as HTMLElement);
    const masks = cells.map((c) => c.lastElementChild as HTMLElement);
    const letters: Letter[] = cells.map((c, i) => ({
      ch: c.dataset.cell!,
      pool: [],
      rank: 0,
      phase: (i * 0.37) % 1,
      startAt: 0,
      lockAt: 0,
      state: "locked",
      glyph: "",
    }));

    // --- Measuring -------------------------------------------------------
    const ctx = document.createElement("canvas").getContext("2d");
    const glyphWidth = new Map<string, number>();
    let faceWidth: number[] = [];
    let spacing = 0;
    let fontPx = 16;
    const measure = () => {
      const cs = getComputedStyle(faces[0] ?? root);
      fontPx = parseFloat(cs.fontSize) || 16;
      spacing = parseFloat(cs.letterSpacing) || 0;
      if (ctx) ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      glyphWidth.clear();
      faceWidth = faces.map((f) => f.getBoundingClientRect().width);
    };
    const widthOf = (g: string) => {
      let w = glyphWidth.get(g);
      if (w === undefined) {
        w = (ctx?.measureText(g).width ?? fontPx * 0.6) + spacing;
        glyphWidth.set(g, w);
      }
      return w;
    };

    const pools = () => {
      const custom = opts.current.charset === "auto" ? null : Array.from(opts.current.charset);
      letters.forEach((l) => (l.pool = custom?.length ? custom : Array.from(autoPool(l.ch))));
    };

    // --- Writing a letter's state to the DOM --------------------------------
    const lock = (i: number, fade: boolean) => {
      const l = letters[i];
      l.state = "locked";
      masks[i].style.opacity = "0";
      faces[i].style.transition = fade ? `opacity ${opts.current.lockFade}ms cubic-bezier(0.2, 0.7, 0.2, 1)` : "none";
      faces[i].style.opacity = "1";
    };
    const hide = (i: number) => {
      letters[i].state = "hidden";
      masks[i].style.opacity = "0";
      faces[i].style.transition = "none";
      faces[i].style.opacity = "0";
    };
    const setGlyph = (i: number, g: string) => {
      const l = letters[i];
      if (g === l.glyph) return;
      l.glyph = g;
      masks[i].textContent = g;
      const s = Math.min(2.5, Math.max(0.35, (faceWidth[i] ?? 0) / widthOf(g)));
      masks[i].style.transform = `translateX(-50%) scaleX(${s.toFixed(3)})`;
    };

    // --- The frame loop -------------------------------------------------
    let frame = 0;
    let revealing = false;
    const step = (now: number) => {
      frame = 0;
      const o = opts.current;
      let active = false;
      letters.forEach((l, i) => {
        if (l.state === "locked") return;
        if (now >= l.lockAt) return lock(i, true);
        active = true;
        if (now < l.startAt) {
          if (l.state !== "hidden") hide(i);
          return;
        }
        if (l.state !== "scramble") {
          l.state = "scramble";
          l.glyph = "";
          faces[i].style.transition = "none";
          faces[i].style.opacity = "0";
          masks[i].style.color = o.scrambleColor ?? "";
        }
        const bucket = Math.floor((now / 1000 + l.phase) * o.rate);
        setGlyph(i, l.pool[(bucket * 7 + i * 13) % l.pool.length]);
        const p = Math.min(1, (now - l.startAt) / Math.max(1, l.lockAt - l.startAt));
        masks[i].style.opacity = String(o.scrambleOpacity + (1 - o.scrambleOpacity) * p);
      });
      if (active) frame = requestAnimationFrame(step);
      else if (revealing) {
        revealing = false;
        o.onComplete?.();
        scheduleLoop();
      }
    };
    const run = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };

    // --- Reveal -----------------------------------------------------------
    const ranks = () => {
      const n = letters.length;
      const o = opts.current.order;
      const mid = (n - 1) / 2;
      const shuffled = letters.map((_, i) => i);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      letters.forEach((l, i) => {
        const r =
          o === "right" ? n - 1 - i : o === "center" ? Math.abs(i - mid) : o === "random" ? shuffled[i] : i;
        l.rank = n > 1 ? r / (o === "center" ? mid || 1 : n - 1) : 0;
      });
    };
    const play = () => {
      if (reduced || !letters.length) return;
      clearTimeout(loopTimer);
      pools();
      ranks();
      const o = opts.current;
      const now = performance.now();
      const spread = Math.max(0, o.duration - o.scramble);
      letters.forEach((l, i) => {
        l.startAt = o.from === "scrambled" ? now : now + l.rank * spread;
        l.lockAt = now + l.rank * spread + o.scramble;
        l.state = "hidden";
        l.glyph = "";
        if (o.from === "blank") hide(i);
      });
      revealing = true;
      root.setAttribute("data-ready", "");
      run();
    };

    // Re-scramble the letters near the pointer; they decode again behind it.
    let rects: DOMRect[] | null = null;
    const trail = (x: number, y: number) => {
      if (reduced || revealing) return;
      rects ??= cells.map((c) => c.getBoundingClientRect());
      const reach = opts.current.hoverRadius * fontPx;
      const now = performance.now();
      rects.forEach((r, i) => {
        const dx = Math.max(r.left - x, 0, x - r.right);
        const dy = Math.max(r.top - y, 0, y - r.bottom);
        if (dx * dx + dy * dy > reach * reach) return;
        const l = letters[i];
        if (l.state === "locked") l.startAt = now;
        l.lockAt = now + opts.current.scramble;
        if (l.state === "locked") l.state = "hidden";
      });
      run();
    };
    const dropRects = () => (rects = null);
    window.addEventListener("scroll", dropRects, { passive: true });

    // --- Loop & visibility ----------------------------------------------
    let loopTimer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    const scheduleLoop = () => {
      clearTimeout(loopTimer);
      if (opts.current.loop && visible) loopTimer = setTimeout(() => visible && play(), opts.current.interval);
    };

    measure();
    pools();
    const ro = new ResizeObserver(() => {
      measure();
      rects = null;
      letters.forEach((l) => (l.glyph = ""));
    });
    ro.observe(root);
    document.fonts?.ready.then(measure);

    api.current = { play, trail };

    if (reduced || trigger === "manual") {
      letters.forEach((_, i) => lock(i, false));
      root.setAttribute("data-ready", "");
    } else if (trigger === "mount") {
      play();
    } else {
      // Stay hidden (blank) until the reveal; a scrambled start shows cipher straight away.
      letters.forEach((l, i) => {
        l.startAt = opts.current.from === "scrambled" ? 0 : Infinity;
        l.lockAt = Infinity;
        l.state = "hidden";
        hide(i);
      });
      root.setAttribute("data-ready", "");
      if (opts.current.from === "scrambled") run();
    }

    let played = trigger !== "view";
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !played) {
          played = true;
          play();
        } else if (visible && !revealing) scheduleLoop();
        else if (!visible) clearTimeout(loopTimer);
      },
      { threshold: 0.5 },
    );
    io.observe(root);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(loopTimer);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", dropRects);
      api.current = null;
    };
    // Rebuild only when the letters or how the first reveal starts change.
  }, [text, trigger]);

  const finePointer = React.useRef(false);
  React.useEffect(() => {
    finePointer.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  const s = `[data-cipher-reveal="${id}"]`;
  const css = [
    `${s} [data-cell]{position:relative;display:inline-block}`,
    `${s} [data-mask]{position:absolute;left:50%;top:0;white-space:pre;opacity:0;pointer-events:none;transform:translateX(-50%)}`,
    // Hide the letters before hydration only when they're going to reveal.
    trigger === "manual" ? "" : `@media (prefers-reduced-motion:no-preference){${s}:not([data-ready]) [data-face]{opacity:0}}`,
  ].join("");

  let cell = 0;
  return (
    <Tag
      ref={rootRef}
      data-cipher-reveal={id}
      className={cn(className)}
      style={{ color, ...style }}
      onPointerEnter={(e: React.PointerEvent<HTMLElement>) => {
        onPointerEnter?.(e);
        if (hover === "replay" && finePointer.current) api.current?.play();
      }}
      onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
        onPointerMove?.(e);
        if (hover === "trail" && finePointer.current) api.current?.trail(e.clientX, e.clientY);
      }}
      {...props}
    >
      <style>{css}</style>
      <noscript>
        <style>{`${s} [data-face]{opacity:1!important}`}</style>
      </noscript>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, w) =>
          /^\s+$/.test(word) || !word ? (
            word
          ) : (
            <span key={w} className="whitespace-nowrap">
              {Array.from(word).map((ch) => (
                <span key={cell++} data-cell={ch}>
                  <span data-face="">{ch}</span>
                  <span data-mask="" />
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}
