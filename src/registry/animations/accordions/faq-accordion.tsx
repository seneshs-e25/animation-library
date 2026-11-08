"use client";

import * as React from "react";

export type FaqItem = {
  question: React.ReactNode;
  answer: React.ReactNode;
};

type FaqAccordionProps = Omit<React.ComponentProps<"div">, "title"> & {
  items: FaqItem[];
  /** Optional heading shown in a left column beside the cards on wide layouts. */
  heading?: React.ReactNode;
  /** Index of the row that starts open. */
  defaultOpen?: number;
  /**
   * false (the original): one row is always open; clicking the open row does
   * nothing. true: clicking the open row closes it, so all can be closed.
   */
  collapsible?: boolean;
  /** Show the 01, 02… step numbers (wide layouts only). */
  numbered?: boolean;
  /** Open/close and chevron duration in milliseconds. */
  duration?: number;
  /** CSS timing function for the open/close and the chevron. */
  easing?: string;
  /** Card background. */
  cardColor?: string;
  /** Question and chevron colour. */
  textColor?: string;
  /** Answer colour. */
  answerColor?: string;
  /** Step number colour. */
  numberColor?: string;
};

/**
 * FAQ accordion — numbered question cards; one answer open at a time.
 *
 * Opening a row closes the one that was open. The answer opens with a
 * `grid-template-rows: 0fr → 1fr` row, which animates to the answer's natural
 * height without measuring it, while the chevron turns over on the same
 * duration and curve. A closed answer is `inert`, so its links can't be
 * tabbed into.
 *
 * Each card's header row is a real <button> with aria-expanded/aria-controls;
 * a closed card is all header, so the whole closed card is the click target.
 */
export function FaqAccordion({
  items,
  heading,
  defaultOpen = 0,
  collapsible = false,
  numbered = true,
  duration = 500,
  easing = "cubic-bezier(0, 0, 0.2, 1)",
  cardColor = "#F6F5F7",
  textColor = "#000000",
  answerColor = "#333333",
  numberColor = "#8F8E91",
  className,
  style,
  ...props
}: FaqAccordionProps) {
  const [open, setOpen] = React.useState<number | null>(defaultOpen);
  const id = React.useId();

  const list = (
    <div className="@container flex flex-col gap-2.5">
      {items.map((item, i) => {
        const isOpen = open === i;
        const qId = `${id}-q${i}`;
        const aId = `${id}-a${i}`;
        return (
          <div key={i} className="overflow-hidden rounded-[20px] bg-(--faq-card)">
            <button
              type="button"
              id={qId}
              aria-expanded={isOpen}
              aria-controls={aId}
              onClick={() => setOpen(isOpen ? (collapsible ? null : i) : i)}
              className={[
                "flex w-full gap-x-[25px] px-[25px] pt-5 text-left",
                isOpen ? "cursor-default pb-0" : "cursor-pointer pb-5",
                "rounded-[20px] outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0054D7]",
              ].join(" ")}
            >
              {numbered && (
                <span className="hidden w-[42px] shrink-0 text-xl leading-8 text-(--faq-number) tabular-nums @[600px]:block">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              <span className="min-w-0 flex-1 text-lg leading-[1.1] font-light tracking-[0.01em] text-(--faq-text) @[600px]:text-[28px] @[600px]:tracking-normal @[600px]:pt-px">
                {item.question}
              </span>
              <svg
                aria-hidden
                viewBox="0 0 22 22"
                fill="none"
                className={[
                  "mt-0 size-[22px] shrink-0 text-(--faq-text) transition-transform duration-(--faq-duration) ease-(--faq-ease) motion-reduce:transition-none @[600px]:mt-[5px]",
                  isOpen ? "rotate-180" : "",
                ].join(" ")}
              >
                <path d="M4.58 8.25 11 14.67l6.42-6.42" stroke="currentColor" strokeLinejoin="round" />
              </svg>
            </button>

            {/* 0fr → 1fr opens to the answer's natural height. */}
            <div
              id={aId}
              inert={!isOpen}
              className={[
                "grid transition-[grid-template-rows] duration-(--faq-duration) ease-(--faq-ease) motion-reduce:transition-none",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              ].join(" ")}
            >
              <div className="overflow-hidden">
                {/* Padding lives inside the collapsing box so it animates away with the answer. */}
                <div
                  className={[
                    "pt-5 pr-[72px] pb-5 pl-[25px] text-sm leading-[1.6] tracking-[0.02em] text-(--faq-answer) @[600px]:text-base",
                    numbered ? "@[600px]:pl-[92px]" : "",
                    "[&>p]:m-0 [&>p+p]:mt-[1.6em]",
                  ].join(" ")}
                >
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className={["@container w-full", className].filter(Boolean).join(" ")}
      style={
        {
          "--faq-duration": `${duration}ms`,
          "--faq-ease": easing,
          "--faq-card": cardColor,
          "--faq-text": textColor,
          "--faq-answer": answerColor,
          "--faq-number": numberColor,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {heading ? (
        <div className="flex flex-col gap-10 @[960px]:flex-row @[960px]:items-start @[960px]:gap-x-[6.25%]">
          <div className="text-[42px] leading-[1.1] font-light tracking-[-0.01em] text-(--faq-text) @[960px]:flex-1 @[960px]:text-[60px]">
            {heading}
          </div>
          <div className="@[960px]:w-[62.1%] @[960px]:shrink-0">{list}</div>
        </div>
      ) : (
        list
      )}
    </div>
  );
}
