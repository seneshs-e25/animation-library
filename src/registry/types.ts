/**
 * Registry types.
 *
 * Every animated component in the library is described by a `RegistryEntry`.
 * The entry is pure data (serializable) so it can be used on the server
 * (sidebar, static params, reading source files) and on the client
 * (customize panel, prompt generation).
 */

export type CategoryId = "interactions" | "animations" | "shaders";

/**
 * Atomic level: atom (one element, e.g. a button), box (a card or block),
 * section (a full page band), page (behaviour across sections).
 */
export type ComponentLevel = "atom" | "box" | "section" | "page";

export const levelLabels: Record<ComponentLevel, string> = {
  atom: "Atom",
  box: "Box",
  section: "Section",
  page: "Page",
};

export type Control = (
  | {
      type: "color";
      name: string;
      label: string;
      default: string;
    }
  | {
      type: "number";
      name: string;
      label: string;
      default: number;
      min: number;
      max: number;
      step: number;
      unit?: string;
    }
  | {
      type: "select";
      name: string;
      label: string;
      default: string;
      options: { label: string; value: string }[];
    }
  | {
      type: "boolean";
      name: string;
      label: string;
      default: boolean;
    }
  | {
      type: "text";
      name: string;
      label: string;
      default: string;
    }
  | {
      /**
       * A list of [x, y] points the developer drags in the preview (the
       * preview gets `setValue` to write them back). Stored as a string,
       * "x,y x,y ...", and emitted as an array literal in the usage snippet.
       */
      type: "points";
      name: string;
      label: string;
      default: string;
      /** Shown in the Customize panel in place of an input. */
      hint?: string;
    }
) & {
  /** Include in the usage snippet even when left at its default value. */
  always?: boolean;
  /**
   * Show in the Customize panel's Motion group (true) or with the other
   * props (false). Left out, it's inferred from the unit and name; see
   * `motionKind` in components/controls-panel.tsx.
   */
  motion?: boolean;
  /**
   * A small supporting timing rather than the main motion: a press dip, a
   * hover tint, a dot changing colour. Shown in the Motion group under a
   * "Micro-interactions" sub-heading, after the main motion.
   */
  secondary?: boolean;
};

export type ControlValues = Record<string, string | number | boolean>;

/** Parses a `points` control value, "x,y x,y ...", into [x, y] pairs. */
export function parsePoints(value: string): [number, number][] {
  return value
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(",").map(Number) as [number, number])
    .filter((p) => p.length === 2 && p.every(Number.isFinite));
}

/** Formats [x, y] pairs as a `points` control value, rounded to 3 places. */
export function formatPoints(points: readonly (readonly [number, number])[]): string {
  const r = (n: number) => String(Math.round(n * 1000) / 1000);
  return points.map(([x, y]) => `${r(x)},${r(y)}`).join(" ");
}

/** A `points` value as a JS array literal, e.g. `[[0.2, 0.2], [0.8, 0.2]]`. */
export function pointsLiteral(value: string): string {
  return `[${parsePoints(value)
    .map(([x, y]) => `[${x}, ${y}]`)
    .join(", ")}]`;
}

export type RegistryFile = {
  /** File name the developer should create, e.g. `corner-bloom-button.tsx`. */
  name: string;
  /** Path to the source file, relative to the project root. */
  path: string;
};

/**
 * The animation contract the copied prompt leads with. Any string can use
 * `{controlName}` tokens; they're replaced with the developer's current
 * Customize values, so the spec always matches what they tuned.
 */
export type MotionSpec = {
  /** What the motion does and how it should feel, in 1-2 sentences. */
  intent: string;
  /** What starts it: hover, focus, scroll position, click, autoplay... */
  trigger: string;
  /** What changes from rest to active: property, from -> to, origin. */
  states: string[];
  /** Durations, easing curves, delays, stagger. */
  timing: string[];
  /** What happens if the trigger reverses or repeats mid-animation. */
  interruption: string;
  /** What changes under prefers-reduced-motion, and what stays. */
  reducedMotion: string;
  /** Breakpoints where the motion changes or switches off. */
  responsive?: string;
  /** How to build it so it stays smooth (properties, layers, gotchas). */
  rules?: string[];
  /** How to confirm the result moves correctly. */
  checks: string[];
  /**
   * "reference" (default): the code is one way to meet the spec, and the
   * agent can rebuild the motion on the site's own element.
   * "required": the code is the motion (e.g. a WebGL shader), so the agent
   * uses it as written and only tunes props.
   */
  implementation?: "reference" | "required";
  /** Replaces the default "How to apply" bullets. */
  apply?: string[];
};

/**
 * An image or media slot the component expects the site to fill. No asset
 * files ship with the prompt, so these tell the agent what each slot needs
 * and what placeholder to use until the real asset exists. Strings can use
 * `{controlName}` tokens like the motion spec.
 */
export type AssetSlot = {
  /** Where it goes: a prop or array field, e.g. `src`, `tiles[].image`. */
  prop: string;
  /** What it shows, e.g. "Customer photo". Also labels the placeholder. */
  label: string;
  /** How the slot displays it, e.g. "fills a 301 / 360 frame (object-cover)". */
  fit: string;
  /** Placeholder size in px, about 2x the displayed size, e.g. "602x720". */
  placeholder: string;
  /** How to prepare the real asset: trimmed, white, transparent, raw photo... */
  notes?: string;
  optional?: boolean;
};

export type RegistryEntry = {
  slug: string;
  title: string;
  description: string;
  category: CategoryId;
  /** Group id inside the category, e.g. `button-hovers`. */
  group: string;
  /** How much of a page the component covers; shown as a label beside the title. */
  level: ComponentLevel;
  /** The live site the effect was taken from, linked on the component page and in the brief. */
  source?: string;
  /**
   * Set when the effect was recreated by studying the live site rather than
   * ported from its source code, e.g. because the site runs on a CMS like
   * WordPress. Names that platform; shown on the component page and in the brief.
   */
  recreated?: string;
  /** Exported component name, used in the usage snippet and prompt. */
  componentName: string;
  files: RegistryFile[];
  /** Props exposed in the Customize panel. */
  controls: Control[];
  /**
   * Shown at the top of the Customize panel's Motion group when the motion
   * has no duration or easing to tune, e.g. "Scroll-linked: the cards move
   * with the scroll position, so there's no duration or easing."
   */
  motionNote?: string;
  /** Fixed props always shown first in the usage snippet, e.g. `logos={logos}`. */
  usageProps?: string[];
  /** Children / text rendered inside the component in the usage snippet. */
  usageChildren?: string;
  /**
   * The animation spec the copied prompt leads with. Entries without one
   * still use the older install-style prompt.
   */
  motion?: MotionSpec;
  /**
   * Notes about the reference component (props, markup, setup gotchas).
   * Motion details belong in `motion`.
   */
  promptNotes?: string[];
  /** Image and media slots; the prompt turns them into an "Images and media" section. */
  assets?: AssetSlot[];
  dependencies?: string[];
  /**
   * Show the light/dark background toggle in the preview. Defaults to true;
   * set false for dark-only components so the preview stays on dark.
   */
  themeToggle?: boolean;
  /** Stage the preview starts on. Defaults to dark. */
  defaultTheme?: "light" | "dark";
  /** Let the preview fill the stage edge to edge (sections, not buttons). */
  fullBleed?: boolean;
};

export type Group = {
  id: string;
  title: string;
};

export type Category = {
  id: CategoryId;
  title: string;
  groups: Group[];
};
