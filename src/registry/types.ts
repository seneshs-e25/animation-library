/**
 * Registry types.
 *
 * Every animated component in the library is described by a `RegistryEntry`.
 * The entry is pure data (serializable) so it can be used on the server
 * (sidebar, static params, reading source files) and on the client
 * (customize panel, prompt generation).
 */

export type CategoryId = "interactions" | "animations" | "shaders";

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
) & {
  /** Include in the usage snippet even when left at its default value. */
  always?: boolean;
};

export type ControlValues = Record<string, string | number | boolean>;

export type RegistryFile = {
  /** File name the developer should create, e.g. `fill-sweep-button.tsx`. */
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

export type RegistryEntry = {
  slug: string;
  title: string;
  description: string;
  category: CategoryId;
  /** Group id inside the category, e.g. `button-hovers`. */
  group: string;
  /** The live site the effect was taken from, linked on the component page and in the brief. */
  source?: string;
  /** Exported component name, used in the usage snippet and prompt. */
  componentName: string;
  files: RegistryFile[];
  /** Props exposed in the Customize panel. */
  controls: Control[];
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
