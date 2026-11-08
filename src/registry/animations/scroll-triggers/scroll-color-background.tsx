"use client";

import * as React from "react";

export type ColorSection = {
  /** Background the whole wrapper fades to while this section is the active one. */
  color: string;
  /** Text colour for the wrapper while this section is active. Fades with the background. */
  textColor?: string;
  children?: React.ReactNode;
  className?: string;
};

type ScrollColorBackgroundProps = Omit<React.ComponentProps<"div">, "children"> & {
  sections: ColorSection[];
  /**
   * Viewport-height fraction a section's top must rise above to become the
   * active one. 0.8 (the original) = when its top enters the bottom fifth.
   */
  arriveAt?: number;
  /** Crossfade duration in milliseconds. */
  duration?: number;
  /** CSS timing function for the crossfade. */
  easing?: string;
};

/** The nearest ancestor that scrolls vertically, or null for the page itself. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let n = el.parentElement; n; n = n.parentElement) {
    const { overflowY } = getComputedStyle(n);
    if ((overflowY === "auto" || overflowY === "scroll") && n.scrollHeight > n.clientHeight) return n;
  }
  return null;
}

/**
 * Scroll color background — a run of sections that share one background,
 * which fades to each section's colour as that section scrolls in.
 *
 * The active section is the last one whose top has risen above `arriveAt` of
 * the viewport (the original's "bottom fifth" edge), so the colour changes
 * while the new section is still mostly below — the fade is done by the time
 * it fills the screen. Scroll and resize are measured once per frame, and the
 * background and text colour are only written when the active section changes.
 *
 * The first section's colour is server-rendered, and the first measure runs
 * with the transition off, so the page never fades in on load. Under reduced
 * motion the colours still change, instantly.
 */
export function ScrollColorBackground({
  sections,
  arriveAt = 0.8,
  duration = 500,
  easing = "ease",
  className,
  style,
  ...props
}: ScrollColorBackgroundProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const sectionRefs = React.useRef<Array<HTMLElement | null>>([]);
  const [active, setActive] = React.useState(0);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scroller = scrollParent(root);
    let frame = 0;

    const measure = () => {
      frame = 0;
      const top = scroller ? scroller.getBoundingClientRect().top : 0;
      const height = scroller ? scroller.clientHeight : window.innerHeight;
      const line = top + height * arriveAt;
      let next = 0;
      sectionRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top < line) next = i;
      });
      setActive((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    // Turn the transition on only after the first, silent measure.
    const raf = requestAnimationFrame(() => setReady(true));
    // Capture catches scrolls of any container, including a nested one.
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, [arriveAt, sections.length]);

  const current = sections[active] ?? sections[0];

  return (
    <div
      ref={rootRef}
      className={[
        ready ? "transition-[background-color,color] motion-reduce:transition-none" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: current?.color,
        color: current?.textColor,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: easing,
        ...style,
      }}
      {...props}
    >
      {sections.map((section, i) => (
        <section
          key={i}
          ref={(el) => {
            sectionRefs.current[i] = el;
          }}
          data-active={i === active ? "" : undefined}
          className={section.className}
        >
          {section.children}
        </section>
      ))}
    </div>
  );
}
