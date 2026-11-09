"use client";

import * as React from "react";
import { Check, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const VISIBLE_MS = 2600;

/**
 * Preview stage. With `clickNotice`, it confirms clicks on any button or
 * link inside it (used for the button components).
 *
 * Accessibility (WCAG 2.x):
 * - 4.1.3 Status Messages: the confirmation is announced through a polite
 *   live region that stays mounted, without moving focus.
 * - 2.1.1 Keyboard: listens to `click`, which native buttons and links also
 *   fire for Enter / Space, so keyboard users get the same notice.
 * - 1.4.3 Contrast: the notice is near-white on near-black (~17:1), so it
 *   stays readable on both light and dark stages.
 * - 2.3.3 / prefers-reduced-motion: the notice only fades, no movement.
 * - The notice is non-interactive and informational, so auto-dismissing it
 *   doesn't remove anything the user needs (2.2.1 Timing Adjustable).
 * - Links in the preview are demo-only, so navigation is prevented.
 */
const STAGE_COLORS = { light: "#F5F5F4", dark: "#0A0A0A" } as const;
type StageTheme = keyof typeof STAGE_COLORS;

export function PreviewStage({
  children,
  themeToggle = true,
  fullBleed = false,
  defaultTheme = "dark",
  clickNotice = false,
}: {
  children: React.ReactNode;
  /** Show the light/dark background toggle. When false the stage stays dark. */
  themeToggle?: boolean;
  /** Drop the padding so a full-width section fills the stage. */
  fullBleed?: boolean;
  /** Stage the preview starts on. Dark unless the component is light-only. */
  defaultTheme?: StageTheme;
  /** Confirm clicks with a "Button clicked" notice. Only for button components. */
  clickNotice?: boolean;
}) {
  const [selectedTheme, setTheme] = React.useState<StageTheme>(defaultTheme);
  const theme: StageTheme = themeToggle ? selectedTheme : "dark";
  const [notice, setNotice] = React.useState<{
    label: string;
    count: number;
  } | null>(null);
  const [visible, setVisible] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  function onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    // Ignore the stage's own controls (theme toggle).
    if ((event.target as HTMLElement).closest("[data-stage-ui]")) return;
    const target = (event.target as HTMLElement).closest("a, button");
    if (!target || !event.currentTarget.contains(target)) return;
    if (target.tagName === "A") event.preventDefault();
    if (!clickNotice) return;

    const label =
      target.textContent?.trim() ||
      target.getAttribute("aria-label") ||
      "Button";
    // The count makes repeated clicks a new message, so screen readers
    // announce each one instead of ignoring an identical update.
    setNotice((prev) => ({
      label,
      count: visible && prev?.label === label ? prev.count + 1 : 1,
    }));
    setVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), VISIBLE_MS);
  }

  const message = notice
    ? `Button clicked: ${notice.label}${notice.count > 1 ? ` (${notice.count} times)` : ""}`
    : "";

  return (
    <div
      data-theme={theme}
      className={cn(
        "group/stage relative grid transition-colors duration-200 ease-[ease] motion-reduce:transition-none",
        fullBleed ? "min-w-0 items-center" : "place-items-center p-10",
      )}
      style={{ background: STAGE_COLORS[theme] }}
      onClickCapture={onClickCapture}
    >
      {children}

      {themeToggle && (
        <div
          data-stage-ui
          role="group"
          aria-label="Preview background"
          className={cn(
            "absolute top-4 right-4 flex gap-0.5 rounded-full p-0.5 ring-1 transition-colors duration-200 ease-[ease]",
            "group-data-[theme=light]/stage:bg-black/[0.04] group-data-[theme=light]/stage:ring-black/10",
            "group-data-[theme=dark]/stage:bg-white/[0.06] group-data-[theme=dark]/stage:ring-white/10",
          )}
        >
          {(["light", "dark"] as const).map((option) => {
            const Icon = option === "light" ? Sun : Moon;
            const active = theme === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                aria-label={`${option === "light" ? "Light" : "Dark"} background`}
                title={`${option === "light" ? "Light" : "Dark"} background`}
                onClick={() => setTheme(option)}
                className={cn(
                  "grid size-8 place-items-center rounded-full outline-none transition-colors duration-150 ease-[ease]",
                  "focus-visible:ring-2 focus-visible:ring-blue-500",
                  // Inactive icons stay at >= 3:1 against the stage (WCAG 1.4.11).
                  "group-data-[theme=light]/stage:text-neutral-500 group-data-[theme=light]/stage:hover:text-neutral-900",
                  "group-data-[theme=dark]/stage:text-neutral-400 group-data-[theme=dark]/stage:hover:text-white",
                  active &&
                    "group-data-[theme=light]/stage:bg-white group-data-[theme=light]/stage:text-neutral-900 group-data-[theme=light]/stage:shadow-sm group-data-[theme=dark]/stage:bg-white/15 group-data-[theme=dark]/stage:text-white",
                )}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Always mounted so assistive tech is already listening when it changes. */}
      {clickNotice && (
        <>
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {visible ? message : ""}
          </div>

          <div
            aria-hidden
            data-visible={visible}
            className={cn(
              "pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full",
              "bg-neutral-900 py-2 pr-4 pl-2.5 text-sm text-neutral-50 shadow-lg ring-1 ring-white/10",
              // Enter: 200ms strong ease-out; exit faster so it gets out of the way.
              "transition-[opacity,translate,scale] ease-[cubic-bezier(0.23,1,0.32,1)]",
              "data-[visible=true]:translate-y-0 data-[visible=true]:scale-100 data-[visible=true]:opacity-100 data-[visible=true]:duration-200",
              "translate-y-2 scale-[0.97] opacity-0 duration-150",
              "motion-reduce:translate-y-0 motion-reduce:scale-100",
            )}
          >
            <span className="grid size-5 place-items-center rounded-full bg-emerald-500 text-neutral-950">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            <span className="font-medium">Button clicked</span>
            {notice && (
              <span className="text-neutral-400">
                {notice.label}
                {notice.count > 1 && (
                  <span className="tabular-nums"> ×{notice.count}</span>
                )}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
