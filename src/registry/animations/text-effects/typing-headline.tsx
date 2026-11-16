"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TypingHeadlineProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** The headline. Plain text, typed out one character at a time. */
  text: string;
  /** Element to render, e.g. "h2". */
  as?: React.ElementType;
  /** The cursor character after the text. */
  cursor?: string;
  /** Cursor colour. */
  cursorColor?: string;
  /**
   * Type the text out before the cursor starts blinking. Off by default: the
   * headline is static and only the cursor blinks, as on Veracode.
   */
  typing?: boolean;
  /** Type on mount, or the first time the headline scrolls into view. */
  trigger?: "load" | "view";
  /** Milliseconds per character while typing. */
  speed?: number;
  /** Milliseconds before the first character, after the trigger. */
  delay?: number;
  /** Milliseconds for one full blink (on → off → on). */
  blinkDuration?: number;
  /** Easing for each half of the blink, as a CSS timing function. */
  blinkEasing?: string;
};

/**
 * Typing headline: a headline followed by a blinking cursor. By default it
 * matches the original (static text, blinking cursor); `typing` adds an
 * optional type-out first. Recreated from the "Start Your Journey_"
 * CTA band on veracode.com (WordPress), where the cursor is a coloured `_`
 * blinking on a 0.5s CSS loop.
 *
 * How it works:
 * - The full text is always laid out: the typed part is visible, the rest is
 *   `visibility: hidden`. Line breaks never move while it types, and the
 *   heading's height is reserved from the first paint.
 * - While typing, a zero-width caret rides after the last typed character
 *   (solid, like a real text caret while you type). When the text is done it
 *   hands over to the real cursor at the end, which then blinks.
 * - Screen readers get the full text once; the typed spans and the cursor are
 *   `aria-hidden`.
 * - The pre-hydration hiding only applies under
 *   `prefers-reduced-motion: no-preference`, and a `<noscript>` rule shows
 *   the text when JavaScript is off.
 *
 * Reduced motion: no typing and no blink; the text and a steady cursor.
 */
export function TypingHeadline({
  text,
  as: Tag = "h2",
  cursor = "_",
  cursorColor = "#00B9FF",
  typing = false,
  trigger = "view",
  speed = 70,
  delay = 200,
  blinkDuration = 500,
  blinkEasing = "ease",
  className,
  style,
  ...props
}: TypingHeadlineProps) {
  const ref = React.useRef<HTMLElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const chars = Array.from(text);
  const [count, setCount] = React.useState(typing ? 0 : chars.length);
  const done = count >= chars.length;

  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const total = Array.from(text).length;
    // State is only set from frame callbacks. A one-frame delay is invisible
    // here: nothing is hidden under reduced motion, and a reset to empty
    // lands before the trigger can fire.
    let frame = 0;
    if (!typing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(() => setCount(total));
      return () => cancelAnimationFrame(frame);
    }
    frame = requestAnimationFrame(() => setCount(0));

    const type = () => {
      cancelAnimationFrame(frame);
      const start = performance.now() + delay;
      const tick = (now: number) => {
        const n = Math.max(0, Math.min(total, Math.floor((now - start) / speed) + 1));
        if (now >= start) setCount(n);
        if (n < total) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    if (trigger === "load") {
      type();
      return () => cancelAnimationFrame(frame);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        type();
      },
      { threshold: 0.5 },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, typing, trigger, speed, delay]);

  const s = `[data-typing-headline="${id}"]`;
  const css = [
    `@keyframes th-blink-${id}{0%,100%{opacity:1}50%{opacity:0}}`,
    // Hide the untyped text before hydration only when it will actually type.
    `@media (prefers-reduced-motion:no-preference){`,
    `${s}:not([data-done]) [data-untyped]{visibility:hidden}`,
    `${s}:not([data-done]) [data-cursor]{visibility:hidden}`,
    `${s}[data-done] [data-cursor]{animation:th-blink-${id} ${blinkDuration}ms ${blinkEasing} infinite}`,
    `}`,
    // Reduced motion shows the finished text from the first paint: no typing caret.
    `@media (prefers-reduced-motion:reduce){${s} [data-caret]{display:none}}`,
  ].join("");

  return (
    <Tag
      ref={ref}
      data-typing-headline={id}
      data-done={done ? "" : undefined}
      className={cn(className)}
      style={style}
      {...props}
    >
      <style>{css}</style>
      <noscript>
        <style>{`${s} [data-untyped],${s} [data-cursor]{visibility:visible!important}${s} [data-caret]{display:none}`}</style>
      </noscript>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {chars.slice(0, count).join("")}
        {!done && (
          // Zero width, so the caret never pushes the hidden text along.
          <span data-caret="" className="relative inline-block w-0">
            <span className="absolute left-0" style={{ color: cursorColor }}>
              {cursor}
            </span>
          </span>
        )}
        <span data-untyped="">{chars.slice(count).join("")}</span>
        <span data-cursor="" style={{ color: cursorColor }}>
          {cursor}
        </span>
      </span>
    </Tag>
  );
}
