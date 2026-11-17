import type { Category, ControlValues, RegistryEntry } from "./types";
import { easingOptions, easings } from "./motion";

export * from "./types";

/**
 * The three pillars of the library. Groups without entries show as
 * "Soon" in the sidebar until a component is registered for them.
 */
export const categories: Category[] = [
  {
    id: "interactions",
    title: "Interactions",
    groups: [
      { id: "button-hovers", title: "Button hovers" },
      { id: "image-hovers", title: "Image hovers" },
    ],
  },
  {
    id: "animations",
    title: "Animated sections",
    groups: [
      { id: "text-effects", title: "Text effects" },
      { id: "scroll-triggers", title: "Scroll triggers" },
      { id: "carousels", title: "Carousels" },
      { id: "pin-scrollers", title: "Pin scrollers" },
      { id: "tabs", title: "Tabs" },
      { id: "accordions", title: "Accordions" },
    ],
  },
  {
    id: "shaders",
    title: "Shaders",
    groups: [{ id: "backgrounds", title: "Backgrounds" }],
  },
];

/** Trigger wording shared by the button hovers. */
const hoverTrigger = (state: string) =>
  `Pointer hover, only on devices that really hover (\`@media (hover: hover)\`; Tailwind v4's \`hover:\` already does this). Keyboard focus (\`:focus-visible\`) shows the same ${state}. On touch there is no hover state; a tap just follows the link.`;

/** Interruption wording for hovers built on CSS transitions. */
const transitionInterruption = (what: string) =>
  `Use CSS transitions, not keyframe animations. If the pointer leaves mid-way, ${what} reverses from wherever it is, using the same duration and curve. It never jumps to the start or the end.`;

/** Checks every button hover shares, after its own hover check. */
const hoverChecks = (state: string) => [
  `Tab to the button: it shows the same ${state}, plus a visible focus outline.`,
  "Turn on reduced motion: the state changes instantly.",
  `On a touch device: tapping doesn't leave the button stuck in the ${state}.`,
];

/** The button hovers' press timing (a micro-interaction), shared by every button. */
const pressTimingControls = [
  { type: "number", name: "pressDuration", label: "Press", default: 160, min: 0, max: 400, step: 10, unit: "ms", secondary: true },
  { type: "select", name: "pressEase", label: "Press easing", default: easings.out, options: easingOptions, secondary: true },
] satisfies RegistryEntry["controls"];

/** Shared button timing: separate in/out duration and curve, plus a press. */
const buttonTimingControls = (d: { in: number; out: number; max?: number; ease?: string; exitEase?: string }) =>
  [
    { type: "select", name: "ease", label: "Easing in", default: d.ease ?? easings.out, options: easingOptions },
    { type: "number", name: "duration", label: "Duration in", default: d.in, min: 0, max: d.max ?? 1000, step: 10, unit: "ms" },
    { type: "select", name: "exitEase", label: "Easing out", default: d.exitEase ?? d.ease ?? easings.out, options: easingOptions },
    { type: "number", name: "exitDuration", label: "Duration out", default: d.out, min: 0, max: d.max ?? 1000, step: 10, unit: "ms" },
    { type: "number", name: "pressScale", label: "Press scale", default: 0.97, min: 0.9, max: 1, step: 0.01 },
    ...pressTimingControls,
  ] satisfies RegistryEntry["controls"];

/** Spec wording for the press timing (`pressTimingControls`). */
const pressTiming = "Press: {pressDuration}ms, `{pressEase}`, both ways.";

/** Spec wording that goes with `buttonTimingControls`. `what` is the moving part, e.g. "Fill". */
const buttonTiming = (what: string, exitNote = " Exits are quicker than entries so the button feels light when you leave it.") => [
  `${what} in: {duration}ms, easing \`{ease}\`.`,
  `${what} out: {exitDuration}ms, easing \`{exitEase}\`.${exitNote}`,
  pressTiming,
  "No delay.",
];
const buttonInterruption = (what: string) =>
  `Use CSS transitions, not keyframe animations. Set the exit timing on the rest state and the entry timing on the hover/focus state (a transition uses the timing of the state it's heading to). If the pointer leaves mid-way, ${what} reverses from wherever it is with the exit timing; it never jumps to the start or the end.`;
const pressState = "Press{pressScale|1= (off)|*=: on `:active` the whole button scales to `{pressScale}` and springs back on release}.";
const pressCheck = "Press it{pressScale|1= (press scale is off: nothing should scale)|*=: it dips to {pressScale} and comes back}.";
const noEaseIn = "Use the curves exactly as given. Never use an ease-in curve on a hover: it starts slow and feels late.";
const timingNote = "Timing is props: `duration`/`ease` for the way in, `exitDuration`/`exitEase` for the way out, `pressDuration`/`pressEase` for the press, and `pressScale` (1 turns the press off). Easings are any CSS timing function.";

/** Shared spec wording for the WebGL shader backgrounds. */
const shader = {
  trigger:
    "None: it starts when the section mounts and loops continuously while the canvas is on screen (or within 100px of it). Off screen the loop idles on its last frame, and scrolling back resumes from where it stopped. It's purely decorative and doesn't react to the pointer.",
  timing: [
    "A continuous loop with no start or end. Speed multiplier: {speed} (1 is the original pace{speed|0=; 0 freezes it on one frame|*=}).",
    "Each frame advances time by at most 0.1s, so coming back to a background tab doesn't jump the animation forward.",
    "{paused|true=`paused` is on: it renders one still frame and the loop stays idle.|*=}",
  ],
  interruption:
    "Nothing interrupts it. Prop changes apply live, without restarting the animation or the WebGL context. If the browser drops the WebGL context, it's rebuilt when the browser restores it.",
  reducedMotion:
    "Under `prefers-reduced-motion: reduce`, it holds a still frame instead of animating, and follows the setting live if it changes.",
  apply: [
    "Add the component file below as written, then render it as the background of the section I name (the hero if I don't name one). Keep that section's content, layout and text as they are.",
    "The section gets `position: relative`, `overflow: hidden` and `isolation: isolate`. The component goes in as its first child with `className=\"absolute inset-0 -z-10\"`, so it fills the section and sits behind the content.",
    "Give the section a solid background colour as well, as a fallback: without WebGL2 the canvas renders nothing.",
  ],
  rules: [
    "It's a Client Component (`\"use client\"`). It renders fine from a Server Component page in the Next.js App Router.",
    "Use at most a few per page, and one per section: each instance is a WebGL context, and browsers cap them (about 16).",
    "Don't add your own requestAnimationFrame loop, resize handler or IntersectionObserver around it; it already handles all three.",
  ],
  checks: [
    "Scroll it out of view and back: it resumes smoothly, and the browser's Performance panel shows no GPU work while it's off screen.",
    "Resize the window: it fills the section with no stretching, seams or blank edges.",
    "Turn on reduced motion: it shows a still frame.",
    "Block WebGL (or use a browser without WebGL2): the section still shows its fallback background, with no errors that break the page.",
  ],
};

/**
 * All components, in sidebar order. Add new entries here, then register the
 * preview in `previews.tsx`.
 */
export const registry: RegistryEntry[] = [
  {
    slug: "corner-bloom",
    title: "Corner bloom",
    description:
      "An ellipse blooms out of the bottom-right corner and floods the pill, used on Ironclad website",
    category: "interactions",
    group: "button-hovers",
    level: "atom",
    source: "https://ironcladapp.com/",
    componentName: "CornerBloomButton",
    files: [
      {
        name: "corner-bloom-button.tsx",
        path: "src/registry/interactions/button-hovers/corner-bloom-button.tsx",
      },
    ],
    usageProps: ['href=""'],
    usageChildren: "Request Demo",
    motion: {
      intent:
        "A hover state for a pill call-to-action. An ellipse in a second colour grows out of a point just past the bottom-right corner until it floods the whole pill, like ink spreading from the corner. It should feel calm and smooth: easing in gently, sweeping across, settling softly, never bouncy. In and out run at the same pace, and a slight press confirms the click.",
      trigger: hoverTrigger("flooded state"),
      states: [
        "Bloom: an ellipse (`border-radius: 50%`) behind the label, sized to the button plus 100px on each axis (`width/height: calc(100% + 100px)`) and positioned 50px outside the bottom-right corner (`right: -50px; bottom: -50px`). At full size it covers all four corners of the pill. At rest it is `scale(0)` with `transform-origin: bottom right`; when active it is `scale(1)`.",
        "Label and arrow: they keep their colour and don't move. The label colour has to read on both the resting colour and the bloom colour.",
        "Press{pressScale|1= (off)|*=: on `:active` the whole pill scales to `{pressScale}` and springs back on release}.",
        "Nothing else changes. The pill's size, padding and resting background stay the same.",
      ],
      timing: [
        "Bloom in: {duration}ms, easing `{ease}`.",
        "Bloom out: {exitDuration}ms, easing `{exitEase}`.",
        pressTiming,
        "No delay.",
      ],
      interruption:
        "Use CSS transitions, not keyframe animations. Set the exit timing on the rest state and the entry timing on the hover/focus state (a transition uses the timing of the state it's heading to). If the pointer leaves mid-bloom, it shrinks back from wherever it is with the exit timing; it never jumps to the start or the end.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, drop the movement but keep the change soft: the bloom sits at full size (`scale(1)`) with `opacity: 0`, and fades to `opacity: 1` over {reducedFade}ms `{reducedFadeEase}` on hover and focus. No press scale. Reduced motion means less motion, not a hard swap.",
      rules: [
        "Animate the bloom with `transform: scale` on its own absolutely positioned layer. Don't animate its width, height or border-radius: those trigger layout and paint every frame.",
        "The pill needs `overflow: hidden`, and a stacking context (`isolation: isolate`) with the bloom on a negative z-index. Also add `mask-image: radial-gradient(white, black)` on the pill: without it Safari doesn't clip a transforming child to the rounded corners.",
        "Give the bloom `pointer-events: none` so it never interferes with the hover.",
        "Use the curves exactly as given. Don't swap in a different curve or duration.",
      ],
      checks: [
        "Hover: the ellipse grows from just past the bottom-right corner over {duration}ms, starting to show straight away. At full size it covers the whole pill, including the rounded left end.",
        "Move the pointer off halfway: the bloom shrinks back from where it was, with no snap.",
        "Press it{pressScale|1= (press scale is off: nothing should scale)|*=: it dips to {pressScale} and comes back}.",
        "In Safari: the pill's rounded corners stay clipped while the bloom grows.",
        "Tab to the button: it shows the same flooded state, plus a visible focus outline.",
        "Turn on reduced motion: the bloom doesn't grow; the flooded colour fades in over {reducedFade}ms, and pressing doesn't scale.",
        "On a touch device: tapping doesn't leave the button stuck in the flooded state.",
      ],
    },
    controls: [
      { type: "color", name: "color", label: "Button color", default: "#308970" },
      { type: "color", name: "bloomColor", label: "Bloom color", default: "#1C212B" },
      { type: "color", name: "textColor", label: "Text color", default: "#F2F1EE" },
      { type: "select", name: "ease", label: "Easing in", default: easings.easeInOut, options: easingOptions },
      {
        type: "number",
        name: "duration",
        label: "Duration in",
        default: 400,
        min: 150,
        max: 1000,
        step: 10,
        unit: "ms",
      },
      { type: "select", name: "exitEase", label: "Easing out", default: easings.easeInOut, options: easingOptions },
      {
        type: "number",
        name: "exitDuration",
        label: "Duration out",
        default: 400,
        min: 100,
        max: 1000,
        step: 10,
        unit: "ms",
      },
      {
        type: "number",
        name: "pressScale",
        label: "Press scale",
        default: 0.97,
        min: 0.9,
        max: 1,
        step: 0.01,
      },
      ...pressTimingControls,
      { type: "number", name: "reducedFade", label: "Reduced-motion fade", default: 150, min: 0, max: 600, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "reducedFadeEase", label: "Reduced-motion easing", default: easings.ease, options: easingOptions, secondary: true },
      { type: "boolean", name: "arrow", label: "Arrow", default: true },
    ],
    promptNotes: [
      "It renders an <a>; pass `href` and any other anchor props. The arrow is optional (`arrow={false}`).",
      "The pill never grows wider than its container (`max-w-full`); a long label wraps and stays centred beside the arrow.",
      "The original uses the Moderat typeface; the component inherits the site's font.",
      "Timing is props: `duration`/`ease` for the way in, `exitDuration`/`exitEase` for the way out, `pressDuration`/`pressEase` for the press, `pressScale` (1 turns the press off), and `reducedFade`/`reducedFadeEase` for the reduced-motion fade. Easings are any CSS timing function.",
      "Deliberate change from the original's motion: it used one 400ms `ease-in-out` both ways and no press. This uses 300ms in on a strong ease-out, 200ms out on the drawer curve, and a press.",
    ],
  },
  {
    slug: "ghost-fill",
    title: "Ghost fill",
    description:
      "An outlined ghost pill snaps to a solid fill with brand-colored text, used on Sophos website",
    category: "interactions",
    group: "button-hovers",
    level: "atom",
    source: "https://www.sophos.com/en-us",
    componentName: "GhostFillButton",
    files: [
      {
        name: "ghost-fill-button.tsx",
        path: "src/registry/interactions/button-hovers/ghost-fill-button.tsx",
      },
    ],
    usageProps: ['href=""'],
    usageChildren: "Explore Sophos Fusion",
    themeToggle: false,
    motion: {
      intent:
        "A hover state for an outlined (ghost) pill button. The transparent pill fills solid and the label switches to the brand colour. It's a soft colour change that eases in and settles, never a flash. Leaving is quicker than arriving, and a slight press confirms the click.",
      trigger: hoverTrigger("filled state"),
      states: [
        "Background: transparent → the fill colour.",
        "Label: the outline colour → the hover text colour (the brand colour).",
        "Press{pressScale|1= (off)|*=: on `:active` the whole pill scales to `{pressScale}` and springs back on release}.",
        "The border keeps its colour and width. Nothing else moves or changes size.",
      ],
      timing: [
        "Fill in: {duration}ms, easing `{ease}`, for both the background and the label colour.",
        "Fill out: {exitDuration}ms, easing `{exitEase}`, for both. Exits are quicker than entries so the button feels light when you leave it.",
        pressTiming,
        "No delay: the background and the label change together.",
      ],
      interruption:
        "Use CSS transitions, not keyframe animations. Set the exit timing on the rest state and the entry timing on the hover/focus state (a transition uses the timing of the state it's heading to). The press keeps its own {pressDuration}ms timing in both. If the pointer leaves mid-fill, the colours reverse from wherever they are with the exit timing; they never jump.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, remove the colour transitions and the press scale, so the colours swap instantly. Keep the state change itself.",
      rules: [
        "Transition only `background-color`, `color` and the press scale, not `all`, so the focus outline, border and layout never animate.",
        "Use the curves exactly as given. Never use an ease-in curve on a hover: it starts slow and feels late.",
      ],
      checks: [
        "Hover: the pill fills and the label turns the brand colour over {duration}ms, with no flash or flicker.",
        "Move the pointer off halfway: the colours go back from where they were, quicker than they came in.",
        "Press it{pressScale|1= (press scale is off: nothing should scale)|*=: it dips to {pressScale} and comes back}.",
        ...hoverChecks("filled state"),
      ],
    },
    controls: [
      { type: "color", name: "color", label: "Outline & text", default: "#FFFFFF" },
      { type: "color", name: "fillColor", label: "Fill color", default: "#FFFFFF" },
      { type: "color", name: "hoverTextColor", label: "Hover text", default: "#2006F7" },
      { type: "select", name: "ease", label: "Easing in", default: easings.out, options: easingOptions },
      {
        type: "number",
        name: "duration",
        label: "Duration in",
        default: 300,
        min: 0,
        max: 1000,
        step: 10,
        unit: "ms",
      },
      { type: "select", name: "exitEase", label: "Easing out", default: easings.expo, options: easingOptions },
      {
        type: "number",
        name: "exitDuration",
        label: "Duration out",
        default: 210,
        min: 0,
        max: 1000,
        step: 10,
        unit: "ms",
      },
      {
        type: "number",
        name: "pressScale",
        label: "Press scale",
        default: 0.97,
        min: 0.9,
        max: 1,
        step: 0.01,
      },
      ...pressTimingControls,
    ],
    promptNotes: [
      "It renders an <a>; pass `href` and any other anchor props.",
      "Designed for dark or saturated backgrounds (the original sits on a blue gradient).",
      "The original uses Inter at weight 700; the component inherits the site's font.",
      timingNote,
      "Deliberate change from the original's motion: it used one 100ms `linear` swap both ways and no press. This uses 300ms in on a strong ease-out, 210ms out on an expo ease-out, and a press.",
    ],
  },
  {
    slug: "color-snap",
    title: "Color snap",
    description:
      "A deep green pill snaps to bright orange on hover, with a lighter press state, used on Ziing website",
    category: "interactions",
    group: "button-hovers",
    level: "atom",
    source: "https://www.ziing.com/",
    componentName: "ColorSnapButton",
    files: [
      {
        name: "color-snap-button.tsx",
        path: "src/registry/interactions/button-hovers/color-snap-button.tsx",
      },
    ],
    usageProps: ['href=""'],
    usageChildren: "Learn about our model",
    motion: {
      intent:
        "A hover and press state for a solid pill button. The background turns a bright accent on hover, and a lighter tint with a slight dip while pressed. The change is quick and crisp, easing out so it responds instantly and settles softly.",
      trigger:
        "Pointer hover, only on devices that really hover (`@media (hover: hover)`; Tailwind v4's `hover:` already does this), and keyboard focus (`:focus-visible`) show the hover colour. Pressing (`:active`) shows the pressed colour on every device, including touch.",
      states: [
        "Background: resting colour → hover colour on hover and focus → pressed colour while pressed.",
        pressState,
        "The label colour, size, padding and position never change.",
      ],
      timing: [
        ...buttonTiming("Colour"),
        "The pressed colour uses the press timing too ({pressDuration}ms), so pressing feels immediate.",
      ],
      interruption: buttonInterruption("the colour"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, remove the transitions and the press scale: the colours swap instantly.",
      rules: [
        "Only `background-color` and the press scale change. Don't add shadow or lift effects on hover or press.",
        noEaseIn,
      ],
      checks: [
        "Hover: the background turns the hover colour {duration|0=instantly|*=over {duration}ms}.",
        "Move the pointer off: the colour goes back quicker than it came in.",
        pressCheck,
        "Press and hold: the background turns the pressed colour; releasing returns it to the hover colour.",
        "Tab to the button: it shows the hover colour, plus a visible focus outline.",
        "On a touch device: tapping shows the pressed colour briefly and doesn't leave the hover colour stuck.",
      ],
    },
    controls: [
      { type: "color", name: "color", label: "Button color", default: "#1C453B" },
      { type: "color", name: "hoverColor", label: "Hover color", default: "#FF6300" },
      { type: "color", name: "activeColor", label: "Pressed color", default: "#FFB350" },
      { type: "color", name: "textColor", label: "Text color", default: "#FFFFFF" },
      ...buttonTimingControls({ in: 200, out: 150, max: 600 }),
    ],
    promptNotes: [
      "It renders an <a>; pass `href` and any other anchor props.",
      "The original uses Montserrat at weight 600 (Google Font); the component inherits the site's font.",
      timingNote,
      "Deliberate change from the original's motion: it swapped colours instantly with no press. This eases the colour in over 200ms and out over 150ms on a strong ease-out, and adds a press. Set `duration={0}` and `exitDuration={0}` for the original instant swap.",
    ],
  },
  {
    slug: "circle-reveal",
    title: "Circle reveal",
    description:
      "A plum-to-pink gradient opens out of the center of the pill as an expanding circle, used on Seemplicity website",
    category: "interactions",
    group: "button-hovers",
    level: "atom",
    source: "https://seemplicity.ai/",
    componentName: "CircleRevealButton",
    files: [
      {
        name: "circle-reveal-button.tsx",
        path: "src/registry/interactions/button-hovers/circle-reveal-button.tsx",
      },
    ],
    usageProps: ['href=""'],
    usageChildren: "Explore More",
    themeToggle: false,
    motion: {
      intent:
        "A hover state for a pill call-to-action. A diagonal gradient opens out of the centre of the pill as an expanding circle until it covers the whole button. It should feel smooth and even, with a gentle ease, never bouncy.",
      trigger: hoverTrigger("revealed state"),
      states: [
        "Gradient layer: covers the button behind the label, filled with `linear-gradient(315deg, <from> 0%, <to> 100%)`. At rest it is clipped to `clip-path: circle(0% at 50% 50%)`; when active it is `circle(100% at 50% 50%)`. A percentage radius is measured against the box's diagonal, so 100% reaches every corner whatever the button's width.",
        "Label: it keeps its colour and doesn't move.",
        "Nothing else changes. The pill's size, padding and resting background stay the same.",
      ],
      timing: [
        "Duration: {duration}ms, in and out.",
        "Easing: `{easing}`, in and out.",
        "No delay.",
      ],
      interruption: transitionInterruption("the circle"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, remove the transition so the gradient appears instantly on hover and focus. Keep the state change itself.",
      rules: [
        "Animate `clip-path: circle()` on the gradient layer. Don't scale a circle element instead: on a wide pill it either leaves the ends uncovered or needs an oversized element.",
        "The pill needs `overflow: hidden`, and a stacking context (`isolation: isolate`) with the gradient layer on a negative z-index and `pointer-events: none`.",
      ],
      checks: [
        "Hover: the circle opens from the exact centre over {duration}ms and covers both rounded ends.",
        "Try a long label (a wide pill): the circle still covers the whole button at full size.",
        "Move the pointer off halfway: the circle closes from where it was, with no snap.",
        ...hoverChecks("revealed state"),
      ],
    },
    controls: [
      { type: "color", name: "color", label: "Button color", default: "#E3308C" },
      { type: "color", name: "gradientFrom", label: "Gradient from", default: "#410051" },
      { type: "color", name: "gradientTo", label: "Gradient to", default: "#E3308C" },
      { type: "color", name: "textColor", label: "Text color", default: "#FFFFFF" },
      {
        type: "number",
        name: "duration",
        label: "Duration",
        default: 500,
        min: 200,
        max: 1000,
        step: 10,
        unit: "ms",
      },
      { type: "select", name: "easing", label: "Easing", default: "cubic-bezier(0.4, 0, 0.2, 1)", options: easingOptions },
    ],
    promptNotes: [
      "It renders an <a>; pass `href` and any other anchor props.",
      "The pill never grows wider than its container (`max-w-full`), and a long label wraps onto a second centred line instead of overflowing.",
      "Designed for dark backgrounds (the original sits on #0B0623).",
      "The original uses Mona Sans at weight 700 (Google Font); the component inherits the site's font.",
    ],
  },
  {
    slug: "outline-sweep",
    title: "Outline sweep",
    description:
      "An outlined pill fills from the left with a rounded sweep while the label flips to white, used on eight25 website",
    category: "interactions",
    group: "button-hovers",
    level: "atom",
    source: "https://www.eight25media.com/",
    componentName: "OutlineSweepButton",
    defaultTheme: "light",
    files: [
      {
        name: "outline-sweep-button.tsx",
        path: "src/registry/interactions/button-hovers/outline-sweep-button.tsx",
      },
    ],
    usageProps: ['href=""'],
    usageChildren: "Read our blog",
    motion: {
      intent:
        "A hover state for an outlined pill button. A solid, pill-shaped fill sweeps in from the left and keeps its rounded leading edge. The label flips colour exactly at the fill's edge, so it's crisp and readable at every point of the sweep. It eases in and out evenly, like the original; leaving is quicker than arriving, and a slight press confirms the click.",
      trigger: hoverTrigger("filled state"),
      states: [
        "Filled layer: a copy of the label on the solid fill, covering the button including its 1px border (`inset: -1px`, with 1px more horizontal padding so its label sits exactly on the real one), with fully rounded corners. At rest it is `clip-path: inset(0 100% 0 0 round 9999px)` (hidden to the left); when active it is `clip-path: inset(0 0 0 0 round 9999px)`. One clip reveals the fill and its label together, so the label colour changes exactly at the fill's edge, never as a fade.",
        "Label at rest: the button's own label stays as it is underneath. It never changes colour.",
        pressState,
        "The border, size and padding stay the same. Nothing else moves.",
      ],
      timing: buttonTiming("Fill"),
      interruption: buttonInterruption("the fill"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, remove the clip transition and the press scale so the filled state appears instantly on hover and focus. Keep the state change itself.",
      rules: [
        "Reveal the fill with `clip-path: inset(... round 9999px)`. Don't use `scaleX`, which squashes the rounded end into an oval, and don't animate `width`, which triggers layout every frame.",
        "The filled layer is `aria-hidden`. The button needs `overflow: hidden` and `isolation: isolate`. Don't animate the label's `color`: a colour fade leaves it low-contrast mid-sweep.",
        noEaseIn,
      ],
      checks: [
        "Hover: the fill sweeps in from the left over {duration}ms, with a rounded leading edge the whole way.",
        "The label is split cleanly at the fill's edge the whole way, with no faded or low-contrast moment.",
        "Move the pointer off halfway: the fill goes back from where it was, quicker than it came in, with no snap.",
        pressCheck,
        ...hoverChecks("filled state"),
      ],
    },
    controls: [
      { type: "color", name: "color", label: "Outline & text", default: "#6B00DF" },
      { type: "color", name: "fillColor", label: "Fill color", default: "#6B00DF" },
      { type: "color", name: "hoverTextColor", label: "Hover text", default: "#FFFFFF" },
      ...buttonTimingControls({ in: 300, out: 200, ease: easings.easeInOut }),
    ],
    promptNotes: [
      "It renders an <a>; pass `href` and any other anchor props.",
      "The original uses the licensed Lota Grotesque at weight 400; the closest Google Font is Hanken Grotesk. The component inherits the site's font.",
      timingNote,
      "The fill uses the original's `ease-in-out` curve and its 300ms on the way in. Three deliberate changes: the way out is quicker (200ms, the original used 300ms); the original faded the label over 700ms on an ease-in-out quint, which leaves it purple on purple mid-sweep, so this flips it exactly at the fill's edge; and it adds a press.",
    ],
  },
  {
    slug: "zoom-image-card",
    title: "Zoom image card",
    description:
      "Hovering the customer tile slowly grows its photo inside a fixed rounded frame while the logo holds still, used on NetApp AI website",
    category: "interactions",
    group: "image-hovers",
    level: "box",
    source: "https://netapp.ai/evaluate/customer-results/",
    componentName: "ZoomImageCard",
    defaultTheme: "light",
    files: [
      {
        name: "zoom-image-card.tsx",
        path: "src/registry/interactions/image-hovers/zoom-image-card.tsx",
      },
    ],
    usageProps: ['href=""', 'src="/images/ducati.webp"', 'logo="/images/ducati-logo.svg"', 'logoAlt="Ducati"'],
    motion: {
      intent:
        "A hover state for a linked customer tile: a photo in a rounded frame with a logo in its corner. Hovering the card slowly grows the photo inside the frame: the picture moves, the frame and logo don't. It should feel calm and barely there, an invitation to click rather than a jump.",
      trigger:
        "Pointer hover on the card, only on devices that really hover (`@media (hover: hover)`; Tailwind v4's `hover:` already does this). Keyboard focus on the card (`:focus-visible`) shows the same zoom. On touch there is no zoom; a tap just follows the link.",
      states: [
        "Photo: `scale(1)` at rest → `scale({scale})` when active, from the centre (the default `transform-origin`).",
        "Frame: keeps its size and rounded corners and clips the growing photo.",
        "{scrim|true=Corner scrim (a black gradient in the top-left behind the logo) and logo: they sit above the photo and don't move or zoom.|*=Logo: sits above the photo and doesn't move or zoom.}",
      ],
      timing: [
        "Duration: {duration}ms, in and out.",
        "Easing: `{easing}`.",
        "No delay.",
      ],
      interruption: transitionInterruption("the zoom"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the photo doesn't zoom at all: it stays at `scale(1)` on hover and focus (gate the scale with `motion-safe:`). Don't swap the zoom for an instant jump.",
      rules: [
        "The whole card is one link and the hover is on the link, so focus and hover share one trigger.",
        "Animate the photo with `transform: scale`. Don't animate its width, height or `background-size`.",
        "The frame needs `overflow: hidden` plus `isolation: isolate`; without the isolation, Safari loses the rounded corners while the photo is transformed.",
        "Put the scrim and logo in the frame above the photo, not inside the scaled element, so they hold still.",
        "If the site has its own Image component, put the transition on the element that renders the photo and keep it filling the frame with `object-fit: cover`.",
      ],
      checks: [
        "Hover the card: the photo grows to {scale}× over {duration}ms, and the logo doesn't move.",
        "The frame's rounded corners stay rounded while the photo grows, including in Safari.",
        "Move the pointer off halfway: the photo shrinks back from where it was, with no snap.",
        "Tab to the card: the photo zooms and the card shows a visible focus outline.",
        "Turn on reduced motion: the photo doesn't zoom.",
        "On a touch device: tapping doesn't leave the photo stuck zoomed.",
      ],
    },
    controls: [
      { type: "number", name: "scale", label: "Zoom scale", default: 1.07, min: 1, max: 1.2, step: 0.01 },
      { type: "number", name: "duration", label: "Duration", default: 350, min: 100, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "easing", label: "Easing", default: easings.cssOut, options: easingOptions },
      { type: "number", name: "radius", label: "Corner radius", default: 20, min: 0, max: 40, step: 1, unit: "px" },
      {
        type: "select",
        name: "aspectRatio",
        label: "Aspect ratio",
        default: "301 / 360",
        options: [
          { label: "301:360 (desktop)", value: "301 / 360" },
          { label: "330:360 (mobile)", value: "330 / 360" },
          { label: "4:3", value: "4 / 3" },
          { label: "16:9", value: "16 / 9" },
        ],
      },
      { type: "boolean", name: "scrim", label: "Corner scrim", default: true },
    ],
    assets: [
      {
        prop: "src",
        label: "Customer photo",
        fit: "Fills the frame at `aspectRatio` ({aspectRatio}) with object-cover",
        placeholder: "602x720",
      },
      {
        prop: "logo",
        label: "Customer logo",
        fit: "Sits 30px in from the frame's top-left, at most 205px wide and 60px tall",
        placeholder: "410x120",
        notes: "Use a white logo, trimmed, on a transparent background: it sits on the dark corner scrim.",
        optional: true,
      },
    ],
    promptNotes: [
      "The whole card is one <a>: hovering anywhere on it (or keyboard focus) zooms the photo. Pass `href` and any other anchor props.",
      "`logo` and `logoAlt` are optional; the logo sits 30px in from the frame's top-left, capped at 60px tall and 205px wide. Use a white logo with the scrim on (`scrim`, default true), which darkens that corner.",
      "Other props: `frameColor` (shows under the photo while it loads and colours the focus ring, default NetApp's #0054D7), `alt`.",
      "The frame is fluid: it fills its column and keeps `aspectRatio`. The original uses 301 / 360 in its grid and 330 / 360 in the single-column mobile layout.",
      "It renders plain <img> tags. If the site has its own Image component (e.g. components/common/Image), swap it in for the photo with fill/object-cover and keep the transition and scale classes on it.",
      "No client JavaScript, so it works in a Server Component.",
    ],
  },
  {
    slug: "video-hover-card",
    added: "2026-11-17",
    title: "Video hover card",
    description:
      "A customer-story tile that shows a still photo until hovered, then crossfades into a muted looping video that grows slightly, used on Miro website",
    category: "interactions",
    group: "image-hovers",
    level: "box",
    source: "https://miro.com/",
    recreated: "Framer",
    componentName: "VideoHoverCard",
    defaultTheme: "light",
    files: [
      {
        name: "video-hover-card.tsx",
        path: "src/registry/interactions/image-hovers/video-hover-card.tsx",
      },
    ],
    usageProps: [
      'video="/videos/pepsico.mp4"',
      'poster="/images/pepsico.jpg"',
      'stat="3.6x"',
      'label="faster time to market"',
      'logo="/images/pepsico-logo.svg"',
      'logoAlt="PepsiCo"',
    ],
    motion: {
      intent:
        "A hover state for a customer-story tile. At rest it's a still photo with a big stat and a logo over it. Hovering brings it to life: the still crossfades into a muted, looping video of the same scene, which grows slightly from its bottom edge. Leaving pauses the clip where it is and the still fades back. It should feel like the photo starts moving, not like a new layer appearing.",
      trigger:
        "Pointer hover on the card, on devices that really hover. Keyboard focus (`:focus-visible`) does the same. On touch screens (`hover: none`){autoplayOnTouch|true=, the video plays while at least half the card is on screen and pauses when it leaves|*=, nothing plays and the still stays}.",
      states: [
        "Video: under the still, `muted loop playsinline`. Rest: paused, `scale: 1`. Active: playing, `scale: {zoom}` from its bottom centre (`transform-origin: bottom`).",
        "Still: over the video. Rest: `opacity: 1`. Active: `opacity: 0`, but only once the video has fired `playing`, so a slow load keeps showing the still instead of a black frame.",
        "Leaving: the video pauses without rewinding (the next hover resumes the clip), the still fades back to 1 and the video shrinks back to 1.",
        "{scrim|true=A top scrim (rgba(18,18,18,0.25) fading to transparent over the top 35%), the stat, label|*=The stat, label} and logo sit above both layers and never move.",
      ],
      timing: [
        "Crossfade and zoom: {duration}ms, `{easing}`, in and out, together. No delay.",
        "Playback starts on pointer enter; the fade waits for the `playing` event (usually a frame or two once the clip is buffered).",
      ],
      interruption: transitionInterruption("the crossfade and zoom"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, there's no zoom and no autoplay on touch. Hover still plays the video and crossfades, since that playback is user-initiated.",
      rules: [
        "Animate only `opacity` on the still and `scale` (or `transform`) on the video. In Tailwind v4, `scale-*` sets the `scale` property, so the transition must list `scale`, not `transform`.",
        "Use `preload=\"metadata\"` so cards don't download every clip up front; the still covers the video until it plays.",
        "Call `play()` and catch its rejected promise (autoplay policies, rapid hover in/out).",
        "The card clips with `overflow: hidden` plus `isolation: isolate`, so the rounded corners hold while the video scales in Safari.",
      ],
      checks: [
        "Hover a card: the clip starts, the still fades out over {duration}ms and the video grows to {zoom}× from its bottom edge. The stat and logo don't move.",
        "Leave and hover again: the clip resumes where it paused, not from the start.",
        "Throttle the network and hover: the still stays until the video is playing; no black flash.",
        "Tab to the card: it plays and shows a focus outline; tab away: it pauses.",
        "On a phone: {autoplayOnTouch|true=the clip plays when the card scrolls into view and pauses when it leaves|*=the still stays}.",
        "Turn on reduced motion: no zoom; hover still crossfades to the video.",
      ],
    },
    controls: [
      { type: "number", name: "zoom", label: "Video zoom", default: 1.05, min: 1, max: 1.2, step: 0.01 },
      { type: "number", name: "duration", label: "Duration", default: 400, min: 100, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "easing", label: "Easing", default: easings.out, options: easingOptions },
      { type: "number", name: "radius", label: "Corner radius", default: 12, min: 0, max: 40, step: 1, unit: "px" },
      {
        type: "select",
        name: "aspectRatio",
        label: "Aspect ratio",
        default: "304 / 481",
        options: [
          { label: "304:481 (original)", value: "304 / 481" },
          { label: "3:4", value: "3 / 4" },
          { label: "1:1", value: "1 / 1" },
          { label: "16:9", value: "16 / 9" },
        ],
      },
      { type: "boolean", name: "scrim", label: "Top scrim", default: true },
      { type: "boolean", name: "autoplayOnTouch", label: "Autoplay on touch", default: true },
    ],
    assets: [
      {
        prop: "video",
        label: "Customer clip",
        fit: "Fills the card at {aspectRatio} (object-cover), scaled to {zoom}× on hover",
        placeholder: "720x1280 MP4",
        notes: "A short (10–20s) silent loop, H.264 MP4, ideally under 3MB. It's cropped to the card, so keep the subject centred. It needs no sound; it's always muted.",
      },
      {
        prop: "poster",
        label: "Still frame",
        fit: "Fills the card at {aspectRatio} (object-cover), over the video",
        placeholder: "608x962",
        notes: "Use the clip's first frame (or a frame from it) so the crossfade reads as the photo starting to move.",
      },
      {
        prop: "logo",
        label: "Customer logo",
        fit: "24px in from the bottom-left, at most 158px wide and 56px tall",
        placeholder: "316x112",
        notes: "White, trimmed, on a transparent background.",
        optional: true,
      },
    ],
    promptNotes: [
      "It renders an <a>; pass `href` and any other anchor props. The whole card is the hover target.",
      "`stat` and `label` sit 24px in from the top-left in white: the original's stat is 48px / 1.2 and the label 16px / 1.2. Miro's font is Roobert (licensed); Inter Tight is the closest Google Font. The component inherits the site's font.",
      "The original lays three cards in a row, 24px apart, under a centred heading.",
      "It is a Client Component (\"use client\"): it calls play()/pause() and, on touch screens, uses an IntersectionObserver.",
      "It renders a plain <img> for the still and logo. If the site has its own Image component, use it for the still and keep the opacity transition on it.",
    ],
  },
  {
    slug: "reveal-link-card",
    title: "Reveal link card",
    description:
      "Hovering the image tile lifts it and fades up a Learn More link over a rising gradient, used on Qlik website",
    category: "interactions",
    group: "image-hovers",
    level: "box",
    source: "https://www.qlik.com/us",
    componentName: "RevealLinkCard",
    defaultTheme: "light",
    files: [
      {
        name: "reveal-link-card.tsx",
        path: "src/registry/interactions/image-hovers/reveal-link-card.tsx",
      },
    ],
    usageProps: ['href=""', 'src="/images/catalog-tile.png"'],
    motion: {
      intent:
        "A hover state for a tall image tile that links somewhere. At rest the tile shows only its image and title. On hover a \"{linkLabel}\" link fades up from the bottom over a rising gradient{lift|true=, and the whole card lifts slightly|*=}. Three layers move on two timings, so it feels layered and soft rather than a single snap.",
      trigger:
        "Pointer hover anywhere on the card, only on devices that really hover (`@media (hover: hover)`; Tailwind v4's `hover:` already does this). Keyboard focus on the card (`:focus-visible`) shows the same revealed state. On devices without hover (`@media (hover: none)`, i.e. touch), the label and gradient are always shown, so the link is never hidden.",
      states: [
        "Link label: `opacity: 0; transform: translateY(5px)` at rest → `opacity: 1; translateY(0)` when active. It sits 22px from the bottom and 20px from the left.",
        "Chevron after the label: `translateX(0)` → `translateX(4px)`, a small nudge to the right.",
        "Gradient: a layer 60% of the card's height, pinned to the bottom, in the card colour: solid for its bottom 20%, fading to transparent at the top (`linear-gradient(0deg, <card colour>, <card colour> 20%, transparent)`). `opacity: 0.5; translateY(30px)` at rest → `opacity: 1; translateY(0)` when active. It keeps the label readable over the image.",
        "{lift|true=Card: `translateY(0)`, no shadow → `translateY(-2px)` with `box-shadow: 0 18px 20px rgba(97, 97, 97, 0.4)`.|*=Card: it doesn't lift or get a shadow; only the gradient and the label move.}",
        "The image and the title stay still.",
      ],
      timing: [
        "Label and chevron: {duration}ms, easing `{easing}`.",
        "Gradient in: its rise takes {duration}ms, with the label, but its opacity takes {gradientFade}ms, both easing `{easing}`. Give the two properties separate durations on the hover state (`transition-duration: {gradientFade}ms, {duration}ms` for `opacity, transform`), so the colour keeps washing in softly after the label has landed.",
        "Gradient out: opacity and rise both take twice the label's duration ({duration}ms × 2), easing `{easing}`. Set this on the resting state, so it applies when the pointer leaves.",
        "{lift|true=Card lift and shadow: {duration}ms, easing `{easing}`.|*=No card lift.}",
        "Everything starts together, with no delay or stagger.",
      ],
      interruption: transitionInterruption("each layer"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, nothing moves: no rise, no nudge{lift|true=, no lift|*=}. The label and gradient keep their opacity fade, so the link still appears on hover.",
      rules: [
        "The whole card is one link, and the hover is on the card, so every layer reacts wherever the pointer enters it.",
        "Animate only `opacity` and `transform` on the label, chevron and gradient. Don't animate `height`, `bottom` or the gradient stops.",
        "The card needs `overflow: hidden` so the gradient's 30px resting offset is clipped, and a stacking context (`isolation: isolate`) with the image on a negative z-index.",
        "Give the gradient `pointer-events: none`.",
        "Don't hide the label on touch: show the label and gradient at full opacity under `@media (hover: none)`.",
      ],
      checks: [
        "Hover: the label fades up 5px and the chevron nudges right over {duration}ms; the gradient rises with them but keeps deepening until {gradientFade}ms.",
        "Move the pointer off halfway: every layer goes back from where it was, with no snap.",
        "Tab to the card: the same reveal happens, plus a visible focus ring.",
        "Turn on reduced motion: the label and gradient fade in, but nothing moves.",
        "On a touch device: the label and gradient are visible without tapping.",
      ],
    },
    controls: [
      { type: "text", name: "title", label: "Title", default: "Business continuity", always: true },
      { type: "text", name: "linkLabel", label: "Link label", default: "Learn More" },
      { type: "color", name: "color", label: "Card color", default: "#0E2219" },
      { type: "color", name: "textColor", label: "Text color", default: "#FFFFFF" },
      { type: "boolean", name: "lift", label: "Lift on hover", default: true },
      { type: "number", name: "duration", label: "Duration", default: 300, min: 100, max: 1200, step: 10, unit: "ms" },
      { type: "number", name: "gradientFade", label: "Gradient fade", default: 1000, min: 200, max: 2000, step: 50, unit: "ms" },
      { type: "select", name: "easing", label: "Easing", default: easings.cssOut, options: easingOptions },
    ],
    assets: [
      {
        prop: "src",
        label: "Tile art",
        fit: "Fills the card at `aspectRatio` (default 220 / 280) with object-cover",
        placeholder: "440x560",
        notes: "Bake any background into the art, or keep it transparent so `color` shows through.",
      },
    ],
    promptNotes: [
      "The whole card is one <a>; pass `href` and any other anchor props. Keyboard focus triggers the same reveal as hover.",
      "The card is fluid: `width` (default 220) is a maximum, so it shrinks in a narrower column, and the height follows `aspectRatio` (default \"220 / 280\", the original; e.g. \"220 / 411\" for the tall variant). Pass `width=\"fill\"` to fill a grid cell. Corners are 14px. The image fills the card with object-cover, so export tile art at that ratio with any background baked in, or transparent to let `color` show through.",
      "No client JavaScript, so it works in a Server Component.",
      "It renders a plain <img>. If the site has its own Image component (e.g. components/common/Image), swap it in with fill/object-cover and keep the `absolute inset-0 -z-10` classes.",
      "The original uses Inter; the component inherits the site's font.",
    ],
  },
  {
    slug: "rising-copy-card",
    title: "Rising copy card",
    description:
      "Hovering the image tile zooms its art and carries the headline from the foot of the card to the top, used on NetApp AI website",
    category: "interactions",
    group: "image-hovers",
    level: "box",
    source: "https://netapp.ai/evaluate/customer-results/",
    componentName: "RisingCopyCard",
    defaultTheme: "light",
    files: [
      {
        name: "rising-copy-card.tsx",
        path: "src/registry/interactions/image-hovers/rising-copy-card.tsx",
      },
    ],
    usageProps: ['href=""', 'src="/images/story-tile.webp"'],
    motion: {
      intent:
        "A hover state for a linked story tile: art, a big headline and a CTA. At rest the headline sits at the foot of the card just above the CTA. On hover the art slowly zooms, the headline travels up to the top of the card and an optional description opens under it, the CTA stays at the foot, and the art takes on a colour tint. Everything moves together on one long ease-out, so it feels like a single calm shift rather than separate effects.",
      trigger:
        "Pointer hover anywhere on the card, only on devices that really hover (`@media (hover: hover)`; Tailwind v4's `hover:` already does this). Keyboard focus on the card (`:focus-visible`) shows the same state. On touch nothing changes: the card shows its resting state and a tap follows the link.",
      states: [
        "Art: `scale(1)` at rest → `scale({scale})` when active, from the centre. The card keeps its size and rounded corners and clips the growing art.",
        "Headline block: at the foot of the card, 30px above the CTA → at the top of the card, at the card's 40px padding. The CTA row does not move.",
        "Description (optional): a row under the headline, collapsed at rest (`grid-template-rows: 0fr`) → open to its natural height (`1fr`), with 15px above the copy. Its copy fades `opacity: 0 → 1`. Nothing clips the copy, so at rest it hangs below the headline (over the CTA, cut off by the card) and rises with it, still mostly transparent as it crosses the CTA.",
        "Copy scrim: a 240° gradient from transparent (first 25%) to `rgba(0,0,0,0.35)`, behind the copy, `opacity: 1 → 0`.",
        "Tint: a 233° gradient from transparent (-6%) to {tint} (105%) in `mix-blend-mode: hue`, `opacity: 0 → 1`. The hue blend turns the art toward the tint without darkening it.",
        "CTA chip (20px disc with an arrow): dark `#2A2A2A` → a #0054D7 to #00DDF4 gradient. It swaps instantly, with no transition, like the original's sprite swap.",
      ],
      timing: [
        "Duration: {duration}ms for the zoom, the headline's travel, the description row, and both fades.",
        "Easing: `{easing}` for all of them. The original uses `cubic-bezier(0, 0, 0.2, 1)` (Tailwind's `ease-out`).",
        "Everything starts together, with no delay or stagger.",
      ],
      interruption: transitionInterruption("every part"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, remove the transitions so the headline and description jump straight to their hover positions, and don't zoom the art at all. The fades and the chip still change, instantly.",
      rules: [
        "The whole card is one link, and the hover is on the card, so everything reacts wherever the pointer enters it.",
        "Move the headline with two flex spacers, not `justify-content` (it can't animate) and not a transform (the travel depends on the card and copy height). The card is a flex column: an empty spacer above the copy with `flex-grow: 1 → 0`, and one above the CTA with `flex-basis: 30px; flex-grow: 0 → 1`. The two factors always add up to 1, so the copy moves in a straight line.",
        "Open the description with a `grid-template-rows: 0fr → 1fr` row whose child has `min-height: 0` and no padding (padding can't collapse, so it would leave a gap at rest). Don't use a guessed `max-height`.",
        "Zoom the art with `transform: scale` on the image. The card needs `overflow: hidden` and `isolation: isolate`, so the zoom stays inside the rounded corners in Safari and the hue blend only mixes with the card's own art.",
        "Without a CTA, leave out the lower spacer too, or its 30px lifts the copy off the foot at rest.",
      ],
      checks: [
        "Hover: over {duration}ms the art zooms to {scale}× while the headline travels to the top and the CTA stays put; a description, if passed, opens under the headline and fades in.",
        "The headline moves in one straight line, with no jump at the start or end.",
        "Move the pointer off halfway: everything goes back from where it was, with no snap.",
        "Tab to the card: the same state shows, plus a visible focus outline.",
        "Turn on reduced motion: the copy jumps to its hover position and the art doesn't zoom.",
        "On a touch device: tapping doesn't leave the card stuck in its hover state.",
      ],
    },
    controls: [
      { type: "text", name: "title", label: "Title", default: "Unleashing imagination with data – petabytes at a time", always: true },
      { type: "text", name: "description", label: "Description", default: "" },
      { type: "text", name: "ctaLabel", label: "CTA label", default: "Learn More", always: true },
      { type: "number", name: "scale", label: "Zoom scale", default: 1.1, min: 1, max: 1.3, step: 0.01 },
      { type: "number", name: "duration", label: "Duration", default: 500, min: 200, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "easing", label: "Easing", default: "cubic-bezier(0, 0, 0.2, 1)", options: easingOptions },
      { type: "color", name: "tint", label: "Hover tint", default: "#25006D" },
      {
        type: "select",
        name: "height",
        label: "Card height",
        default: "360",
        options: [
          { label: "360px (short)", value: "360" },
          { label: "426px (mobile)", value: "426" },
          { label: "560px (tall)", value: "560" },
        ],
      },
    ],
    assets: [
      {
        prop: "src",
        label: "Card photo",
        fit: "Fills the whole card (fluid width, `height` tall) with object-cover",
        placeholder: "800x720",
        notes: "White copy rises over it, so a photo that's darker towards the bottom reads best.",
      },
    ],
    promptNotes: [
      "The whole card is one <a>; pass `href` and any other anchor props. Keyboard focus triggers the same state as hover.",
      "`height` is a number in px (the original's tiles are 355×360, 355×560 and 270×426 on mobile). `width` (default 355) is a maximum, so the card shrinks in a narrower column; pass `width=\"fill\"` to fill a grid cell. The headline drops from 40px to 32px when the card is narrower than 320px (a container query on its content box).",
      "`description` is optional. On touch it never opens, so don't put anything there the reader needs. Pick a `height` that fits the headline, the open description and the CTA inside the padding; with a long headline and a description, use the tall card (560).",
      "Other props: `easing`, `color` (card background under the art), `chipFrom` / `chipTo` (the CTA chip's hover gradient), `radius` (20), `padding` (40), `titleAs` (default h3).",
      "The original tints each tile differently by position: #25006D, #540063, #182F00. Pass `tint` per card to do the same.",
      "No client JavaScript, so it works in a Server Component.",
      "It renders a plain <img>. If the site has its own Image component (e.g. components/common/Image), swap it in with fill/object-cover and keep the transition and scale classes on it.",
      "Original typography: F37 Judge (licensed), headline 40px / 1.1 weight 100 with -0.4px tracking (32px below the xxl breakpoint), CTA label 16px / 1.6 weight 100 with 0.32px tracking. The component uses weight 300 and inherits the site's font; the demo uses Inter Tight as the closest Google Font.",
    ],
  },
  {
    slug: "bento-grid",
    title: "Bento grid",
    description:
      "Five image cards in a bento layout; hovering a linked card slowly zooms its art and lights up its CTA chip, used on NetApp AI website",
    category: "interactions",
    group: "image-hovers",
    level: "section",
    source: "https://netapp.ai/technology/ai-data-security-governance/",
    componentName: "BentoGrid",
    defaultTheme: "light",
    files: [
      {
        name: "bento-grid.tsx",
        path: "src/registry/interactions/image-hovers/bento-grid.tsx",
      },
    ],
    usageProps: ["tiles={tiles}"],
    fullBleed: true,
    motion: {
      intent:
        "A bento of five image cards linking to related content. Hovering a linked card slowly zooms its art inside the rounded card, and a light card's frosted CTA chip turns bright. The card, its copy and its neighbours stay put, so it feels calm: an invitation to click, not a jump.",
      trigger:
        "Pointer hover anywhere on a linked card, only on devices that really hover (`@media (hover: hover)`; Tailwind v4's `hover:` already does this). Keyboard focus on the card (`:focus-visible`) shows the same state. Cards without a link don't react.",
      states: [
        "Art: `scale(1)` at rest → `scale({scale})` when active, from the centre. The card keeps its size and rounded corners and clips the growing art.",
        "CTA chip on light (white-copy) cards: a frosted glass disc → a #0054D7 to #00DDF4 gradient disc. It swaps instantly, with no transition, as the original's sprite swap does. Dark-copy cards keep their dark disc.",
        "Copy, card size and the grid don't change.",
      ],
      timing: [
        "Zoom: {duration}ms, in and out.",
        "Easing: `{easing}`, in and out.",
        "No delay.",
      ],
      interruption: transitionInterruption("the zoom"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the art doesn't zoom at all (gate the scale with `motion-safe:`). The chip still swaps.",
      responsive:
        "From 900px of container width: a 3-column grid (422fr 398fr 402fr) with rows 203.5px, 203.5px, 165px and 10px gaps. Tile 1 spans all three rows of column 1; tile 2 spans two rows of column 2; tiles 3 and 4 stack in column 3; tile 5 spans columns 2–3 on the bottom row. Copy sits at the top on tiles 2 and 3, at the bottom on the rest. Below 900px the cards stack 20px apart with minimum heights 592, 417, 204, 204 and 165px, and the corners halve to 10px. (The original switches at the 992px viewport breakpoint and only zooms from 1280px.)",
      rules: [
        "Each linked card is one link, and the hover is on the card, so the zoom starts wherever the pointer enters it.",
        "Animate the art with `transform: scale`. The card needs `overflow: hidden` plus `isolation: isolate` so the zoom stays inside the rounded corners in Safari.",
        "Don't zoom cards that don't link anywhere.",
        "Lay the five slots out with explicit grid placement (col/row start and span), not auto-flow, so the pattern holds whatever the content. A sixth tile starts the same pattern again below.",
      ],
      checks: [
        "Hover the tall left card: its art grows to {scale}× over {duration}ms, its chip turns bright, and nothing else moves.",
        "Hover the wide bottom card (no link): nothing happens.",
        "Move the pointer off halfway: the art shrinks back from where it was, with no snap.",
        "Tab through: each linked card gets a visible focus outline and the same zoom.",
        "Narrow the container below 900px: the cards stack in order at their minimum heights.",
        "Turn on reduced motion: the art doesn't zoom.",
      ],
    },
    controls: [
      { type: "number", name: "scale", label: "Zoom scale", default: 1.07, min: 1, max: 1.2, step: 0.01 },
      { type: "number", name: "duration", label: "Duration", default: 350, min: 100, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "easing", label: "Easing", default: easings.cssOut, options: easingOptions },
      { type: "number", name: "radius", label: "Corner radius", default: 20, min: 0, max: 40, step: 1, unit: "px" },
    ],
    assets: [
      {
        prop: "tiles[].image",
        label: "Tile art",
        fit: "Fills each of the five tiles with object-cover. From 900px the tiles are about 422×592 (1), 398×417 (2), 402×204 (3 and 4) and 800×165 (5)",
        placeholder: "844x1184 for tile 1, 800x834 for tile 2, 804x408 for tiles 3 and 4, 1600x330 for tile 5",
        notes: "Copy sits on the art: use `tone: \"dark\"` for pale art.",
      },
    ],
    promptNotes: [
      "`tiles` is an array of `{ image, alt?, title?, ctaLabel?, href?, tone? }`. `href` makes the whole card a link and turns on its zoom; `ctaLabel` only shows on linked cards. `tone` is \"light\" (white copy on dark art, the default) or \"dark\" (dark #1E252F copy on pale art, plus a faint #D2CEEB hairline).",
      "The layout is built for five tiles; tiles 6–10 start a second bento below, and so on. Pass fewer and the empty slots stay empty.",
      "Other props: `chipFrom` / `chipTo` (the light chip's hover gradient). `easing` is any CSS timing function.",
      "Card padding 30px (21px top and bottom on the wide card in the original), copy gap 20px, titles 28px / 1.1 (22px stacked), CTA label 16px / 1.6.",
      "It renders plain <img> tags. If the site has its own Image component, swap it in with fill/object-cover and keep the transition and scale classes on it.",
      "No client JavaScript, so it works in a Server Component.",
      "Original typography: F37 Judge (licensed), weight 300 titles. The component inherits the site's font; the demo uses Inter Tight as the closest Google Font.",
    ],
  },
  {
    slug: "hover-card-list",
    title: "Hover card list",
    description:
      "A list of big titles with arch thumbnails; hovering a row tints it and pops out a detail card with a photo, tag pills and bullets, used on Hatch website",
    category: "interactions",
    group: "image-hovers",
    level: "section",
    source: "https://www.hatch.lk/",
    recreated: "Framer",
    componentName: "HoverCardList",
    files: [
      {
        name: "hover-card-list.tsx",
        path: "src/registry/interactions/image-hovers/hover-card-list.tsx",
      },
    ],
    usageProps: ["items={items}"],
    defaultTheme: "light",
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A list you scan by pointing: each row is a big title with an arch-shaped thumbnail, and the row under the pointer tints and pops a detail card (photo, tags, bullets) out beside the title, over the rows above and below. It should feel quick and direct, like flipping a card over, so sweeping down the list previews each item in turn.",
      trigger:
        "Pointer hover on a row, only on devices that really hover (Tailwind v4's `hover:` already checks `@media (hover: hover)`), or keyboard focus inside the row (`:focus-within`). Below 900px of container width, or on touch, tapping a row (or Enter/Space on it) toggles its details open inline instead.",
      states: [
        "Row: background `#FAFAFA` (`background`) \u2192 `{accent}`. 1px `{accent}` rules sit between rows.",
        "Detail card, 900px+: `opacity: 0; scale: 0.96; visibility: hidden` \u2192 `opacity: 1; scale: 1; visible`. It's 330px wide, absolutely positioned 159px from the row's right edge (about 55px left of the index) and centred on the row (`top: 50%; translateY(-50%)`), so it overhangs the neighbouring rows; the hovered row is raised (`z-index`) above them.",
        "Card contents: photo (299:222, only the top-right corner rounded, 34px), white tag pills (10px, icon + label) and a 16px bullet list in #666, on an `{accent}` card with 16px padding.",
        "Below 900px: the details open inline under the title with a `grid-template-rows: 0fr \u2192 1fr` reveal and a fade, and the row stays tinted while open.",
      ],
      timing: [
        "Row tint: {duration}ms, `{easing}`, in and out.",
        "Detail card: {cardDuration}ms `{cardEase}` for opacity and scale{cardDuration|0= (0 = it just appears, as on Hatch)|*=}.",
        "Inline accordion: {duration}ms, the same curve as the tint.",
      ],
      interruption:
        "All CSS transitions: moving to the next row fades the old card out while the new one fades in, and the tints cross over, both retargeting from wherever they are. Moving the pointer onto the card keeps its row hovered (the card is a child of the row).",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the tint, card and accordion change instantly.",
      responsive:
        "From 900px of container width: rows 32px top and bottom with 75px left and 60px right padding, a 112px thumbnail (60px 60px 30px 30px arch), titles clamp(40px, 4.3cqw, 62px) and 38px indexes, and the floating card. Below 900px: 18px 20px rows, a 50px thumbnail, 28px titles, 20px indexes, and the inline accordion instead of the card.",
      rules: [
        "Keep the hover in CSS (`group-hover`, `group-focus-within`); the only state is the open row for taps.",
        "Hide closed cards with `visibility: hidden` (transitioned along with opacity) so the invisible cards, which overhang the neighbouring rows, never catch the pointer or a click.",
        "Put the card inside the row, not in a shared overlay, so hovering the card keeps the row hovered and the card sits beside its own row.",
        "Animate only `opacity`, `scale` and `background-color` (plus `grid-template-rows` for the small-screen accordion).",
      ],
      checks: [
        "Hover a row: it tints to {accent} over {duration}ms and its card scales up into place beside the title, overlapping the rows above and below.",
        "Sweep down the list: each row's card takes over smoothly, with no flicker or stuck cards.",
        "Move the pointer from the row onto its card: the card stays open.",
        "Tab through the rows: each one tints and shows its card.",
        "Below 900px or on a phone: tapping a row opens its details inline; tapping again closes them.",
        "Turn on reduced motion: everything changes instantly.",
      ],
    },
    controls: [
      { type: "color", name: "accent", label: "Accent", default: "#CDCEA6" },
      { type: "number", name: "duration", label: "Tint", default: 400, min: 0, max: 1000, step: 10, unit: "ms" },
      { type: "select", name: "easing", label: "Tint easing", default: "cubic-bezier(0.22, 1, 0.36, 1)", options: easingOptions },
      { type: "number", name: "cardDuration", label: "Card reveal", default: 200, min: 0, max: 600, step: 10, unit: "ms" },
      { type: "select", name: "cardEase", label: "Card easing", default: easings.out, options: easingOptions },
      { type: "boolean", name: "numbered", label: "Index numbers", default: true },
    ],
    assets: [
      {
        prop: "items[].thumb",
        label: "Row thumbnail",
        fit: "A square, arch-shaped thumbnail at the start of the row: 50px, 112px from 900px, object-cover",
        placeholder: "224x224",
        optional: true,
      },
      {
        prop: "items[].image",
        label: "Card photo",
        fit: "The photo on the hover card, 299 / 222, object-cover. Defaults to `thumb`",
        placeholder: "660x490",
        optional: true,
      },
    ],
    promptNotes: [
      "`items` is an array of rows. Each item is `{ title, thumb?, image?, alt?, tags?, bullets?, href? }`: `image` (the card photo) defaults to `thumb`, `tags` are `{ icon?, label }` pills, and `href` makes the row a link. Items without an image, tags or bullets get no card.",
      "The file also exports `HourglassIcon` and `ArmchairIcon` (Tabler icons, MIT) for duration and capacity tags.",
      "Other props: `heading`, `background` (#FAFAFA, the resting row colour), `numbered` (01, 02... at the end of each row). Timing props: `duration`/`easing` (tint and accordion), `cardDuration`/`cardEase` (floating card); easings are any CSS timing function.",
      "Deliberate change: on Hatch the card just appears (it mounts on hover). Here it fades and scales in over `cardDuration` (200ms) so sweeping the list reads as one motion; set `cardDuration={0}` for the original snap. The tint uses Framer's 0.4s spring there, matched with an ease-out curve here. Hatch's card also carries a faint stripe pattern in the corner (brand artwork, not included).",
      "It renders plain <img> tags. If the site has its own Image component, swap it in with object-cover and keep the classes.",
      "It's a Client Component (\"use client\") for the tap-to-open state; the hover itself is CSS.",
      "Original typography: Montserrat (Google Font) for the heading (38px / 500), titles (62px / 400), indexes and tags; Open Sans 16px for the bullets. The component inherits the site's font; the demo uses Montserrat.",
    ],
  },
  {
    slug: "rising-headline",
    title: "Rising headline",
    description:
      "A display headline whose letters fill in from the bottom up as they rise into place, one after another, used on eight25 website",
    category: "animations",
    group: "text-effects",
    level: "atom",
    source: "https://cntfl-eight25corporate-e25qa.vercel.app/",
    componentName: "RisingHeadline",
    dependencies: ["gsap"],
    files: [
      {
        name: "rising-headline.tsx",
        path: "src/registry/animations/text-effects/rising-headline.tsx",
      },
    ],
    usageProps: ['as="h1"'],
    defaultTheme: "light",
    fullBleed: true,
    motion: {
      intent:
        "A display headline that writes itself in: every letter fills from its baseline up while rising {distance}px into place, left to right, so the line feels poured rather than faded. It plays once and then the headline just sits there.",
      trigger:
        "{trigger|view=Scroll into view, once: the first time 20% of the headline is visible (an IntersectionObserver), then the observer disconnects.|*=Page load, once: it starts as soon as the component mounts (it's the hero, so it's already on screen).} It never replays.",
      states: [
        "Each letter: `clip-path: inset(120% -10% -20% -10%)` → `inset(-20% -10% -20% -10%)` (the top inset pulls up, so the letter fills bottom → top; the box is padded past the glyph so descenders and ascenders aren't cut off) and `translateY({distance}px)` → `0`, together.",
        "Spaces are letters too (a 0.3em inline-block), so the stagger keeps its rhythm across words. The stagger runs through the whole headline in reading order, across line breaks.",
      ],
      timing: [
        "Letters: {duration}s each, easing `{ease}` (a CSS cubic-bezier; the original is GSAP's `power2.out`, which is `cubic-bezier(0.33, 1, 0.68, 1)`), {stagger}s between one letter starting and the next.",
      ],
      interruption:
        "It's a one-shot intro: nothing can interrupt or reverse it. If the text changes, the tween is reverted and plays again from hidden.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` the letters are shown in place, with no motion. The pre-hydration hiding is scoped to `prefers-reduced-motion: no-preference`, so nothing is hidden even before JavaScript runs.",
      rules: [
        "Split into words → letters. Wrap each word in a `white-space: nowrap` inline-block so inline-block letters never break mid-word. The split spans are `aria-hidden`; screen readers get the full headline once from a visually hidden copy inside the heading.",
        "Hide the letters with CSS before hydration (clipped and pushed down), so nothing flashes, and add a `<noscript>` rule that shows them when JavaScript is off.",
        "Animate only `clip-path` and `transform`: no layout properties. Run it as one staggered GSAP tween in a `gsap.context` scoped to the heading and revert it on unmount.",
        "The easing is a CSS cubic-bezier. GSAP can't read those without the CustomEase plugin, so turn it into an easing function `(t) => number` (solve the curve's x for t) and pass that as the tween's `ease`.",
        "Clear the inline styles on complete, so the finished headline is plain text with nothing left on `will-change`.",
      ],
      checks: [
        "{trigger|view=Scroll to the headline|*=Reload the page}: letters fill bottom-up and rise {distance}px, one after another, left to right.",
        "Descenders (y, p, g) aren't cut off mid-animation.",
        "Before JavaScript loads, nothing flashes visible then hides; with JavaScript off, the headline is visible.",
        "Turn on reduced motion: the headline is shown in place, with no motion.",
      ],
    },
    controls: [
      { type: "text", name: "text", label: "Text", default: "Transform your", always: true },
      {
        type: "select",
        name: "trigger",
        label: "Plays on",
        default: "load",
        options: [
          { label: "Load", value: "load" },
          { label: "Into view", value: "view" },
        ],
      },
      { type: "number", name: "stagger", label: "Letter stagger", default: 0.11, min: 0.01, max: 0.3, step: 0.01, unit: "s" },
      { type: "number", name: "duration", label: "Letter duration", default: 1.2, min: 0.2, max: 3, step: 0.05, unit: "s" },
      { type: "select", name: "ease", label: "Easing", default: "cubic-bezier(0.33, 1, 0.68, 1)", options: easingOptions },
      { type: "number", name: "distance", label: "Rise distance", default: 32, min: 0, max: 120, step: 2, unit: "px" },
    ],
    promptNotes: [
      "`text` must be a plain string because every letter becomes a span: marks and links can't survive the split. Use \"\\n\" for a hard line break.",
      "This is a base component: it only handles the letters and their motion. Font, size, colour, leading and width come from `className` (it renders one `as` element, `h1` by default).",
      "Splitting into inline-blocks drops kerning between letters. That's true of the original too; keep tracking in `className`.",
      "In the original it's the opening headline of the `Banner with Expanding Media` hero, over a decorative fan of fading vertical lines (not part of this component).",
      "Original typography: Landour Display (licensed) weight 300 at 120px / 90% with -3px tracking from 1200px (52px, -2.12px tracking below), colour #4E008E on white. The demo uses Hanken Grotesk weight 300 as the closest Google Font.",
      "It's a Client Component (\"use client\").",
    ],
  },  {
    slug: "wave-headline",
    title: "Wave headline",
    description:
      "A ripple crosses the headline and each letter rises out of it, blurred to sharp with a small overshoot, like a flag waving once, used on NetApp AI website",
    category: "animations",
    group: "text-effects",
    level: "atom",
    source: "https://netapp.ai/",
    componentName: "WaveHeadline",
    files: [
      {
        name: "wave-headline.tsx",
        path: "src/registry/animations/text-effects/wave-headline.tsx",
      },
    ],
    usageProps: ['as="h1"'],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "The headline arrives as a wave: a ripple crosses the line left to right and each letter rises out of it, from a blurred cloud below its seat up through its baseline to a small overshoot, then settles, like a flag waving once. The stagger is the wave, so it should read as one front passing through the line, not letters animating one by one.",
      trigger:
        "{trigger|load=On mount, once.|*=The first time any part of the headline is in view (an IntersectionObserver with no threshold), once; the observer then disconnects.} The letters' animations are armed paused at first paint and released together by a `data-in-view` stamp on the heading, so they keep their timing relative to each other.",
      states: [
        "0%: `opacity: 0; translate: 0 {rise}em; filter: blur({blur}px)`.",
        "55%: `opacity: 1` (the letter is whole while it's still travelling).",
        "70%: `translate: 0 -{overshoot}em; filter: blur(0)` (the top of the flap, past the seat).",
        "100%: `opacity: 1; translate: 0 0; filter: blur(0)`.",
        "Slots are counted across words and lines in reading order. Spaces keep a slot without a span, so the ripple holds its rhythm across word gaps.",
      ],
      timing: [
        "Each letter: {duration}ms, easing `{easing}` over the whole keyframe run, `fill-mode: backwards` (held hidden through its own delay).",
        "Letter n starts at {delay}ms + n × {stagger}ms. In the original that's measured off the comp: the front crosses ~15 characters in ~630ms, and the 470ms lead lets the eyebrow above uncover first.",
      ],
      interruption: "A one-shot entrance: it plays once and can't be interrupted or reversed.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` there's no animation at all: the settled line, nothing hidden. The animations are only declared inside `@media (prefers-reduced-motion: no-preference)`.",
      rules: [
        "CSS keyframes on every letter, not JavaScript per frame: one `@keyframes`, a per-letter `--slot` custom property, and `animation-delay: calc(delay + slot × stagger)`.",
        "Arm the animations `paused` and release them with one attribute on the heading, so the whole line starts on one clock. Under `@media (scripting: none)` release them outright, or the headline would stay hidden without JavaScript.",
        "Letters must be `display: inline-block` (`translate` does nothing to an inline box). Wrap each word in a `white-space: nowrap` inline-block so a narrow headline only breaks at spaces; keep the spaces as text.",
        "Screen readers get the headline once from a visually hidden copy; the split spans are `aria-hidden`.",
      ],
      checks: [
        "{trigger|load=Reload|*=Reload with the headline on screen}: after {delay}ms the first letter rises out of a blur, and the front crosses the line at {stagger}ms per letter, each letter overshooting slightly and settling.",
        "Nothing flashes visible before the wave starts.",
        "Turn on reduced motion: the headline is just there, sharp, with no movement.",
        "Narrow the window: the headline wraps only between words.",
      ],
    },
    controls: [
      { type: "text", name: "text", label: "Text", default: "Intelligent data. Unmatched value.", always: true },
      {
        type: "select",
        name: "trigger",
        label: "Plays on",
        default: "view",
        options: [
          { label: "Into view", value: "view" },
          { label: "Load", value: "load" },
        ],
      },
      { type: "number", name: "delay", label: "Delay", default: 470, min: 0, max: 2000, step: 10, unit: "ms" },
      { type: "number", name: "stagger", label: "Letter stagger", default: 42, min: 5, max: 150, step: 1, unit: "ms" },
      { type: "number", name: "duration", label: "Letter duration", default: 500, min: 100, max: 2000, step: 10, unit: "ms" },
      { type: "select", name: "easing", label: "Easing", default: "cubic-bezier(0.22, 0.61, 0.36, 1)", options: easingOptions },
      { type: "number", name: "rise", label: "Rise", default: 0.42, min: 0, max: 1.5, step: 0.02, unit: "em" },
      { type: "number", name: "overshoot", label: "Overshoot", default: 0.06, min: 0, max: 0.3, step: 0.01, unit: "em" },
      { type: "number", name: "blur", label: "Blur", default: 14, min: 0, max: 40, step: 1, unit: "px" },
    ],
    promptNotes: [
      "`text` must be a plain string because every letter becomes a span: marks and links can't survive the split. Use \"\\n\" for a hard line break.",
      "This is a base component: it only handles the letters and their motion. Font, size, colour and alignment come from `className` (it renders one `as` element, `h1` by default).",
      "Splitting into inline-blocks drops kerning pairs across letters, as in the original.",
      "In the original it's the NetApp AI homepage hero: a 300ms bottom-up uncover on the eyebrow above it first (which is why the wave waits 470ms), the headline centred over a looping background video, and a prompt bar and tiles that arrive after it.",
      "Original typography: F37 Judge (licensed) Thin at 120px / 90% with -1.2px tracking (80px / -0.8px below 1280px, 50px below 992px), white. The demo uses Inter Tight weight 100 as the closest Google Font.",
      "It's a Client Component (\"use client\") only for the in-view stamp; the motion itself is CSS.",
    ],
  },

  {
    slug: "staggered-text",
    added: "2026-11-17",
    title: "Staggered text",
    description: "Text that staggers in by letter, word or line, each piece fading up out of a soft blur",
    category: "animations",
    group: "text-effects",
    level: "atom",
    componentName: "StaggeredText",
    files: [
      {
        name: "staggered-text.tsx",
        path: "src/registry/animations/text-effects/staggered-text.tsx",
      },
    ],
    usageProps: ['as="h1"'],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A heading that arrives piece by piece: each {split|letter=letter|line=rendered line|*=word} fades up from just below its seat and sharpens out of a soft blur, one after another in reading order. It should feel quick and settled, a confident reveal rather than a show.",
      trigger:
        "{trigger|load=On mount, once.|*=The first time 20% of the text is in view (an IntersectionObserver), once; the observer then disconnects.} Every piece's animation is armed paused at first paint and released together by a `data-play` stamp on the element, so they keep their timing relative to each other.",
      states: [
        "From: `opacity: 0; translate: 0 {distance}em; filter: blur({blur}px)`.",
        "To: `opacity: 1; translate: 0 0; filter: blur(0)`.",
        "{split|letter=Slots are counted per letter across words and lines in reading order; a space keeps a slot, so the rhythm holds across word gaps.|line=Slots are the rows the browser actually rendered: every word on the same row shares a slot. Rows depend on the width, so they're measured just before the animation is released, not split on sentences or `\\n` alone.|*=Slots are counted per word across lines in reading order.}",
      ],
      timing: [
        "Each piece: {duration}ms, easing `{easing}`, `fill-mode: backwards` (held hidden through its own delay).",
        "Piece n starts at {delay}ms + n × {stagger}ms.",
      ],
      interruption: "A one-shot entrance: it plays once and can't be interrupted or reversed.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` there's no animation at all: the settled text, nothing hidden. The animations are only declared inside `@media (prefers-reduced-motion: no-preference)`.",
      rules: [
        "CSS keyframes on every piece, not JavaScript per frame: one `@keyframes`, a per-piece `--slot` custom property, and `animation-delay: calc(delay + slot × stagger)`.",
        "Arm the animations `paused` and release them with one attribute on the element, so every piece starts on one clock. Under `@media (scripting: none)` release them outright, or the text would stay hidden without JavaScript.",
        "Pieces must be `display: inline-block` (`translate` does nothing to an inline box). Wrap each word in a `white-space: nowrap` inline-block so the text only breaks at spaces; keep the spaces as text between words.",
        "For lines, measure each word's `offsetTop` (it ignores the starting `translate`) and give words on the same row the same slot.",
        "Animate only `opacity`, `translate` and `filter`. Keep the blur small: a large blur on many letters at once is expensive.",
        "Screen readers get the text once from a visually hidden copy; the split spans are `aria-hidden`.",
      ],
      checks: [
        "{trigger|load=Reload|*=Scroll the text into view}: the first {split|letter=letter|line=line|*=word} fades up out of a blur after {delay}ms, and the rest follow {stagger}ms apart.",
        "Nothing flashes visible before it starts.",
        "{split|line=Narrow the window and reload: the rows stagger as they now wrap, top to bottom.|*=Narrow the window: the text wraps only between words.}",
        "Turn on reduced motion: the text is just there, sharp, with no movement.",
      ],
    },
    controls: [
      { type: "text", name: "text", label: "Text", default: "Build faster than ever", always: true },
      {
        type: "select",
        name: "split",
        label: "Split by",
        default: "word",
        always: true,
        options: [
          { label: "Letter", value: "letter" },
          { label: "Word", value: "word" },
          { label: "Line", value: "line" },
        ],
      },
      {
        type: "select",
        name: "trigger",
        label: "Plays on",
        default: "view",
        options: [
          { label: "Into view", value: "view" },
          { label: "Load", value: "load" },
        ],
      },
      { type: "number", name: "delay", label: "Delay", default: 0, min: 0, max: 2000, step: 10, unit: "ms" },
      { type: "number", name: "stagger", label: "Stagger", default: 80, min: 5, max: 400, step: 5, unit: "ms" },
      { type: "number", name: "duration", label: "Piece duration", default: 700, min: 100, max: 2000, step: 10, unit: "ms" },
      { type: "select", name: "easing", label: "Easing", default: easings.out, options: easingOptions },
      { type: "number", name: "distance", label: "Rise", default: 0.4, min: 0, max: 1.5, step: 0.02, unit: "em" },
      { type: "number", name: "blur", label: "Blur", default: 8, min: 0, max: 30, step: 1, unit: "px" },
    ],
    promptNotes: [
      "`text` must be a plain string because it's split into spans: marks and links can't survive the split. Use \"\\n\" for a hard line break.",
      "This is a base component: it only handles the split and the motion. Font, size, colour, alignment and width come from `className` (it renders one `as` element, `h1` by default).",
      "A good stagger depends on the split: about 25-40ms for letters, 60-100ms for words, 120-180ms for lines.",
      "Splitting letters into inline-blocks drops kerning pairs across letters.",
      "The demo sets it in Inter Tight 700 with tight tracking, white on near-black, centred.",
      "It's a Client Component (\"use client\") only for the play stamp and line measuring; the motion itself is CSS.",
    ],
  },

  {
    slug: "line-mask-reveal",
    title: "Line mask reveal",
    description:
      "A paragraph splits into its rendered lines and each line slides up out of its own mask, one after another, used on Weonic's Weo Motion library",
    category: "animations",
    group: "text-effects",
    level: "atom",
    source: "https://weonic-website.web.app/motion?tab=playground&n=56",
    componentName: "LineMaskReveal",
    dependencies: ["gsap"],
    files: [
      {
        name: "line-mask-reveal.tsx",
        path: "src/registry/animations/text-effects/line-mask-reveal.tsx",
      },
    ],
    usageProps: ['as="p"'],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A lead paragraph that slides in line by line, each line rising out from under an invisible edge (its own clipping mask), so the copy reads as being set in place rather than faded in. It's calm and quick to settle: a long, heavily eased slide with a short stagger.",
      trigger:
        "{trigger|view=Scroll into view: it plays when 20% of the paragraph is visible (an IntersectionObserver). {replay|true=When the paragraph has left the viewport completely it resets to hidden, unseen, and plays again on the way back.|*=It plays once, then the observer disconnects.}|*=Page load: it plays as soon as the component mounts.}",
      states: [
        "The text is split into the lines the browser actually rendered (not sentences), and each line is wrapped in a mask with `overflow: clip`.",
        "Each line: `translateY(125%)` of its own height → `0`, inside its mask. Nothing fades: the mask alone hides it, so a line is fully opaque the moment its top edge clears.",
        "The mask is padded 0.12em top and bottom (with a matching negative margin, so layout doesn't change) so ascenders and descenders aren't cut off under tight leading.",
      ],
      timing: [
        "Lines: {duration}s each, easing `{ease}` (a CSS cubic-bezier; the original is GSAP's `power4.out`, which is `cubic-bezier(0.22, 1, 0.36, 1)`), {stagger}s between one line starting and the next, led from the {from|start=first line|end=last line|center=middle line|random=lines in random order}.",
      ],
      interruption:
        "{trigger|view={replay|true=Leaving the viewport mid-animation lets it finish off screen; once fully out it snaps back to hidden, and entering again restarts it from hidden.|*=It's a one-shot: once started it always finishes.}|*=It's a one-shot intro: nothing interrupts or reverses it.} If the width changes or the web font loads, the lines are re-measured and re-split, and the tween keeps its progress (a finished paragraph stays finished).",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` the text is never split and shows in place, with no motion. The pre-hydration hiding only applies under `prefers-reduced-motion: no-preference`.",
      rules: [
        "Use GSAP SplitText (free since GSAP 3.13) with `type: \"lines\"`, `mask: \"lines\"` and `autoSplit: true`, and create the tween inside `onSplit`, returning it, so a re-split on resize or font load keeps its progress. Don't split by hand on `\\n` or sentences: lines depend on the width.",
        "Lines don't exist until the text is measured, so hide the whole element (`visibility: hidden`) until the split is ready, then show it. Add a `<noscript>` rule that shows it when JavaScript is off.",
        "Keep the `<style>` tags outside the split element, or SplitText will split them too.",
        "SplitText puts the full text on an `aria-label` and hides the split line spans from screen readers; keep its default `aria: \"auto\"`.",
        "Animate only `transform` (yPercent). Revert the split on unmount so React gets its original text node back.",
        "The easing is a CSS cubic-bezier. GSAP can't read those without the CustomEase plugin, so turn it into an easing function `(t) => number` (solve the curve's x for t) and pass that as the tween's `ease`.",
      ],
      checks: [
        "{trigger|view=Scroll the paragraph into view|*=Reload the page}: each line slides up from under its own edge, top line first, {stagger}s apart.",
        "Descenders (g, y, p) aren't clipped at rest, and no sliver of a hidden line shows below the line above before it moves.",
        "Resize the window after it's played: the lines re-wrap and the paragraph stays fully visible (it doesn't replay or vanish).",
        "Before JavaScript loads nothing flashes visible and then hides; with JavaScript off, the paragraph is visible.",
        "Turn on reduced motion: the paragraph is shown in place, with no motion.",
      ],
    },
    controls: [
      {
        type: "text",
        name: "text",
        label: "Text",
        default:
          "Motion should explain, not decorate. Every movement on this page tells you where something came from and where it went.",
        always: true,
      },
      {
        type: "select",
        name: "trigger",
        label: "Plays on",
        default: "view",
        options: [
          { label: "Into view", value: "view" },
          { label: "Load", value: "load" },
        ],
      },
      { type: "boolean", name: "replay", label: "Replay on re-entry", default: true },
      { type: "number", name: "stagger", label: "Line stagger", default: 0.12, min: 0, max: 0.5, step: 0.01, unit: "s" },
      { type: "number", name: "duration", label: "Line duration", default: 1, min: 0.2, max: 3, step: 0.05, unit: "s" },
      { type: "select", name: "ease", label: "Easing", default: "cubic-bezier(0.22, 1, 0.36, 1)", options: easingOptions },
      {
        type: "select",
        name: "from",
        label: "Stagger from",
        default: "start",
        options: [
          { label: "Start", value: "start" },
          { label: "Center", value: "center" },
          { label: "End", value: "end" },
          { label: "Random", value: "random" },
        ],
      },
    ],
    promptNotes: [
      "`text` must be a plain string: the element's content is split into line spans at runtime, so marks and links can't survive. Use \"\\n\" for a hard line break (it becomes a `<br>`).",
      "This is a base component: it only handles the split and the motion. Font, size, colour, leading and max width come from `className` (it renders one `as` element, `p` by default). The width decides where lines break, so set it on the element.",
      "Deliberate change: the original pushes lines down 110%. Here it's 125% because the mask is padded for descenders, and 110% would leave a sliver of the hidden line showing under tight leading.",
      "In the original it's pattern 056 (Line-by-line Reveal) in the Weo Motion playground: `data-wm-split=\"lines\"`, `data-wm-effect=\"mask\"`, 120ms stagger, 1000ms, `power4.out`, replaying on re-entry. The other effects in that playground (rise, blur, flip...) aren't part of this component.",
      "Original typography: DM Sans (Google Font) 24px / 600 at 1.5 leading, max width 24ch, light text on a near-black stage. The demo matches it.",
      "It's a Client Component (\"use client\") and registers the SplitText plugin at module level.",
    ],
  },

  {
    slug: "blur-highlight",
    added: "2026-11-17",
    title: "Blur highlight",
    description:
      "A paragraph comes into focus from a blur as it scrolls into view, then a marker highlight sweeps across each key phrase, used on React Bits Pro",
    category: "animations",
    group: "text-effects",
    level: "atom",
    source: "https://pro.reactbits.dev/docs/components/blur-highlight",
    componentName: "BlurHighlight",
    files: [
      {
        name: "blur-highlight.tsx",
        path: "src/registry/animations/text-effects/blur-highlight.tsx",
      },
    ],
    usageProps: ['as="p"'],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A key-message paragraph that sharpens into focus as you reach it, then points at what matters: a marker-pen highlight sweeps across each key phrase. The blur is quick and settles softly; the highlight follows a beat later so the eye reads the copy first, then the emphasis.",
      trigger:
        "Scroll into view: it plays when {amount} of the paragraph is visible above the bottom 20% of the viewport (an IntersectionObserver with `rootMargin: 0px 0px -20% 0px`). A paragraph taller than the viewport (on a phone) plays once it fills {amount} of the viewport, since it could never show that share of itself. {once|true=It plays once, then the observer disconnects.|*=When it drops below that it reverses (no delays on the way out), and plays again on the way back.}",
      states: [
        "Paragraph: `opacity: {inactiveOpacity}` and `filter: blur({blur}px)` → `opacity: 1`, `filter: blur(0px)`. The whole element, not per word.",
        "Each key phrase is a `<mark>` with a solid fill drawn as `background-image: linear-gradient({highlightColor}, {highlightColor})`, `no-repeat`. Its `background-size` grows {direction|left=`0% 100%` → `100% 100%` anchored at the left (`background-position: 0% 0%`), so it sweeps left to right|right=`0% 100%` → `100% 100%` anchored at the right (`background-position: 100% 0%`), so it sweeps right to left|top=`100% 0%` → `100% 100%` anchored at the top, so it sweeps downward|*=`100% 0%` → `100% 100%` anchored at the bottom, so it fills upward}.",
        "The mark has `box-decoration-break: clone`, rounded corners (0.2em) and a little inline padding, so a phrase that wraps gets its own rounded fill on each line.",
      ],
      timing: [
        "Blur-in: {blurDuration}s, `{blurEase}`, after {blurDelay}s.",
        "Highlights: {highlightDuration}s each, `{highlightEase}`, starting {highlightDelay}s after the blur-in starts{highlightStagger|0=, all together|*=, then {highlightStagger}s between one phrase and the next}.",
        "Delays only apply when it plays in; reversing on exit starts at once.",
      ],
      interruption:
        "These are CSS transitions, so leaving mid-play reverses from wherever each property is, and coming back resumes forward from there. Nothing snaps.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` there's no blur, fade or sweep: the text and highlights show at rest. All the hidden-state CSS sits inside `@media (prefers-reduced-motion: no-preference)`.",
      rules: [
        "Blur the paragraph as one element. A blur per word or per letter costs a layer each and isn't what the original does.",
        "Draw the highlight as a background (gradient + `background-size`), not a pseudo-element or `scaleX` bar: only a background follows the text across line breaks, with `box-decoration-break: clone` (and `-webkit-` prefix).",
        "Put the transition delays on the active state only, so the exit reverses immediately.",
        "Set the hidden state in CSS so it's right before hydration (no flash of sharp text), and add a `<noscript>` rule that shows it.",
      ],
      checks: [
        "Scroll the paragraph into view: it sharpens from a blur, then the highlights sweep in from the {direction}, {highlightDelay}s after the blur starts.",
        "Narrow the width so a phrase wraps: each line of that phrase has its own rounded fill, and the sweep covers both lines.",
        "{once|true=Scroll away and back: it stays shown.|*=Scroll it out of the lower part of the viewport: it blurs out and the highlights retract; scroll back and it plays again.}",
        "Turn on reduced motion: the text and highlights are shown at rest.",
      ],
    },
    controls: [
      {
        type: "text",
        name: "text",
        label: "Text ([phrase] = highlight)",
        default:
          "Our [cutting-edge technology] transforms how businesses [analyze data] and make decisions. From [real-time insights] to [predictive analytics], we deliver solutions that drive growth and innovation.",
        always: true,
      },
      { type: "color", name: "highlightColor", label: "Highlight", default: "#7C3AED" },
      {
        type: "select",
        name: "direction",
        label: "Sweep from",
        default: "left",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
        ],
      },
      { type: "number", name: "blur", label: "Blur", default: 8, min: 0, max: 24, step: 1, unit: "px", motion: true },
      { type: "number", name: "inactiveOpacity", label: "Hidden opacity", default: 0, min: 0, max: 1, step: 0.05, motion: true },
      { type: "boolean", name: "once", label: "Play once", default: false },
      { type: "number", name: "amount", label: "Visible to play", default: 0.5, min: 0.1, max: 1, step: 0.05 },
      { type: "number", name: "blurDuration", label: "Blur duration", default: 0.8, min: 0.1, max: 3, step: 0.05, unit: "s" },
      { type: "select", name: "blurEase", label: "Blur easing", default: easings.out, options: easingOptions },
      { type: "number", name: "blurDelay", label: "Blur delay", default: 0, min: 0, max: 2, step: 0.05, unit: "s" },
      { type: "number", name: "highlightDuration", label: "Highlight duration", default: 1, min: 0.1, max: 3, step: 0.05, unit: "s" },
      { type: "select", name: "highlightEase", label: "Highlight easing", default: easings.drawer, options: easingOptions },
      { type: "number", name: "highlightDelay", label: "Highlight delay", default: 0.4, min: 0, max: 2, step: 0.05, unit: "s" },
      { type: "number", name: "highlightStagger", label: "Highlight stagger", default: 0, min: 0, max: 0.6, step: 0.02, unit: "s" },
    ],
    promptNotes: [
      "`text` is a plain string; wrap each key phrase in square brackets (`\"Our [cutting-edge technology] transforms...\"`). From a CMS, map a rich-text bold/highlight mark to brackets, or adapt the component to take children with `<mark>` elements: the motion only needs the marks to carry the `bh-mark` class.",
      "The highlights are `<mark>` elements, so screen readers can announce them as highlighted; the copy is never split or hidden from assistive tech.",
      "`highlightTextColor` (optional) sets the text colour inside highlights; by default it inherits. Pick a highlight colour with enough contrast against the text (the demo is white on #7C3AED). The original's light-mode colour is #FF9FFC with dark text.",
      "Recreated from the live React Bits Pro preview (its source is behind a paywall): whole-element blur + opacity, highlights as a gradient `background-size` sweep with `box-decoration-break: clone`. Its default timings are kept (8px, 0.8s blur, highlight 0.4s later for 1s, 50% visible, replays). Its easings aren't documented, so ours use the library's strong ease-out for the blur and the drawer curve for the sweep. Its docs list a 0.3 inactive opacity, but the live preview starts from 0; 0 is the default here.",
      "Original typography: the system UI sans at 24px / 32px, weight 400, max width 36rem, white on near-black. The demo matches it with Inter.",
      "It's a Client Component (\"use client\") with no dependencies: the motion is CSS transitions; the only JS is the IntersectionObserver.",
    ],
  },

  {
    slug: "stretch-headline",
    title: "Stretch headline",
    description:
      "Each letter lands like rubber: squashed flat and wide, it springs up tall and narrow, wobbles once and settles, one after another, used on Weonic's Weo Motion library",
    category: "animations",
    group: "text-effects",
    level: "atom",
    source: "https://weonic-website.web.app/motion?tab=playground&n=65",
    componentName: "StretchHeadline",
    files: [
      {
        name: "stretch-headline.tsx",
        path: "src/registry/animations/text-effects/stretch-headline.tsx",
      },
    ],
    usageProps: ['as="h2"'],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A short, punchy headline whose letters land like they're made of rubber: each one arrives squashed flat and wide, springs up past its height going tall and narrow, wobbles back once and settles. Staggered letter by letter, it reads as a playful bounce running along the word, so keep it for short display words, not sentences.",
      trigger:
        "{trigger|view=Scroll into view: it plays when 20% of the headline is visible (an IntersectionObserver). {replay|true=When the headline has left the viewport completely it resets to hidden, unseen, and plays again on the way back.|*=It plays once, then the observer disconnects.}|*=Page load: it plays as soon as the component mounts.}",
      states: [
        "Each letter runs four evenly spaced keyframes of `transform: scale(x, y)` and `opacity`: `scale(1.9, 0.25)` at opacity 0 → `scale(0.82, 1.3)` at opacity 1 → `scale(1.08, 0.94)` → `scale(1, 1)`. The origin is the letter's centre.",
        "{intensity|1=|*=The intensity is {intensity}: each scale value's distance from 1 is multiplied by it (clamped at 0.02 so no letter flips or vanishes).}",
        "Only letters animate; spaces stay as plain text and don't take a stagger slot. The stagger runs through the whole headline in reading order, across line breaks, led from the {from|start=first letter|end=last letter|center=middle letter outwards|random=letters in random order}.",
      ],
      timing: [
        "Each letter: {duration}ms with one easing, `{easing}`, across the whole keyframe run, not per step (the original is GSAP's `power2.out`, which is `cubic-bezier(0.33, 1, 0.68, 1)`), so the squash snaps and the wobble slows down. {stagger}ms between one letter starting and the next.",
      ],
      interruption:
        "{trigger|view={replay|true=Leaving the viewport mid-animation lets it finish off screen; once fully out it snaps back to hidden, and entering again restarts it from the first keyframe.|*=It's a one-shot: once started it always finishes.}|*=It's a one-shot intro: nothing interrupts or reverses it.} Replaying cancels any running letter animations before starting new ones.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` the headline is shown in place, with no motion. The pre-hydration hiding only applies under `prefers-reduced-motion: no-preference`.",
      rules: [
        "Use the Web Animations API (`element.animate`) per letter, with `easing` on the animation (so the ease spans all keyframes like the original), `delay: slot × stagger` and `fill: \"backwards\"` so each letter is held at its first keyframe until its turn. No animation library is needed. Cancel the animations on unmount and on reset.",
        "Letters must be `display: inline-block` (transforms do nothing to an inline box). Wrap each word in a `white-space: nowrap` inline-block so a narrow headline only breaks at spaces; keep the spaces as text.",
        "Hide the letters with CSS (`opacity: 0`) until they play, so nothing flashes before hydration, and add a `<noscript>` rule that shows them when JavaScript is off.",
        "Animate only `transform` and `opacity`. Screen readers get the headline once from a visually hidden copy; the split spans are `aria-hidden`.",
      ],
      checks: [
        "{trigger|view=Scroll the headline into view|*=Reload the page}: each letter pops in flat and wide, stretches tall and narrow, wobbles once and settles, {stagger}ms apart.",
        "Nothing flashes visible before the letters play; with JavaScript off, the headline is visible.",
        "Narrow the window: the headline wraps only between words.",
        "Turn on reduced motion: the headline is shown in place, with no motion.",
      ],
    },
    controls: [
      { type: "text", name: "text", label: "Text", default: "Stretchy", always: true },
      {
        type: "select",
        name: "trigger",
        label: "Plays on",
        default: "view",
        options: [
          { label: "Into view", value: "view" },
          { label: "Load", value: "load" },
        ],
      },
      { type: "boolean", name: "replay", label: "Replay on re-entry", default: true },
      { type: "number", name: "stagger", label: "Letter stagger", default: 50, min: 0, max: 200, step: 5, unit: "ms" },
      { type: "number", name: "duration", label: "Letter duration", default: 1100, min: 200, max: 3000, step: 50, unit: "ms" },
      { type: "select", name: "easing", label: "Easing", default: "cubic-bezier(0.33, 1, 0.68, 1)", options: easingOptions },
      { type: "number", name: "intensity", label: "Intensity", default: 1, min: 0, max: 1.5, step: 0.05 },
      {
        type: "select",
        name: "from",
        label: "Stagger from",
        default: "start",
        options: [
          { label: "Start", value: "start" },
          { label: "Center", value: "center" },
          { label: "End", value: "end" },
          { label: "Random", value: "random" },
        ],
      },
    ],
    promptNotes: [
      "`text` must be a plain string because every letter becomes a span: marks and links can't survive the split. Use \"\\n\" for a hard line break.",
      "This is a base component: it only handles the letters and their motion. Font, size, colour and alignment come from `className` (it renders one `as` element, `h2` by default).",
      "Splitting into inline-blocks drops kerning pairs across letters; keep tracking in `className`.",
      "In the original it's pattern 065 (Text Elastic Stretch) in the Weo Motion playground: `data-wm-split=\"chars\"`, `data-wm-effect=\"stretch\"`, 50ms stagger, 1100ms, `power2.out`, replaying on re-entry. `intensity` is an addition here (1 matches the original).",
      "Original typography: DM Sans (Google Font) weight 800 at clamp(28px, 7vw, 54px), 1.02 leading, -0.04em tracking, light text on a near-black stage. The demo matches it.",
      "It's a Client Component (\"use client\").",
    ],
  },

  {
    slug: "text-marquee",
    title: "Text marquee",
    description:
      "A line of big words that slides sideways forever and eases to a stop under the mouse, fading out at both edges, used on Weonic's Weo Motion library",
    category: "animations",
    group: "text-effects",
    level: "atom",
    source: "https://weonic-website.web.app/motion?tab=playground&n=70",
    componentName: "TextMarquee",
    motionNote:
      "Constant speed: the strip moves at a steady px/s with no duration or easing; only the hover slow-down has a timing.",
    files: [
      {
        name: "text-marquee.tsx",
        path: "src/registry/animations/text-effects/text-marquee.tsx",
      },
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A band of oversized words that drifts sideways forever at a steady, unhurried pace, like a ticker for the brand's keywords. It's ambient: it never asks for attention, {slowOnHover|true=and it settles to a stop when someone puts the mouse on it to read, then picks back up when they leave.|*=and it never stops.}{scrollBoost|true= Scrolling the page pushes it along: it speeds up with the scroll and runs backwards when scrolling up, then eases back to its cruising pace.|*=}",
      trigger:
        "It starts moving as soon as it's on screen and runs forever. The loop pauses while the strip is off screen (an IntersectionObserver) and resumes where it left off.",
      states: [
        "Content: the items in order, each followed by the separator ({separator}), {gap}px apart, with a trailing {gap}px gap so one group is exactly one loop. The group is cloned (aria-hidden) until the clones cover the strip's width plus one spare, re-counted on resize.",
        "Motion: the track moves {direction|right=right|*=left} at {speed}px/s via `translate3d`, and the offset wraps into one group width, so the jump back is invisible.",
        "{slowOnHover|true=Hover (mouse and pen only, not touch): the target speed drops to 0; leaving sets it back to {speed}px/s. The actual speed eases exponentially toward the target, covering 95% of the change in {hoverRamp}ms (each frame closes `1 - 0.05^(dt / {hoverRamp})` of the gap; 474ms is the original's 10% per 60fps frame), so it glides to a stop and glides back up.|*=No hover behaviour.}",
        "{scrollBoost|true=Scroll boost: page scroll velocity (px/ms, blended 50% toward each new reading, decaying ×0.92 per frame) is added as |v| × 900 px/s, and its sign sets the direction: scrolling down runs the {direction|right=right|*=left}, up runs it the other way.|*=}",
        "{fade|0=No edge fade.|*=Edges: a `mask-image` fades the strip out over the first and last {fade}% of its width.}",
      ],
      timing: [
        "Continuous: {speed}px/s, linear, frame-rate independent (distance = speed × frame time; frame time is capped at 100ms so a stalled tab doesn't leap).",
        "{slowOnHover|true=Hover slow-down and speed-up: an exponential ease-out that covers 95% of the change in {hoverRamp}ms.|*=}",
      ],
      interruption:
        "Hover and scroll only change the target speed, and the real speed always eases toward it, so any change mid-motion is smooth. Resizing re-measures the group and the clone count without resetting the offset.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` there's no loop: the clones are hidden and the strip becomes a still, horizontally scrollable line of the items.",
      rules: [
        "Drive it from one `requestAnimationFrame` loop that writes `transform: translate3d()` on the track, not a CSS keyframe: the eased hover stop and scroll boost need a speed that can change continuously.",
        "Make one group's width exactly one loop (trailing gap included), clone it enough to always fill the strip, and wrap the offset with `((offset % loop) - loop) % loop`.",
        "Only the first group is read by screen readers; clones and separators are `aria-hidden`.",
        "Stop the loop when the strip is off screen, and clean up listeners, observers and the frame on unmount. Use a passive scroll listener.",
      ],
      checks: [
        "It moves {direction|right=right|*=left} at a steady pace and the loop point can't be seen, even on a very wide window.",
        "{slowOnHover|true=Mouse over it: it glides to a stop (not a freeze); move away: it glides back up. Tapping on a phone doesn't stop it.|*=Hovering doesn't change it.}",
        "{scrollBoost|true=Scroll the page fast: it speeds up, and runs the other way when scrolling up, then settles.|*=Scrolling the page doesn't change it.}",
        "Turn on reduced motion: the strip is still, with no duplicate text, and can be scrolled sideways.",
      ],
    },
    controls: [
      { type: "text", name: "items", label: "Items (comma-separated)", default: "Design, Motion, Code", always: true },
      { type: "text", name: "separator", label: "Separator", default: "✦" },
      { type: "number", name: "speed", label: "Speed", default: 70, min: 10, max: 400, step: 5, unit: "px/s" },
      {
        type: "select",
        name: "direction",
        label: "Direction",
        default: "left",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      { type: "boolean", name: "slowOnHover", label: "Slow down on hover", default: true },
      { type: "number", name: "hoverRamp", label: "Hover slow-down", default: 474, min: 50, max: 2000, step: 1, unit: "ms", secondary: true },
      { type: "boolean", name: "scrollBoost", label: "Scroll boost", default: false },
      { type: "number", name: "gap", label: "Gap", default: 40, min: 0, max: 160, step: 4, unit: "px" },
      { type: "number", name: "fade", label: "Edge fade", default: 8, min: 0, max: 30, step: 1, unit: "%" },
    ],
    promptNotes: [
      "`items` takes an array of strings or nodes, or one comma-separated string. `separator` is any node (`null` for none); it follows every item, including the last, so the loop joins seamlessly.",
      "This is a base component: it only handles the loop and the motion. Font, size, weight, colour and padding come from `className` on the strip (a full-width `div`).",
      "In the original it's pattern 070 (Infinite Text Marquee) in the Weo Motion playground: `data-wm=\"marquee\"`, 70px/s, left, slowing on hover, with scroll velocity off. Deliberate changes: touch taps don't stop it (the original uses `pointerenter` for every pointer type, so a tap would halt it), and the loop pauses while off screen.",
      "Original typography: DM Sans (Google Font) weight 800 at clamp(32px, 8vw, 64px) with -0.03em tracking, light text on a near-black stage, 2.5rem (40px) gaps. The demo matches it.",
      "It's a Client Component (\"use client\").",
    ],
  },

  {
    slug: "blend-through-headline",
    title: "Blend-through headline",
    description:
      "The headline picks up the colours of an animated background wherever it passes behind the text, and stays its normal colour everywhere else, used on Stripe website",
    category: "animations",
    group: "text-effects",
    level: "atom",
    source: "https://stripe.com/",
    componentName: "BlendThroughHeadline",
    motionNote:
      "No motion of its own: the tint follows whatever moves in the background layer, so there's no duration or easing.",
    files: [
      {
        name: "blend-through-headline.tsx",
        path: "src/registry/animations/text-effects/blend-through-headline.tsx",
      },
    ],
    usageProps: ['as="h1"'],
    usageChildren:
      "<em>Financial infrastructure to grow your revenue.</em> Accept payments, handle business banking, and implement custom revenue models—from your first transaction to your billionth.",
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "The headline seems to sit inside the section's animated background: where the background passes behind a letter, the letter takes on its colour, and as the background moves the tint moves across the text. Everywhere else the headline is its normal colour ({color}, with {emphasisColor} for the `<em>` lead-in). The headline itself never moves. The effect is all in the colour.",
      trigger:
        "None of its own. It's continuous and driven by whatever moves in the background layer (a WebGL ribbon on Stripe). A still background gives a still tint.",
      states: [
        "Layer order inside the section's stacking context, bottom to top: (1) the real headline, `z-index: auto`; (2) the background layer, `z-index: 1`, transparent wherever it has nothing to draw; (3) an identical `inert`, `aria-hidden` copy of the headline, `z-index: 2`, `mix-blend-mode: hard-light`. Both copies share one grid cell so they line up exactly.",
        "Top copy colour: {tint} at {tintOpacity} alpha (`<em>`: {emphasisTint} at {emphasisTintOpacity}). Over the background it hard-lights the background's colours. That's the tint you see.",
        "Bottom copy colour: solved per channel so that the top copy blended over it gives exactly {color} (`<em>`: {emphasisColor}). Nobody sees it directly. With Stripe's colours it's yellow (#DDD600) and reads as slate grey.",
        "Where the background covers the bottom copy, the bottom copy is hidden and only the tinted top copy shows.",
      ],
      timing: [
        "No timing of its own. The tint follows the background frame by frame, with no lag, because it's the browser compositing the layers.",
      ],
      interruption: "Nothing to interrupt: it's a static blend over whatever is moving underneath.",
      reducedMotion:
        "Nothing changes in the headline. The background layer should hold still under `prefers-reduced-motion: reduce` (the library's shader backgrounds already do), which leaves a static tint that's still readable.",
      responsive:
        "Works at any size. The tint lands wherever the background happens to sit behind the text at that width, so check the headline at narrow widths where it wraps into the background.",
      rules: [
        "Nothing between the section and the two copies may create a stacking context (no `z-index` with position, `transform`, `filter`, `opacity < 1`, `isolation`, or `will-change` on wrappers). Otherwise the blend has no background to mix with and the effect quietly disappears.",
        "The section itself does create one (`position: relative; isolation: isolate`), so the blend can't leak into the rest of the page.",
        "The background layer: `position: absolute; inset: 0; z-index: 1; pointer-events: none`, and transparent where it doesn't draw. An opaque full-bleed background hides the bottom copy completely. The effect still works, but the {color} rest colour never shows.",
        "Any other content that has to sit above the background (eyebrow, buttons) needs `position: relative; z-index: 2`.",
        "Colour the top copy with a semi-transparent text colour, not `opacity`, because `opacity` would composite the copy on its own before blending.",
        "Text selection and link clicks reach the real copy: the top copy is `inert`, and the background is `pointer-events: none`.",
      ],
      checks: [
        "Where the background passes behind the headline, the letters show its colours tinted towards {tint}. Elsewhere they read as {color} ({emphasisColor} for the lead-in).",
        "As the background moves, the tinted area slides through the letters with no lag or flicker.",
        "The two copies line up exactly, with no doubled or blurry edges at any width.",
        "A screen reader reads the headline once.",
        "Select the headline text, and tab through any links in it: each link is reached once.",
      ],
    },
    controls: [
      { type: "color", name: "color", label: "Text colour", default: "#6E7780" },
      { type: "color", name: "tint", label: "Tint", default: "#000EFF" },
      { type: "number", name: "tintOpacity", label: "Tint strength", default: 0.5, min: 0, max: 1, step: 0.05 },
      { type: "color", name: "emphasisColor", label: "Lead-in colour", default: "#020826" },
      { type: "color", name: "emphasisTint", label: "Lead-in tint", default: "#2D2564" },
      { type: "number", name: "emphasisTintOpacity", label: "Lead-in tint strength", default: 1, min: 0, max: 1, step: 0.05 },
    ],
    promptNotes: [
      "`children` is any ReactNode (nothing is split), so marks, `<sup>` and links survive. Wrap a lead-in in `<em>` to give it the emphasis colours. The component makes `em` non-italic, as on Stripe.",
      "It renders a plain `display: grid` wrapper holding two `as` elements (`h1` by default), as Stripe does, so site-wide `h1` styles hit both copies equally. `className` and `style` go on both copies (typography, width). Other props go on the real one only.",
      "Colours must be hex. `blendThroughBase(color, tint, opacity)` is exported and returns the solved bottom colour. If a rest colour can't be reached with that tint (a dark tint can't produce a light grey, for example), it clamps to the nearest colour and warns in development.",
      "The component has no background of its own. Pair it with any animated layer: a shader background from this library, a video, or a CSS gradient. The demo uses this library's Ribbon wave shader (a transparent canvas at `z-index: 1`), which isn't part of this component.",
      "Original typography: Söhne (licensed) weight 300, `font-feature-settings: \"ss01\"`, line-height 1.03, -0.01em tracking, 34px on mobile up to about 56px on desktop. The demo uses Inter Tight as the closest Google Font, set a little heavier (400) and smaller (30–48px).",
      "Works as a Server Component: no hooks, no \"use client\".",
    ],
  },
  {
    slug: "count-up",
    title: "Count up",
    description:
      "A number counts up from 0 to its value the first time it scrolls into view, used on NetApp AI website",
    category: "animations",
    group: "text-effects",
    level: "atom",
    source: "https://netapp.ai/platform/novus/",
    componentName: "CountUp",
    defaultTheme: "light",
    files: [
      {
        name: "count-up.tsx",
        path: "src/registry/animations/text-effects/count-up.tsx",
      },
    ],
    motion: {
      intent:
        "A stat's number counts up from 0 to its value as the stat arrives on screen, so the figure feels earned rather than printed. In a row of stats the original counts them one after another, left to right, each starting when the one before lands. It plays once per page load and then the numbers just sit there.",
      trigger:
        "Scroll into view, once: the first time {threshold*100}% of the number is visible (an IntersectionObserver), then the observer disconnects. It never replays on later scrolls; only a reload arms it again. The original watches the whole stat row and starts when 40% of the row is visible.",
      states: [
        "Number: `0` → the value, written into the number's own text every animation frame. It keeps the value's decimals the whole way (2.6 counts 0.0, 0.1 … 2.6) and lands on exactly the value.",
        "Prefix and suffix (e.g. \"K+\", \"TB/s\"): rendered once and never rewritten.",
        "Before the trigger: the number already reads `0`. It's zeroed on hydration, before the first paint, so a reader scrolling down meets 0, never the final figure snapping back to 0.",
      ],
      timing: [
        "Duration: {duration}ms per number.",
        "{easing|linear=Easing: linear (constant speed, no ease-in or ease-out), as in the original.|*=Easing: `{easing}` (a CSS timing function, solved in JS for each frame's progress: find the curve's x for t, use its y).}",
        "In a row: each number starts when the previous one lands, i.e. stat n waits n × {duration}ms after the trigger (`delay={index * duration}`).",
      ],
      interruption:
        "Nothing interrupts it. Once started, a count runs to its value even if the stat scrolls back out of view. If the component unmounts mid-count, stop the frame loop and timer.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, don't count and don't zero: the final number is shown from the start.",
      rules: [
        "Server-render the final number, then zero it in a layout effect on the client. Without JavaScript the reader sees the real figure.",
        "Rewrite only the number's own text node with requestAnimationFrame. Don't re-render React state every frame, and don't touch the prefix or suffix.",
        "Give screen readers the final value once (visually hidden text) and hide the counting digits with `aria-hidden`, so the count isn't announced frame by frame.",
        "Use `font-variant-numeric: tabular-nums` so the number's width doesn't jitter while it counts (the original doesn't; it's an improvement).",
      ],
      checks: [
        "Load the page with the stats below the fold: they read 0 until you scroll to them, then count up over {duration}ms.",
        "Scroll away and back: they don't count again.",
        "A decimal value like 2.6 lands on 2.6, not 3 or 2.",
        "Turn on reduced motion and reload: the final numbers show immediately.",
        "With JavaScript off, the final numbers show.",
        "A screen reader reads each stat once, with its final value.",
      ],
    },
    controls: [
      { type: "number", name: "value", label: "Value", default: 100, min: 0, max: 1000, step: 1, always: true },
      { type: "text", name: "prefix", label: "Prefix", default: "" },
      { type: "text", name: "suffix", label: "Suffix", default: "TB/s", always: true },
      { type: "number", name: "duration", label: "Duration", default: 1000, min: 200, max: 3000, step: 50, unit: "ms" },
      { type: "select", name: "easing", label: "Easing", default: "linear", options: easingOptions },
      { type: "number", name: "threshold", label: "Visible to start", default: 0.4, min: 0, max: 1, step: 0.05 },
    ],
    promptNotes: [
      "One <CountUp> per number. `value` is the number, `prefix` / `suffix` are the fixed text around it (`value={50} suffix=\"K+\"`, `value={100} suffix=\"TB/s\"`).",
      "To count a row one after another, give each stat `delay={index * duration}`. Each CountUp watches itself, so in a row that comes into view together this matches the original's group sequence.",
      "It's a client component (\"use client\"), but it server-renders the final number. Drop it inside a Server Component's markup as-is.",
      "In the original the numbers sit in a framed stat row (a 1px #CFDDE6 frame split by hairlines, label at the top of each cell, figure at the bottom at 120px / 0.9 / -1.2px, 72px on mobile). That layout is the section's; the component is just the number.",
      "Original typography: F37 Judge (licensed), labels 28px / 1.1, figures weight 100. The demo uses Inter Tight weight 300 as the closest Google Font.",
    ],
  },
  {
    slug: "gradient-sweep-text",
    added: "2026-11-17",
    title: "Gradient sweep text",
    description:
      "The last words of a headline are invisible until a band of blue, pink and orange sweeps through them and leaves them in the text colour, used on Lovable website",
    category: "animations",
    group: "text-effects",
    level: "atom",
    source: "https://lovable.dev/",
    componentName: "GradientSweepText",
    files: [
      {
        name: "gradient-sweep-text.tsx",
        path: "src/registry/animations/text-effects/gradient-sweep-text.tsx",
      },
    ],
    usageChildren: "Endless possibilities.",
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A headline's closing words arrive as a streak of colour: a soft, slightly blurred band sweeps through them from right to left and the words settle into the headline's own colour behind it. It's a one-off flourish that draws the eye to the payoff of the line, then gets out of the way.",
      trigger:
        "{trigger|load=On mount, once.|*=The first time {threshold*100}% of the words are visible (an IntersectionObserver), once; the observer then disconnects. It never replays on later scrolls.}",
      states: [
        "The words are painted by their background: `background-clip: text` with `-webkit-text-fill-color: transparent`. The background is `linear-gradient(90deg, <text colour> 0 33.33%, <band colours spread from 40% to 60%>, transparent 66.67%)` at `background-size: 300% 100%`.",
        "Before the trigger: `background-position: 100% 0`, which shows the transparent third. The words are invisible but keep their space, so nothing shifts. They're hidden in a layout effect before the first paint, never by server-rendered CSS.",
        "Sweep: `background-position` 100% → 0%, so the band enters at the right edge of the words and leaves through the left, and the text colour fills in behind it.{blur|0=|*= At the same time `filter: blur({blur}px)` → none.}",
        "End: `background-position: 0%`, the words in the text colour (`currentColor` by default, so they match the rest of the headline).",
        "Band colours: {colors}.",
      ],
      timing: [
        "Sweep: {duration}ms, `{ease}`{ease|cubic-bezier(0.455, 0.03, 0.515, 0.955)= (quad ease-in-out, as on Lovable: eases in, crosses the words at full speed, then settles)|*=}.",
        "Starts {delay}ms after the trigger. The blur clears over the same {duration}ms.",
      ],
      interruption:
        "Nothing interrupts it. Once started it runs to the end even if the words scroll away. On unmount, cancel the animation and restore the final state.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, don't hide and don't sweep: the words show in the text colour from the start.",
      rules: [
        "Animate `background-position` with one Web Animation (or a CSS keyframe added by the observer). Don't step it from JavaScript per frame.",
        "Server-render the end state and hide the words on the client before paint, so without JavaScript the headline is complete.",
        "Give the span a little right padding pulled back with a negative margin (`pr-[0.1em] -mr-[0.1em]`): the last glyph's overhang would otherwise fall outside the painted background and get cut off.",
        "Under `forced-colors: active`, drop the background and fill the text with `CanvasText`, or the words disappear in Windows high contrast.",
        "The words stay real text, so screen readers and selection work normally; nothing is split into characters.",
      ],
      checks: [
        "Load the page with the headline below the fold: the closing words are a blank gap (the line doesn't reflow), then as they scroll in a coloured band sweeps through them right to left over {duration}ms and they end in the headline colour.",
        "Scroll away and back: it doesn't replay.",
        "If the words wrap onto two lines, the band runs through both as one strip.",
        "Turn on reduced motion and reload: the words are simply there.",
        "With JavaScript off, the words show in the text colour.",
      ],
    },
    controls: [
      { type: "number", name: "duration", label: "Sweep", default: 1200, min: 300, max: 3000, step: 50, unit: "ms" },
      {
        type: "select",
        name: "ease",
        label: "Sweep easing",
        default: "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
        options: [{ label: "Quad ease-in-out (Lovable)", value: "cubic-bezier(0.455, 0.03, 0.515, 0.955)" }, ...easingOptions],
      },
      { type: "number", name: "delay", label: "Delay", default: 100, min: 0, max: 1000, step: 10, unit: "ms" },
      { type: "number", name: "blur", label: "Start blur", default: 1, min: 0, max: 8, step: 0.5, unit: "px" },
      { type: "text", name: "colors", label: "Band colours", default: "#82BCFF, #2483FF, #FF66F4, #FF3029, #FE7B02" },
      {
        type: "select",
        name: "trigger",
        label: "Trigger",
        default: "view",
        options: [
          { label: "Scroll into view", value: "view" },
          { label: "On load", value: "load" },
        ],
      },
      { type: "number", name: "threshold", label: "Visible to start", default: 0.5, min: 0, max: 1, step: 0.05 },
    ],
    promptNotes: [
      "Wrap only the words that should sweep, inside the site's own heading: `<h2>One platform. <GradientSweepText>Endless possibilities.</GradientSweepText></h2>`. The heading keeps its font and colour; the words end in that colour (`color` defaults to `currentColor`).",
      "`colors` is the band, left to right, as an array or a comma-separated string. They're spread evenly between 40% and 60% of the gradient.",
      "On Lovable it finishes every section headline (\"Endless possibilities.\", \"and beyond\", \"on Lovable\"...), and on dark sections the end colour is white. Pass `color` if the words should end in a different colour from the heading.",
      "It's a client component (\"use client\"). It renders a plain `<span>` and server-renders the finished words.",
      "Original typography: Camera Plain Variable (licensed) weight 600, -0.04em tracking, line-height 1.1, on #FCFBF8. The demo uses Inter Tight as the closest Google Font.",
    ],
  },
  {
    slug: "typing-headline",
    added: "2026-11-17",
    title: "Typing headline",
    description:
      "A headline that ends on a blinking coloured cursor, like a terminal prompt, with an optional type-out, used in the \"Start Your Journey_\" CTA on the Veracode website",
    category: "animations",
    group: "text-effects",
    level: "atom",
    source: "https://www.veracode.com/",
    recreated: "WordPress",
    componentName: "TypingHeadline",
    files: [
      {
        name: "typing-headline.tsx",
        path: "src/registry/animations/text-effects/typing-headline.tsx",
      },
    ],
    usageProps: ['as="h2"'],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A CTA headline that reads like a terminal prompt: {typing|false=the text is already there and a coloured cursor blinks after it, inviting the next step.|*=the text types itself out one character at a time behind a steady caret, then the coloured cursor at the end starts to blink, inviting the next step.} It's a small, quiet loop, not an entrance show.",
      trigger:
        "{typing|false=None: the cursor blinks from the first paint, forever.|*={trigger|load=Typing starts on mount, once.|*=Typing starts the first time 50% of the headline is visible (an IntersectionObserver), once; the observer then disconnects.} The cursor starts blinking when the last character is typed, and keeps blinking.}",
      states: [
        "{typing|false=Text: static.|*=Typing: character n becomes visible at {delay}ms + (n − 1) × {speed}ms after the trigger. The untyped characters are laid out but `visibility: hidden`, so lines never re-wrap while it types and the heading's height is reserved from the first paint.}",
        "{typing|false=|*=While typing: a solid caret (the cursor character, zero width so it pushes nothing) sits right after the last typed character. When the text is complete it's removed and the real cursor at the end of the line appears in the same spot.}",
        "Cursor: the `{cursor}` character in {cursorColor}, inline after the text. Blink: `opacity` 1 → 0 → 1 (keyframes at 0%, 50%, 100%), looping.",
      ],
      timing: [
        "{typing|false=|*=Typing: {speed}ms per character, starting {delay}ms after the trigger, no easing (a steady typist).}",
        "Blink: {blinkDuration}ms per cycle, `{blinkEasing}` on each half, infinite. The original is a CSS `animation: 0.5s infinite blink-anim` with the default `ease`.",
      ],
      interruption:
        "{typing|false=Nothing to interrupt: it's a CSS loop.|*=Typing is one-shot: once started it runs to the end even if the headline scrolls away. If the text changes, it types again from empty. On unmount, cancel the frame loop and observer.}",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` the full text shows from the first paint and the cursor is steady (no typing, no blink). The pre-hydration hiding and the blink are only declared inside `@media (prefers-reduced-motion: no-preference)`.",
      rules: [
        "Keep the whole text in the layout and only toggle `visibility` on the untyped part; don't grow the string, or a word near the end of a line jumps to the next line as it's typed.",
        "The blink is a CSS keyframe loop on the cursor's `opacity` only, scoped to the component. Start it only once the text is done, so the caret is solid while typing like a real text caret.",
        "Hide the untyped text with CSS before hydration so nothing flashes, and add a `<noscript>` rule that shows it when JavaScript is off.",
        "Screen readers get the full headline once from visually hidden text inside the heading; the visible characters and both cursors are `aria-hidden`, so the typing isn't announced character by character.",
      ],
      checks: [
        "{typing|false=Load the page: the headline is there and the {cursorColor} cursor blinks at {blinkDuration}ms per cycle.|*={trigger|load=Reload|*=Scroll to the headline}: after {delay}ms it types at {speed}ms per character with a solid caret, then the end cursor blinks.}",
        "Narrow the window so the headline wraps: line breaks don't move while it types.",
        "Before JavaScript loads nothing flashes visible then hides; with JavaScript off the full headline and cursor show.",
        "Turn on reduced motion: the full headline shows with a steady cursor.",
      ],
    },
    controls: [
      { type: "text", name: "text", label: "Text", default: "Start Your Journey", always: true },
      { type: "text", name: "cursor", label: "Cursor", default: "_" },
      { type: "color", name: "cursorColor", label: "Cursor colour", default: "#00B9FF" },
      { type: "boolean", name: "typing", label: "Type the text out", default: false },
      {
        type: "select",
        name: "trigger",
        label: "Types on",
        default: "view",
        options: [
          { label: "Into view", value: "view" },
          { label: "Load", value: "load" },
        ],
      },
      { type: "number", name: "speed", label: "Per character", default: 70, min: 20, max: 200, step: 5, unit: "ms", motion: true },
      { type: "number", name: "delay", label: "Start delay", default: 200, min: 0, max: 2000, step: 50, unit: "ms", motion: true },
      { type: "number", name: "blinkDuration", label: "Blink cycle", default: 500, min: 200, max: 2000, step: 50, unit: "ms", motion: true },
      { type: "select", name: "blinkEasing", label: "Blink easing", default: easings.ease, options: easingOptions, motion: true },
    ],
    promptNotes: [
      "The defaults match Veracode: the headline is static and only the cursor blinks. `typing` is an optional addition (off by default) that types the text out first; `trigger`, `speed` and `delay` only apply when it's on.",
      "`text` must be plain text. The cursor is a separate prop (`cursor`, `cursorColor`); on Veracode it's an inline-coloured `<mark>` holding `_` in #00B9FF.",
      "This is a base component: font, size, colour and width come from `className` (it renders one `as` element, `h2` by default).",
      "In the original it opens the bottom CTA band (`bs-section--bottom-cta-v2`, overflow hidden): a 7/5 column split (6/6 from 1200px), vertically centred. Left column: 60px top and bottom padding, centred text; from 768px 80px padding, left-aligned. Under the headline, two buttons 17px apart: \"Request a Live Demo\" (#FAD100, #0D1117 text, padding 16px 25px) and \"Contact Us\" (1px rgba(117,119,123,.5) border, #FAD100 text, padding 16px 30px), both 18px / 21.2px weight 700, 10px radius. Right column: an illustration, max 300px tall and centred on mobile; from 768px right-aligned, max 467px tall and shifted `translate: 80px -5px` so it bleeds off the edge. The page behind is #000416 with a full-page wave background (decoration, not part of this component). That layout is the section's.",
      "Original typography: Public Sans (Google Font) weight 700, -2px tracking, white: 48px / 1.2 with a 40px bottom margin, and 72px / 86.4px with an 80px bottom margin from 992px. The cursor inherits the headline's type.",
      "It's a Client Component (\"use client\").",
    ],
  },
  {
    slug: "cipher-reveal",
    added: "2026-11-17",
    title: "Cipher reveal",
    description:
      "A headline that decodes out of scrambled characters letter by letter, then re-scrambles under the pointer, from the Cipher Reveal text effect in React Bits Pro",
    category: "animations",
    group: "text-effects",
    level: "atom",
    source: "https://pro.reactbits.dev/docs/components/cipher-reveal",
    componentName: "CipherReveal",
    files: [
      {
        name: "cipher-reveal.tsx",
        path: "src/registry/animations/text-effects/cipher-reveal.tsx",
      },
    ],
    usageProps: ['as="h2"'],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A headline that decodes itself: {from|scrambled=the whole line starts as cycling cipher characters|*=letters type in as cycling cipher characters} and each one locks into the real letter in turn, {order|right=right to left|center=from the middle outwards|random=in a random order|*=left to right}. It should feel precise and technical, like a message being decrypted, and the line must never shift while it happens.",
      trigger:
        "{trigger|mount=The reveal plays once on mount.|manual=Nothing plays on its own: the text is static until `replay()` is called on the ref.|*=The reveal plays once, the first time 50% of the headline is visible (an IntersectionObserver).}{loop|true= It then decodes again every {interval}ms while the headline is on screen.|*=}{hover|trail= On hover (fine pointers only), the letters within {hoverRadius}em of the pointer re-scramble and decode again behind it.|replay= When a fine pointer enters the headline, the whole reveal plays again.|*=}",
      states: [
        "Order: each letter gets a rank from 0 to 1 ({order|right=last letter first|center=distance from the middle|random=a fresh shuffle each play|*=its index}). Letter start = rank × ({duration}ms − {scramble}ms); it locks {scramble}ms later, so the last letter locks at {duration}ms.",
        "{from|scrambled=Before its turn: every letter already shows a scrambled glyph.|*=Before its turn: the letter is invisible (its space is kept).}",
        "Scrambling: the real letter is at `opacity: 0` and a glyph on top of it changes {rate} times a second, {charset|auto=picked from characters of the same case and a similar width (narrow i/l/t, wide m/w, digits, symbols)|*=picked from `{charset}`}. It is {scrambleColor} at opacity {scrambleOpacity}, brightening linearly to 1 as it nears its lock.",
        "Every scrambled glyph is scaled on X (`scaleX`, centred) to the exact width of the letter it covers, so the line never shifts.",
        "Locked: the glyph disappears and the real letter fades to `opacity: 1`.",
      ],
      timing: [
        "Whole reveal: {duration}ms. Each letter scrambles {scramble}ms before it locks. Glyphs change {rate}×/s, staggered per letter so they don't all flip on the same frame.",
        "Lock fade: {lockFade}ms, `cubic-bezier(0.2, 0.7, 0.2, 1)`.",
        "{hover|trail=Hover trail: a touched letter scrambles while the pointer moves over it and locks {scramble}ms after the pointer last came within reach.|*=}",
      ],
      interruption:
        "Replaying mid-reveal restarts it from the `from` state. The hover trail is ignored while a reveal is playing. Changing the text renders the new letters and plays the reveal again. Off screen the loop timer stops; it resumes when the headline is back. On unmount, cancel the frame loop, timers and observers.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` the text shows from the first paint: no scramble, no hover trail, no loop. The pre-hydration hiding is only declared inside `@media (prefers-reduced-motion: no-preference)`.",
      rules: [
        "Split the text into words (`white-space: nowrap`) of inline-block letters, so lines only break between words. Each letter holds the real character (keeps the layout) and an absolutely positioned glyph on top (`left: 50%`, `translateX(-50%) scaleX(…)`, `pointer-events: none`).",
        "Measure glyph widths with a canvas `measureText` in the letter's computed font plus its letter-spacing, cached per character; measure letter widths once, again after `document.fonts.ready` and on resize. Never read layout per frame.",
        "Run one requestAnimationFrame loop that writes `opacity`, `transform` and `textContent` straight to the DOM, and stop it as soon as every letter is locked. Don't put per-frame state in React.",
        "Hide the letters with CSS before hydration so nothing flashes, and add a `<noscript>` rule that shows them.",
        "Screen readers get the text once from visually hidden text inside the heading; the letters are `aria-hidden`, so the scramble isn't announced.",
      ],
      checks: [
        "{trigger|mount=Reload|manual=Call `replay()`|*=Scroll to the headline}: letters decode {order|right=right to left|center=from the middle out|random=in a random order|*=left to right} and the last one locks at about {duration}ms.",
        "Watch the line's edges during the reveal: nothing shifts or re-wraps. Narrow the window so it wraps: words stay whole.",
        "{hover|trail=Move the pointer along the headline: letters under it scramble and decode again behind it.|replay=Move the pointer onto the headline: it decodes again.|*=Hover the headline: nothing happens.}",
        "After the reveal, confirm in the Performance panel that no frame loop is still running.",
        "Turn on reduced motion: the headline is static from the first paint.",
      ],
    },
    controls: [
      { type: "text", name: "text", label: "Text", default: "Ideas into reality", always: true },
      {
        type: "select",
        name: "from",
        label: "Start",
        default: "blank",
        options: [
          { label: "Blank", value: "blank" },
          { label: "Scrambled", value: "scrambled" },
        ],
      },
      {
        type: "select",
        name: "order",
        label: "Order",
        default: "left",
        options: [
          { label: "Left to right", value: "left" },
          { label: "Right to left", value: "right" },
          { label: "Centre out", value: "center" },
          { label: "Random", value: "random" },
        ],
      },
      { type: "text", name: "charset", label: "Charset", default: "auto" },
      {
        type: "select",
        name: "hover",
        label: "Hover",
        default: "trail",
        options: [
          { label: "Trail", value: "trail" },
          { label: "Replay", value: "replay" },
          { label: "None", value: "none" },
        ],
      },
      { type: "number", name: "hoverRadius", label: "Hover radius", default: 0.6, min: 0.2, max: 2, step: 0.05, unit: "em", motion: false },
      {
        type: "select",
        name: "trigger",
        label: "Plays on",
        default: "view",
        options: [
          { label: "Into view", value: "view" },
          { label: "Mount", value: "mount" },
          { label: "Manual (ref)", value: "manual" },
        ],
      },
      { type: "color", name: "color", label: "Text colour", default: "#FFFFFF" },
      { type: "color", name: "scrambleColor", label: "Scramble colour", default: "#FFFFFF" },
      { type: "number", name: "scrambleOpacity", label: "Scramble opacity", default: 0.42, min: 0, max: 1, step: 0.01 },
      { type: "boolean", name: "loop", label: "Loop", default: false },
      { type: "number", name: "duration", label: "Duration", default: 1400, min: 300, max: 5000, step: 50, unit: "ms", motion: true },
      { type: "number", name: "scramble", label: "Scramble per letter", default: 450, min: 100, max: 2000, step: 25, unit: "ms", motion: true },
      { type: "number", name: "rate", label: "Glyph changes", default: 14, min: 4, max: 40, step: 1, unit: "/s", motion: true },
      { type: "number", name: "interval", label: "Loop interval", default: 5000, min: 1500, max: 15000, step: 250, unit: "ms", motion: true },
      { type: "number", name: "lockFade", label: "Lock fade", default: 200, min: 0, max: 800, step: 10, unit: "ms", motion: true, secondary: true },
    ],
    promptNotes: [
      "`text` must be plain text. Font, size, weight, tracking and alignment come from `className` (it renders one `as` element, `h2` by default); the scramble glyphs use the same font.",
      "`ref` exposes `{ replay() }` (React 19 ref-as-prop). `onComplete` fires when a reveal finishes, not after a hover trail.",
      "React Bits' demo type: the page font at weight 600, `-0.03em` tracking, line-height 1.1, `clamp(2.75rem, 8vw, 6.5rem)` (`min(80px, 11vw)` in the docs preview), white, centred on a near-black stage. The demo uses Inter Tight 600.",
      "It's a Client Component (\"use client\").",
    ],
  },
  {
    slug: "rotating-pill-headline",
    added: "2026-11-17",
    title: "Rotating pill headline",
    description:
      "A headline with a coloured pill mid-sentence whose word, colours and width change every few seconds, used in the \"Where teams and agents Ship together.\" hero on the Notion website",
    category: "animations",
    group: "text-effects",
    level: "atom",
    source: "https://www.notion.com/",
    componentName: "RotatingPillHeadline",
    files: [
      {
        name: "rotating-pill-headline.tsx",
        path: "src/registry/animations/text-effects/rotating-pill-headline.tsx",
      },
    ],
    usageProps: ['as="h1"', "words={words}"],
    themeToggle: false,
    defaultTheme: "light",
    fullBleed: true,
    motion: {
      intent:
        "A hero headline with one word that keeps changing: a rounded pill with a coloured dot sits mid-sentence, and every few seconds its word and colours swap and the pill snaps to the new word's width, nudging the rest of the line along. It should feel crisp and confident, not bouncy.",
      trigger:
        "Autoplay: the next word every {interval}ms, looping forever, but only while the headline is on screen (an IntersectionObserver pauses it off screen). Nothing animates on load: the first word shows at its natural width.",
      states: [
        "Word: the text swaps instantly to the next word in the list (no fade or slide).",
        "Colours: the pill background and dot change to that word's colours {colorDuration|0=at the same moment, no transition (as on Notion)|*=over {colorDuration}ms, `ease`}.",
        "Width: the label wrapping the word animates its `width` from the old word's measured pixel width to the new one's. It clips its content (`overflow: hidden`, `white-space: nowrap`), so a wider word is cut off on the right until the pill opens up, and a narrower word leaves space that closes. The pill's padding and dot don't move; only the label resizes, and the text after the pill reflows with it.",
      ],
      timing: [
        "Hold: {interval}ms per word.",
        "Resize: {duration}ms, `{easing}`. Notion's curve is `cubic-bezier(0.86, 0, 0.07, 1)`, a very strong ease-in-out: a held start, a fast middle, a soft landing. With a short duration it reads as a snap.",
      ],
      interruption:
        "The interval ({interval}ms) is far longer than the resize ({duration}ms), so changes never overlap. If one did, the width transition retargets from wherever it is. Off screen the timer stops and restarts when the headline comes back.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` the words don't rotate: the first word shows, still, with no width transition. (Notion only drops the width transition and keeps swapping words; stopping the rotation is an improvement.)",
      rules: [
        "Measure the word with an inner `inline-block` span and set the clipping label's `width` in pixels before paint (a layout effect); CSS transitions `width` between the two pixel values. Don't animate from `auto`.",
        "Re-measure with a ResizeObserver on the inner span, so the pill fits after the web font loads and when the font size changes at a breakpoint.",
        "Size the pill in `em` (padding, gap, dot) so it scales with the headline at every breakpoint. It's `display: inline-flex; align-items: baseline` so the word sits on the headline's baseline, and the dot is centred with `align-self: center`.",
        "Screen readers: render the sentence once with a visually hidden list of the words in place of the pill, and mark the rotating pill `aria-hidden`, so changes aren't announced every few seconds.",
      ],
      checks: [
        "Every {interval}ms the word changes, the colours change with it, and the pill resizes over {duration}ms; the text after the pill slides along with it.",
        "Going from a short word to a long one (Ship → Create), the new word is clipped on the right while the pill grows, never overflowing it.",
        "Reload: nothing animates on load. The pill fits its first word exactly, even after the web font swaps in.",
        "Scroll the headline off screen and wait: it doesn't advance while hidden.",
        "Narrow the window: the pill wraps with the words around it and stays in proportion.",
        "Turn on reduced motion: the first word stays put.",
      ],
    },
    controls: [
      { type: "text", name: "before", label: "Before", default: "Where teams and agents", always: true },
      { type: "text", name: "after", label: "After", default: "together.", always: true },
      { type: "number", name: "interval", label: "Hold per word", default: 2500, min: 1000, max: 6000, step: 100, unit: "ms", motion: true },
      { type: "number", name: "duration", label: "Resize", default: 300, min: 100, max: 1000, step: 10, unit: "ms", motion: true },
      { type: "select", name: "easing", label: "Resize easing", default: "cubic-bezier(0.86, 0, 0.07, 1)", options: easingOptions, motion: true },
      { type: "number", name: "colorDuration", label: "Colour change", default: 0, min: 0, max: 600, step: 10, unit: "ms", motion: true, secondary: true },
    ],
    promptNotes: [
      "`words` is an array of `{ text, background, dot }`. Notion's: Think (#E6F3FE / #097FE8), Ship (#D0F4D8 / #1AAE39), Create (#FFDEC4 / #FF6D00), Build (#FFE4AF / #FFB110), Jam (#EADBFA / #9849E8), Scale (#BDE6E4 / #27918D), shown in that order.",
      "`before` and `after` are the plain text around the pill. The heading's accessible text is `before`, the words comma separated (or `srLabel`), then `after`.",
      "This is a base component: font, size, colour, alignment and width come from `className` (it renders one `as` element, `h1` by default). The pill takes 0.75em of the headline's size and inherits its colour.",
      "Pill proportions at Notion's desktop size (72px pill text): padding 8px 28px, 12px gap, 32px dot, full radius, line-height 1.21, -0.0278em tracking. The component keeps those ratios in `em` at every size; Notion uses tighter fixed values below 840px (2px 12px padding, 6px gap, 16px dot).",
      "Original typography: NotionInter (licensed), weight 600, rgba(0, 0, 0, 0.95), centred with `text-wrap: balance`. Size 42px / 48px / -1.5px tracking, and from 600px `clamp(2.625rem, -25.5px + 11.25vw, 6rem)` / `clamp(3rem, -17px + 10.8333vw, 6.25rem)` / `clamp(-0.2875rem, 2.375px - 0.645833vw, -0.09375rem)` (96px / 100px at 1280px+). The demo uses Inter weight 600 as the closest Google Font.",
      "It's a Client Component (\"use client\").",
    ],
  },
  {
    slug: "scroll-text-reveal",
    title: "Scroll text reveal",
    description:
      "A dimmed statement fills in letter by letter as its section scrolls through the viewport, after fading up into place, used on NetApp AI website",
    category: "animations",
    group: "scroll-triggers",
    level: "atom",
    source: "https://netapp.ai/",
    componentName: "ScrollTextReveal",
    motionNote:
      "Scroll-linked: the fill follows the scroll position, so it has no duration or easing; only the rise on enter is timed.",
    files: [
      {
        name: "scroll-text-reveal.tsx",
        path: "src/registry/animations/scroll-triggers/scroll-text-reveal.tsx",
      },
    ],
    usageProps: ['as="h2"', "text={stat.text}"],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A large statement that reads like it's being written as you scroll: the text starts dimmed and fills in {split|word=word|*=letter} by {split|word=word|*=letter}, in reading order, as it passes through the viewport. It should feel tied to the reader's own scrolling, never on a timer.",
      trigger:
        "Scroll position. The fill is driven by a CSS view timeline on {timeline|self=the text element itself|*=the closest `<section>` around the text, not the text}, so it moves forward as you scroll down and backward as you scroll up.{rise|true= The first time 20% of the text is in view it also fades up into place, once.|*=}",
      states: [
        "Every {split|word=word|*=character} starts at `opacity: {dimOpacity}` and ends at `opacity: 1`.",
        "The fill runs between `cover {start}%` and `cover {end}%` of {timeline|self=the text's|*=the section's} view timeline (0% = its top meets the bottom of the viewport, 100% = its bottom leaves the top; 50% is the moment it sits centred, so {end}% finishes the text just before that). Each {split|word=word|*=character} gets its own equal slice of that range, numbered across lines in reading order (line breaks take no slice), so the brightness sweeps through the text.",
        "{rise|true=Rise on enter: from `opacity: 0; translateY({riseDistance}px)` to `opacity: 1; translateY(0)`, once.|*=}",
      ],
      timing: [
        "Fill: `linear`, mapped to scroll (no duration).",
        "{rise|true=Rise: {riseDuration}ms, easing `{riseEasing}`, once on first entry.|*=No rise.}",
      ],
      interruption:
        "The fill has no state of its own: it always matches the scroll position, so scrolling back un-fills it and stopping freezes it mid-sweep.{rise|true= The rise plays once and never replays.|*=}",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, there's no rise and no dimming: the text is simply shown at full opacity.",
      rules: [
        "Drive the fill with a CSS scroll-driven animation: name a `view-timeline` on {timeline|self=the text element|*=the section} and give each span `animation-timeline` with its own `animation-range`.",
        "Fallback, as in the original: where `animation-timeline` isn't supported (Firefox) and in WebKit (Safari freezes some of ~100 concurrent scroll-driven animations at their first frame), set `animation: none` on the spans and write the same opacities from a passive scroll listener once per animation frame, using the same `cover` progress maths.",
        "Split the text into one `aria-hidden` span per {split|word=word|*=character} and give screen readers the full sentence once in a visually hidden copy.",
        "The text must render visible in the server HTML; only hide it for the rise after hydration, and only if it starts entirely off screen, then play the rise when 20% of it is in view. Nothing flashes and nothing depends on JavaScript.",
        "No ancestor between the text and the page scroller may have `overflow: hidden`, `auto` or `scroll` (the timeline would attach to it and freeze); use `overflow: clip` to clip decorations.",
      ],
      checks: [
        "Scroll the {timeline|self=text|*=section} up through the viewport: the first {split|word=word|*=letter} lights at {start}% of its pass and the last at {end}%, just before it's centred, in reading order.",
        "Open it in Safari and Firefox: the same sweep runs (from the scroll fallback), with no letters stuck dim.",
        "Scroll back up: it un-fills in reverse.",
        "{rise|true=Load the page with the text below the fold, then scroll to it: it fades up {riseDistance}px over {riseDuration}ms, once. Reload with it already on screen: it doesn't jump.|*=}",
        "Turn on reduced motion: the text is fully visible and doesn't move.",
      ],
    },
    controls: [
      {
        type: "text",
        name: "text",
        label: "Text",
        default: "Gartner predicts that through 2026, 60% of AI projects that are not supported by AI-ready data will be abandoned",
      },
      {
        type: "select",
        name: "split",
        label: "Split by",
        default: "char",
        options: [
          { label: "Character", value: "char" },
          { label: "Word", value: "word" },
        ],
      },
      { type: "number", name: "dimOpacity", label: "Dim opacity", default: 0.2, min: 0, max: 0.8, step: 0.05 },
      { type: "number", name: "start", label: "Reveal start", default: 20, min: 0, max: 90, step: 1, unit: "%" },
      { type: "number", name: "end", label: "Reveal end", default: 45, min: 5, max: 100, step: 1, unit: "%" },
      {
        type: "select",
        name: "timeline",
        label: "Measured on",
        default: "section",
        options: [
          { label: "Section", value: "section" },
          { label: "Text", value: "self" },
        ],
      },
      { type: "boolean", name: "rise", label: "Rise on enter", default: true },
      { type: "number", name: "riseDistance", label: "Rise distance", default: 48, min: 0, max: 120, step: 2, unit: "px" },
      { type: "number", name: "riseDuration", label: "Rise duration", default: 1400, min: 200, max: 2400, step: 50, unit: "ms" },
      { type: "select", name: "riseEasing", label: "Rise easing", default: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", options: easingOptions },
    ],
    promptNotes: [
      "This is a base component: it only handles the text and its motion. Font, size, colour, alignment and width come from `className` on the component (it renders a single `as` element, `h2` by default). The section, background and logo above it are not part of it.",
      "`text` must be a plain string because it is split into one span per character (or per word with `split=\"word\"`). Screen readers get the full text once from a visually hidden copy; the split spans are `aria-hidden`.",
      "By default the scroll progress is measured on the closest `<section>`, as in the original (whose section has 259px top / 251px bottom padding, 102px / 98px below 1280px): the component names a view timeline on it. Pass `timeline=\"self\"` if the text isn't inside a section or the section is very tall.",
      "Gotcha: no ancestor between the text and the page scroller may have `overflow: hidden`/`auto`/`scroll`. Any of those makes that ancestor the scroll container, the view timeline attaches to it, and since it never scrolls the text stays frozen. Use `overflow: clip` (Tailwind `overflow-clip`) on the section to clip decorations instead.",
      "Original typography: F37 Judge (licensed) at 60px / 66px, weight 100, -0.6px tracking, centred in a 1060px column (30px / 33px, -0.3px below 1280px), white over a light aurora background, with a 30px-tall attribution logo (20px below 1280px) 60px above it. The demo uses Inter Tight weight 300 as the closest Google Font, in black so it reads on the light background.",
    ],
  },
  {
    slug: "scroll-shift-headline",
    title: "Scroll shift headline",
    description:
      "Two huge centred lines slide past each other in opposite directions as you scroll, landing dead centre when the section is centred, used on eight25 website",
    category: "animations",
    group: "scroll-triggers",
    level: "atom",
    source: "https://cntfl-eight25corporate-e25qa.vercel.app/",
    componentName: "ScrollShiftHeadline",
    motionNote:
      "Scroll-linked: the lines move with the scroll position, so there's no duration or easing.",
    files: [
      {
        name: "scroll-shift-headline.tsx",
        path: "src/registry/animations/scroll-triggers/scroll-shift-headline.tsx",
      },
    ],
    usageProps: ['as="h2"'],
    defaultTheme: "light",
    fullBleed: true,
    motion: {
      intent:
        "A two-line display statement that leans with the reader's scrolling: the lines are pulled apart sideways while the section approaches, close onto a centred stack as it reaches the middle of the screen, and cross past each other as it leaves. It's tied to scroll, never on a timer, so the type only moves while you do.",
      trigger:
        "Scroll position, as a scrub. One progress number is a pure function of where {measure|self=the heading|*=the closest `<section>` around the heading} sits: `+1` while it's fully below the viewport's middle, `0` when its centre is on the viewport's middle, `-1` once it's fully above (clamped to that range).",
      states: [
        "Line one: `translateX(progress × {travel}em × -1)`, so it sits to the left below centre and to the right above it.",
        "Line two: `translateX(progress × {travel}em)`, the same distance the opposite way.",
        "At `progress = 0` both lines are at 0: centred (`text-align: center` on the heading is their whole resting position, with no horizontal offsets that would have to agree).",
        "The travel is in `em`, so it scales with the type: {travel}em is about {travel*260}px at a 260px display size.",
      ],
      timing: [
        "No duration or easing: linear, mapped 1:1 to scroll position.",
        "Write the progress as a CSS custom property on the heading at most once per animation frame, and only when it changed (4 decimal places).",
      ],
      interruption:
        "There's no state to interrupt: the offset always matches the scroll position, so stopping freezes it and scrolling back walks the lines back the way they came.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` (watched live), stop listening and remove the property: both lines sit centred and never move.",
      rules: [
        "Publish one custom property (progress) from a passive scroll listener (capture phase on `window`, so nested scroll containers count too) plus resize, coalesced into `requestAnimationFrame`. The lines read it in a `calc()` with a `0` fallback, so server HTML and no-JS render the centred composition.",
        "Measure progress against the nearest scroll container (the window, unless the heading sits in a scrolling box).",
        "Each line is a single, `white-space: nowrap` copy of its text: nothing loops. A line wider than the viewport bleeds past both edges, so clip the section horizontally with `overflow-x: clip` (not `hidden`, which would make it a scroll container).",
        "Only `transform` changes. React must not re-render on scroll.",
      ],
      checks: [
        "Scroll the section up from below: line one starts left and line two right, and they meet in a centred stack exactly when the section is centred in the viewport.",
        "Keep scrolling: they cross and part the other way as the section leaves the top. Scroll back: they retrace.",
        "Stop scrolling: nothing moves.",
        "No horizontal scrollbar at any width.",
        "Turn on reduced motion: both lines sit centred and stay still.",
      ],
    },
    controls: [
      { type: "text", name: "headline", label: "Line 1", default: "accelerate", always: true },
      { type: "text", name: "headlineSecondary", label: "Line 2", default: "growth", always: true },
      { type: "number", name: "travel", label: "Travel", default: 0.6, min: 0, max: 2, step: 0.05, unit: "em" },
      { type: "number", name: "overlap", label: "Line overlap", default: 0.35, min: 0, max: 0.6, step: 0.01, unit: "em" },
      {
        type: "select",
        name: "measure",
        label: "Centred on",
        default: "section",
        options: [
          { label: "Section", value: "section" },
          { label: "Heading", value: "self" },
        ],
      },
    ],
    promptNotes: [
      "`headline` and `headlineSecondary` are the two lines (plain strings, as the original's CMS fields). Either can be left out; with one line it still slides, just with nothing to pass.",
      "This is a base component: it only handles the two lines and their slide. Font, size, weight, leading and colour come from `className`/`style` on the component (one `as` element, `h2` by default, `text-align: center`). `overlap` pulls line two up into line one in em (the original uses 0.3462em at 260px, 0.3889em on mobile).",
      "Put it in a section with `overflow-x: clip` so the bleeding lines never cause a horizontal scrollbar. By default progress is measured on that closest `<section>`; pass `measure=\"self\"` if there isn't one.",
      "In the original it's the `onscrollText` content section, over a decorative fan of faint vertical lines in rgba(78, 0, 142, 0.2) that sway slowly (not part of this component).",
      "Original typography: Landour Display (licensed) weight 200 (Extra Light, from the variable font with `\"opsz\" 72`), fluid `min(260px, 18.0556vw)` (260px at 1440), 110% leading, 0 tracking, colour #4E008E on white. The demo uses Hanken Grotesk weight 200 as the closest Google Font.",
      "It's a Client Component (\"use client\"); no dependencies.",
    ],
  },
  {
    slug: "scroll-color-background",
    title: "Scroll color background",
    description:
      "The page background fades to a new color as each section scrolls in, so dark and light sections hand over smoothly, used on NetApp AI website",
    category: "animations",
    group: "scroll-triggers",
    level: "page",
    source: "https://netapp.ai/solutions/ai-training-fine-tuning/",
    componentName: "ScrollColorBackground",
    files: [
      {
        name: "scroll-color-background.tsx",
        path: "src/registry/animations/scroll-triggers/scroll-color-background.tsx",
      },
    ],
    usageProps: ["sections={sections}"],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A run of sections that share one background. As you scroll into the next section, the whole background (and the text colour) fades to that section's colour, so the page feels like it changes mood rather than cutting between blocks. Here: {color1} → {color2} → {color3}.",
      trigger:
        "Scroll position. A section becomes the active one when its top rises above {arriveAt*100}% of the viewport height (the original's \"bottom fifth\" edge). The active section is the last one that has crossed that line, so scrolling back up hands the colour back the same way.",
      states: [
        "Wrapper background: the active section's colour. Sections themselves are transparent.",
        "Wrapper text colour: the active section's `textColor`, if given, so copy stays readable on dark and light grounds.",
        "On load: the first measure picks the right section with the transition off, so nothing fades in on page load.",
      ],
      timing: [
        "Crossfade: {duration}ms, easing `{easing}`, for `background-color` and `color` together.",
        "It starts the moment the new section crosses the line, while that section is still mostly below the fold, so the fade is done by the time it fills the screen.",
      ],
      interruption:
        "Use a CSS transition on `background-color` and `color`. Scrolling back across the line mid-fade reverses from wherever the colour is, with no jump.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the colours still change at the same scroll points but instantly, with no fade.",
      rules: [
        "Put the colour on one wrapper behind all the sections and keep the sections transparent. Don't fade each section's own background: their edges would show during the fade.",
        "Measure section tops on scroll and resize, at most once per animation frame, and only write the colour when the active section changes. Don't write styles every frame.",
        "Server-render the first section's colour so the page has its ground before JavaScript runs.",
        "Listen for scroll in the capture phase on window, so it also works inside a nested scroll container.",
      ],
      checks: [
        "Scroll down slowly: as the second section's top reaches the bottom fifth of the screen, the background fades to {color2} over {duration}ms; the same again for {color3}.",
        "Scroll back up: the colours hand back at the same points.",
        "Reload half-way down the page: the background is already the right colour, with no fade on load.",
        "Turn on reduced motion: the colours switch instantly at the same points.",
      ],
    },
    controls: [
      { type: "color", name: "color1", label: "Section 1", default: "#FFFFFF" },
      { type: "color", name: "color2", label: "Section 2", default: "#000000" },
      { type: "color", name: "color3", label: "Section 3", default: "#0054D7" },
      { type: "number", name: "duration", label: "Duration", default: 350, min: 0, max: 2000, step: 50, unit: "ms" },
      { type: "select", name: "easing", label: "Easing", default: "ease", options: easingOptions },
      { type: "number", name: "arriveAt", label: "Switch at (viewport)", default: 0.8, min: 0.2, max: 1, step: 0.05 },
    ],
    promptNotes: [
      "`sections` is an array of `{ color, textColor?, className?, children? }`, one per section, in page order. Each renders as a transparent <section>; give it height and content as usual. The active section also gets a `data-active` attribute for styling its own content.",
      "Timing props: `duration` (ms) and `easing` (any CSS timing function) for the crossfade; `arriveAt` sets where in the viewport a section takes over.",
      "It's a client component, but the first colour is server-rendered.",
      "The original is NetApp's \"dark takeover\": when a dark section arrives, the WHOLE page (including the header and sections outside it) fades to black (a #001330 → #000 gradient over the first 540px), and it hands back once that section has scrolled fully off the top. This component scopes the effect to its own wrapper and generalises it to any number of colours.",
    ],
  },
  {
    slug: "logo-marquee",
    title: "Logo marquee",
    description:
      "An endless strip of logos scrolls sideways at a slow, steady pace, and a linked logo grows and pauses the strip on hover, used on Sophos website",
    category: "animations",
    group: "carousels",
    level: "section",
    source: "https://www.sophos.com/en-us",
    componentName: "LogoMarquee",
    files: [
      {
        name: "logo-marquee.tsx",
        path: "src/registry/animations/carousels/logo-marquee.tsx",
      },
    ],
    usageProps: ["logos={logos}"],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A full-width strip of logos (customers, partners or award badges) that drifts sideways forever at a slow, steady pace, so the row reads as \"there are many of these\" without asking for attention. It should feel calm and constant: no easing, no jumps, no visible seam.",
      trigger:
        "Starts on load and never stops. Pointer hover on a linked logo pauses the whole strip (devices that really hover only), and so does keyboard focus on a linked logo; leaving resumes from the same spot.",
      states: [
        "Track: six identical copies of the logos in one row, every logo {gap}px apart (including between copies). It moves from `translateX(0)` to `translateX(calc(-50% - {gap}px / 2))`, exactly three copies, then restarts, so copy four lands where copy one began and the loop has no seam.",
        "Logos: {logoHeight}px tall from 1024px wide (60px below), each at its natural width.",
        "Linked logo on hover (1024px+): `scale({hoverScale})`, from the centre{hoverScale|1= (that is, no scale)|*=}. Unlinked logos don't react.",
      ],
      timing: [
        "Strip: `linear`, infinite. Its speed is {speed}px per second: measure one copy's width (the track's full width ÷ 6) and set the duration to `3 × copyWidth ÷ {speed}` seconds, clamped to 10–200s. Re-measure when the logos load or the layout changes.",
        "Hover scale: {hoverDuration}ms, `{hoverEase}`, in and out.",
      ],
      interruption:
        "Pausing freezes the strip mid-move and resuming continues from there (`animation-play-state`, not a restart). The hover scale reverses from wherever it is if the pointer leaves mid-grow. A re-measure only changes the duration, so the speed adjusts without the strip jumping back.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the strip doesn't move: show one copy of the logos as a normal horizontal scroll area, and the hover scale applies without its transition.",
      responsive:
        "Logos are 60px tall below 1024px and {logoHeight}px from 1024px; the hover scale is only from 1024px. The speed stays {speed}px/s at every width.",
      rules: [
        "Animate only `transform` on the track, with a CSS keyframe animation; don't move it with JS each frame or with `left` or `margin`.",
        "Use `gap` on the track (not margins on the logos), so the gap between copies equals the gap between logos and the `- gap / 2` correction lines the loop up exactly.",
        "Copies two to six are `aria-hidden` and their links `tabIndex={-1}`, so screen readers and keyboard users meet each logo once.",
      ],
      checks: [
        "Watch one logo for 10 seconds: it moves about {speed*10}px, at a constant speed.",
        "Watch the strip for a full loop: no jump, gap or overlap at any point.",
        "Hover a linked logo on desktop: it grows to {hoverScale}× over {hoverDuration}ms and the whole strip stops; move off and the strip carries on from the same place.",
        "Hover an unlinked logo: nothing happens.",
        "At 375px: logos are 60px tall and the strip moves at the same speed.",
        "Turn on reduced motion: the strip stands still and can be scrolled sideways.",
      ],
    },
    controls: [
      { type: "number", name: "speed", label: "Speed", default: 30, min: 5, max: 120, step: 1, unit: "px/s" },
      {
        type: "select",
        name: "direction",
        label: "Direction",
        default: "left",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      { type: "boolean", name: "pauseOnHover", label: "Pause on hover", default: true },
      { type: "number", name: "hoverScale", label: "Hover scale", default: 1.1, min: 1, max: 1.3, step: 0.01 },
      { type: "number", name: "hoverDuration", label: "Hover", default: 300, min: 0, max: 800, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "hoverEase", label: "Hover easing", default: "cubic-bezier(0.4, 0, 0.2, 1)", options: easingOptions, secondary: true },
      { type: "number", name: "gap", label: "Gap", default: 70, min: 16, max: 160, step: 2, unit: "px" },
      { type: "number", name: "logoHeight", label: "Logo height", default: 80, min: 32, max: 120, step: 2, unit: "px" },
      { type: "color", name: "background", label: "Background", default: "#EDF2F9" },
    ],
    assets: [
      {
        prop: "logos[].src",
        label: "Client logo",
        fit: "Shown at a fixed height (`logoHeight`, 80px from 1024px) and its natural width",
        placeholder: "400x160",
        notes: "SVG preferred, trimmed with no padding baked in, all in one colour treatment so the strip reads evenly. A placeholder's ratio becomes the logo's width, so give real logos their own shape.",
      },
    ],
    promptNotes: [
      "`logos` is an array of `{ src, alt, href?, newTab? }`. Logos are shown at a fixed height and their natural width, so export them trimmed, with no padding baked in. Logos with an `href` become links that grow and pause the strip on hover; the rest are plain images.",
      "`heading` (optional) renders centred above the strip, 40px above it, max 310px wide on phones. The original's is Lexend Exa 24px weight 300 in #0A143A; the Sophos homepage instance has none.",
      "Speed matches the original, which sets each loop (three copies) to one copy's width ÷ 10 seconds: about 30px/s, clamped to a 10-200s loop. Keep the measurement rather than a fixed duration, so the pace doesn't change with the number of logos.",
      "It is a Client Component (\"use client\") because it measures its width with a ResizeObserver. The keyframes and pause rules ship inside the component in a React 19 `<style href precedence>` tag; on React 18, move them into the global CSS.",
      "Section padding is 20px top and bottom on phones and 180px from 1024px, on #EDF2F9, as in the original. Change them with `className` if the page needs different spacing.",
      "It renders plain <img> tags. If the site has its own Image component, swap it in and keep the fixed height with auto width.",
    ],
  },
  {
    slug: "card-marquee",
    title: "Card marquee",
    description:
      "An endless row of icon cards drifts sideways; hovering one pauses the row while the card grows, turns white and reveals its copy, used on Seemplicity website",
    category: "animations",
    group: "carousels",
    level: "section",
    source: "https://seemplicity.ai/centralize-exposure-data/",
    recreated: "WordPress",
    componentName: "CardMarquee",
    files: [
      {
        name: "card-marquee.tsx",
        path: "src/registry/animations/carousels/card-marquee.tsx",
      },
    ],
    usageProps: [
      "items={benefits.map((benefit) => ({\n    icon: <img src={benefit.icon} alt=\"\" />,\n    title: <h3 className=\"text-[22px] font-bold min-[992px]:text-4xl\">{benefit.title}</h3>,\n    description: <p>{benefit.body}</p>,\n    href: benefit.url,\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A row of benefit cards that drifts past on its own, slow enough to read. When the reader hovers a card the row holds still and that card lifts out of the row: it grows taller, turns white and opens a line of copy under its heading.",
      trigger:
        "The row moves continuously from mount. Hovering the row{pauseOnHover|true= (or keyboard focus on a card) pauses it|*= doesn't pause it}. Hovering or focusing a card opens it. Hover only applies on devices that really hover (`@media (hover: hover)`); on touch the cards stay closed and a tap follows the link.",
      states: [
        "Row: `translateX(0 → -50%)` of a track holding two identical halves, looping forever{direction|right= in reverse|*=}.",
        "Card at rest: {cardWidth}px wide, {cardHeight}px tall (240px below 992px), `rgb(163 9 187 / 0.05)` background, transparent 1px border, no shadow. Icon top, heading bottom, copy hidden.",
        "Card open: {hoverGrow}px taller (half above, half below, centred in its slot so neighbours don't move), white background, `{hoverBorder}` border, `0 8px 28px rgb(11 6 35 / 0.12)` shadow. The copy opens under the heading (`grid-template-rows: 0fr → 1fr`, opacity 0 → 1), pushing the heading up.",
      ],
      timing: [
        "Row: {speed}px per second, `linear`. The duration is measured: one half's width ÷ {speed}.",
        "Card open / close: {hoverDuration}ms, `{hoverEase}`, on height, background, border, shadow, and the copy's rows and opacity together.",
      ],
      interruption:
        "Pausing freezes the row mid-move and it resumes from there (`animation-play-state`). A card that loses hover mid-open closes from wherever it is with the same transition. Resizing only re-measures the duration and copy count; the row doesn't jump back.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the row doesn't move: one copy of the cards shows as a horizontal scroll area, and cards open and close instantly.",
      responsive:
        "Below 992px: cards are 240px tall with 30px padding, a 20px gap and a 22px bold heading. From 992px: {cardHeight}px tall, 40px padding, 30px gap, 36px heading. Speed is {speed}px/s at every width.",
      rules: [
        "Animate the row with a CSS keyframe on `transform` only; never move it with JS each frame.",
        "Put each card's spacing in its own right margin (not a flex `gap`), so -50% lands exactly on the start of the second half.",
        "Render enough copies per half to cover the viewport (measure with a ResizeObserver). Every copy after the first is `aria-hidden` with `tabIndex={-1}` on its links.",
        "Keep each card in a fixed-height slot and position it absolutely centred, so its grow never reflows the row.",
      ],
      checks: [
        "Watch one card for 10 seconds: it moves about {speed*10}px at a constant pace, and a full loop shows no jump.",
        "Hover a card: the row stops, the card grows {hoverGrow}px over {hoverDuration}ms and its copy opens under the heading; neighbours don't move. Move off: it closes and the row carries on from the same place.",
        "Tab to a card: it opens with a focus ring and the row pauses.",
        "Turn on reduced motion: the row stands still and scrolls sideways.",
      ],
    },
    controls: [
      { type: "number", name: "speed", label: "Speed", default: 52, min: 10, max: 200, step: 1, unit: "px/s" },
      {
        type: "select",
        name: "direction",
        label: "Direction",
        default: "left",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      { type: "boolean", name: "pauseOnHover", label: "Pause on hover", default: true },
      { type: "number", name: "cardWidth", label: "Card width", default: 340, min: 240, max: 480, step: 10, unit: "px" },
      { type: "number", name: "cardHeight", label: "Card height", default: 324, min: 240, max: 440, step: 4, unit: "px" },
      { type: "number", name: "hoverGrow", label: "Hover grow", default: 58, min: 0, max: 120, step: 2, unit: "px" },
      { type: "number", name: "hoverDuration", label: "Hover", default: 300, min: 0, max: 800, step: 10, unit: "ms" },
      { type: "select", name: "hoverEase", label: "Hover easing", default: easings.out, options: easingOptions },
      { type: "color", name: "hoverBorder", label: "Hover border", default: "#D9CCDC" },
    ],
    assets: [
      {
        prop: "items[].icon",
        label: "Card icon",
        fit: "A 32px line icon above the title",
        placeholder: "64x64",
        notes: "An inline SVG or an icon from the site's icon set works too.",
        optional: true,
      },
    ],
    promptNotes: [
      "`items` is an array of `{ icon?, title, description?, href? }`. `title` and `description` are nodes so the site's heading and paragraph styles apply; the title is clamped to 3 lines. With `href` the card is a link; without it the card is still focusable so keyboard users can open it.",
      "The section heading and intro above the row are not part of this component - render them separately. The original section is white with 197px / 162px padding from 992px (80px below), and 83px between the intro and the row.",
      "Original typography: heading Cabinet Grotesk (licensed) 36px / 1.2, weight 400, -0.56px tracking, #410051 from 992px; 22px bold below. Copy 16px / 1.5 #0B0623 (14px on phones). Icons are 32px pink line icons. The demo uses Bricolage Grotesque for the heading.",
      "The original runs a CSS keyframe marquee at about 77px/s (7500px every 97.8s), and on hover the card goes from 324px to 382px tall, rgb(163 9 187 / 0.05) to white, with a #D9CCDC border and `0 8px 28px rgb(11 6 35 / 0.12)` shadow over 300ms `ease`. Deliberate changes: the defaults here run slower (52px/s) and open the card on a strong ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`) so it feels more responsive; the original's copy pops in with `display: none → block` and its card grows only as tall as the row allows; here the copy opens smoothly with the grow, the card grows evenly about its centre, and the row pauses on hover so the open card stays under the pointer.",
      "It is a Client Component (\"use client\") because it measures its width with a ResizeObserver. The keyframes and pause rules ship inside the component in a React 19 `<style href precedence>` tag; on React 18, move them into the global CSS.",
    ],
  },
  {
    slug: "integration-logo-wall",
    added: "2026-11-17",
    title: "Integration logo wall",
    description:
      "Two columns of logo cards scroll endlessly in opposite directions beside the section copy, turning into sideways rows on phones, used on UJET website",
    category: "animations",
    group: "carousels",
    level: "section",
    source: "https://ujet.cx/",
    componentName: "IntegrationLogoWall",
    files: [
      {
        name: "integration-logo-wall.tsx",
        path: "src/registry/animations/carousels/integration-logo-wall.tsx",
      },
    ],
    usageProps: ["columns={[crmLogos, wemLogos]}"],
    usageChildren:
      "<h2>Seamless integration with key customer service solutions</h2>\n  <p>Ensure best-in-breed compatibility with our partner ecosystem.</p>\n  <a href=\"/integrations\">View All Integrations</a>",
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "An integrations section where two columns of partner logo cards drift past each other, one up and one down, so the block reads as a large, living ecosystem without pulling focus from the copy beside it. It should feel calm and constant: no easing, no seams, no jumps.",
      trigger:
        "Starts on load and never stops. {pauseOnHover|true=Hovering either column (devices that really hover) or focusing a card link pauses both; leaving resumes from the same spot.|*=Nothing pauses it, as in the original.}",
      states: [
        "Column window: {columnHeight}px tall from 1024px, clipped, with a {fade}px fade to transparent at the top and bottom (a `mask-image` gradient, so it works on any background).",
        "Track: two identical halves, each with enough copies of the column's logos to fill the window. It moves from `translateY(0)` to `translateY(-50%)`, then restarts on an identical frame.",
        "Column 1 moves {direction|down=down|*=up}, column 2 the opposite way (`animation-direction: reverse`). Column 2 starts {stagger}px further into its loop so the cards never line up across the columns.",
        "Cards: {cardWidth}×{cardHeight}px, {cardBackground} background, {radius}px radius, `0 6px 15px rgb(0 8 67 / 0.15)` shadow, {gap}px apart, the logo fitted inside 20px / 50px padding.",
      ],
      timing: [
        "Each column: `linear`, infinite, at {speed}px per second. Measure one copy of the logos (its height) and set the duration to `copies × copyHeight ÷ {speed}` seconds. Re-measure when the logos load or the layout changes.",
        "Stagger: `animation-delay: -{stagger} ÷ {speed}` seconds on the second column, not a margin, so nothing shifts.",
      ],
      interruption:
        "Pausing freezes the columns mid-move and resuming continues from there (`animation-play-state`, never a restart). A re-measure only changes the duration, so the speed adjusts without the columns jumping back.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, nothing moves: each column shows one copy of its logos as a scroll area (vertical from 1024px, horizontal below).",
      responsive:
        "Breakpoints are container queries on the section's own width, not the viewport. Below 1024px the copy stacks on top and the columns become two full-width rows of 200px-wide cards, 16px apart, sliding sideways at the same {speed}px/s: row 1 left, row 2 right, with the fade on the left and right edges. From 1024px it's copy left, columns right.",
      rules: [
        "Animate only `transform` on each track with a CSS keyframe; don't move it with JS each frame or with `top` or `margin`.",
        "Give each card its own bottom margin (right margin below 1024px) instead of a flex `gap`, so -50% lands exactly on the start of the second half.",
        "Copies after the first are `aria-hidden` and their links `tabIndex={-1}`, so screen readers and keyboard users meet each logo once.",
        "Pad the clipped window by about 16px so the card shadows aren't cut off at the sides.",
      ],
      checks: [
        "Watch one card for 10 seconds: it moves about {speed*10}px at a constant pace; the two columns move in opposite directions.",
        "Watch for a full loop: no jump, gap or overlap at any point, and the cards in the two columns stay offset.",
        "The top and bottom {fade}px of each column fade out rather than cutting off hard.",
        "At 375px: two sideways rows under the copy, moving in opposite directions at the same speed.",
        "Turn on reduced motion: the columns stand still and can be scrolled.",
      ],
    },
    controls: [
      { type: "number", name: "speed", label: "Speed", default: 22.5, min: 5, max: 120, step: 0.5, unit: "px/s" },
      {
        type: "select",
        name: "direction",
        label: "First column",
        default: "up",
        options: [
          { label: "Up", value: "up" },
          { label: "Down", value: "down" },
        ],
      },
      { type: "number", name: "stagger", label: "Column offset", default: 45, min: 0, max: 200, step: 5, unit: "px", motion: true },
      { type: "boolean", name: "pauseOnHover", label: "Pause on hover", default: false },
      { type: "number", name: "cardWidth", label: "Card width", default: 260, min: 180, max: 360, step: 10, unit: "px" },
      { type: "number", name: "cardHeight", label: "Card height", default: 70, min: 50, max: 140, step: 2, unit: "px" },
      { type: "number", name: "gap", label: "Gap", default: 20, min: 8, max: 48, step: 2, unit: "px" },
      { type: "number", name: "radius", label: "Radius", default: 4, min: 0, max: 24, step: 1, unit: "px" },
      { type: "number", name: "columnHeight", label: "Column height", default: 550, min: 300, max: 800, step: 10, unit: "px" },
      { type: "number", name: "fade", label: "Edge fade", default: 70, min: 0, max: 160, step: 5, unit: "px" },
      { type: "color", name: "background", label: "Background", default: "#F3F4FE" },
      { type: "color", name: "cardBackground", label: "Card background", default: "#FFFFFF" },
    ],
    assets: [
      {
        prop: "columns[][].src",
        label: "Partner logo",
        fit: "Fitted (object-contain) inside a {cardWidth}×{cardHeight}px card with 20px / 50px padding, centred",
        placeholder: "320x60",
        notes: "SVG preferred, trimmed with no padding baked in, in full brand colour on a transparent background (the card supplies the white).",
      },
    ],
    promptNotes: [
      "`columns` is an array of logo arrays, one per column (two in the original, about 15 logos each). Each logo is `{ src, alt, href?, newTab? }`; with `href` the card becomes a link. Columns alternate direction, so a third column would move like the first.",
      "`children` is the copy column (heading, paragraph, CTA), rendered at max 570px wide beside the logos from 1024px and above them on phones. Style it with the site's own typography.",
      "Original typography: heading Outfit 60px / 1 weight 600, -0.6px tracking, #000843 from 890px (32px on phones); paragraph Outfit 20px / 1.5 #000843; CTA a #FF4E33 pill (43px radius, 12px 20px padding, 18px weight 600 white, #FF715C on hover) with an arrow that turns -45° over 400ms. Section #F3F4FE with 120px / 50px padding from 890px, 40px below.",
      "The original is two Swiper sliders (vertical, loop, autoplay delay 1ms, 4000ms per 90px slide, linear, `allowTouchMove: false`), the second with `reverseDirection`, and colour-matched gradient overlays for the fades. This version swaps Swiper for a CSS keyframe loop at the same 22.5px/s, uses `mask-image` for the fades so they work on any background, and switches layout at a 1024px container query instead of the original's 890px viewport media query, because the copy needs room beside two 260px columns.",
      "It is a Client Component (\"use client\") because it measures each column with a ResizeObserver. The keyframes and pause rules ship inside the component in a React 19 `<style href precedence>` tag; on React 18, move them into the global CSS.",
      "It renders plain <img> tags. If the site has its own Image component, swap it in and keep `object-contain` inside the card.",
    ],
  },
  {
    slug: "showcase-ticker",
    added: "2026-11-17",
    title: "Showcase ticker",
    description:
      "Two rows of site screenshots, wide desktop shots mixed with narrow phone shots, drift endlessly in opposite directions under the section heading, used on the Framer website",
    category: "animations",
    group: "carousels",
    level: "section",
    source: "https://www.framer.com/",
    recreated: "Framer",
    componentName: "ShowcaseTicker",
    files: [
      {
        name: "showcase-ticker.tsx",
        path: "src/registry/animations/carousels/showcase-ticker.tsx",
      },
    ],
    usageProps: [
      "heading={<h2 className=\"text-[44px] leading-[1.1] font-medium tracking-[-0.04em]\">Shipped with Framer</h2>}",
      "action={<a href=\"/showcase\" className=\"rounded-lg bg-white/10 px-3.5 py-2.5 text-sm font-medium\">See Framer sites</a>}",
      "rows={[\n    [{ src: \"/showcase/site-1.png\", alt: \"…\", kind: \"site\" }, { src: \"/showcase/phone-1.png\", alt: \"…\", kind: \"mobile\" }],\n    [{ src: \"/showcase/phone-2.png\", alt: \"…\", kind: \"mobile\" }, { src: \"/showcase/site-2.png\", alt: \"…\", kind: \"site\" }],\n  ]}",
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A gallery of customer sites that keeps moving on its own, two rows sliding past each other in opposite directions, so the section feels like a large, living body of work. It should be calm and constant: no easing, no seams, no jumps, nothing to interact with.",
      trigger:
        "Starts on load and never stops. {pauseOnHover|true=Hovering a row (devices that really hover) or focusing a card link pauses both rows; leaving resumes from the same spot.|*=Nothing pauses it, as in the original.}",
      states: [
        "Row window: the full content width (max 1200px), clipped with a {radius}px radius so cards entering and leaving keep a rounded edge.",
        "Track: two identical halves, each with enough copies of the row's cards to cover the window. It moves from `translateX(0)` to `translateX(-50%)`, then restarts on an identical frame.",
        "Row 1 moves {direction|right=right|*=left}, row 2 the opposite way (`animation-direction: reverse`).",
        "Cards: {height}px tall from 1200px; \"site\" cards 700/450 of the height wide, \"mobile\" cards 220/450. {radius}px radius, a 1px `rgb(255 255 255 / 0.1)` outline (the `border` prop), the screenshot `object-cover`, {gap}px apart and {gap}px between rows.",
      ],
      timing: [
        "Each row: `linear`, infinite, at {speed}px per second. Measure one copy of the cards (its width) and set the duration to `copies × copyWidth ÷ {speed}` seconds. Re-measure when the layout or card size changes.",
      ],
      interruption:
        "{pauseOnHover|true=Pausing freezes the rows mid-move and resuming continues from there (`animation-play-state`, never a restart). |*=}A re-measure only changes the duration, so the speed adjusts without the rows jumping back.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, nothing moves: each row shows one copy of its cards as a horizontal scroll area.",
      responsive:
        "Breakpoints are container queries on the section's own width. Cards are {height}px tall from 1200px, 76% of that from 810px and 58% below, keeping their aspect ratios. Speed is {speed}px/s at every width.",
      rules: [
        "Animate only `transform` on each track with a CSS keyframe; don't move it with JS each frame.",
        "Give each card its own right margin instead of a flex `gap`, so -50% lands exactly on the start of the second half.",
        "Copies after the first are `aria-hidden` with empty `alt`, and their links `tabIndex={-1}`, so screen readers and keyboard users meet each site once.",
        "Lazy-load the screenshots; they're large and most copies start off-screen.",
      ],
      checks: [
        "Watch one card for 10 seconds: it moves about {speed*10}px at a constant pace; the two rows move in opposite directions.",
        "Watch for a full loop: no jump, gap or overlap at any point.",
        "Cards at the row's left and right edges are clipped with a rounded corner, not a hard square edge.",
        "At 375px: the same two rows with smaller cards, still moving at {speed}px/s.",
        "Turn on reduced motion: the rows stand still and can be scrolled sideways.",
      ],
    },
    controls: [
      { type: "number", name: "speed", label: "Speed", default: 32, min: 5, max: 160, step: 1, unit: "px/s" },
      {
        type: "select",
        name: "direction",
        label: "First row",
        default: "left",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      { type: "boolean", name: "pauseOnHover", label: "Pause on hover", default: false },
      { type: "number", name: "height", label: "Card height", default: 450, min: 240, max: 600, step: 10, unit: "px" },
      { type: "number", name: "gap", label: "Gap", default: 10, min: 0, max: 40, step: 1, unit: "px" },
      { type: "number", name: "radius", label: "Radius", default: 15, min: 0, max: 40, step: 1, unit: "px" },
      { type: "color", name: "background", label: "Background", default: "#000000" },
    ],
    assets: [
      {
        prop: "rows[][].src (kind: \"site\")",
        label: "Desktop site screenshot",
        fit: "Fills a 700×450 card at {height}px tall (object-cover, centred)",
        placeholder: "1400x900",
        notes: "A browser-viewport capture of the site's hero, no browser chrome. Set `position: \"top\"` if the image is taller than 14:9.",
      },
      {
        prop: "rows[][].src (kind: \"mobile\")",
        label: "Phone site screenshot",
        fit: "Fills a 220×450 card at {height}px tall (object-cover, centred)",
        placeholder: "440x900",
        notes: "A phone-viewport capture of the site, no device frame.",
      },
      {
        prop: "rows[][].video",
        label: "Site recording",
        fit: "Fills the card over the screenshot, muted and looping",
        placeholder: "none",
        notes: "Short (5-10s), muted MP4 or WebM. The screenshot doubles as its poster.",
        optional: true,
      },
    ],
    promptNotes: [
      "`rows` is an array of card arrays, one per row (two in the original, six cards each, alternating site / mobile). Each card is `{ src, alt, kind?, aspect?, video?, position?, href? }`. `kind` picks the 700:450 or 220:450 shape; `aspect` (width ÷ height) overrides it. With `href` the card becomes a link.",
      "`heading` and `action` render in a header above the rows, 40px apart. The section has 120px / 20px padding and a 1200px max content width, as in the original; change them with `className`.",
      "Original typography: heading GT Walsheim Medium (licensed) 44px / 1.1, weight 500, -1.76px tracking, white. The \"See Framer sites\" link is a rgb(255 255 255 / 0.1) button with an 8px radius and 10px 14px padding. The demo uses DM Sans 500 as the closest Google Font.",
      "The original is a Framer Ticker component (two of them, the second reversed) at about 32px/s with no hover behaviour. This version swaps it for a CSS keyframe loop at the same speed.",
      "It is a Client Component (\"use client\") because it measures each row with a ResizeObserver. The keyframes and pause rules ship inside the component in a React 19 `<style href precedence>` tag; on React 18, move them into the global CSS.",
      "It renders plain <img> tags. If the site has its own Image component, swap it in and keep the card's fixed height with `object-cover`.",
    ],
  },
  {
    slug: "expanding-bento",
    title: "Expanding bento",
    description:
      "Two rows of colour cards with their names drifting across them as giant marquees; the hovered card widens and fades in a white detail card, used on Hatch website",
    category: "animations",
    group: "carousels",
    level: "section",
    source: "https://www.hatch.lk/",
    recreated: "Framer",
    componentName: "ExpandingBento",
    files: [
      {
        name: "expanding-bento.tsx",
        path: "src/registry/animations/carousels/expanding-bento.tsx",
      },
    ],
    usageProps: ["panels={panels}", "strips={strips}"],
    defaultTheme: "light",
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A bento of solid colour cards in two rows, each with its name drifting across it as a giant marquee, so the section feels alive even at rest. Pointing at a card widens it and fades in a white detail card (heading, image, copy, CTA) while the other cards in its row narrow to make room. It should feel like one smooth push of the row, never a jump.",
      trigger:
        "Marquees run from mount, continuously. The expansion: pointer hover on a card in either row (mouse or pen, not touch), or keyboard focus inside it. Each row tracks its own open card. Leaving a row (or tabbing out of it) closes its card again, so at rest every card in a row is the same width. On touch, tapping a card opens it.",
      states: [
        "Closed card: `flex: 1 1 0` (all equal), filled with its colour; a 30px white/40% leaf-shaped badge at the top right, a 12px white label at the bottom left, and the marquee centred vertically.",
        "Open card: `flex-grow: {expand}`, so it ends {expand}\u00d7 as wide as each closed card (410px vs 295px in a 1320px row). The others shrink together to make room; the row's total width never changes.",
        "Open strip: `flex-grow: {stripExpand}` (784px vs 528px in a 1320px row), the same way.",
        "Detail card: a white layer over the closed face, `opacity: 0 \u2192 1`. It's laid out at the open card's final width from the start, so its text never reflows while the card grows; the card clips it instead. Panels stack heading, image (100px 100px 30px 30px arch), copy and CTA top to bottom. Strips put the image (30% wide, full height, 80px 80px 16px 16px arch) on the left and heading (24px, black), copy (14px) and CTA in a column beside it, centred vertically.",
        "Marquee: `before \u00b7 thumb \u00b7 after` (\"Hot [image] Desks\") repeating, moving left with `translateX`. Words are 7.67cqw (101px in a 1320px row), weight 400, -0.04em tracking, white; the thumb is 0.79em tall with the card's leaf shape. Strips use 36px words and a 1.36em thumb.",
      ],
      timing: [
        "Width (`flex-grow`) and the detail card's fade: {duration}ms, `{ease}`, together{ease|cubic-bezier(0.12, 0.23, 0.5, 1)= (Framer's tween in the original)|*=}.",
        "Marquee: linear, {speed}px per second, endless.",
      ],
      interruption:
        "Both are CSS transitions, so moving to another card mid-way retargets from the current widths and opacities, with no snap. Only one card is open at a time. The marquee never pauses or restarts.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the marquees stand still (showing the start of the line) and cards open and close instantly, with no width or fade transition.",
      responsive:
        "From 900px of container width: the top row is {height}px tall and the strips {stripHeight}px, side by side. Below 900px each row becomes a horizontal scroll-snap row of open (white) cards, min(85%, 360px) wide and at least 480px tall (growing to fit the copy, images at least 180px), with no marquee; strips then stack their image under the heading like panels.",
      rules: [
        "Animate width with `flex-grow` on flex items, not pixel widths set from JS: one transition sizes every card and it scales with the row. Only the open index is state.",
        "Size the detail card with a container-relative calc of the open width: `(100cqw - (n - 1) \u00d7 gap) \u00d7 expand / (n - 1 + expand)`.",
        "Marquee: two identical halves moving by -50% on a CSS keyframe, with enough units in each half to cover the whole component's width. Set the duration from the measured unit width so the speed is in px/s, and count units against the component (not the card), so the count doesn't change, and the loop doesn't jump, while a card grows.",
        "The marquee and badge are decorative (`aria-hidden`); each card is named by its title, and the detail card's copy and CTA stay in the accessibility tree.",
      ],
      checks: [
        "At rest: four equal cards, each marquee drifting left at {speed}px/s with no visible seam when it loops.",
        "Hover the second card: over {duration}ms it widens to {expand}\u00d7 a closed card, the white detail card fades in, and the text inside doesn't reflow.",
        "Hover a bottom strip: it widens to {stripExpand}\u00d7 the other strip and shows its image beside its copy.",
        "Sweep across the row: the open card follows the pointer smoothly; leave the row and all four return to equal widths.",
        "Tab to a card's CTA: that card opens.",
        "Below 900px: two swipeable rows of white cards.",
        "Turn on reduced motion: the marquees stop and cards switch instantly.",
      ],
    },
    controls: [
      { type: "number", name: "height", label: "Row height", default: 569, min: 400, max: 720, step: 1, unit: "px" },
      { type: "number", name: "stripHeight", label: "Strip height", default: 200, min: 120, max: 320, step: 2, unit: "px" },
      { type: "number", name: "expand", label: "Open width", default: 1.39, min: 1.1, max: 2.5, step: 0.01 },
      { type: "number", name: "stripExpand", label: "Open strip width", default: 1.49, min: 1.1, max: 2.5, step: 0.01 },
      { type: "number", name: "duration", label: "Expand", default: 500, min: 150, max: 1000, step: 10, unit: "ms" },
      { type: "select", name: "ease", label: "Expand easing", default: easings.inOut, options: easingOptions },
      { type: "number", name: "speed", label: "Marquee speed", default: 40, min: 20, max: 300, step: 5, unit: "px/s" },
      { type: "number", name: "gap", label: "Gap", default: 8, min: 0, max: 32, step: 1, unit: "px" },
      { type: "number", name: "radius", label: "Radius", default: 0, min: 0, max: 32, step: 1, unit: "px" },
    ],
    assets: [
      {
        prop: "panels[].thumb",
        label: "Marquee thumbnail",
        fit: "A small square image inside the scrolling title, about the height of a lowercase letter, clipped to `shape`, object-cover",
        placeholder: "400x400",
        optional: true,
      },
      {
        prop: "panels[].image",
        label: "Detail image",
        fit: "Fills the rest of the white detail card under its heading, with a 100px 100px 30px 30px arch, object-cover. Defaults to `thumb`",
        placeholder: "800x800",
        optional: true,
      },
      {
        prop: "strips[].image",
        label: "Strip image",
        fit: "Sits beside the copy on an expanded strip, at least 180px tall, object-cover. Defaults to the strip's `thumb`",
        placeholder: "800x480",
        optional: true,
      },
    ],
    promptNotes: [
      "`panels` is an array of `{ title, color, thumb?, image?, alt?, description?, ctaLabel?, href?, label?, accent?, marquee?, shape? }`. `thumb` is the small image in the marquee; `image` (defaults to `thumb`) is the big image on the detail card, with a 100px 100px 30px 30px arch. `marquee` is `[before, after]` around the thumb, defaulting to the title split at its first space. `accent` colours the detail heading (defaults to `color`; use it when the card colour is too pale on white). The CTA shows when both `ctaLabel` and `href` are set.",
      "`strips` (optional) are the short row under the panels and take the same fields. They expand the same way (`stripExpand`, 1.49) with the image beside the copy; their heading is black unless `accent` is set, and their marquee puts the whole title before the thumb unless `marquee` is set.",
      "`shape` is a CSS border-radius for the badge and thumb; cards without one cycle through Hatch's leaf shapes.",
      "Panel detail card: 20px padding, heading 28px / 1.2 weight 500 with -0.04em tracking, image fills the rest, copy 16px #717171, CTA 14px weight 600 with a 17px #FF562F arrow square (`ctaColor`).",
      "It renders plain <img> tags. If the site has its own Image component, swap it in with object-cover and keep the classes.",
      "It's a Client Component (\"use client\") for the open index and the marquee measuring. The keyframes ship in a React 19 `<style href precedence>` tag; on React 18, move them into the global CSS.",
      "Original typography: Montserrat (Google Font) for the marquee, headings and labels, Inter for the copy. The component inherits the site's font; the demo uses Montserrat.",
    ],
  },
  {
    slug: "expanding-cards",
    title: "Expanding cards",
    description:
      "A row of slim, faded testimonial cards where the hovered one grows to fill the row and slides its quote in, used on Ironclad website",
    category: "animations",
    group: "carousels",
    level: "section",
    source: "https://ironcladapp.com/",
    recreated: "WordPress",
    componentName: "ExpandingCards",
    files: [
      {
        name: "expanding-cards.tsx",
        path: "src/registry/animations/carousels/expanding-cards.tsx",
      },
    ],
    usageProps: [
      "items={stories.map((story) => ({\n    label: story.company,\n    media: <img src={story.image} alt=\"\" className=\"object-cover\" />,\n    content: <YourQuote logo={story.logo} quote={story.quote} />,\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A row of slim, faded cards where the one you point at grows to fill the row and its content rises into view, so a set of testimonials can be browsed by sweeping across them. It should answer the pointer at once and then settle softly, and never flicker as the pointer sweeps across the row.",
      trigger:
        "Pointer resting on a card for {hoverDelay}ms (hover intent), or keyboard focus on it (immediately). One card is always open; leaving the row keeps the last one open.",
      states: [
        "Closed card: `flex: 0 0 {collapsedWidth}px` at `opacity: {inactiveOpacity}`; its content is hidden.",
        "Open card: adds `flex-grow: 1` (fills the rest of the row) at `opacity: 1`.",
        "Open card's content: from `opacity: 0; translateY(24px)` to `opacity: 1; translateY(0)`. It keeps a fixed 420px min width, so the text never reflows while the card grows; the card clips it.",
      ],
      timing: [
        "Card width (`flex-grow`): {duration}ms, `{ease}`{ease|cubic-bezier(0.32, 0.72, 0, 1)= (the iOS drawer curve: moves at once, then a long soft settle)|cubic-bezier(0.23, 1, 0.32, 1)= (strong ease-out: responds at once, then a long soft settle)|*=}.",
        "Card opacity: {fadeDuration}ms, `{fadeEase}`{fadeEase|cubic-bezier(0.23, 1, 0.32, 1)= (strong ease-out)|cubic-bezier(0.32, 0.72, 0, 1)= (the iOS drawer curve)|*=}, so the card lights up before it's done growing.",
        "Content in: {contentDuration}ms, `{fadeEase}`, starting {contentDelay}ms after the card, so the card makes room first.",
        "Content out: {contentExitDuration}ms, same curve, no delay. Exit is faster than enter, so the old quote is gone before its card closes around it.",
      ],
      interruption:
        "Nothing is ever blocked. A card only opens once the pointer has rested on it for {hoverDelay}ms, so sweeping across the row skips the cards in between; moving on before then cancels it. Every change is a CSS transition, so opening another card mid-way retargets each width, opacity and offset from where it is. Keyboard focus opens a card immediately.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` the width and the content's rise snap, but the opacity of cards and content still fades over 200ms `ease`, so the change stays readable.",
      responsive:
        "Expands from 1200px wide. Below that the cards become a horizontal scroll-snap row of full, open cards {mobileHeight}px tall (vs {height}px on desktop); no hover expansion.",
      rules: [
        "Animate the width with `flex-grow` on flex items so one transition handles every card, not by setting pixel widths in JS.",
        "Only the active index is state; widths and fades are CSS transitions. Don't lock out hovers while a card opens: use hover intent (a short dwell timer) instead.",
        "Never put an ease-in curve on the opening card: it starts slow at the moment the user is watching.",
        "If a card's media is a video, play it only while that card is open.",
      ],
      checks: [
        "Rest on a closed card: it starts growing at once and settles softly over {duration}ms, while the open one shrinks to {collapsedWidth}px and fades to {inactiveOpacity}.",
        "The new card's content rises 24px and fades in just after the card starts growing, without the text reflowing; the old card's content is gone almost immediately.",
        "Sweep the pointer quickly across the whole row: only the card you stop on opens, with no flicker. Rest on a card, then move to another mid-open: it turns around smoothly, with no wait.",
        "Leave the row: the last card stays open.",
        "Tab through the cards: each opens as it gets focus.",
        "Below 1200px: a swipeable row of full cards.",
        "Turn on reduced motion: the width snaps, and cards and content only fade.",
      ],
    },
    controls: [
      { type: "number", name: "height", label: "Height", default: 621, min: 400, max: 720, step: 1, unit: "px" },
      { type: "number", name: "mobileHeight", label: "Mobile height", default: 480, min: 320, max: 720, step: 10, unit: "px" },
      { type: "number", name: "collapsedWidth", label: "Closed width", default: 80, min: 40, max: 160, step: 2, unit: "px" },
      { type: "number", name: "gap", label: "Gap", default: 20, min: 0, max: 48, step: 2, unit: "px" },
      { type: "number", name: "radius", label: "Radius", default: 20, min: 0, max: 40, step: 1, unit: "px" },
      { type: "number", name: "inactiveOpacity", label: "Closed opacity", default: 0.2, min: 0.1, max: 1, step: 0.05 },
      { type: "number", name: "duration", label: "Expand", default: 600, min: 150, max: 1000, step: 10, unit: "ms" },
      { type: "select", name: "ease", label: "Expand easing", default: easings.out, options: easingOptions },
      { type: "number", name: "contentDuration", label: "Content reveal", default: 500, min: 200, max: 1400, step: 10, unit: "ms" },
      { type: "number", name: "contentDelay", label: "Content delay", default: 200, min: 0, max: 500, step: 10, unit: "ms" },
      { type: "select", name: "fadeEase", label: "Reveal easing", default: easings.drawer, options: easingOptions },
      { type: "number", name: "hoverDelay", label: "Hover intent", default: 120, min: 0, max: 400, step: 10, unit: "ms" },
      { type: "number", name: "contentExitDuration", label: "Content out", default: 150, min: 0, max: 600, step: 10, unit: "ms", secondary: true },
      { type: "number", name: "fadeDuration", label: "Card fade", default: 300, min: 0, max: 1000, step: 10, unit: "ms", secondary: true },
      { type: "boolean", name: "overlay", label: "Dark overlay", default: true },
    ],
    assets: [
      {
        prop: "items[].media",
        label: "Card background",
        fit: "Fills the card behind everything ({height}px tall from the expand breakpoint, 480px below), object-cover. An image or a muted looping video",
        placeholder: "1800x1242",
        notes: "The quote sits bottom left over a dark gradient, so keep the subject towards the top right.",
      },
      {
        prop: "items[].content",
        label: "Customer logo",
        fit: "The logo inside `content`, 50px tall above the quote",
        placeholder: "300x100",
        notes: "White, trimmed, transparent background.",
        optional: true,
      },
    ],
    promptNotes: [
      "`items` is an array of `{ media, content, label }`. `media` fills the card behind everything (an image with `object-cover`, a video or a gradient; the component sizes it to the card). `content` is the testimonial block - logo, quote, CTA - and sits at the bottom left. `label` names the card for screen readers.",
      "The section heading and the CTA below the row are not part of this component - render them separately in the section.",
      "Content keeps a 420px min width so the quote never reflows while the card grows. Write quotes short enough to fit: the original uses a 30px / 1.2 quote with a 50px-high logo above it, inside 60px 120px 60px 60px padding, over a `linear-gradient(246deg, transparent 38.82%, #000 89.91%)` overlay.",
      "Expands from 1200px wide (`minWidth`), as in the original. Below that the cards become a horizontal scroll-snap row of full cards, `mobileHeight` tall (480px, vs 621px `height` on desktop) so a narrow card isn't a towering strip (the original uses a Swiper carousel there).",
      "It is a Client Component (\"use client\") because of the hover state. Only the active index is state; widths and fades are CSS transitions.",
      "If a card's media is a video, play it only while the card is open (the original pauses the others).",
      "Deliberate change from the original's motion: Ironclad grows the card on an ease-in curve over 400ms, fades the content in over 800ms ease-in-out, and ignores hovers for 800ms after each open. Here it uses the iOS drawer curve for the width, a strong ease-out for the content (faster out than in), and a 120ms hover intent instead of the lock, so it responds at once without flickering.",
    ],
  },
  {
    slug: "stat-counter-cards",
    added: "2026-11-17",
    title: "Stat counter cards",
    description:
      "A row of stat cards whose numbers count up on scroll; hovering one widens it, lifts its number and reveals a line of copy, used on Seemplicity website",
    category: "animations",
    group: "carousels",
    level: "section",
    source: "https://seemplicity.ai/",
    recreated: "WordPress",
    componentName: "StatCounterCards",
    defaultTheme: "light",
    themeToggle: false,
    fullBleed: true,
    files: [
      {
        name: "stat-counter-cards.tsx",
        path: "src/registry/animations/carousels/stat-counter-cards.tsx",
      },
    ],
    usageProps: [
      "items={[\n    { value: 87, suffix: \"%\", label: \"Proven Not Exploitable\", description: \"87% of one customer’s priority findings ruled out with evidence.\" },\n    { value: 1.7, prefix: \"$\", suffix: \"M\", label: \"Annual Cost Savings\", description: \"Save an average of $1.7M annually.\" },\n  ]}",
    ],
    motion: {
      intent:
        "A row of quiet white stat cards. The numbers count up once as the row arrives, so the figures feel earned; then pointing at a card makes it the one in focus: it widens, its number rises to the top and a line of supporting copy fades in at the bottom while the other cards make room. It should feel calm and even, never jumpy.",
      trigger:
        "Count: the first time 40% of the row is visible (one IntersectionObserver on the row), once per page load. Expand, from {minWidth}px of component width: pointer enter on a card (immediate) or keyboard focus. Pointer leave waits {leaveDelay}ms before closing, so crossing the gap between two cards doesn't collapse the row; leaving the whole row closes at once. Below {minWidth}px: click, Enter or Space toggles a card open, one at a time.",
      states: [
        "Numbers: `0` → each card's value, written into the number's own text node every frame, all cards together. Decimals are kept the whole way (1.7 counts 0.0 … 1.7). Prefix and suffix (\"$\", \"%\", \"K\", \"M\") never change.",
        "Row, nothing open: every card `flex: 0 1` an equal share of the row, at least {minHeight}px tall, 1px border, padding `clamp(24px, 3.4cqi, 40px)` (40px at the original's 1200px width).",
        "Open card: `flex: 0 0 {openWidth}px`, border and a `0 10px 50px` shadow in the active colour, `z-index: 2`. The other cards shrink to share what's left of the row equally.",
        "Number position: a `::before` spacer with `flex-grow: 1` holds the number and label at the bottom of a resting card. On open the spacer goes to `flex-grow: 0`, so the number rises to the top; the description takes the bottom with `margin-top: auto`. Because the spacer's grow passes through fractions, the free space is shared between it and the auto margin on the way, so both glide.",
        "Description: `grid-template-rows: 0fr → 1fr` and `opacity: 0 → 1`. Its text has a fixed 240px width, so it never reflows while the card widens.",
        "Stacked (below {minWidth}px): an open card gets the border and shadow, and its description opens under the label (`0fr → 1fr`, fade, `margin-top: 0 → 15px`).",
      ],
      timing: [
        "Count: {countDuration}ms, `{countEase}`{countEase|cubic-bezier(0.16, 1, 0.3, 1)= (expo ease-out, close to countUp.js's easeOutExpo that the original uses: races up, then settles onto the figure)|*=}, all numbers together.",
        "Card width: {duration}ms, `{ease}`, both ways.",
        "Number rises (open): {riseDuration}ms, `{ease}`, no delay.",
        "Number sinks back (close): {sinkDuration}ms, `{ease}`, after {sinkDelay}ms, so it only drops once the card has mostly narrowed.",
        "Description in: {revealDuration}ms, `{ease}`, starting {revealDelay}ms after the card starts widening, so the card makes room first.",
        "Description out: {revealExitDuration}ms, no delay: the copy is gone before its card narrows around it.",
        "Border and shadow: {shadowDuration}ms, `{ease}`.",
        "Stacked accordion: height, fade and margin {duration}ms, `{ease}`; opening waits 50ms.",
      ],
      interruption:
        "Every change is a CSS transition, so moving from one card to the next mid-way retargets each width, spacer and fade from where it is; nothing is locked. The count runs to the end once started, even if the row scrolls away; if the component unmounts, stop the frame loop and restore the final numbers.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`: no count (the final numbers show from the start and are never zeroed), and the width, rise and accordion height snap. Only a 200ms `ease` opacity fade on the description stays.",
      responsive:
        "Row and hover from {minWidth}px of the component's own width (a container query; the original switches at a 1200px viewport). Below that the cards stack full width with 20px padding and open on tap.",
      rules: [
        "Animate the widths with flex on flex items (one transition handles every card), not pixel widths set in JS. Only the open index and the tapped index are state.",
        "Server-render the final numbers, then zero them in a layout effect before paint. Rewrite only the number's text node in requestAnimationFrame; don't re-render React every frame.",
        "Give screen readers each figure once (visually hidden text) and `aria-hidden` the counting digits. The description stays in the accessibility tree even while hidden.",
        "Use `font-variant-numeric: tabular-nums` so numbers don't jitter while counting (an improvement on the original).",
        "Labels keep at least two lines' height in the row, so every number sits on the same baseline (the original equalises them in JS).",
      ],
      checks: [
        "Scroll the row into view: all four numbers count up together over {countDuration}ms, fast then settling, and land exactly on 87, 75, 33 and 1.7. Scroll away and back: no recount.",
        "Point at a card: it widens to {openWidth}px over {duration}ms, the others shrink evenly, its number glides up to the top, and the description fades in at the bottom without reflowing.",
        "Sweep across the row: cards hand over smoothly with no collapse in the gaps. Leave the row: the card narrows, the copy vanishes at once, and the number drops back to the bottom a moment later.",
        "Tab through the cards: each opens on focus, with a visible outline.",
        "Narrow the container below {minWidth}px: cards stack, and tapping one opens it (and closes the other) like an accordion.",
        "Turn on reduced motion and reload: final numbers show, the cards snap open and closed, and only the copy fades.",
      ],
    },
    controls: [
      { type: "number", name: "countDuration", label: "Count", default: 2000, min: 300, max: 4000, step: 50, unit: "ms" },
      { type: "select", name: "countEase", label: "Count easing", default: easings.expo, options: easingOptions },
      { type: "number", name: "duration", label: "Expand", default: 600, min: 150, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "ease", label: "Expand easing", default: easings.ease, options: easingOptions },
      { type: "number", name: "riseDuration", label: "Number rise", default: 300, min: 0, max: 1000, step: 10, unit: "ms" },
      { type: "number", name: "sinkDuration", label: "Number sink", default: 600, min: 0, max: 1200, step: 10, unit: "ms" },
      { type: "number", name: "sinkDelay", label: "Sink delay", default: 300, min: 0, max: 800, step: 10, unit: "ms" },
      { type: "number", name: "revealDuration", label: "Copy reveal", default: 200, min: 0, max: 800, step: 10, unit: "ms" },
      { type: "number", name: "revealDelay", label: "Copy delay", default: 150, min: 0, max: 600, step: 10, unit: "ms" },
      { type: "number", name: "revealExitDuration", label: "Copy out", default: 50, min: 0, max: 400, step: 10, unit: "ms", secondary: true },
      { type: "number", name: "shadowDuration", label: "Shadow", default: 300, min: 0, max: 800, step: 10, unit: "ms", secondary: true },
      { type: "number", name: "leaveDelay", label: "Leave delay", default: 50, min: 0, max: 300, step: 10, unit: "ms", secondary: true },
      { type: "number", name: "openWidth", label: "Open width", default: 420, min: 320, max: 560, step: 10, unit: "px" },
      { type: "number", name: "minHeight", label: "Card height", default: 320, min: 220, max: 480, step: 10, unit: "px" },
      { type: "number", name: "gap", label: "Gap", default: 10, min: 0, max: 40, step: 2, unit: "px" },
      { type: "number", name: "radius", label: "Radius", default: 20, min: 0, max: 40, step: 1, unit: "px" },
      { type: "color", name: "numberColor", label: "Number", default: "#A309BB" },
      { type: "color", name: "labelColor", label: "Label", default: "#410051" },
      { type: "number", name: "minWidth", label: "Row from", default: 960, min: 600, max: 1400, step: 10, unit: "px" },
    ],
    promptNotes: [
      "`items` is an array of `{ value, prefix?, suffix?, label, description }`. `value` is a number (decimals kept); `prefix`/`suffix` are fixed text around it (`value={1.7} prefix=\"$\" suffix=\"M\"`).",
      "The section heading and its pink-to-white gradient background aren't part of the component; render them in the section around it. The original: `linear-gradient(180deg, #F0DCF3 0%, #FAF0FA 35%, #FFFFFF 60%)` behind a centred heading, 40px between heading and cards on mobile, 75px on desktop.",
      "Pass `numberClassName` for the numbers' font and size. Original numbers: 36px / 1.2 weight 400 stacked, `clamp(36px, 24.86px + 2.857vw, 66px)` / 1 weight 300 with -2.64px tracking in the row. Labels 16px / 1.4 (#410051), description 14px / 1.4 (#0B0623).",
      "Colours are props (`background`, `borderColor`, `activeColor` for the open border and shadow, `numberColor`, `labelColor`, `textColor`), defaulting to Seemplicity's.",
      "It's a Client Component (\"use client\") for the open state and the count; it server-renders the final numbers.",
      "Original typography: Cabinet Grotesk (Fontshare, not on Google Fonts) for the heading and numbers, Mona Sans for labels and copy. The demo uses Bricolage Grotesque weight 300 as the closest Google Font for the display text.",
      "Deliberate changes from the original: the description reveal uses `grid-template-rows: 0fr → 1fr` instead of a max-height of 800px (so the timing isn't eaten by empty height), its text has a fixed 240px width so it doesn't reflow, numbers use tabular figures, label heights are equalised with `min-height: 2lh` instead of JS, and the breakpoint is a container query (960px of the component's width; card padding scales from 24px to 40px with it).",
    ],
  },
  {
    slug: "spotlight-slider",
    title: "Spotlight slider",
    description:
      "One testimonial card in focus while its neighbours peek in blurred and shrunk, autoplaying until someone uses the arrows, swipes, dots or a row of logo tabs, used on Sophos website",
    category: "animations",
    group: "carousels",
    level: "section",
    source: "https://www.sophos.com/en-us",
    componentName: "SpotlightSlider",
    files: [
      {
        name: "spotlight-slider.tsx",
        path: "src/registry/animations/carousels/spotlight-slider.tsx",
      },
    ],
    usageProps: [
      "items={stories.map((story) => ({\n    label: story.company,\n    tab: <img src={story.logo} alt=\"\" />,\n    content: (\n      <SpotlightSlide\n        logo={<img src={story.logo} alt={story.company} />}\n        quote={story.quote}\n        name={story.name}\n        role={story.role}\n        media={<img src={story.image} alt=\"\" />}\n        onPlay={() => openVideo(story.video)}\n      />\n    ),\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A testimonial carousel where one card sits in focus in the middle and its neighbours peek in from both sides, blurred and slightly shrunk, so the row reads as \"one story, more to come\". Changing slide glides the row sideways while the new card sharpens into focus. It should feel smooth and unhurried, never flashy.",
      trigger:
        "{autoplay|true=Autoplay: once 30% of the slider is in view, it moves to the next slide every {interval}ms. Any arrow, dot or logo-tab click, swipe, Left/Right key press or click on the focused card stops autoplay for good; hovering the slides with a mouse pauses it until the pointer leaves. |*=}The prev/next arrows (768px+), the logo tabs (1024px+), the dots (below 1024px), a horizontal swipe or drag past a fifth of the slide width, and Left/Right keys while focus is inside the slider each move it.",
      states: [
        "Track: a flex row of full-width slides inside a centred viewport with `overflow: visible`, moved by `translateX(-index × 100%)`. The section clips the peeking neighbours at its edges.",
        "Focused card: `opacity: 1; filter: blur(0); scale: 1`.",
        "Neighbour cards, slider 1024px+ wide: `opacity: {inactiveOpacity}; filter: blur({inactiveBlur}px); scale: {inactiveScale}`. They don't respond to the pointer.",
        "Neighbour cards, below 1024px: `filter: blur({inactiveBlur}px); scale: 0.9 0.95` (narrower than tall), with no fade.",
        "Dots: the active dot widens from 10px to 30px and takes the accent colour; the others are 10px circles.",
        "Logo tabs: inactive logos are `grayscale(1)` at 0.9 opacity; the active one is in full colour. From 1280px, hovering a tab brings its colour back too.",
        "Arrows: white 50px circles with an accent chevron; on hover the fill becomes the accent and the chevron white. At the {loop|true=ends they stay enabled because the row wraps|*=first and last slide the matching arrow is disabled and nothing moves}.",
      ],
      timing: [
        "Row slide: {duration}ms, `{ease}`.",
        "Card focus change (opacity, blur, scale): {focusDuration}ms, `{focusEase}`, starting at the same moment as the row slide, so the new card is sharp before the row stops.",
        "Dot width: {dotDuration}ms. Arrow colours: {arrowDuration}ms. `SpotlightSlide` play button hover scale: {playDuration}ms. All three on `{controlEase}`.",
        "{autoplay|true=Autoplay: each slide holds for {interval}ms; the timer restarts after every change. {loop|true=After the last slide it wraps to the first.|*=It stops on the last slide.}|*=No autoplay.}",
      ],
      interruption:
        "A slide change can't be interrupted: any move asked for while the row is still sliding ({duration}ms) is ignored, whether it comes from an arrow, tab, dot, key, swipe or autoplay. Two quick clicks on Next move one slide. While dragging, the row follows the finger 1:1 (0.35 of the drag past the first or last slide, like a rubber band) with its transition off. On release it moves one slide if the drag passed a fifth of the slide width (about 200px on a 1012px slide, 64px on a 320px one), otherwise it springs back, both over {duration}ms. A drag doesn't also click a link in the slide.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, there's no autoplay, the row jumps to the new slide and the cards switch focus instantly. All controls still work.",
      responsive:
        "Focused slide width: 320px below 768px (never wider than the slider minus 40px), 620px from 768px, 830px from 1024px, {slideWidth}px from 1280px. Arrows show from 768px, sitting at the left and right of a 1220px-max area. Logo tabs replace the dots from 1024px (dots show at every width when there are no tabs).",
      rules: [
        "Move the row with `transform: translateX`, never `left` or scroll position, and transition `opacity`, `filter` and `scale` on the cards, nothing else.",
        "Don't add a carousel library either. The original uses react-slick, and its interaction values are Slick defaults this matches without one: `waitForAnimate: true` (input ignored mid-slide), `touchThreshold: 5` (swipe past a fifth of the slide width), `edgeFriction: 0.35`. If the site already runs Slick, keep those settings.",
        "Only the focused card is interactive: make the others `inert` so Tab skips them. If a slide holds a `<video>`, pause it when the slide loses focus and play it once a slide comes into focus.",
        "Measure the breakpoints on the slider's own width (container queries), not the window, so it adapts to the column it sits in.",
      ],
      checks: [
        "On load, the middle card is sharp and its neighbours peek in both sides, blurred and slightly smaller{inactiveOpacity|1=|*= (and faded on wide screens)}.",
        "Click next: the row glides one card over {duration}ms and the new card sharpens within {focusDuration}ms.",
        "{autoplay|true=Scroll the slider into view and wait: it moves every {interval}ms. Hover the slides and it holds. Click any control and it never autoplays again.|*=Nothing moves until you use a control.}",
        "Click Next twice within 150ms: the row moves one slide, not two.",
        "On desktop, drag the row 100px and let go: it springs back. Drag about 210px: it changes slide.",
        "Drag 200px right on the first slide: the row moves about 70px, then springs back.",
        "On a 375px phone: no arrows, dots under the slider, neighbours blurred and scaled 0.9 × 0.95 but not faded, and a swipe of about 65px changes slide.",
        "Tab through the slider: only the focused card's controls get focus.",
        "Turn on reduced motion: no autoplay, slides change instantly.",
      ],
    },
    controls: [
      { type: "boolean", name: "autoplay", label: "Autoplay", default: true },
      { type: "number", name: "interval", label: "Interval", default: 5000, min: 2000, max: 10000, step: 500, unit: "ms" },
      { type: "number", name: "slideWidth", label: "Slide width", default: 1012, min: 830, max: 1200, step: 2, unit: "px" },
      { type: "number", name: "duration", label: "Slide", default: 700, min: 150, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "ease", label: "Slide easing", default: easings.inOut, options: easingOptions },
      { type: "number", name: "focusDuration", label: "Focus", default: 150, min: 0, max: 800, step: 10, unit: "ms" },
      { type: "select", name: "focusEase", label: "Focus easing", default: "cubic-bezier(0.4, 0, 0.2, 1)", options: easingOptions },
      { type: "number", name: "dotDuration", label: "Dot", default: 150, min: 0, max: 600, step: 10, unit: "ms", secondary: true },
      { type: "number", name: "arrowDuration", label: "Arrow hover", default: 300, min: 0, max: 800, step: 10, unit: "ms", secondary: true },
      { type: "number", name: "playDuration", label: "Play hover", default: 200, min: 0, max: 600, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "controlEase", label: "Controls easing", default: "cubic-bezier(0.4, 0, 0.2, 1)", options: easingOptions, secondary: true },
      { type: "number", name: "inactiveOpacity", label: "Side opacity", default: 0.3, min: 0, max: 1, step: 0.05 },
      { type: "number", name: "inactiveBlur", label: "Side blur", default: 5, min: 0, max: 16, step: 1, unit: "px" },
      { type: "number", name: "inactiveScale", label: "Side scale", default: 0.95, min: 0.8, max: 1, step: 0.01 },
      { type: "number", name: "radius", label: "Radius", default: 10, min: 0, max: 32, step: 1, unit: "px" },
      { type: "color", name: "accent", label: "Accent", default: "#2006F7" },
      { type: "color", name: "cardBackground", label: "Card", default: "#000000" },
      { type: "color", name: "dotColor", label: "Inactive dot", default: "#BBCFDE" },
      { type: "boolean", name: "showTabs", label: "Logo tabs", default: true },
      { type: "boolean", name: "showDots", label: "Dots", default: true },
      { type: "boolean", name: "loop", label: "Loop", default: false },
    ],
    assets: [
      {
        prop: "<SpotlightSlide media>",
        label: "Slide photo",
        fit: "From an 800px-wide card it fills the right side (868px wide, full card height, at least 460px); below that it's full width under the text, 212px tall (349px from 600px). object-cover",
        placeholder: "1736x920",
        notes: "The left edge fades into the black card, so keep the subject to the right.",
      },
      {
        prop: "<SpotlightSlide logo>",
        label: "Customer logo",
        fit: "Top of the text column, at most 180×38px",
        placeholder: "360x76",
        notes: "White, trimmed, transparent background.",
      },
      {
        prop: "items[].tab",
        label: "Tab logo",
        fit: "A logo in the tab row under the slider (1024px+); the inactive ones are greyed out",
        placeholder: "280x70",
        notes: "Pass the colour version.",
        optional: true,
      },
      {
        prop: "<SpotlightSlide pattern>",
        label: "Card pattern",
        fit: "Decoration over the card's right side: `wide` is 1012×569, `narrow` is 327px wide",
        placeholder: "1012x569 (wide) and 327x578 (narrow)",
        notes: "Leave it out rather than use a placeholder: it's decoration.",
        optional: true,
      },
    ],
    promptNotes: [
      "The file exports two components: `SpotlightSlider` (the carousel: track, peeking neighbours, autoplay, arrows, logo tabs, dots) and `SpotlightSlide` (the Sophos testimonial card layout). Any content can go in a slide; `SpotlightSlide` is the usual one.",
      "`items` is an array of `{ content, label, tab }`. `label` names the slide for screen readers and the tab buttons. `tab` is the logo in the row under the slider (1024px+); pass the colour logo, the slider greys out the inactive ones. Leave `tab` out on every item, or pass `showTabs={false}`, to hide the tabs; the dots then show at every width. `showDots={false}` hides the dots.",
      "`SpotlightSlide`: black card. From an 800px-wide card the text and media sit side by side with a min-height of 460px; below that, text on top and media underneath (212px tall, 349px from a 600px card). Left text column 480px wide with 40px padding (30px on small cards): white logo (max 180×38px, pushed to the top), the outlined quote mark fading out to the bottom right, the quote (24px / 1.15, weight 300, -0.08em tracking, closing quote added for you), name (18px) and role (14px). The media sits right, 868px wide and 72px past the card edge, under a black-to-transparent gradient 489px wide.",
      "`SpotlightSlide` options: `onPlay` shows a 90px play button (60px on small cards) that scales to 1.1 on hover (timed by the slider's `playDuration` and `controlEase` through CSS variables; 200ms `cubic-bezier(0.4, 0, 0.2, 1)` when used on its own); `playIcon` replaces its default white circle (the original uses its own play image). `pattern={{ wide, narrow }}` overlays a decorative image on the card's right side (1012×569 on wide cards, 327px wide on small ones), above the media and under the text.",
      "The original uses Lexend Exa (Google Font) for the quote and name and Inter for the role; the component inherits the site's font, so load Lexend Exa on the section if you want the match. The section around it is #EDF2F9 with a 44px weight-300 heading; the heading and 'See all case studies' button aren't part of this component.",
      "Opening the video (the original uses a Fancybox iframe modal for YouTube) is up to the site: `onPlay` is a plain callback.",
      "It is a Client Component (\"use client\"). State is the active index, the drag offset and the autoplay flags; the track position, fades and blur are CSS transitions.",
      "Performance: `filter: blur()` on large cards repaints during the focus change only. If it janks on low-end devices, set `inactiveBlur={0}` and rely on the opacity and scale.",
    ],
  },
  {
    slug: "awards-carousel",
    title: "Awards carousel",
    description:
      "A row of award badges on soft pink and purple glows that two pill arrows beside the heading move one card at a time, used on Seemplicity website",
    category: "animations",
    group: "carousels",
    level: "section",
    source: "https://seemplicity.ai/why/",
    recreated: "WordPress",
    componentName: "AwardsCarousel",
    files: [
      {
        name: "awards-carousel.tsx",
        path: "src/registry/animations/carousels/awards-carousel.tsx",
      },
    ],
    usageProps: [
      "heading={<>Validated by experts.<br />Trusted by enterprises.</>}",
      "description=\"We don't just claim to be the best. The industry's top analysts confirm it.\"",
      "items={awards.map((award) => ({\n    image: <img src={award.badge} alt={award.name} />,\n    title: award.name,\n    href: award.url,\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A row of award cards that two pill arrows beside the heading move one card at a time, with the next card peeking past the edge to show there's more. It should feel smooth and unhurried.",
      trigger:
        "From 992px: the previous/next arrows, or Left/Right keys while focus is inside, or tabbing to an off-screen card link (the row moves to it). Below 992px: a horizontal swipe or drag past 50px, or the dots.",
      states: [
        "Track: a flex row of {cardWidth}px cards with {gap}px gaps, moved by `translate3d(-index × ({cardWidth} + {gap})px, 0, 0)`. The next card peeks past the content edge and the section clips it.",
        "From 992px it shows as many whole cards as fit and stops when the last card is in view; the arrow at that end drops to 35% opacity and is disabled.",
        "Dots (below 992px): 10px pills; the active one widens to 30px at full opacity, the others are at 20%.",
        "Arrows: no hover state in the original; this version adds a faint grey fill on hover and a 0.97 press scale.",
      ],
      timing: [
        "Row: {duration}ms, `{ease}`{ease|ease= (Swiper's default)|*=}.",
        "Dot width and opacity: {dotDuration}ms, `{dotEase}`.",
        "Arrow dim, hover fill and press scale: {arrowDuration}ms, `{arrowEase}`.",
      ],
      interruption:
        "Clicking an arrow mid-slide retargets the row from its current position. While dragging, the row follows the finger 1:1 (a quarter of that past the first or last card) with its transition off; on release it moves one card if the drag passed 50px, otherwise it springs back.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the row jumps to the new position without sliding. All controls still work.",
      responsive:
        "Arrows from 992px; below 992px the arrows hide and dots plus swipe take over. Cards keep their {cardWidth}px width (capped at the row width), so tablets show two or more with the next peeking and phones show one with the next peeking. Use a 992px breakpoint, not a Tailwind default.",
      rules: [
        "Move the row with `transform: translate3d`, never `left` or scroll position.",
        "Don't add a carousel library (the original uses Swiper; this matches its speed and easing without it).",
        "Make off-screen cards unreachable by Tab only if they're out of view; tabbing to one moves the row to it.",
      ],
      checks: [
        "Click next: the row moves one card over {duration}ms with `{ease}`, and the next card still peeks at the edge.",
        "Keep clicking: it stops when the last card is fully in view and that arrow dims to 35% and disables.",
        "At 375px: no arrows, dots under the row; a 60px swipe moves one card, a 30px swipe springs back.",
        "Turn on reduced motion: the row jumps.",
      ],
    },
    controls: [
      { type: "number", name: "cardWidth", label: "Card width", default: 280, min: 200, max: 400, step: 4, unit: "px" },
      { type: "number", name: "gap", label: "Gap", default: 40, min: 0, max: 80, step: 2, unit: "px" },
      { type: "number", name: "mediaHeight", label: "Badge height", default: 200, min: 140, max: 320, step: 4, unit: "px" },
      { type: "number", name: "radius", label: "Radius", default: 20, min: 0, max: 40, step: 1, unit: "px" },
      { type: "number", name: "duration", label: "Slide", default: 600, min: 150, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "ease", label: "Slide easing", default: easings.inOut, options: easingOptions },
      { type: "number", name: "dotDuration", label: "Dot", default: 300, min: 0, max: 800, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "dotEase", label: "Dot easing", default: easings.inOut, options: easingOptions, secondary: true },
      { type: "number", name: "arrowDuration", label: "Arrow", default: 200, min: 0, max: 600, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "arrowEase", label: "Arrow easing", default: easings.out, options: easingOptions, secondary: true },
      { type: "color", name: "glowTop", label: "Top glow", default: "#E3308C" },
      { type: "color", name: "glowBottom", label: "Bottom glow", default: "#A309BB" },
      { type: "color", name: "color", label: "Text", default: "#410051" },
    ],
    assets: [
      {
        prop: "items[].image",
        label: "Award badge",
        fit: "Fitted (contain) into a 220×100 box centred in the glowing card",
        placeholder: "440x200",
        notes: "SVG or a transparent PNG, trimmed.",
      },
    ],
    promptNotes: [
      "`items` is an array of `{ image, title, label?, href? }`. `image` is the award badge (an <img> or SVG); it is fitted into a 220×100 box centred in the glowing card. `title` is the award name under the card. `href` makes the whole card a link. `label` names the slide for screen readers when `title` isn't plain text.",
      "`heading` and `description` render the section header with the two arrows to its right, as in the original. Leave both out to render just the row (the arrows then sit above it on the right).",
      "Below 992px the arrows hide. Cards keep their 280px width (capped at the row width), so tablets show two or more with the next peeking and phones show one with the next peeking past the edge; swipe (50px threshold, rubber-bands at the ends) plus 10px pill dots (active one 30px wide, others 20% opacity, width over `dotDuration` on `dotEase`, 300ms `cubic-bezier(0.77, 0, 0.175, 1)` by default) move between them. Keep `min-[992px]:` rather than a Tailwind default breakpoint.",
      "Card glow: two blurred SVG shapes from the original, inlined as a data-URI background: `#E3308C` at 50% from the top right and `#A309BB` at 30% along the bottom left, on whatever background the section has (white in the original). Change them with `glowTop` / `glowBottom`.",
      "The original arrows are 120×70 pills with a 1px rgba(160,160,160,.3) border, 45px radius and a 31×23 arrow (#0B0623), 15px apart. They have no hover state in the original; this version adds a faint grey fill on hover and a 0.97 press scale.",
      "Typography from the original: heading 66px / 1, weight 300, -1.72px tracking (36px / 1.2, weight 400 below 992px), max 860px wide; description 18px / 1.6; award names 28px / 1.2 (22px below 992px), -0.56px tracking, 21px above. All #410051. The original uses Cabinet Grotesk (free from Fontshare, not on Google Fonts) for the heading and names and Mona Sans (Google Font) for the description; the component inherits the site's font. The demo uses Hanken Grotesk as the closest Google Font.",
      "It is a Client Component (\"use client\"). State is the index, the drag offset and the measured row width (ResizeObserver). The track position is a CSS transition. Reduced motion: the row jumps without a transition.",
      "It renders whatever you pass as `image`. If the site has its own Image component (e.g. components/common/Image), use it and keep a 100px height.",
    ],
  },
  {
    slug: "expert-card-carousel",
    added: "2026-11-17",
    title: "Expert card carousel",
    description:
      "A looping row of people cards that round arrows or a drag move one card at a time; the Bio button flips a card over in 3D to show a short bio, used on Medrio website",
    category: "animations",
    group: "carousels",
    level: "section",
    source: "https://medrio.com/",
    recreated: "WordPress",
    componentName: "ExpertCardCarousel",
    files: [
      {
        name: "expert-card-carousel.tsx",
        path: "src/registry/animations/carousels/expert-card-carousel.tsx",
      },
    ],
    usageProps: [
      "items={experts.map((expert) => ({\n    image: <img src={expert.photo} alt=\"\" />,\n    name: expert.name,\n    role: expert.title,\n    bio: expert.bio,\n    href: expert.linkedin,\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A row of people cards that loops forever, moved one card at a time by two round arrows or a drag. Each card can flip over in 3D to show a short bio and flip back. Sliding should feel smooth and even; the flip should feel like turning a real card.",
      trigger:
        "Arrows on the row's left and right edges, Left/Right keys while focus is inside, or a horizontal drag with mouse, touch or pen. The Bio button in a card's footer flips that card; pressing it again flips it back.",
      states: [
        "Track: a flex row with {gap}px gaps, rendered three times over so it can loop. Up to {perView} cards share the row; one fewer shows whenever a card would be narrower than {minCardWidth}px (so 4 → 3 → 2 → 1 as the row narrows). Cards are {cardHeight}px tall with {radius}px corners on the top right and bottom left only.",
        "Moving: `translate3d(-index × (cardWidth + {gap})px, 0, 0)`. The row starts on the middle copy. When a move ends in the first or last copy, the track jumps by one copy with its transition off; the cards are identical, so nothing visibly changes and the row never runs out.",
        "Flip: each card has a front (220px circle photo, name, role) and a back ({backColor}: name, role, bio) stacked with `backface-visibility: hidden` in a 1000px perspective. Bio turns the front to `rotateY(180deg)` and the back from `rotateY(180deg)` to `0`. Only one card is flipped at a time, and any slide change turns it back.",
        "Footer (LinkedIn on the left, Bio on the right) sits over both faces and doesn't flip. The Bio icon crossfades from turn arrows on a {accent} circle to an {accent} close mark on a white circle.",
        "Arrows: 49px white circles centred on the row's edges, at half the card height. No hover state in the original; this version grows them to 1.06 on hover and dips to 0.94 on press.",
      ],
      timing: [
        "Row: {duration}ms, `{ease}`{ease|ease= (Swiper's default, as in the original)|*=}.",
        "Flip: {flipDuration}ms, `{flipEase}`{flipEase|ease= (the original's)|*=}.",
        "Bio icon crossfade: {iconDuration}ms, `{iconEase}`.",
        "Arrow grow and press dip: {arrowDuration}ms, `{arrowEase}`.",
      ],
      interruption:
        "Clicking an arrow mid-slide retargets the row from where it is. While dragging, the row follows the pointer 1:1 with its transition off; on release it moves by as many cards as were dragged (rounded), at least one once the drag passes 50px, otherwise it springs back. Pressing Bio mid-flip reverses the flip from its current angle.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the row jumps without sliding and the flip becomes an opacity crossfade between the two faces. All controls still work.",
      responsive:
        "The number of cards follows the row's own width (not the window): as many as fit at {minCardWidth}px or wider, up to {perView}. The original steps 4 → 3 → 2 → 1 at window widths of 1366, 1024 and 767px. Arrows stay at every width, so leave about 25px of padding on each side of the row for them.",
      rules: [
        "Move the row with `transform: translate3d`, never `left` or scroll position.",
        "Don't add a carousel library (the original uses Swiper's loop mode; this does the loop with three copies and a silent jump).",
        "Flip with `rotateY` on the two faces inside a perspective parent; keep `overflow: hidden` on the card so the turning faces stay inside its rounded shape.",
        "Make cards out of view `inert` and `aria-hidden`, and the hidden face of a flipped card `inert`.",
      ],
      checks: [
        "Click next five times: the row moves one card each time over {duration}ms and keeps going past the last expert back to the first with no jump or blank space.",
        "Press Bio: that card turns over in {flipDuration}ms to the grey bio; the footer stays still and the icon swaps to a close mark. Press Bio on another card: the first one flips back.",
        "Flip a card, then click an arrow: the card turns back as the row moves.",
        "Drag the row 30px and let go: it springs back. Drag 60px: it moves one card.",
        "Narrow the window: the row drops from 4 cards to 3, 2 and 1.",
        "Turn on reduced motion: the row jumps and the bio fades in instead of flipping.",
      ],
    },
    controls: [
      { type: "number", name: "duration", label: "Slide", default: 500, min: 150, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "ease", label: "Slide easing", default: easings.inOut, options: easingOptions },
      { type: "number", name: "flipDuration", label: "Flip", default: 600, min: 150, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "flipEase", label: "Flip easing", default: easings.inOut, options: easingOptions },
      { type: "number", name: "iconDuration", label: "Bio icon", default: 200, min: 0, max: 600, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "iconEase", label: "Bio icon easing", default: easings.out, options: easingOptions, secondary: true },
      { type: "number", name: "arrowDuration", label: "Arrow", default: 200, min: 0, max: 600, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "arrowEase", label: "Arrow easing", default: easings.out, options: easingOptions, secondary: true },
      { type: "number", name: "perView", label: "Cards shown", default: 4, min: 1, max: 6, step: 1 },
      { type: "number", name: "minCardWidth", label: "Min card width", default: 250, min: 180, max: 400, step: 10, unit: "px" },
      { type: "number", name: "gap", label: "Gap", default: 40, min: 0, max: 80, step: 2, unit: "px" },
      { type: "number", name: "cardHeight", label: "Card height", default: 406, min: 320, max: 560, step: 2, unit: "px" },
      { type: "number", name: "radius", label: "Radius", default: 16, min: 0, max: 40, step: 1, unit: "px" },
      { type: "color", name: "cardColor", label: "Card", default: "#FFFFFF" },
      { type: "color", name: "backColor", label: "Bio side", default: "#F0F0F0" },
      { type: "color", name: "accent", label: "Accent", default: "#F55001" },
      { type: "color", name: "color", label: "Text", default: "#000000" },
      { type: "boolean", name: "loop", label: "Loop", default: true },
    ],
    assets: [
      {
        prop: "items[].image",
        label: "Headshot",
        fit: "Fills a 220×220 circle (object-cover) at the top of the card",
        placeholder: "440x440",
        notes: "A square photo, face centred. The original uses circle-framed PNGs; a plain square photo works because the slot crops it to a circle.",
      },
    ],
    promptNotes: [
      "`items` is an array of `{ image, name, role, bio, href?, label? }`. `image` is the headshot (an <img>); `href` is the person's LinkedIn URL and shows the LinkedIn button in the footer; `label` names the slide for screen readers when `name` isn't plain text.",
      "The component is just the row and its arrows. The section around it in the original is black with a centred white heading (\"Our experts help you make the right call\", Lexend 40px) and a 16px intro line; build those on the page.",
      "Typography from the original, all Lexend (Google Font): names 20px / 32px with -0.2px tracking, roles 13px / 17px, bio 16px / 20px weight 300, the Bio label 16px weight 500 in #F55001. The component inherits the site's font.",
      "Card from the original: white, 406px tall, 35px padding, corners `0 16px` (square top-left and bottom-right). Bio side #F0F0F0 with the bio capped so it scrolls above the footer. Footer 35px from the bottom: the 36px LinkedIn square (#0A66C2) on the left, 'Bio' plus a 24px icon on the right.",
      "It is a Client Component (\"use client\"). State is the index, the drag offset, the flipped card and the measured row width (ResizeObserver). The track and the flip are CSS transitions.",
      "It renders whatever you pass as `image`. If the site has its own Image component (e.g. components/common/Image), use it inside the 220px circle.",
    ],
  },
  {
    slug: "testimonial-slider",
    added: "2026-11-17",
    title: "Testimonial slider",
    description:
      "One open customer story between narrow portrait cards; picking a portrait or letting the progress bar run morphs every card at once, the portrait growing into the story as the open one shrinks away, used on Calendly website",
    category: "animations",
    group: "carousels",
    level: "section",
    source: "https://calendly.com/",
    recreated: "Astro",
    componentName: "TestimonialSlider",
    files: [
      {
        name: "testimonial-slider.tsx",
        path: "src/registry/animations/carousels/testimonial-slider.tsx",
      },
    ],
    usageProps: [
      "items={stories.map((story) => ({\n    headline: story.result,\n    quote: story.quote,\n    name: story.name,\n    role: story.role,\n    image: <img src={story.photo} alt=\"\" />,\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A customer story carousel where one story sits open in a wide card and the others wait as narrow portrait cards on both sides. Changing story morphs every card at once: the chosen portrait grows into the open card while the open one shrinks back into a portrait, and the new story slides in behind it. It should feel like one fluid, physical row, never like slides swapping.",
      trigger:
        "{autoplay|true=Autoplay: the active dot fills like a progress bar over {interval}ms, then the next story opens. Hovering the row with a mouse, focus inside it, the tab being hidden or the row being off screen pauses the fill where it is. |*=}Clicking a portrait card opens that story; clicking a dot opens its story; a horizontal swipe past 50px moves one story; Left/Right/Home/End move between dots while they have focus.",
      states: [
        "Every card is absolutely placed from the row's centre and given a slot: its distance from the open story. Slot 0 is the open card, {cardWidth}×{cardHeight}px. Slots ±1 are side cards, {sideWidth}×{sideHeight}px, {gap}px from it. Slots ±2 are edge cards, {edgeWidth}×{edgeHeight}px, {edgeGap}px further out. Slots ±3 sit one more step out at opacity 0. All are vertically centred.",
        "Changing story changes each card's slot, so its `width`, `height` and `transform: translate3d(x, -height/2, 0)` all transition together, along with opacity for cards entering or leaving the ends.",
        "Cards are keyed by a never-wrapping position, not by story. Moving forward mounts a new hidden card at slot +3 (it then fades and slides into +2) and the card leaving drops from -2 to -3 and fades: the row runs forever and no card ever crosses the screen.",
        "Closed cards show the portrait (inset 16px, {imageRadius}px corners). The open card shows the story: the result headline (36px, weight 500, -1px tracking), the quote (28px / 1.2, serif in the original), then name and role pills (12px) joined by a small waisted bridge, with the portrait in a panel on the right, `clamp(200px, 50%, 361px)` wide.",
        "The story inside every card is laid out at the open card's full size and clipped by the card, so text never reflows while the card resizes. Closed: `opacity: 0; translateX(±(100% + 60px))` toward the card's side. Open: `opacity: 1; translateX(0)`. The portrait thumbnail crossfades the other way.",
        "{connectors|true=Neighbouring cards are joined by a {cardColor} waisted bridge (a 16×28 SVG shape stretched across the gap) on each card's right edge; it moves and stretches with the cards.|*=No bridges between cards.}",
        "Dots: 8×8px, 3px radius, a 10% tint of the text colour (`trackColor`). The active one widens to 80px and {autoplay|true=fills left to right with {accent} (`scaleX(0 → 1)`, linear) as the progress bar|*=is filled with {accent}}.",
      ],
      timing: [
        "Card morph (width, height, transform, opacity): {duration}ms, `{ease}`. The original runs a spring that settles in about 600ms with a slow start and a long tail.",
        "Story text and photo: slide on the same {duration}ms `{ease}`, fade in over {fadeDuration}ms ease-out, fade out over half that, so the old story is gone before the new one lands.",
        "Dot stretch: {dotDuration}ms, strong ease-out.",
        "{autoplay|true=Autoplay fill: {interval}ms, linear. It restarts from empty after every change.|*=No autoplay.}",
      ],
      interruption:
        "Every change retargets from wherever the cards are, because width, height and transform are CSS transitions: clicking another portrait mid-morph bends the motion toward the new layout with no snap. A dot two or more stories away takes the shortest way round; cards that weren't on screen fade in at their slots. A swipe moves one story per gesture and the click that ends it is swallowed.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` there's no autoplay (the active dot is simply filled), cards jump to their new slots, and the story crossfades over {fadeDuration}ms without sliding. All controls still work.",
      responsive:
        "Measured on the row's own width, not the window. All five cards show while the open card can stay at least 600px wide beside them, shrinking from {cardWidth}px as the row narrows. Narrower than that, the edge cards go and only the side cards show, with the open card shrinking to fit (never under 320px). Below 768px the open card becomes 320×538px with the text centred on top and the photo filling the bottom, and the side cards peek in from the edges.",
      rules: [
        "Morph the cards by transitioning `width`, `height` and `transform` on absolutely positioned cards. Only seven cards exist at once, and each clips its contents with `contain: layout paint`, so the layout cost stays small. Don't swap to `scale`: it would stretch the text and photos.",
        "Lay the story out at the open card's size inside every card and let the card clip it; never let it reflow during the morph.",
        "Key cards by an ever-increasing position so the row loops without any card travelling across it.",
        "Drive autoplay with a CSS animation on the dot's fill (`animation-play-state` pauses it) and move on at `animationend`, so the bar and the timer can't drift apart.",
        "Closed cards are `aria-hidden` and their story `inert`; the dots are a `tablist` with roving tabindex. Pause autoplay on hover and focus so people can read.",
        "`corner-shape: superellipse(2)` gives the original's squircle corners where supported; plain rounded corners elsewhere.",
      ],
      checks: [
        "On a wide screen: one open story with two portraits on each side, smaller toward the ends, joined by small bridges.",
        "Click the portrait right of the open card: all five cards morph at once over {duration}ms, the portrait grows into the open story, the old story shrinks into a portrait on the left, a new portrait fades in on the far right and the far-left one fades out.",
        "Click a portrait, then another before the first move ends: the cards bend toward the second without snapping.",
        "{autoplay|true=Wait: the active dot fills over {interval}ms, then the next story opens. Hover the row: the fill stops; leave and it continues.|*=Nothing moves until you click.}",
        "Narrow the row: the edge cards go, then below 768px the open card stacks its photo under the text.",
        "Swipe left on a phone: the next story opens.",
        "Turn on reduced motion: no autoplay, cards jump, the story crossfades.",
      ],
    },
    controls: [
      { type: "boolean", name: "autoplay", label: "Autoplay", default: true },
      { type: "number", name: "interval", label: "Interval", default: 6000, min: 2000, max: 12000, step: 500, unit: "ms" },
      { type: "number", name: "duration", label: "Morph", default: 650, min: 200, max: 1400, step: 10, unit: "ms" },
      { type: "select", name: "ease", label: "Morph easing", default: easings.drawer, options: easingOptions },
      { type: "number", name: "fadeDuration", label: "Story fade", default: 300, min: 0, max: 800, step: 10, unit: "ms" },
      { type: "number", name: "dotDuration", label: "Dot", default: 300, min: 0, max: 800, step: 10, unit: "ms", secondary: true },
      { type: "number", name: "cardWidth", label: "Open card width", default: 762, min: 560, max: 960, step: 2, unit: "px" },
      { type: "number", name: "cardHeight", label: "Open card height", default: 513, min: 400, max: 640, step: 1, unit: "px" },
      { type: "number", name: "sideWidth", label: "Side card width", default: 105, min: 60, max: 180, step: 1, unit: "px" },
      { type: "number", name: "sideHeight", label: "Side card height", default: 344, min: 200, max: 500, step: 1, unit: "px" },
      { type: "number", name: "edgeWidth", label: "Edge card width", default: 74, min: 40, max: 140, step: 1, unit: "px" },
      { type: "number", name: "edgeHeight", label: "Edge card height", default: 205, min: 120, max: 400, step: 1, unit: "px" },
      { type: "number", name: "gap", label: "Gap", default: 20, min: 4, max: 48, step: 1, unit: "px" },
      { type: "number", name: "edgeGap", label: "Edge gap", default: 16, min: 4, max: 48, step: 1, unit: "px" },
      { type: "number", name: "radius", label: "Radius", default: 64, min: 0, max: 80, step: 1, unit: "px" },
      { type: "number", name: "imageRadius", label: "Photo radius", default: 48, min: 0, max: 64, step: 1, unit: "px" },
      { type: "boolean", name: "connectors", label: "Bridges", default: true },
      { type: "color", name: "cardColor", label: "Card", default: "#FFFFFF" },
      { type: "color", name: "color", label: "Text", default: "#071A31" },
      { type: "color", name: "accent", label: "Progress", default: "#4890E3" },
    ],
    assets: [
      {
        prop: "items[].image",
        label: "Customer photo",
        fit: "Fills a portrait panel up to 361×481 in the open card (object-cover), and the 73×312 strip of a closed card",
        placeholder: "722x962",
        notes: "A 3:4 portrait photo with the person centred, so it still reads when cropped to a thin strip. The original uses a second version with the company logo over it for the open card; pass the plain one as `thumbnail` and the logo version as `image` to match.",
      },
    ],
    promptNotes: [
      "`items` is an array of `{ headline, quote, name, role?, image, thumbnail?, label? }`. `headline` is the result (\"75 hours saved monthly\"), `quote` includes its quotation marks, `image` is an <img>, `thumbnail` is an optional different photo for closed cards, and `label` names the story for screen readers when `headline` isn't plain text.",
      "The component is the card row and the dots. The section around it in the original has a blue-to-violet gradient, a small uppercase \"Customer stories\" eyebrow and a white centred 60px heading (\"Real customers. Real results.\"), 64px above the cards; build those on the page.",
      "Typography from the original: headline Calendly Sans 36px / 1.1, weight 500, -1px tracking; quote Wulkan Text (a serif) 28px / 1.2, weight 500, text #071A31. Pass the site's serif with `quoteClassName`. Pills are 12px on a 6% tint of the text colour.",
      "It is a Client Component (\"use client\"). State is the position, the row width (ResizeObserver), on-screen (IntersectionObserver) and hover/focus for pausing. Everything that moves is a CSS transition or animation.",
      "Give it at least 64px of room above and below in a section with `overflow-x: clip` (it clips its own row), and don't put it inside a transform-animated parent while it morphs.",
    ],
  },
  {
    slug: "stacking-cards",
    title: "Stacking cards",
    description:
      "Cards stick as you scroll, and each one slides up, shrinks, blurs and fades as the next card covers it, used on Seemplicity website",
    category: "animations",
    group: "pin-scrollers",
    level: "section",
    source: "https://seemplicity.ai/",
    recreated: "WordPress",
    componentName: "StackingCards",
    files: [
      {
        name: "stacking-cards.tsx",
        path: "src/registry/animations/pin-scrollers/stacking-cards.tsx",
      },
    ],
    usageChildren: "{cards.map((card) => (\n    <YourCardContent key={card.id} {...card} />\n  ))}",
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A stack of cards that pile up as you scroll: each card sticks under the header, and as the next one slides over it, the covered card slides up, shrinks, blurs{fade|true= and fades away|*=}, so it recedes behind the new one. It should feel smooth and physical, with a slight lag behind the scroll.",
      trigger:
        "Scroll position, from 992px wide. Every card is `position: sticky` at `top: {stickyTop}px`, so later cards scroll up over earlier ones.",
      states: [
        "A covered card's progress runs 0 → 1 between the moment it sticks and the moment the next card sticks (one card height + {gap}px of scroll), eased with smoothstep `t²(3 − 2t)`.",
        "At progress 1 the covered card is at `translateY(-{offsetY}px) scale({scale})`, `filter: blur({blur}px)`{fade|true= and `opacity: 0`|*=}. At 0 it's untouched.",
        "The last card never changes.",
      ],
      timing: [
        "No fixed duration: progress follows scroll. Each frame, the displayed value moves 0.2 of the way toward the scroll-based target (frame-rate independent, as at 60fps), and a {smoothDuration}ms `{smoothEase}` CSS transition on transform, opacity and filter smooths it further.",
      ],
      interruption:
        "Progress always follows the scroll position, so scrolling back up reverses the effect smoothly; there's nothing to cancel.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, cards still stick and stack (scrolling is user-driven), but covered cards don't slide, scale, blur or fade, and there's no smoothing transition.",
      responsive:
        "Stacking runs from 992px wide. Below that the cards are a plain list with the same {gap}px gap.",
      rules: [
        "Stick with `position: sticky`; only `transform`, `opacity` and `filter` change, so there's no layout work.",
        "Read scroll in a passive listener and write styles straight to the DOM in one requestAnimationFrame loop that stops once every card has settled; React shouldn't re-render on scroll.",
        "Don't put it inside an ancestor with `overflow: hidden`; that breaks sticky.",
      ],
      checks: [
        "Scroll down: each card sticks {stickyTop}px from the top, and as the next one covers it, it slides up {offsetY}px, shrinks to {scale}, blurs to {blur}px{fade|true= and fades out|*=}.",
        "The effect lags the scroll slightly and settles smoothly when you stop.",
        "Scroll back up: covered cards come back to full size and sharpness.",
        "Below 992px: a plain list, nothing sticks.",
        "Turn on reduced motion: cards stack without sliding, scaling, blurring or fading.",
      ],
    },
    controls: [
      { type: "number", name: "stickyTop", label: "Sticky top", default: 160, min: 0, max: 240, step: 4, unit: "px" },
      { type: "number", name: "gap", label: "Gap", default: 30, min: 0, max: 120, step: 2, unit: "px" },
      { type: "number", name: "cardHeight", label: "Card height", default: 420, min: 240, max: 460, step: 10, unit: "px" },
      { type: "number", name: "radius", label: "Radius", default: 20, min: 0, max: 48, step: 1, unit: "px" },
      { type: "color", name: "background", label: "Card color", default: "#0B0623" },
      { type: "number", name: "offsetY", label: "Slide up", default: 60, min: 0, max: 160, step: 2, unit: "px" },
      { type: "number", name: "scale", label: "Scale to", default: 0.96, min: 0.8, max: 1, step: 0.01 },
      { type: "number", name: "blur", label: "Blur", default: 10, min: 0, max: 24, step: 1, unit: "px" },
      { type: "boolean", name: "fade", label: "Fade out", default: true },
      { type: "number", name: "smoothDuration", label: "Smoothing", default: 300, min: 0, max: 800, step: 10, unit: "ms" },
      { type: "select", name: "smoothEase", label: "Smoothing easing", default: easings.out, options: easingOptions },
    ],
    promptNotes: [
      "Each child becomes one card. The component draws the card box (background, radius, min height); put the card's content inside as children.",
      "`stickyTop` should be the site header's height + 80px (the original uses 80px header + 80 = 160). Pass the real value if the header height differs.",
      "Stacking runs from 992px wide (`minWidth`). Below that the original switches to a swipe carousel, which is a separate component; here the cards fall back to a plain list with the same gap. Pass `minWidth={0}` to stack on phones too.",
      "It is a Client Component (\"use client\"): it needs a scroll listener. The listener is passive and writes styles in one requestAnimationFrame loop that stops when cards settle, so React never re-renders on scroll.",
      "Don't put the component inside an ancestor with `overflow: hidden` - that breaks position: sticky. An `overflow: auto` scroll container works.",
    ],
  },
  {
    slug: "horizontal-scroll",
    added: "2026-11-17",
    title: "Horizontal scroll",
    description:
      "The section pins and scrolling down slides a row of cards sideways until the last one is in view, then the page carries on, used on Miro website",
    category: "animations",
    group: "pin-scrollers",
    level: "section",
    source: "https://miro.com/",
    recreated: "Framer",
    componentName: "HorizontalScroll",
    files: [
      {
        name: "horizontal-scroll.tsx",
        path: "src/registry/animations/pin-scrollers/horizontal-scroll.tsx",
      },
    ],
    motionNote:
      "Scroll-linked: the row moves with the scroll position, so there's no duration or easing. Smoothing sets how far it lags behind and how softly it settles.",
    usageProps: ['heading={<h2>Experience the Intelligent Canvas</h2>}'],
    usageChildren: "{cards.map((card) => (\n    <YourCard key={card.id} {...card} />\n  ))}",
    themeToggle: false,
    defaultTheme: "light",
    fullBleed: true,
    motion: {
      intent:
        "A section that turns vertical scroll into horizontal movement: it pins in place, and as you keep scrolling down a row of cards (led by the section heading) slides left until the last card is in view, then the page scrolls on. It should feel like gliding along a wide canvas, smooth and slightly behind the wheel, never ticking with each scroll step.",
      trigger:
        "Scroll position, from 992px wide. The stage inside the section is `position: sticky; top: {stickyTop}px` and as tall as the viewport minus {stickyTop}px.",
      states: [
        "The section is as tall as the stage plus the row's travel × {speed}, where travel = row width − stage width. That extra height is how long it stays pinned.",
        "Progress runs 0 → 1 from the moment the section's top reaches the pin line ({stickyTop}px) to the moment it has scrolled travel × {speed} further. Linear, no easing curve.",
        "The row is at `translateX(-progress × travel)`: 0 when the pin starts (heading at the left edge), −travel at the end (last card's right edge at the stage's right padding).",
        "The heading ({headingWidth}px column) is the first item in the row, so it slides out with the cards.",
      ],
      timing: [
        "No fixed duration: position follows scroll. Each frame, the displayed offset moves {smoothing} of the way toward the scroll-based target (frame-rate independent, as at 60fps), so the row glides and settles after the wheel stops.",
      ],
      interruption:
        "The offset always chases the current scroll position, so reversing direction mid-glide turns the row around smoothly; there's nothing to cancel.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the section still pins and the row still follows the scroll (it's user-driven), but 1:1 with no lag.",
      responsive:
        "Scroll-driven from 992px wide. Below that nothing pins: the heading sits above the panel, and the panel is a native horizontal swipe row with scroll-snap on each card.",
      rules: [
        "Pin with `position: sticky` and move the row with `transform: translate3d()` only, so there's no layout work per frame.",
        "Measure travel with a ResizeObserver (row, stage and scroll container) and set the section height in px from it; recompute when cards, widths or the viewport change.",
        "Read scroll in a passive listener and write the transform straight to the DOM in one requestAnimationFrame loop that stops once it settles; React shouldn't re-render on scroll.",
        "Don't put it inside an ancestor with `overflow: hidden`; that breaks sticky. The stage itself clips the row.",
      ],
      checks: [
        "Scroll into the section: it pins {stickyTop}px from the top, and the heading and cards slide left as you scroll down.",
        "At the end of the pin the last card's right edge sits at the stage's right padding, then the page scrolls on normally.",
        "Stop scrolling mid-way: the row glides on briefly and settles; it doesn't jump in wheel-sized steps.",
        "Scroll back up: the row slides back to the right and the heading returns.",
        "Resize the window: the pin length and end position update; the last card still lands at the right edge.",
        "Below 992px: nothing pins; swipe the cards sideways and each snaps into place.",
        "Turn on reduced motion: the row follows the scroll exactly, with no lag.",
      ],
    },
    controls: [
      { type: "number", name: "speed", label: "Scroll length", default: 1, min: 0.5, max: 3, step: 0.1, unit: "×", motion: true },
      { type: "number", name: "smoothing", label: "Smoothing", default: 0.12, min: 0.04, max: 1, step: 0.01, motion: true },
      { type: "number", name: "stickyTop", label: "Sticky top", default: 0, min: 0, max: 160, step: 4, unit: "px" },
      { type: "number", name: "cardWidth", label: "Card width", default: 800, min: 320, max: 1000, step: 10, unit: "px" },
      { type: "number", name: "headingWidth", label: "Heading width", default: 420, min: 200, max: 600, step: 10, unit: "px" },
      { type: "number", name: "gap", label: "Gap", default: 32, min: 0, max: 80, step: 2, unit: "px" },
      { type: "boolean", name: "panel", label: "Panel", default: true },
      { type: "color", name: "panelColor", label: "Panel color", default: "#FFFFFF" },
      { type: "number", name: "radius", label: "Radius", default: 24, min: 0, max: 48, step: 1, unit: "px" },
      { type: "color", name: "background", label: "Background", default: "#F7F7F5" },
    ],
    assets: [
      {
        prop: "children (card image)",
        label: "Product screenshot",
        fit: "Fills a 16 / 9 frame at the top of each card (object-cover, rounded 12px)",
        placeholder: "1600x900",
        notes: "Product UI shots on a light canvas, as in the original. Keep important detail away from the edges.",
      },
    ],
    promptNotes: [
      "Each child becomes one card in the row; `heading` is an optional lead column that slides with the row. The component draws the panel (`panel`, `panelColor`, `radius`) around the cards; put each card's own content (image, title, text, button) inside as children.",
      "Card from the original: a 16 / 9 screenshot on top, then a 28px title, an 18px / 28px grey (#555) description and a black 'Learn more' button (48px tall, 8px radius). The heading is about 44px / 1.2, regular weight. Miro's font is Roobert (licensed); Inter Tight is the closest Google Font.",
      "`stickyTop` should be the fixed header's height so the stage pins below it.",
      "The original ends the pinned stretch by zooming out to an overview of the whole canvas; that zoom is a separate effect and not part of this component.",
      "It is a Client Component (\"use client\"): it needs a scroll listener and a ResizeObserver. Styles are written in one requestAnimationFrame loop that stops when the row settles, so React never re-renders on scroll.",
      "Don't put the component inside an ancestor with `overflow: hidden` - that breaks position: sticky. An `overflow: auto` scroll container works.",
    ],
  },
  {
    slug: "focus-scroll",
    title: "Focus scroll",
    description:
      "A media column pins in place while text blocks scroll past, crossfading to the visual for the block in focus, with a swipeable card row on phones, used on Sophos website",
    category: "animations",
    group: "pin-scrollers",
    level: "section",
    source: "https://www.sophos.com/en-us",
    componentName: "FocusScroll",
    files: [
      {
        name: "focus-scroll.tsx",
        path: "src/registry/animations/pin-scrollers/focus-scroll.tsx",
      },
    ],
    usageProps: [
      "items={items.map((item) => ({\n    media: <img src={item.image} alt={item.imageAlt} />,\n    content: <YourTextBlock title={item.title} body={item.body} />,\n    action: item.cta && <a href={item.cta.href}>{item.cta.label}</a>,\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A feature section where a column of visuals pins in place while short text blocks scroll past beside it. As each block comes into focus, the pinned visual crossfades to match it, so the reader always sees the picture for what they're reading. On phones it becomes a row of glass cards to swipe through, with a progress bar. It should feel calm and editorial: the swap is a soft fade, never a slide or a jump.",
      trigger:
        "Pinned layout (720px+): the page's scroll position. Each text block has a focus zone that starts when the block's top reaches `{stickyTop} - 10 + blockHeight / 4` px from the viewport top and ends when its bottom reaches `{stickyTop} - 10 + blockHeight / 2`. Scrolling down into a zone, or back up into one, makes that block active; leaving a zone changes nothing. Phone layout (below 720px): a horizontal swipe or drag past a fifth of the card width.",
      states: [
        "Media column: `position: sticky; top: {stickyTop}px`. The active visual is in the flow at opacity 1; the others are stacked on top of it (absolute, same top-left) at opacity 0 and ignore the pointer.",
        "Text blocks: {inactiveOpacity|1=nothing changes on them; they scroll normally|*=out-of-focus blocks fade to opacity {inactiveOpacity}, the active one is at 1}.",
        "Before the first zone the first visual shows; after the last zone the last one stays.",
        "Phone row: cards are one row-width (100% - 20px) apart, so the next card peeks in on the right. Moving shifts the row with `translateX(-index × 100%)`.",
        "Phone progress bar: a 5px pill whose fill width is `(index + 1) / count`.",
      ],
      timing: [
        "Crossfade: {duration}ms, `{ease}`, outgoing and incoming at the same time.",
        "Phone row and progress fill: {slideDuration}ms, `{slideEase}`.",
        "No delays and no stagger.",
      ],
      interruption:
        "Crossfade: if the active block changes mid-fade, each visual fades from its current opacity towards its new target; nothing snaps. Scrolling fast past several zones in one frame activates the last zone passed in the scroll direction (as ScrollTrigger fires onEnter for each in order). Phone row: a move asked for while the row is still sliding ({slideDuration}ms) is ignored. While dragging, the row follows the finger 1:1 (0.35 of the drag past the first or last card) with its transition off; on release it moves one card if the drag passed a fifth of the card width, otherwise springs back.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the visual still swaps at the same scroll points but instantly, without the fade, and the phone row and progress bar jump without sliding. Scrolling itself is user-driven, so pinning stays.",
      responsive:
        "Breakpoints are on the component's own width (container queries), matching the original's container widths. 720px+: pinned layout, media 50%, text `50% - 40px`, 40px gap, text blocks 40px top and bottom padding. 960px+: text blocks at least 270px tall. 1220px+: media {mediaWidth}%, gap {gap}px, text blocks at least 450px tall with 105px top / 155px bottom padding (60px bottom on the last). Below 720px: the phone card row.",
      rules: [
        "Pin with `position: sticky`, not by fixing the element or translating it on scroll. The fade is `opacity` only.",
        "Don't add GSAP or a carousel library either. The original uses GSAP ScrollTrigger (only its onEnter/onEnterBack callbacks, no scrub) for the swap and react-slick for the phone row; its values are matched here: `waitForAnimate: true`, `touchThreshold: 5`, `edgeFriction: 0.35`, speed 500, `ease` (the defaults of `slideDuration` and `slideEase`).",
        "Read scroll positions in a passive scroll listener, at most once per animation frame, and only set state when the active block changes, so scrolling doesn't re-render.",
        "Don't put it inside an ancestor with `overflow: hidden`; that breaks sticky. Use `overflow-x: clip` on the section to clip the peeking phone card.",
      ],
      checks: [
        "Scroll down slowly: each visual fades to the next over {duration}ms as its text block's top passes about a quarter of the block's height below the pin line, and the media column stays pinned {stickyTop}px from the top.",
        "Stop between two blocks: the last focused visual stays; nothing fades back.",
        "Scroll back up: the previous visual returns as its block's bottom comes back past the pin line + half its height.",
        "Fling past everything to the bottom: the last visual shows, with no flicker through the others.",
        "At 375px: glass cards with the next one peeking in, a progress bar at a third full. Swipe about 65px: it moves one card over {slideDuration}ms and the bar grows. Swipe 30px: it springs back.",
        "Swipe twice quickly on the phone row: it moves one card, not two.",
        "Turn on reduced motion: visuals swap without fading, and the phone row jumps.",
      ],
    },
    controls: [
      { type: "number", name: "stickyTop", label: "Sticky top", default: 180, min: 0, max: 240, step: 2, unit: "px" },
      { type: "number", name: "mediaWidth", label: "Media width", default: 60, min: 40, max: 70, step: 1, unit: "%" },
      { type: "number", name: "gap", label: "Gap", default: 80, min: 24, max: 160, step: 4, unit: "px" },
      {
        type: "select",
        name: "mediaSide",
        label: "Media side",
        default: "left",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      { type: "number", name: "duration", label: "Crossfade", default: 500, min: 0, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "ease", label: "Crossfade easing", default: "cubic-bezier(0.4, 0, 0.2, 1)", options: easingOptions },
      { type: "number", name: "inactiveOpacity", label: "Inactive text", default: 1, min: 0.2, max: 1, step: 0.05 },
      { type: "number", name: "slideDuration", label: "Phone slide", default: 500, min: 0, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "slideEase", label: "Slide easing", default: easings.ease, options: easingOptions },
      {
        type: "select",
        name: "theme",
        label: "Theme",
        default: "dark",
        options: [
          { label: "Dark", value: "dark" },
          { label: "Light", value: "light" },
        ],
      },
    ],
    assets: [
      {
        prop: "items[].media",
        label: "Feature visual",
        fit: "Full column width at its natural height (object-fit: contain)",
        placeholder: "1200x900",
        notes: "Its ratio sets the height of the step, so the real visual should keep the same ratio across items.",
      },
    ],
    promptNotes: [
      "`items` is an array of `{ media, content, action }` React nodes. `media` is the visual (usually an `<img>` with real alt text; it's shown at full column width, natural height, `object-fit: contain`). `content` is the text block (title and copy), styled with the site's typography. `action` is an optional link or button: 43px under the text in the pinned layout, pinned to the bottom of the card on phones.",
      "Both layouts are in the DOM and a container query shows one, so `media` and `content` render twice. Keep ids out of them.",
      "`theme` sets the phone cards and progress bar: \"dark\" (white at 10% with a 30% white border, white bar on a 20% #D9D9D9 track) for dark sections, \"light\" (black at 10%, 30% black border, #001A47 bar on its 20% track, and 20px side padding on the media) for light ones. The section background, heading and intro above it aren't part of this component; the original's are #001A47 with a background image (dark) or #EDF2F9 (light), and a 44px Lexend Exa weight-300 heading.",
      "`stickyTop` should be the site header's height + 62px (the original's header is 118px, so 180). Pass the real value if the header height differs.",
      "In the original, the card title is Lexend Exa 32px weight 300 and the copy Inter 14px (16px from 960px), white on dark. The CTA is a 14px bold white link with an arrow that slides 5px right on hover (100ms linear, from 1280px).",
      "It is a Client Component (\"use client\"): it needs a scroll listener and the phone row's state.",
    ],
  },
  {
    slug: "collapsing-stack",
    title: "Collapsing stack",
    description:
      "Rows of heading, copy and art are dealt into a pile as you scroll, each new row sliding up over the last and folding it into a strip, used on NetApp AI website",
    category: "animations",
    group: "pin-scrollers",
    level: "section",
    source: "https://netapp.ai/technology/ai-performance-scale/",
    componentName: "CollapsingStack",
    motionNote:
      "Scroll-linked: the rows are dealt by the scroll position, so there's no duration or easing; Scrub sets how many seconds the deal takes to catch up with the scroll.",
    dependencies: ["gsap"],
    files: [
      {
        name: "collapsing-stack.tsx",
        path: "src/registry/animations/pin-scrollers/collapsing-stack.tsx",
      },
    ],
    usageProps: [
      "items={rows.map((row) => ({\n    title: <h3 className=\"text-4xl font-light\">{row.title}</h3>,\n    description: <p className=\"text-xl\">{row.body}</p>,\n    media: <img src={row.image} alt={row.imageAlt} />,\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A list of rows (heading, copy, art) dealt into a pile as you scroll: each row travels up, lands at its own slot under the header and stays there while the next row rises over it, folding its copy away and closing its art to a strip. The section ends as a pile of headings with the last row open. It should feel like a deck being dealt, tied to the reader's own scroll and gliding slightly behind it.",
      trigger:
        "Scroll position, through a GSAP ScrollTrigger with `scrub: {scrub}`. It starts the moment the list pins (`top top+={stickyTop}`) and runs for the deal's runway: the total card travel × {speed}. Its progress is the deal: `dealt = progress × maxTravel`.",
      states: [
        "The list is one `position: sticky` box (`top: {stickyTop}px`), the assembled pile's height, inside a wrapper as tall as the rows laid end to end plus the extra runway. Switching the stack on never changes the page's length.",
        "Each row sits absolute at its slot (the bands above it, summed) and is dealt by a `y` transform: its remaining travel from where plain flow would put it, `max(0, flowTop − slot − dealt)`, walked to zero. A docked row has its transform removed, not set to 0.",
        "Bands: `{padding} + {peek} + {padding}` px from 992px wide (heading beside the art); 240px from 768px and 150px below (heading over the art), plus any extra heading lines there.",
        "Copy fold: from the moment the next row overlaps a quarter of this row (`0.75 × rowHeight − band` px away) to the moment it lands, the description goes `grid-template-rows: 1fr → 0fr` and `opacity: 1 → 0`; once fully folded it's `inert`. The heading is never touched.",
        "Art: closed by `clip-path: inset(0 0 N px 0 round radius)` off its bottom edge, one pixel per pixel the next row advances, down to {peek}px (170px from 768px, 79px below). On the column layout the copy still standing above the art comes off the window too. The image never moves or resizes.",
      ],
      timing: [
        "No fixed durations: everything is scrubbed by scroll, and `scrub: {scrub}` eases progress toward the scroll position over {scrub}s{scrub|0= (0 = locked to the scrollbar)|*=}.",
        "All values are rounded to whole pixels and only written when they change.",
      ],
      interruption:
        "Everything follows the trigger's progress, so scrolling back un-deals the pile in reverse, and stopping lets the scrub settle on the current position.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` (watched live with `gsap.matchMedia`), every row is open in plain flow: nothing pins, nothing folds.",
      responsive:
        "From 992px: 367px text column, 80px gap, art 833:533 with a {radius}px radius, rows {padding}px top and bottom. Below 992px the text sits above the art (330:211, 10px radius, 10px row padding). If `{stickyTop} + 2 × the tallest band` doesn't fit the viewport, the deal is off and every row is open in plain flow; this is re-checked on every refresh.",
      rules: [
        "Use GSAP ScrollTrigger as the reference does (`scrub`, `onRefreshInit` to measure, `onUpdate` to apply), and pin with CSS `position: sticky`, not ScrollTrigger's `pin`.",
        "Measure every row's open height, art height and heading height on each refresh (one deliberate reflow), never in a scrub frame. Re-measure when fonts load and when the visual viewport resizes (debounced).",
        "Write with `gsap.set` straight to the DOM; React shouldn't re-render on scroll. Close the art with `clip-path`, not by animating its height.",
        "Rows must be opaque (their own background) so each covers the one below. Don't put it inside an ancestor with `overflow: hidden`; that breaks sticky.",
      ],
      checks: [
        "Scroll down: the list pins {stickyTop}px from the top and each row rises at 1/{speed} of the scroll speed, gliding to a stop when you stop.",
        "As a row covers the previous one, the previous description folds away from the moment it's a quarter covered, and its art closes to a {peek}px strip with its heading still whole.",
        "When the last row lands, the finished pile scrolls off the top together.",
        "Scroll back up: the pile un-deals in reverse, with no jumps.",
        "Make the window very short: every row is open in plain flow.",
        "Turn on reduced motion: every row is open in plain flow.",
      ],
    },
    controls: [
      { type: "number", name: "stickyTop", label: "Sticky top", default: 100, min: 0, max: 200, step: 4, unit: "px" },
      { type: "number", name: "peek", label: "Folded art", default: 200, min: 80, max: 320, step: 4, unit: "px" },
      { type: "number", name: "padding", label: "Row padding", default: 30, min: 8, max: 60, step: 2, unit: "px" },
      { type: "number", name: "speed", label: "Scroll per px", default: 1.5, min: 1, max: 3, step: 0.1 },
      { type: "number", name: "scrub", label: "Scrub", default: 1, min: 0, max: 3, step: 0.1, unit: "s" },
      { type: "number", name: "radius", label: "Art radius", default: 20, min: 0, max: 40, step: 1, unit: "px" },
      { type: "color", name: "background", label: "Row background", default: "#FFFFFF" },
      { type: "color", name: "borderColor", label: "Divider", default: "#F4F1ED" },
    ],
    assets: [
      {
        prop: "items[].media",
        label: "Row art",
        fit: "Fills the row's art window, top-aligned, object-cover. An image or a video",
        placeholder: "1600x900",
        notes: "The window closes from the bottom as the row collapses, so keep the subject near the top.",
      },
    ],
    promptNotes: [
      "This is the animated list only. The section intro above it (eyebrow, heading, paragraph, 100px above the list from 992px) and the section padding aren't part of the component; render them around it. Headings, copy and art come in through `items` as nodes, so typography is the site's own.",
      "`items` is an array of `{ title, description, action?, media }` (the original has 3 rows). `title` stays whole in the pile; `description` and `action` fold away together; `media` is an `img` or `video` that fills the art window (absolute, full size, `object-fit: cover`). A row without media shows a black band.",
      "`stickyTop` should be the site header's height (the original reads `--site-header-offset`, 100px by default).",
      "Breakpoints are viewport media queries at 768px and 992px, the original's `md` and `lg`. Keep `992px` rather than a Tailwind default.",
      "Original typography: F37 Judge (licensed). Row headings 36px / 1.1 weight 100 (28px, -0.28px tracking below 992px), copy 20px / 1.6 #333 with 0.2px tracking (16px, 0.32px below), intro heading 70px / 1.1, eyebrow uppercase #0054D7. The demo uses Inter Tight (Google Font).",
      "It is a Client Component (\"use client\") that runs its setup in a layout effect, so the first paint is already the pile.",
    ],
  },
  {
    slug: "product-tabs",
    added: "2026-11-17",
    title: "Product tabs",
    description:
      "Icon tabs above a card where the active tab lifts out in the card's colour, joined to it by a small bridge, and a colour fill slides through the row to land in the chosen tab, used on Calendly website",
    category: "animations",
    group: "tabs",
    level: "section",
    source: "https://calendly.com/",
    recreated: "Astro",
    componentName: "ProductTabs",
    files: [
      {
        name: "product-tabs.tsx",
        path: "src/registry/animations/tabs/product-tabs.tsx",
      },
    ],
    usageProps: [
      "items={products.map((product) => ({\n    label: product.name,\n    icon: <product.Icon />,\n    color: product.color,\n    content: (\n      <ProductPanel\n        icon={<product.Icon />}\n        color={product.color}\n        name={product.name}\n        badge={product.badge}\n        heading={product.heading}\n        body={product.body}\n        href={product.href}\n        media={<img src={product.image} alt=\"\" />}\n      />\n    ),\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A product switcher: a row of icon tabs above a card. The active tab lifts out in the card's colour and is joined to the card by a small waisted bridge, so tab and card read as one shape, and a blob of the product's colour slides along under the row to settle in the chosen tab. It should feel liquid and calm: one colour travelling, not tabs blinking on and off.",
      trigger:
        "Clicking a tab or the previous / next arrows (they wrap), Left/Right/Home/End while a tab has focus{autoplay|true=, and autoplay: every {interval}ms it moves to the next tab{progress|true=, timed by a progress ring that closes around the active tab|*=}. It pauses while the pointer is over it, while focus is inside, while the browser tab is hidden and while it's off screen|*=}.",
      states: [
        "Shape: every layer is the original's squircle, an SVG path in a 56×56 box made of four cubic curves through the edge midpoints (from top centre, clockwise; handles at 0.66 and 0.754 of the half-size along each edge), scaled to {tabSize}px. Don't approximate it with `border-radius`: the progress ring has to trace the exact same curve. Resting tab: a {cardColor} wash at 20% (half-size 24) inside a 4px {cardColor} border at 40% (half-size 26). Hover raises the wash to 40%. Icons are {iconColor}.",
        "Travelling fill: each tab has a hole inset 4px (7.14%), clipped to the squircle with an `objectBoundingBox` clipPath; the fill is clipped to the same shape, so its edge is curved as it slides in. Inside every hole is a copy of the same fill shape, shifted by `translateX((active − index) × (tabSize + {gap}px))`, so all copies line up as one blob that shows only through the hole above it. Its colour is the active product's colour.",
        "Changing tab transitions that shift and the fill colour together: the blob slides from the old tab to the new one, visibly passing through the holes of the tabs between them while its colour blends to the new product's.",
        "Lift: a {cardColor} copy of the tab shape plus a 32×14px waisted bridge (concave sides) from its bottom edge down to the card, which sits 14px below the row. It fades out on the old tab and in on the new one. The active icon turns {activeIconColor}.",
        "Card: {cardColor}, {radius}px corners, 48px padding (32px under 600px), up to {maxWidth}px wide. {shadow|true=A layered `drop-shadow` filter on the wrapper around the tabs and card outlines tab, bridge and card as one silhouette.|*=No shadow.}",
        "Panels are stacked in one grid cell; the active one is visible, the rest are `opacity: 0`, hidden and `inert`.",
        "{autoplay|true={progress|true=Progress ring (the loading indicator): a {ringWidth}px stroke with round caps, in a darker shade of the product colour (each item's `ringColor`), traced on the hole's squircle just inside its rim (half-size 24 − width/2), so it lines the edge of the fill. It starts at top centre and runs clockwise, drawn with `pathLength=\"1\"`, `stroke-dasharray: 1 1` and `stroke-dashoffset` from 1 to 0. Only the active tab has one.|*=Autoplay runs without a visible ring: the same timer, hidden.}|*=No progress ring (autoplay is off).}",
      ],
      timing: [
        "Fill slide and colour blend: {duration}ms, `{ease}`{ease|cubic-bezier(0.5, 0, 0.5, 1)= (the original's: a slow start and a slow landing)|*=}.",
        "Lift crossfade and icon colour: {duration}ms, same easing, starting together with the slide.",
        "Panel crossfade: {fadeDuration}ms, ease. The original swaps the copy quickly while the colour is still travelling.",
        "Tab hover wash: {hoverDuration}ms, ease.",
        "{autoplay|true=Autoplay: {interval}ms per tab. The ring waits {duration}ms for the fill to land, then draws linearly over the remaining time; when it closes (`animationend`) the next tab opens. The original's ring also waits for the slide and runs at the same pace.|*=No autoplay.}",
      ],
      interruption:
        "Fill, lift and panels are CSS transitions, so clicking another tab mid-slide retargets the blob from where it is. Jumping from the last tab to the first sends the blob back across the whole row (the arrows wrap, the blob doesn't).",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` there's no autoplay (so no progress ring) and the fill doesn't slide: it appears in the new tab while its colour fades, and the lift and panels crossfade.",
      responsive:
        "Measured on the component's own width (container queries). Below 600px the tabs are 48px with 7px gaps and the card padding drops to 32px. `ProductPanel` puts the copy and the media side by side from 768px and stacks them below.",
      rules: [
        "Only `transform`, `background-color`, `color` and `opacity` change. Don't animate a shared indicator's `left` or `width`.",
        "The fill shift must use the same pitch as the row (tab size + gap) at every breakpoint, or the copies stop lining up; drive both from one CSS variable.",
        "Keep the bridge and the lifted tab exactly the card's colour and touching it, so they merge into the card with no seam, and put the drop shadow on a wrapper around tabs and card together, never on each piece.",
        "Drive autoplay from the ring's CSS animation and pause it with `animation-play-state`, so the ring and the tab change can't drift apart and a pause keeps its progress instead of restarting. Restart it (a new key) on every tab change.",
        "Use real `tablist` / `tab` / `tabpanel` roles with roving tabindex. Autoplay moves content on its own, so keep the hover and focus pause.",
      ],
      checks: [
        "On load, the first tab is lifted in the card colour, joined to the card by the bridge, with the product colour inside it.",
        "Click the tab two to the right: the colour slides through the tab in between and lands in the new one over {duration}ms while it blends to the new product's colour; the lift moves with it and the copy swaps.",
        "Click a tab, then another before the slide ends: the blob turns toward the second without snapping.",
        "{autoplay|true=Wait: once the colour lands, {progress|true=a darker ring draws clockwise from the top of the active tab and|*=after} {interval}ms the next tab opens. Hover the card halfway through: {progress|true=the ring stops where it is and carries on when you leave|*=nothing changes until you leave}.|*=Nothing changes until you click.}",
        "Under 600px wide: 48px tabs, copy above the media.",
        "Turn on reduced motion: no autoplay, and the colour appears in place instead of sliding.",
      ],
    },
    controls: [
      { type: "boolean", name: "autoplay", label: "Autoplay", default: true },
      { type: "number", name: "interval", label: "Interval", default: 6000, min: 2000, max: 12000, step: 500, unit: "ms" },
      { type: "number", name: "duration", label: "Fill slide", default: 600, min: 150, max: 1400, step: 10, unit: "ms" },
      { type: "select", name: "ease", label: "Fill easing", default: "cubic-bezier(0.5, 0, 0.5, 1)", options: easingOptions },
      { type: "number", name: "fadeDuration", label: "Panel fade", default: 200, min: 0, max: 800, step: 10, unit: "ms" },
      { type: "number", name: "hoverDuration", label: "Tab hover", default: 150, min: 0, max: 600, step: 10, unit: "ms", secondary: true },
      { type: "number", name: "tabSize", label: "Tab size", default: 56, min: 40, max: 80, step: 1, unit: "px" },
      { type: "number", name: "gap", label: "Tab gap", default: 8, min: 2, max: 24, step: 1, unit: "px" },
      { type: "number", name: "maxWidth", label: "Card width", default: 920, min: 600, max: 1200, step: 10, unit: "px" },
      { type: "number", name: "radius", label: "Card radius", default: 48, min: 0, max: 72, step: 1, unit: "px" },
      { type: "color", name: "cardColor", label: "Card", default: "#FCFBF8" },
      { type: "color", name: "iconColor", label: "Icons", default: "#EDF5FF" },
      { type: "color", name: "activeIconColor", label: "Active icon", default: "#071A31" },
      { type: "boolean", name: "arrows", label: "Arrows", default: true },
      { type: "boolean", name: "shadow", label: "Shadow", default: true },
      { type: "boolean", name: "progress", label: "Progress ring", default: true },
      { type: "number", name: "ringWidth", label: "Ring width", default: 3, min: 1, max: 6, step: 0.5, unit: "px" },
    ],
    assets: [
      {
        prop: "items[].icon",
        label: "Product icon",
        fit: "Fills a 32×32 box centred in the tab (57% of it), drawn in currentColor",
        placeholder: "64x64",
        notes: "An inline SVG with `fill` or `stroke` set to `currentColor`, so it can turn light on the resting tabs and dark in the active one.",
      },
      {
        prop: "ProductPanel media",
        label: "Product visual",
        fit: "Fills a 4:3 box with 32px corners on the right of the card (object-cover)",
        placeholder: "1120x840",
        notes: "A product UI shot or illustration on its own background. The original plays a Rive animation with a still poster.",
        optional: true,
      },
    ],
    promptNotes: [
      "`items` is an array of `{ label, icon, color, ringColor?, content }`. `label` names the tab for screen readers (and its tooltip), `icon` is an SVG in currentColor, `color` is the product colour that slides into the tab, `ringColor` is the darker shade for the progress ring (defaults to `color` mixed 28% toward black), and `content` is the panel. The file also exports `ProductPanel`, which lays out the original's panel (name with icon and badge, headline, paragraph, Learn more link, media); use it or pass your own.",
      "The component is the tabs, arrows and card. In the original it sits in the hero under the main heading and sign-up buttons, on a blue-to-violet gradient, so the light resting tabs and arrows read against it. On a light background, pass darker `iconColor` and `cardColor` values or the resting tabs disappear.",
      "Original colours (fill / ring): Scheduling #6BB1FF / #4890E3, Callie #DBEE9F / #BAD855, Notetaker #B89FFA / #997EDF, Payments #5DDFD7 / #14C1B6; card #FCFBF8; text #071A31; body copy #5F6D77. Headline Calendly Sans 36px / 1.1, weight 500, -1px tracking.",
      "It is a Client Component (\"use client\"). State is the active index plus hover, focus, on-screen (IntersectionObserver) and reduced-motion flags for autoplay. Everything that moves is a CSS transition.",
    ],
  },
  {
    slug: "vertical-tab-slider",
    title: "Vertical tab slider",
    description:
      "Hovering a list of service titles slides a tall photo card to match, steps the title forward on a leader line and glows the card's colours behind it, used on eight25 website",
    category: "animations",
    group: "tabs",
    level: "section",
    source: "https://cntfl-eight25corporate-e25qa.vercel.app/",
    componentName: "VerticalTabSlider",
    files: [
      {
        name: "vertical-tab-slider.tsx",
        path: "src/registry/animations/tabs/vertical-tab-slider.tsx",
      },
    ],
    usageProps: ["items={services}"],
    usageChildren: "<h2>{headline}</h2>",
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A services list that drives a photo card: running the pointer down the titles slides a 400×520 card window up or down to that service's card, and the hovered title steps forward with a hairline running into it from behind the card, so the list and the card read as one control. The card's own photo glows, blurred, behind the column.",
      trigger:
        "Desktop (container ≥ 960px): hovering a title with a mouse selects it (`pointerenter`, `pointerType === \"mouse\"` only, so a tap or a pen hovering doesn't select). Click selects too, as the fallback. Keyboard: Enter/Space select; focus alone doesn't (tabbing through doesn't drag the track), but a focused title shows at full opacity. Narrow: swiping the card carousel; the card nearest the scroller's centre becomes active.",
      states: [
        "Card track: a column of 520px cards with 10px gaps inside a 400×520 `overflow: hidden` window. Active card n → `translateY(-n × 530px)`.",
        "Active title: `opacity: 1` and `translateX(-{tabShift}px)`. The others: `opacity: {inactiveOpacity}`.",
        "Leader rule: a 1px line, 729px long, ending at the active title's left edge at its vertical centre, `linear-gradient(to right, currentColor 85%, transparent)`, opacity 0 → 1. It belongs to each title (so it follows a title that wraps) and paints behind the card.",
        "{glow|true=Glow: every card's photo stacked in one box (938×1024 desktop, 518×565 narrow), mirrored horizontally, `blur(75px)` (41px narrow) with a 403px corner radius, centred on the card column; only the active one is at opacity 1, so the colours dissolve between cards. The box is at `opacity: 0.4`.|*=No glow.}",
        "Section: {background} background with {color} text. The titles and leader rule inherit the colour; the card copy is always white on its dark scrim.",
        "Narrow (< 960px): the same cards as a horizontal scroll-snap carousel (300px wide; the active card is 420px tall, the others 400px), with a 5px progress bar filled to (active + 1) / count and an `n / total` counter. No tab column.",
        "Plus link: a white disc with a purple plus; on hover of the disc itself a violet disc wipes in from the bottom-left corner (`clip-path: circle(0% at 0% 100%)` → `circle(150% at 0% 100%)`).",
      ],
      timing: [
        "Card track: {slideDuration}ms `{slideEase}` on `transform`.",
        "Title step and opacity, leader rule: {stepDuration}ms `{stepEase}`.",
        "Narrow card height (400 ↔ 420): {stepDuration}ms `{stepEase}`.",
        "Narrow progress fill: {stepDuration}ms `{progressEase}` on `width`.",
        "{glow|true=Glow crossfade: {fadeDuration}ms `{fadeEase}`.|*=}",
        "Plus wipe: {stepDuration}ms `{stepEase}`.",
      ],
      interruption:
        "Everything is a CSS transition on state, so running the pointer quickly down the list retargets the track from wherever it is, with no queue.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, keep the selection (it's how the card is chosen) but make the track move, title step and crossfades instant, and skip the plus wipe.",
      rules: [
        "Translate the `<ul>` inside the window with a CSS custom property set from state; don't scroll it.",
        "On narrow screens use a native `scroll-snap` carousel so touch keeps the browser's own inertia, and read the active card back out of the scroll position (the slide whose centre is nearest the scroller's centre) rather than driving it.",
        "Stack the glow images and crossfade them on opacity rather than swapping one `src`, so a change is a dissolve, not a pop while bytes load. At 75px of blur a small image is enough.",
        "Lift the card window above the tab column (`z-index`) so the leader rule passes behind the card.",
      ],
      checks: [
        "Run the pointer down the titles: the card window slides to each card in {slideDuration}ms, the hovered title steps {tabShift}px left at full opacity with the line running into it from behind the card, and the others dim to {inactiveOpacity}.",
        "Tap a title on a touch screen: it selects only on the tap, not on touch-down.",
        "Tab through the titles with the keyboard: focus shows on each without moving the card; Enter selects.",
        "Narrow the container below 960px: the cards become a swipe carousel with the progress bar and counter, and the counter follows the swipe.",
      ],
    },
    controls: [
      { type: "number", name: "slideDuration", label: "Card slide", default: 500, min: 0, max: 1200, step: 50, unit: "ms" },
      { type: "select", name: "slideEase", label: "Slide easing", default: easings.out, options: easingOptions },
      { type: "number", name: "fadeDuration", label: "Glow fade", default: 700, min: 0, max: 1500, step: 10, unit: "ms" },
      { type: "select", name: "fadeEase", label: "Fade easing", default: easings.out, options: easingOptions },
      { type: "number", name: "stepDuration", label: "Tab step", default: 300, min: 0, max: 800, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "stepEase", label: "Tab step easing", default: easings.out, options: easingOptions, secondary: true },
      { type: "select", name: "progressEase", label: "Progress easing", default: "cubic-bezier(0.4, 0, 0.2, 1)", options: easingOptions, secondary: true },
      { type: "number", name: "tabShift", label: "Active tab step", default: 40, min: 0, max: 80, step: 2, unit: "px" },
      { type: "number", name: "inactiveOpacity", label: "Inactive tabs", default: 0.4, min: 0.1, max: 1, step: 0.05 },
      { type: "boolean", name: "glow", label: "Photo glow", default: true },
      { type: "color", name: "background", label: "Background", default: "#290044" },
      { type: "color", name: "color", label: "Text", default: "#FFFFFF" },
    ],
    assets: [
      {
        prop: "items[].image",
        label: "Card photo",
        fit: "Fills the card behind the copy, object-cover",
        placeholder: "1200x800",
        notes: "Use the raw photo: the component lays its own scrim over it, and a photo with a scrim baked in comes out about 40% too dark.",
      },
    ],
    promptNotes: [
      "`items` is an array of `{ title, description?, image, imageAlt?, href?, linkLabel? }`, one per card and tab. `title` is the tab label and the small title at the top of the card; `description` is the large copy at the bottom (clamped to 5 lines); `href` adds the plus link (no href, no plus, but the slot is kept so copy wraps the same on every card).",
      "Use the raw photo for `image`: the component lays the original's scrim over it (a corner shade, a shade up from the bottom left and a flat 20% black) so white copy reads on any photo. An image with the scrim already baked in comes out about 40% too dark.",
      "`children` render above the card row (headline, intro copy, a CTA) and inherit the section's text colour. The original has an 80px headline, then copy indented to the tab column's left edge (550px).",
      "The original fades the whole page to this dark plate as the section scrolls in (it sets `data-plate=\"dark\"` on <html>). This component leaves that out and just uses the plate's colours, since the hover is the effect it's for.",
      "Layout: from a 960px-wide container the row is the 400px card window and a 730px tab column with at least 150px between them; the card is 520px tall in a 445px row, overflowing 37.5px above and below. It's a container query, so it follows the section's width, not the viewport (the original switches at the 1200px viewport).",
      "The original also draws 39 white bars under `mix-blend-overlay` and two blurred curve shapes behind the card column (decoration, not part of this component; the demo has a simple stand-in).",
      "Original typography: tabs in Landour Text (licensed) 34px / 110%, -1px tracking; card title Instrument Sans bold 14px / 160% (18px narrow); card copy Instrument Sans 24px / 140% (18px narrow). The demo uses Hanken Grotesk for the tabs as the closest Google Font, and Instrument Sans (a Google Font) for the cards.",
      "It's a Client Component (\"use client\"); no dependencies. The demo photos are from the eight25 site.",
    ],
  },
  {
    slug: "progress-tabs",
    title: "Progress tabs",
    description:
      "Autoplaying tabs where a fill sweeps across the active tab as its time runs out, then the media panel slides to the next one, used on Seemplicity website",
    category: "animations",
    group: "tabs",
    level: "section",
    source: "https://seemplicity.ai/",
    recreated: "WordPress",
    componentName: "ProgressTabs",
    files: [
      {
        name: "progress-tabs.tsx",
        path: "src/registry/animations/tabs/progress-tabs.tsx",
      },
    ],
    usageProps: [
      "items={steps.map((step) => ({\n    label: step.label,\n    media: <img src={step.image} alt={step.imageAlt} className=\"object-cover\" />,\n    content: <YourStepText title={step.title} body={step.body} />,\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A set of tabs over a media panel that steps through itself: the active tab fills with a gradient and a lighter fill sweeps across it as its time runs out, then the panel slides to the next tab. It should feel like a calm guided tour the reader can take over at any time.",
      trigger:
        "{autoplay|true=Autoplay: each tab holds for {interval}ms while the component is at least 25% on screen and the browser tab is visible; it waits while keyboard focus is inside{pauseOnHover|true= or the pointer is over it|*=}. |*=}Clicking a tab, or arrow keys / Home / End on the tab list, switch tabs{autoplay|true= and restart the timer from zero (autoplay keeps going)|*=}.",
      states: [
        "Active tab: `linear-gradient(90deg, {accentFrom}, {accentTo})` background with white label; inactive tabs are plain with the label colour.",
        "{autoplay|true={progress|true=Progress fill on the active tab: `linear-gradient(90deg, transparent, {accentTo})` at 50% opacity, `scaleX(0 → 1)` from the left.|*=No visible progress fill; a hidden timer runs instead.}|*=}",
        "Panels: one flex track with a 10px gap, moved by whole panels with `translateX`.{autoplay|true= After the last tab it slides back to the first.|*=}",
      ],
      timing: [
        "{autoplay|true={progress|true=Fill: {interval}ms, `{fillEase}`. It completes exactly as the tab changes.|*=Timer: {interval}ms.}|*=}",
        "Panel slide: {duration}ms, `{ease}`.",
        "Active tab background and label colour: {tabDuration}ms `{tabEase}`.",
        "{autoplay|true={pauseButton|true=Pause button hover dim (to 80%): {hoverDuration}ms `{tabEase}`.|*=}|*=}",
      ],
      interruption:
        "Clicking a tab mid-slide retargets the panel from where it is.{autoplay|true= Pausing (focus, off-screen, hidden tab{pauseOnHover|true=, hover|*=}{pauseButton|true=, or the pause button|*=}) freezes the timer where it is and resumes it from there; the fill is the timer, so it can't drift.|*=}",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, there's no autoplay and no progress fill, and panels switch instantly. Tabs still work.",
      responsive:
        "Media box height steps 300px, 400px (768px+), 500px (992px+) and {mediaHeight}px (1200px+). Below 640px the tab row becomes a horizontal scroll that keeps the active tab centred.",
      rules: [
        "Make the fill's CSS animation the timer: advance on its `animationend`, so pausing the animation (`animation-play-state`) pauses autoplay exactly.",
        "Use the WAI-ARIA tabs pattern (tablist / tab / tabpanel, roving tabindex) and make inactive panels `inert`.",
        "{autoplay|true={pauseButton|true=Keep the pause / play button at the end of the tab bar while autoplay is on (WCAG 2.2.2).|*=}|*=}",
      ],
      checks: [
        "{autoplay|true=Wait: the active tab's fill sweeps across over {interval}ms, then the panel slides to the next tab over {duration}ms. After the last tab it slides back to the first.|*=Nothing moves until you pick a tab.}",
        "Click a different tab mid-fill: the panel slides there{autoplay|true= and its fill starts from zero|*=}.",
        "{autoplay|true=Scroll the component mostly off screen, or switch browser tabs: the fill stops and resumes where it was.|*=}",
        "Use the arrow keys on the tab list: focus and the panel move together.",
        "Turn on reduced motion: no autoplay or fill, panels switch instantly.",
      ],
    },
    controls: [
      { type: "boolean", name: "autoplay", label: "Autoplay", default: true },
      { type: "number", name: "interval", label: "Interval", default: 4500, min: 1500, max: 10000, step: 100, unit: "ms" },
      { type: "number", name: "duration", label: "Slide", default: 700, min: 0, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "ease", label: "Slide easing", default: easings.inOut, options: easingOptions },
      { type: "select", name: "fillEase", label: "Fill easing", default: easings.linear, options: easingOptions },
      { type: "number", name: "tabDuration", label: "Tab fade", default: 300, min: 0, max: 800, step: 10, unit: "ms", secondary: true },
      { type: "number", name: "hoverDuration", label: "Button hover", default: 200, min: 0, max: 600, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "tabEase", label: "Tab easing", default: easings.out, options: easingOptions, secondary: true },
      { type: "boolean", name: "progress", label: "Progress fill", default: true },
      { type: "boolean", name: "pauseOnHover", label: "Pause on hover", default: false },
      { type: "boolean", name: "pauseButton", label: "Pause button", default: true },
      { type: "number", name: "mediaHeight", label: "Media height", default: 560, min: 320, max: 720, step: 10, unit: "px" },
      { type: "number", name: "radius", label: "Radius", default: 20, min: 0, max: 40, step: 1, unit: "px" },
      { type: "color", name: "accentFrom", label: "Accent from", default: "#410051" },
      { type: "color", name: "accentTo", label: "Accent to", default: "#E3308C" },
      { type: "color", name: "labelColor", label: "Label", default: "#410051" },
      { type: "color", name: "trayTint", label: "Tab bar tint", default: "#A309BB" },
    ],
    assets: [
      {
        prop: "items[].media",
        label: "Tab media",
        fit: "Fills the rounded media box: full width, 300px tall (400px from 768px, 500px from 992px, `mediaHeight` from 1200px). object-cover; an image or a video",
        placeholder: "2000x1120",
      },
    ],
    promptNotes: [
      "`items` is an array of `{ label, media, content }`. `label` is the tab text (the original uses `/context`, `/strategy`, ...). `media` fills the rounded media box and is sized to it (an image with `object-cover`, or a video). `content` is optional and renders under the box (title, copy, CTA), styled with the site's typography.",
      "The section heading and intro above the tabs are not part of this component - render them separately in the section.",
      "`mediaBackground` (any CSS `background` value) shows behind the media; the original uses a purple background image behind a product screenshot. Media box height steps 300 / 400 (768px) / 500 (992px) / `mediaHeight` (1200px, default 560), as in the original.",
      "The original Swiper setup holds each tab for 4500ms, then slides panels 600ms `ease` with a 10px gap (the defaults here slide slower, 700ms on a strong ease-in-out), rewinding to the first tab after the last. The active tab gets a `linear-gradient(90deg, #410051, #E3308C)` background, and a `linear-gradient(90deg, transparent, #E3308C)` fill at 50% opacity sweeps across it linearly. Keep these unless asked. One deliberate change: the original sweep runs 5000ms and gets cut off at 90%; here it runs exactly `interval`, so it completes as the tab changes.",
      "Tab labels default to `font-mono text-sm lowercase`; the original uses Space Mono 14px (a Google Font). Pass `tabClassName` to set the site's mono font. The original's panel title uses Cabinet Grotesk (licensed); use the site's display font or a close Google Font such as Bricolage Grotesque.",
      "The progress fill's CSS animation is the timer: its `animationend` advances the tab, so pausing the animation pauses autoplay exactly. Autoplay waits while the component is less than 25% on screen or the browser tab is hidden. Clicking a tab restarts the timer from zero (autoplay keeps going, like the original).",
      "Accessibility: WAI-ARIA tabs (role tablist/tab/tabpanel, roving tabindex, arrow keys, Home, End); inactive panels are `inert`. Give images real alt text. For WCAG 2.2.2, a 45px pause / play button sits at the end of the tab bar while autoplay is on (`pauseButton`, default true; keep it unless the site has another way to stop the motion), and autoplay also holds while keyboard focus is inside the component.",
      "Below 640px the tab row becomes a horizontal scroll that keeps the active tab centred (the original switches to a stacked, sticky scroll-spy layout there, which is a separate pattern).",
      "It is a Client Component (\"use client\"). Only the active tab is state; the fill and slide are CSS. Reduced motion: no autoplay or fill, and panels switch instantly.",
    ],
  },
  {
    slug: "scroll-progress-tabs",
    added: "2026-11-17",
    title: "Scroll progress tabs",
    description:
      "A canvas pins and zooms out, tabs drop in over its top edge, and scrolling fills each tab in turn while the canvas swaps to its content, used on Miro website",
    category: "animations",
    group: "tabs",
    level: "section",
    source: "https://miro.com/intelligent-canvas/",
    componentName: "ScrollProgressTabs",
    files: [
      {
        name: "scroll-progress-tabs.tsx",
        path: "src/registry/animations/tabs/scroll-progress-tabs.tsx",
      },
    ],
    motionNote:
      "Scroll-linked: the zoom and the tab fill follow the scroll position, so they have no duration or easing. Step length and intro length set how much scroll each takes.",
    usageProps: [
      "items={useCases.map((useCase) => ({\n    label: useCase.label,\n    content: <img src={useCase.image} alt={useCase.imageAlt} className=\"object-cover\" />,\n  }))}",
    ],
    themeToggle: false,
    defaultTheme: "light",
    fullBleed: true,
    motion: {
      intent:
        "A product canvas that the reader scrolls through like a guided tour. The section pins, the canvas zooms out to its resting size, and a row of tabs drops in over its top edge. Each further stretch of scroll fills the active tab from left to right, like a progress bar; when it's full, the next tab takes over and the canvas swaps to that use case. It should feel calm and in the reader's hands: nothing plays on its own, everything follows the scroll.",
      trigger:
        "Scroll position. The stage is `position: sticky; top: {stickyTop}px` and as tall as the viewport minus {stickyTop}px. Clicking a tab, or arrow keys / Home / End on the tab list, smooth-scrolls the page to the start of that tab's step.",
      states: [
        "The section is as tall as the stage{intro|true= + {introLength} × viewport height (the intro)|*=} + {stepLength} × viewport height per tab. That extra height is how long it stays pinned; the last tab fills just as it unpins.",
        "{intro|true=Intro: the canvas goes `scale({introScale}) → scale(1)` (transform-origin centre top), linear with the scroll across the intro. The tab bar is hidden (opacity 0, {rise}px above its place, `inert`) until the zoom lands, and hides again if you scroll back into the intro.|*=No intro: the tab bar is shown from the start and the canvas never scales.}",
        "Steps: `step = (scrolled past the intro) / step length`. Its whole part is the active tab; its fraction is the fill.",
        "Tabs: white pills (12px radius, 3px white border, soft shadow). A layer in the fill colour ({fillColor}) sits behind each label: clipped with `clip-path: inset(0 calc((1 - fill) * 100%) 0 0)` on the active tab, fully shown on passed tabs, hidden on upcoming ones.",
        "Canvas: a glass frame (24px radius, 10px padding, white gradient, 1px white border, blur 8px) around a {ratio}-ratio screen (16px radius, {screenColor}{dots|true= with an 18px dot grid|*=}). Panels are stacked in one cell; only the active one is visible.",
      ],
      timing: [
        "Zoom and fill: no duration, they follow the scroll 1:1 (linear, no easing curve).",
        "Tab bar entrance: opacity {fadeDuration}ms and the {rise}px drop {riseDuration}ms, both `{ease}`. The same transitions run in reverse when it hides.",
        "Panel swap: the outgoing and incoming panels crossfade over {panelDuration}ms `{ease}`.",
        "Tab hover: the shadow deepens over {hoverDuration}ms `{ease}`.",
      ],
      interruption:
        "Everything follows the current scroll position, so reversing direction runs it backwards (fills empty, earlier tabs return, the zoom reverses). The panel crossfade and tab bar entrance are CSS transitions, so a change mid-fade retargets from the current opacity. A click mid-scroll just starts a new smooth scroll to that tab's step.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, nothing pins or zooms and the tab bar is always shown. The tabs are ordinary click tabs: the active one is fully filled and panels swap instantly.",
      responsive:
        "The canvas is as wide as {canvasWidth}px allows, shrinking to fit both the stage width (16px side padding) and the stage height (80px top padding so the tab bar, which sits half above the canvas, is never cut off; 40px bottom), so the whole canvas and tabs are visible while pinned. When the tabs don't fit the canvas width, the row scrolls sideways (scrollbar hidden) and keeps the active tab centred; below 640px tabs get 12px × 8px padding and 14px labels.",
      rules: [
        "Pin with `position: sticky` and scale with `transform` only. Fill with `clip-path` on a layer behind the label, not by animating width.",
        "Measure the viewport (or the scroll container's height) with a ResizeObserver and set the section height in px from it.",
        "Read scroll in a passive listener, once per animation frame, and write the scale and a `--fill` custom property straight to the DOM. Only set React state when the active tab changes or the tab bar shows or hides.",
        "Use the WAI-ARIA tabs pattern (tablist / tab / tabpanel, roving tabindex); inactive panels are `inert`, and the tab bar is `inert` while hidden.",
        "Don't put it inside an ancestor with `overflow: hidden`; that breaks sticky. The stage itself clips the zoomed canvas.",
      ],
      checks: [
        "Scroll into the section: it pins {stickyTop}px from the top{intro|true= and the canvas shrinks from {introScale}× to its resting size; the tabs fade in and drop {rise}px into place as the zoom lands|*=}.",
        "Keep scrolling: the first tab fills from left to right with the scroll; stop and the fill stops with you.",
        "As the fill completes, the next tab starts filling, the previous one stays full, and the canvas crossfades to the next panel over {panelDuration}ms.",
        "Scroll back up: fills empty, earlier panels return{intro|true=, and the tabs hide again once you're back in the zoom|*=}.",
        "Click the last tab: the page smooth-scrolls to its step and every earlier tab shows full.",
        "Turn on reduced motion: no pin and no zoom; clicking tabs swaps panels instantly.",
      ],
    },
    controls: [
      { type: "number", name: "stepLength", label: "Step length", default: 0.5, min: 0.2, max: 1.5, step: 0.05, unit: "× vh", motion: true },
      { type: "boolean", name: "intro", label: "Zoom intro", default: true },
      { type: "number", name: "introLength", label: "Intro length", default: 1.1, min: 0.3, max: 2, step: 0.05, unit: "× vh", motion: true },
      { type: "number", name: "introScale", label: "Intro scale", default: 1.28, min: 1, max: 1.6, step: 0.01, unit: "×", motion: true },
      { type: "number", name: "fadeDuration", label: "Tabs fade", default: 280, min: 0, max: 800, step: 10, unit: "ms" },
      { type: "number", name: "riseDuration", label: "Tabs drop", default: 360, min: 0, max: 800, step: 10, unit: "ms" },
      { type: "number", name: "rise", label: "Tabs drop distance", default: 28, min: 0, max: 60, step: 1, unit: "px" },
      { type: "number", name: "panelDuration", label: "Panel crossfade", default: 400, min: 0, max: 1000, step: 10, unit: "ms" },
      { type: "number", name: "hoverDuration", label: "Tab hover", default: 160, min: 0, max: 400, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "ease", label: "Easing", default: easings.expo, options: easingOptions },
      { type: "number", name: "stickyTop", label: "Sticky top", default: 0, min: 0, max: 160, step: 4, unit: "px" },
      { type: "number", name: "canvasWidth", label: "Canvas width", default: 1030, min: 600, max: 1320, step: 10, unit: "px" },
      { type: "boolean", name: "dots", label: "Dot grid", default: true },
      { type: "color", name: "screenColor", label: "Screen", default: "#F4F4F1" },
      { type: "color", name: "fillColor", label: "Tab fill", default: "#F4F4F1" },
      { type: "color", name: "labelColor", label: "Label", default: "#191812" },
    ],
    assets: [
      {
        prop: "items[].content",
        label: "Use case screen",
        fit: "Fills the canvas screen (850 / 560 by default, `ratio`), object-cover; an image, a video or a live board",
        placeholder: "1700x1120",
        notes: "Product UI on a light canvas, as in the original. Keep the edges quiet; the frame's 16px corners crop them.",
      },
    ],
    promptNotes: [
      "`items` is an array of `{ label, content }`. `label` is the tab text; `content` fills the canvas screen while that tab is active (a screenshot with `object-cover`, a video, or a live board). The screen keeps `ratio` (850 / 560 by default).",
      "The original's tabs are Roobert 16px / 20px weight 500 (licensed); Inter Tight is the closest Google Font. Pass the site's font through `tabClassName`. The section background in the original is a pale grid with soft pink, purple and yellow glows; it isn't part of this component.",
      "In the original, the hero headline sits above the canvas and the canvas starts bigger (about 1320px) and scales to 0.78; here the canvas rests at its real size and starts at `introScale` (1.28 ≈ 1 / 0.78), which is the same motion. Set `intro={false}` to drop the zoom and start straight on the tabs.",
      "`stickyTop` should be the fixed header's height so the stage pins below it.",
      "It is a Client Component (\"use client\"): it needs a scroll listener and a ResizeObserver. React only re-renders when the active tab changes; the zoom and fill are written straight to the DOM.",
      "Don't put the component inside an ancestor with `overflow: hidden` - that breaks position: sticky. An `overflow: auto` scroll container works.",
    ],
  },
  {
    slug: "accordion-tabs",
    title: "Accordion tabs",
    description:
      "A list of feature titles beside a media panel; the open one expands on a tinted card while a thin bar fills along its edge, then the next opens and the media fades over, used on PandaDoc website",
    category: "animations",
    group: "tabs",
    level: "section",
    source: "https://www.pandadoc.com/",
    componentName: "AccordionTabs",
    files: [
      {
        name: "accordion-tabs.tsx",
        path: "src/registry/animations/tabs/accordion-tabs.tsx",
      },
    ],
    usageProps: [
      "items={features.map((feature) => ({\n    title: feature.title,\n    body: feature.body,\n    links: feature.links,\n    media: <video src={feature.video} autoPlay muted loop playsInline className=\"object-cover\" />,\n  }))}",
    ],
    defaultTheme: "light",
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A vertical list of feature titles beside a large media panel that walks through itself: the open title expands on a tinted card to show its copy, a thin bar fills along the card's bottom edge, then it collapses as the next one opens and the media fades over. It should read as a calm, unhurried tour the reader can take over at any time.",
      trigger:
        "{autoplay|true=From 960px wide, each tab stays open for {interval}ms while at least 20% of the component is on screen and the browser tab is visible; it waits while keyboard focus is inside{pauseOnHover|true= or the pointer is over it|*=}. |*=}Clicking a title, or Arrow Up / Down, Home and End on the titles, opens that tab{autoplay|true= and restarts the timer from zero|*=}. Below 960px titles toggle like an accordion and nothing autoplays.",
      states: [
        "Open tab: background `{activeBackground}`, title in `{textColor}`; the panel opens from 0 to its natural height (grid rows `0fr → 1fr`) to show the copy at 70% and link chips. The copy is visible at full opacity the moment it opens and hidden the moment it closes (no opacity fade, as in the original).",
        "Closed tabs: title at 55% of `{textColor}`, turning `{hoverColor}` on hover. No background.",
        "{autoplay|true=Progress bar: a 2px track (10% of `{textColor}`) along the open card's bottom edge, with a `{textColor}` fill scaling `scaleX(0 → 1)` from the left.|*=}",
        "Media panel: one stacked panel per tab; the open tab's panel fades in from 0 to 1 over the previous one, which is hidden once covered.",
        "Link chips: white with a transparent 1px border; on hover the border and text turn `{textColor}`.",
      ],
      timing: [
        "{autoplay|true=Progress fill: {interval}ms, `{fillEase}`. The tab changes exactly when it completes.|*=}",
        "Panel open / close: {duration}ms from 960px ({duration*1/2}ms below), `{ease}`. The closing and opening tabs move together.",
        "Media fade: {fade}ms, `{fadeEase}`. The outgoing media hides instantly once the fade ends.",
        "Chip hover: {chipDuration}ms `{chipEase}` colour transition. Mobile chevron turn: {iconDuration}ms `{iconEase}`.",
      ],
      interruption:
        "Clicking another title mid-transition retargets both panels from where they are, and the new media fades in over whatever is showing.{autoplay|true= Pausing (focus, off-screen, hidden browser tab{pauseOnHover|true=, hover|*=}) freezes the fill where it is and resumes from there; the fill is the timer, so it can't drift.|*=}",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, there's no autoplay and no progress bar; panels open and media swaps instantly. Tabs still work.",
      responsive:
        "From 960px: titles take 31.25% of the width, a 3.125% gap, and the media 65.625%, sticky {stickyTop}px from the top at a {mediaAspect} aspect ratio. Below 960px it's a single-column accordion with dividers; each tab's media sits inside its panel, the open tab can be closed, and there's no autoplay or progress bar.",
      rules: [
        "Make the fill's CSS animation the timer: advance on its `animationend`, so pausing it with `animation-play-state` pauses autoplay exactly. Animate `transform: scaleX`, not width.",
        "Open panels with a grid `grid-template-rows: 0fr → 1fr` transition, so nothing has to be measured.",
        "Stack the media panels in one grid cell. Fade the incoming one in on top and hide the outgoing one only after the fade (transition-delay), so the background never flashes through.",
        "Make closed panels `inert` and give each title `aria-expanded` / `aria-controls`.",
      ],
      checks: [
        "{autoplay|true=Wait at 960px or wider: the bar fills over {interval}ms, then the tab collapses as the next opens over {duration}ms and its media fades in over {fade}ms. After the last tab it goes back to the first.|*=Nothing moves until you pick a title.}",
        "Click another title mid-fill: it opens, the media fades over{autoplay|true=, and the bar starts from zero|*=}.",
        "{autoplay|true=Scroll the component mostly off screen, or switch browser tabs: the bar stops and resumes where it was.|*=}",
        "Narrow the window below 960px: titles stack with dividers, each tab shows its media inside, the open one closes when tapped, and nothing autoplays.",
        "Turn on reduced motion: no autoplay or bar, panels and media switch instantly.",
      ],
    },
    controls: [
      { type: "boolean", name: "autoplay", label: "Autoplay", default: true },
      { type: "number", name: "interval", label: "Interval", default: 12000, min: 3000, max: 20000, step: 500, unit: "ms" },
      { type: "number", name: "duration", label: "Expand", default: 400, min: 0, max: 1000, step: 10, unit: "ms" },
      { type: "select", name: "ease", label: "Expand easing", default: easings.inOut, options: easingOptions },
      { type: "number", name: "fade", label: "Media fade", default: 600, min: 0, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "fadeEase", label: "Fade easing", default: "cubic-bezier(0.25, 1, 0.5, 1)", options: easingOptions },
      { type: "select", name: "fillEase", label: "Fill easing", default: easings.linear, options: easingOptions },
      { type: "number", name: "iconDuration", label: "Chevron turn", default: 300, min: 0, max: 800, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "iconEase", label: "Chevron easing", default: easings.out, options: easingOptions, secondary: true },
      { type: "number", name: "chipDuration", label: "Chip hover", default: 150, min: 0, max: 600, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "chipEase", label: "Chip easing", default: "cubic-bezier(0.4, 0, 0.2, 1)", options: easingOptions, secondary: true },
      { type: "boolean", name: "pauseOnHover", label: "Pause on hover", default: false },
      { type: "number", name: "radius", label: "Radius", default: 12, min: 0, max: 32, step: 1, unit: "px" },
      { type: "color", name: "activeBackground", label: "Open tab", default: "#F8F5F3" },
      { type: "color", name: "textColor", label: "Text", default: "#242424" },
      { type: "color", name: "hoverColor", label: "Hover", default: "#248567" },
    ],
    assets: [
      {
        prop: "items[].media",
        label: "Tab media",
        fit: "Fills the media panel (aspect ratio `mediaAspect`, 1.52, from 960px), object-cover. A muted looping video or an image",
        placeholder: "1520x1000",
      },
    ],
    promptNotes: [
      "`items` is an array of `{ title, body?, links?, media, mediaBackground? }`. `body` is the copy under the open title; `links` render as small chips (`{ label, href }`). `media` fills the media panel and is sized to it (a muted looping video or an image with `object-cover`). `mediaBackground` shows behind that tab's media (defaults to `mediaBackground`, #F8F5F3).",
      "The section heading, intro and CTA above the tabs are not part of this component - render them separately in the section.",
      "Ported from PandaDoc's BenefitsTabs (Next.js + Contentful). Values match it: 12000ms per tab, 400ms panel (200ms below 960px) on `cubic-bezier(0.3, 0.52, 0.49, 0.9)` (the default here is a strong ease-in-out instead), sand #F8F5F3 open card, #242424 text, #248567 hover, 2px progress bar, 31.25% / 65.625% columns, media sticky at 80px. Keep these unless asked.",
      "Two deliberate changes from the original: the progress fill is the timer (the original runs a separate setTimeout next to a `width` animation), and the media crossfades over 600ms. The original's Splide slider is configured to fade over 600ms, but its CSS sets `transition: none !important` on the slides, so the live site swaps media instantly; set `fade={0}` to match that.",
      "Titles default to `text-[20px] sm:text-[28px] font-bold`; the original uses Graphik (licensed) - use the site's font, or a close Google Font such as Inter. Pass `titleClassName` to change them.",
      "Accessibility: each title is a button with `aria-expanded` / `aria-controls`, Arrow Up / Down, Home and End move between titles (roving tabindex), and closed panels are `inert`. Autoplay holds while keyboard focus is inside, and clicking a title restarts the timer. For WCAG 2.2.2 (motion over 5s needs a way to stop it), consider `pauseOnHover` or turning `autoplay` off if the site has no other pause control.",
      "It is a Client Component (\"use client\"). It reads `(min-width: 960px)` with matchMedia, so on the server it renders the mobile accordion and switches to the two-column layout after hydration.",
    ],
  },
  {
    slug: "step-tabs",
    title: "Step tabs",
    description:
      "Pill tabs joined by dotted gradient lines; picking one crossfades the card below while its image slides in from the right, used on Seemplicity website",
    category: "animations",
    group: "tabs",
    level: "section",
    source: "https://seemplicity.ai/why/",
    recreated: "WordPress",
    componentName: "StepTabs",
    files: [
      {
        name: "step-tabs.tsx",
        path: "src/registry/animations/tabs/step-tabs.tsx",
      },
    ],
    usageProps: [
      "items={steps.map((step) => ({\n    label: step.label,\n    icon: <img src={step.icon} alt=\"\" />,\n    content: <YourStepText title={step.title} body={step.body} />,\n    media: <img src={step.image} alt={step.imageAlt} />,\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    motion: {
      intent:
        "A short sequence of steps (Collect, Contextualize, Close) as pill tabs joined by dotted lines. Picking a step swaps the card below with a soft crossfade while its product image glides in from the right, so each step feels like it arrives rather than blinks in.",
      trigger:
        "Clicking a pill, or arrow keys / Home / End on the tab list. Nothing moves on its own: there is no autoplay.",
      states: [
        "Active pill: `linear-gradient(90deg, {accentFrom}, {accentTo})` background, white label and icon, `0 5px 20px rgb(65 0 81 / 0.4)` shadow, no border. Inactive pills: white with a 1px `rgb(65 0 81 / 0.1)` border and {labelColor} label.",
        "Cards: all stacked in one grid cell; the active one is `opacity: 1`, the rest `opacity: 0`.",
        "Image inside each card: `translateX({slideOffset}%)` when inactive, `translateX(0)` when active, clipped by its rounded (10px) box. The outgoing image slides back out to {slideOffset}% while its card fades.",
      ],
      timing: [
        "Card crossfade: {fadeDuration}ms, `{fadeEase}`.",
        "Image slide: {slideDuration}ms, `{slideEase}`, both in and out.",
        "Pill gradient, border, shadow and label colour: {tabDuration}ms `{tabEase}`. An `img` icon whitens over {tabDuration}ms `{iconEase}`.",
      ],
      interruption:
        "Everything is CSS transitions on state, so clicking another pill mid-transition retargets each card and image from where it is. Nothing jumps.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the crossfade stays (opacity only) but the image doesn't slide; it sits in place.",
      responsive:
        "Below 768px the card stacks (copy above image), pills shrink (40px tall, 12px semibold label, 15px icon) with 30px connectors, and the pill row scrolls sideways, keeping the active pill centred. From 768px the card is two equal columns; from 992px it's 5fr / 7fr with 50px 88px 60px 60px copy padding.",
      rules: [
        "Animate only `opacity` (cards) and `transform` (images). Stack the cards in one grid cell so the section's height is the tallest card's and never changes on switch.",
        "Use the WAI-ARIA tabs pattern (tablist / tab / tabpanel, roving tabindex) and make inactive panels `inert`.",
      ],
      checks: [
        "Click the next pill: the card crossfades over {fadeDuration}ms and its image slides in from the right over {slideDuration}ms, decelerating into place.",
        "Click two pills quickly: nothing snaps; the images reverse from where they are.",
        "The section's height doesn't change between steps.",
        "Use the arrow keys on the tab list: focus and the card move together.",
        "Turn on reduced motion: the card still fades, the image doesn't move.",
      ],
    },
    controls: [
      { type: "number", name: "fadeDuration", label: "Crossfade", default: 600, min: 0, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "fadeEase", label: "Crossfade easing", default: easings.ease, options: easingOptions },
      { type: "number", name: "slideDuration", label: "Image slide", default: 700, min: 0, max: 1400, step: 10, unit: "ms" },
      { type: "select", name: "slideEase", label: "Slide easing", default: "cubic-bezier(0.33, 1, 0.68, 1)", options: easingOptions },
      { type: "number", name: "tabDuration", label: "Pill change", default: 300, min: 0, max: 800, step: 10, unit: "ms", secondary: true },
      { type: "select", name: "tabEase", label: "Pill easing", default: easings.out, options: easingOptions, secondary: true },
      { type: "select", name: "iconEase", label: "Icon easing", default: "cubic-bezier(0.4, 0, 0.2, 1)", options: easingOptions, secondary: true },
      { type: "number", name: "slideOffset", label: "Slide from", default: 80, min: 0, max: 100, step: 5, unit: "%" },
      { type: "boolean", name: "connectors", label: "Connectors", default: true },
      { type: "color", name: "accentFrom", label: "Accent from", default: "#410051" },
      { type: "color", name: "accentTo", label: "Accent to", default: "#E3308C" },
      { type: "color", name: "connectorFrom", label: "Line start", default: "#A309BB" },
      { type: "color", name: "labelColor", label: "Label", default: "#410051" },
    ],
    assets: [
      {
        prop: "items[].media",
        label: "Step image",
        fit: "Fills a 730 / 460 rounded box in the right column, object-cover",
        placeholder: "1460x920",
      },
      {
        prop: "items[].icon",
        label: "Pill icon",
        fit: "About 26px, before the pill label",
        placeholder: "52x52",
        notes: "An `img` is turned white on the active pill; an `svg` using `currentColor` follows the label colour.",
        optional: true,
      },
    ],
    promptNotes: [
      "`items` is an array of `{ label, icon?, content, media }`. `label` is the pill text; `icon` is a ~26px `img` or `svg` before it (an `img` turns white on the active pill via `brightness(0) invert(1)`; an `svg` using `currentColor` follows the label). `content` is the left column (heading + copy, styled with the site's typography); `media` is the right column, sized to a 730 / 460 rounded box with `object-cover`.",
      "The section heading, intro and any CTA below are not part of this component - render them around it. The original section background is #F5F5F5.",
      "Card: white, 1px #D9CCDC border, 20px radius, `0 10px 30px rgb(65 0 81 / 0.2)` shadow. The wrapper has 30px padding so the shadow isn't clipped. From 768px the image box pulls 23px left into the copy column's padding, as in the original.",
      "Connectors: a 1px line from #A309BB to #E3308C with a 6px dot at each end (the original is a 66 x 6 PNG); 72px wide from 768px, 30px below.",
      "Original typography: pills Mona Sans 16px bold (a Google Font); card heading Cabinet Grotesk (licensed) 300 weight, `clamp(30px, 24.06px + 1.52vw, 46px)`, -0.92px tracking, line-height 1.2, #410051; copy 18px / 1.6 #0B0623. The demo uses Bricolage Grotesque for the heading.",
      "Motion matches the original Swiper setup: `effect: fade` with `crossFade` at 600ms, and the image `translateX(80%) → 0` over 700ms `cubic-bezier(0.33, 1, 0.68, 1)`. Keep these unless asked. Deliberate changes: the pill gradient fades in over 300ms instead of switching instantly, and there's no swipe on the card (the pills and keys are the controls).",
      "It is a Client Component (\"use client\"). Only the active tab is state; every transition is CSS.",
    ],
  },
  {
    slug: "faq-accordion",
    title: "FAQ accordion",
    description:
      "Numbered question cards where opening one answer closes the other, with the chevron turning over as the answer slides open, used on NetApp AI website",
    category: "animations",
    group: "accordions",
    level: "section",
    source: "https://netapp.ai/platform/novus/",
    componentName: "FaqAccordion",
    defaultTheme: "light",
    files: [
      {
        name: "faq-accordion.tsx",
        path: "src/registry/animations/accordions/faq-accordion.tsx",
      },
    ],
    usageProps: ["items={faqs}", 'heading="Frequently asked questions"'],
    motion: {
      intent:
        "An FAQ list of rounded, numbered question cards. {collapsible|true=One answer is open at a time, and clicking the open card closes it.|*=One answer is always open: opening a card closes the one that was open, and clicking the open card does nothing.} The answer slides open to its own height while the chevron turns over, on one shared duration and curve, so it feels smooth and unhurried.",
      trigger:
        "Click anywhere on a closed card (the card's header row is a <button> and a closed card is all header), or Tab to it and press Enter or Space.",
      states: [
        "Answer: collapsed (`grid-template-rows: 0fr`) → open to its natural height (`1fr`). The 20px above and below the answer sit inside the collapsing box, so they open and close with it.",
        "Chevron (22px, pointing down): `rotate(0)` → `rotate(180deg)` when its card is open.",
        "The card that was open closes at the same moment, with the same motion in reverse.",
        "Nothing fades; the answer is clipped by its row as it opens.",
      ],
      timing: [
        "Duration: {duration}ms for the answer and the chevron.",
        "Easing: `{easing}` for both.",
        "Opening one card and closing the other start together.",
      ],
      interruption:
        "Use CSS transitions. Clicking another card mid-way reverses the half-open one from wherever it is, with no jump.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, remove the transitions: answers open and close instantly and the chevron flips instantly.",
      rules: [
        "Animate `grid-template-rows` from `0fr` to `1fr` on a wrapper whose only child has `overflow: hidden`. Don't measure heights in JS or guess a `max-height`.",
        "Put the answer's padding inside the collapsing child, not on the grid, or a closed card stays padded open.",
        "Mark a closed answer `inert` so links inside it can't be tabbed to.",
        "The header button gets `aria-expanded` and `aria-controls` pointing at the answer. Don't give each answer `role=\"region\"`: with many rows, every answer would become a page landmark.",
        "Rotate the chevron with `transform`.",
      ],
      checks: [
        "Click a closed card: its answer opens over {duration}ms as the open one closes, and both chevrons turn over.",
        "{collapsible|true=Click the open card: it closes, leaving none open.|*=Click the open card: nothing happens.}",
        "Click a second card while the first is still opening: it reverses smoothly.",
        "Tab through: focus lands on each card's header with a visible outline, never on links inside a closed answer; Enter and Space toggle.",
        "Turn on reduced motion: cards open and close instantly.",
      ],
    },
    controls: [
      { type: "text", name: "heading", label: "Heading", default: "Frequently asked questions" },
      { type: "number", name: "duration", label: "Duration", default: 400, min: 100, max: 1200, step: 10, unit: "ms" },
      { type: "select", name: "easing", label: "Easing", default: easings.drawer, options: easingOptions },
      { type: "boolean", name: "collapsible", label: "Allow all closed", default: false },
      { type: "boolean", name: "numbered", label: "Step numbers", default: true },
      { type: "color", name: "cardColor", label: "Card color", default: "#F6F5F7" },
    ],
    promptNotes: [
      "`items` is an array of `{ question, answer }`; both are ReactNodes, so the answer can hold paragraphs (spaced 1.6em apart) and links.",
      "`heading` is optional. With it, the heading sits in a left column beside the cards once the component is at least 960px wide (the cards take 62.1%), and stacks above them below that. Without it, the component is just the cards.",
      "Other props: `defaultOpen` (index, default 0), `easing`, `textColor`, `answerColor`, `numberColor`. The step numbers only show once the card list is at least 600px wide, as in the original's desktop-only numbers.",
      "Layout: 20px corner cards on #F6F5F7, 10px apart, 25px side padding and 20px top and bottom; number column 42px; questions 28px / 1.1 (18px narrow), answers 16px / 1.6 #333 (14px narrow).",
      "Original typography: F37 Judge (licensed), questions weight 300, heading 60px. The component inherits the site's font; the demo uses Inter Tight as the closest Google Font.",
    ],
  },
  {
    slug: "aurora",
    title: "Aurora",
    description:
      "Soft, flowing light seen through vertical fluted glass, a WebGL shader background",
    category: "shaders",
    group: "backgrounds",
    level: "atom",
    componentName: "Aurora",
    motionNote: "A continuous shader loop: it has no duration or easing. Speed sets its pace.",
    files: [
      {
        name: "aurora.tsx",
        path: "src/registry/shaders/backgrounds/aurora.tsx",
      },
    ],
    themeToggle: false,
    fullBleed: true,
    usageProps: ['className="absolute inset-0 -z-10"'],
    motion: {
      implementation: "required",
      intent:
        "A full-bleed animated background for a hero or feature section: soft, flowing light seen through vertical fluted glass. Bands of colour slowly warp and drift behind {stripeCount} vertical stripes that refract them, with a faint colour fringe. It should feel ambient and slow, something you notice rather than something that pulls focus from the content.",
      trigger: shader.trigger,
      states: [
        "Colour: a gradient ramp from the light colour through the mid colour to the dark colour, wrapped around the centre so the colour radiates out from the middle of the section.",
        "Motion: the colour field warps with a liquid distortion that evolves over time (warp {warpAmplitude}, warp frequency {warpFrequency}). This is the only thing that moves.",
        "Glass: {stripeCount} vertical stripes, each refracting the colour beneath it (dispersion {stripeDispersion}), plus a chromatic aberration of {chromaticAberration} that grows towards the edges. The stripes stay still; the colour moves under them.",
      ],
      timing: shader.timing,
      interruption: shader.interruption,
      reducedMotion: shader.reducedMotion,
      responsive:
        "It fills its section at any size and re-renders on resize. Rendering resolution is capped at {maxPixelRatio}× device pixels; the effect is soft, so lower it for very large sections.",
      rules: [...shader.rules, "Keep the defaults (`AURORA_DEFAULTS`) for anything I haven't set."],
      checks: [
        "It animates continuously behind the section's content: slow, smooth warping colour under {stripeCount} vertical stripes, with no flicker.",
        "The section's text and buttons sit above it and stay readable.",
        ...shader.checks,
      ],
      apply: shader.apply,
    },
    controls: [
      { type: "color", name: "colorLight", label: "Light", default: "#96ABD7" },
      { type: "color", name: "colorMid", label: "Mid", default: "#5973C2" },
      { type: "color", name: "colorDark", label: "Dark", default: "#FFFFFF" },
      { type: "number", name: "speed", label: "Speed", default: 1, min: 0, max: 5, step: 0.1 },
      { type: "number", name: "warpAmplitude", label: "Warp", default: 0.222, min: 0, max: 0.4, step: 0.001 },
      { type: "number", name: "warpFrequency", label: "Warp frequency", default: 0.12, min: 0, max: 0.3, step: 0.001 },
      { type: "number", name: "stripeCount", label: "Stripes", default: 24, min: 2, max: 60, step: 1 },
      { type: "number", name: "stripeDispersion", label: "Dispersion", default: 0.31, min: 0, max: 1, step: 0.01 },
      { type: "number", name: "chromaticAberration", label: "Chromatic aberration", default: 0.006, min: 0, max: 0.02, step: 0.001 },
      { type: "number", name: "maxPixelRatio", label: "Max pixel ratio", default: 2, min: 0.5, max: 3, step: 0.5 },
      { type: "boolean", name: "paused", label: "Paused", default: false },
    ],
    promptNotes: [
      "It's a named export: `import { Aurora } from \"@/components/animations/aurora\"`.",
      "It renders a bare `<canvas>` (aria-hidden) that fills its parent.",
      "Raw WebGL2 with five passes (gradient → polar wrap → time-based liquify → chromatic aberration → vertical blinds). The gradient and polar passes are cached until the colours or size change.",
    ],
  },
  {
    slug: "curtain",
    title: "Curtain",
    description:
      "A deep-blue gradient with a curtain of slowly drifting, undulating layers that fades out toward the bottom, a WebGL shader background",
    category: "shaders",
    group: "backgrounds",
    level: "atom",
    componentName: "Curtain",
    motionNote: "A continuous shader loop: it has no duration or easing. Speed sets its overall pace; Flow and Wave set how the layers drift and undulate.",
    files: [
      {
        name: "curtain.tsx",
        path: "src/registry/shaders/backgrounds/curtain.tsx",
      },
    ],
    themeToggle: false,
    fullBleed: true,
    usageProps: ['className="absolute inset-0 -z-10"'],
    motion: {
      implementation: "required",
      intent:
        "A full-bleed animated background for a dark hero or section: a deep-blue gradient with a curtain of stacked, softly lit layers that drift slowly and undulate, fading out towards the bottom so the content below sits on solid colour. It should feel calm and premium, slow enough to read as texture.",
      trigger: shader.trigger,
      states: [
        "Backdrop: a vertical gradient from the top colour to the bottom colour. It starts at {gradientStart} of the section's height and reaches the bottom colour at {gradientEnd} (values above 1 are past the bottom edge).",
        "Layers: a curtain of stacked layer edges, lit from the light layer colour near the top to the dark layer colour near the bottom, overlay-blended on the backdrop at {intensity} opacity.",
        "Motion: the layers drift at {flow} layers per second{flow|0= (so they don't drift)|*=}; a negative value reverses the direction. A wave of {wave} layer widths travels along them{wave|0= (0 means rigid layers)|*=}. This is the only thing that moves.",
        "Fade: the layers fade out between {fadeStart} and {fadeEnd} of the section's height, leaving only the gradient at the bottom.",
      ],
      timing: shader.timing,
      interruption: shader.interruption,
      reducedMotion: shader.reducedMotion,
      responsive:
        "It fills its section at any size and re-renders on resize. Rendering resolution is capped at {maxPixelRatio}× device pixels; lower it for very large sections.",
      rules: [
        ...shader.rules,
        "Use light text on top: the background runs from deep blue to black.",
        "Keep the defaults (`CURTAIN_DEFAULTS`) for anything I haven't set.",
      ],
      checks: [
        "It animates continuously behind the section's content: layers drifting slowly and undulating, fading out towards the bottom, with no flicker or banding.",
        "The section's text and buttons sit above it and stay readable.",
        ...shader.checks,
      ],
      apply: shader.apply,
    },
    controls: [
      { type: "color", name: "colorTop", label: "Top", default: "#002F79" },
      { type: "color", name: "colorBottom", label: "Bottom", default: "#000000" },
      { type: "color", name: "layerLight", label: "Layer light", default: "#027EE1" },
      { type: "color", name: "layerDark", label: "Layer dark", default: "#051E74" },
      { type: "number", name: "speed", label: "Speed", default: 1, min: 0, max: 5, step: 0.1 },
      { type: "number", name: "flow", label: "Flow", default: 0.06, min: -0.3, max: 0.3, step: 0.01 },
      { type: "number", name: "wave", label: "Wave", default: 0.1, min: 0, max: 0.4, step: 0.01 },
      { type: "number", name: "intensity", label: "Intensity", default: 1, min: 0, max: 1, step: 0.05 },
      { type: "number", name: "fadeStart", label: "Fade start", default: 0.46, min: 0, max: 1, step: 0.01 },
      { type: "number", name: "fadeEnd", label: "Fade end", default: 1, min: 0, max: 1.5, step: 0.01 },
      { type: "number", name: "gradientStart", label: "Gradient start", default: 0.3, min: 0, max: 1, step: 0.01 },
      { type: "number", name: "gradientEnd", label: "Gradient end", default: 1.7, min: 0.5, max: 3, step: 0.01 },
      { type: "number", name: "maxPixelRatio", label: "Max pixel ratio", default: 1.5, min: 0.5, max: 3, step: 0.5 },
      { type: "boolean", name: "paused", label: "Paused", default: false },
    ],
    promptNotes: [
      "It's a named export: `import { Curtain } from \"@/components/animations/curtain\"`.",
      "It renders a bare `<canvas>` (aria-hidden) that fills its parent.",
      "Raw WebGL2, a single full-screen pass. The layer shapes come from a fitted field and per-layer shading measured from reference footage. For the fallback background, use a dark colour such as the top colour or black.",
    ],
  },
  {
    slug: "layer-cascade",
    title: "Layer cascade",
    description:
      "A static four-cornered shape you can drag into any quadrilateral, on a stack of layers in a cyan-to-violet gradient, with new layers sliding out from under it and sinking into black, a WebGL shader background",
    category: "shaders",
    group: "backgrounds",
    level: "atom",
    componentName: "LayerCascade",
    motionNote: "A continuous shader loop: it has no duration or easing. Speed sets its overall pace; Flow sets how fast layers sink down the stack.",
    files: [
      {
        name: "layer-cascade.tsx",
        path: "src/registry/shaders/backgrounds/layer-cascade.tsx",
      },
    ],
    themeToggle: false,
    fullBleed: true,
    usageProps: ['className="absolute inset-0 -z-10"'],
    motion: {
      implementation: "required",
      intent:
        "A full-bleed animated background for a dark hero or section: a static rounded four-cornered shape on top of a stack of layers of the same outline, each a little larger and darker than the one in front, fanning out to black at the edges. New layers keep sliding out from under the top shape and sinking down through the stack, so the stack feels like it's slowly unfolding outward while the top stays still. Calm and premium, slow enough to read as texture.",
      trigger: shader.trigger,
      states: [
        "Colour: one gradient across the frame, {colorTop} at the upper right, through {colorMid} in the middle, to {colorBottom} at the lower left. Each layer reveals it at its own brightness.",
        "Top shape: a quadrilateral with corners at {corners} (clockwise from the top left, as [x, y] fractions of the section's width and height; values just outside 0–1 push a corner past the edge), its corners rounded to {radius} of the section height. It never moves.",
        "Stack: {layers} layers behind it. Each one is the shape in front offset outward by {spread} of the section height (so the gaps stay even and the corners round off more), turned {twist}° further around the shape's centre, and keeps {falloff} of its brightness, so the back of the stack fades to the background colour {background}.",
        "Depth: each layer casts a soft shadow of strength {shadow} on the layer behind it, strongest right at its edge.",
        "Motion: the layers behind the top rectangle sink down the stack at {flow} layers per second. A new layer slides out from under the top shape (it starts exactly at its size, so nothing pops), then grows, turns and darkens as it recedes, and the deepest layer melts into the background. The loop is seamless. The top shape stays still.",
      ],
      timing: shader.timing,
      interruption: shader.interruption,
      reducedMotion: shader.reducedMotion,
      responsive:
        "It fills its section at any size and re-renders on resize. Rendering resolution is capped at {maxPixelRatio}× device pixels; lower it for very large sections.",
      rules: [
        ...shader.rules,
        "Use light text on top: the stack runs from bright cyan and violet in the middle to black at the edges.",
        "Keep the defaults (`LAYER_CASCADE_DEFAULTS`) for anything I haven't set.",
      ],
      checks: [
        "It animates continuously behind the section's content: the top shape stays still while new layers slide out from under it and sink down the stack, with no popping when a layer is added or removed, and crisp, antialiased edges.",
        "The section's text and buttons sit above it and stay readable.",
        ...shader.checks,
      ],
      apply: shader.apply,
    },
    controls: [
      { type: "color", name: "colorTop", label: "Top", default: "#00E5FF" },
      { type: "color", name: "colorMid", label: "Middle", default: "#5200FF" },
      { type: "color", name: "colorBottom", label: "Bottom", default: "#1C00A3" },
      { type: "color", name: "background", label: "Background", default: "#000000" },
      { type: "number", name: "speed", label: "Speed", default: 1, min: 0, max: 5, step: 0.1 },
      { type: "number", name: "flow", label: "Flow", default: 0.12, min: 0, max: 1, step: 0.01 },
      { type: "number", name: "layers", label: "Layers", default: 12, min: 2, max: 16, step: 1 },
      {
        type: "points",
        name: "corners",
        label: "Corners",
        default: "0.141,0.139 0.815,0.147 0.814,0.828 0.138,0.828",
        hint: "Drag the four corner handles in the preview to reshape the top layer.",
      },
      { type: "number", name: "radius", label: "Radius", default: 0.06, min: 0, max: 0.3, step: 0.01 },
      { type: "number", name: "spread", label: "Spread", default: 0.04, min: 0.005, max: 0.15, step: 0.005 },
      { type: "number", name: "twist", label: "Twist", default: 0, min: -10, max: 10, step: 0.5, unit: "°" },
      { type: "number", name: "falloff", label: "Falloff", default: 0.8, min: 0.3, max: 1, step: 0.01 },
      { type: "number", name: "shadow", label: "Shadow", default: 0.3, min: 0, max: 1, step: 0.05 },
      { type: "number", name: "maxPixelRatio", label: "Max pixel ratio", default: 1.5, min: 0.5, max: 3, step: 0.5 },
      { type: "boolean", name: "paused", label: "Paused", default: false },
    ],
    promptNotes: [
      "It's a named export: `import { LayerCascade } from \"@/components/animations/layer-cascade\"`.",
      "It renders a bare `<canvas>` (aria-hidden) that fills its parent.",
      "Raw WebGL2, a single full-screen pass. Every layer shares the top shape's outline. Its corners are fractions of the section, so it stretches with the section rather than cropping. For the fallback background, use a dark violet such as #1C00A3 or black.",
    ],
  },
  {
    slug: "ribbon-wave",
    title: "Ribbon wave",
    description:
      "A folded silk ribbon, rendered as a real 3D mesh that curls along its length and only breathes, on a transparent WebGL canvas, from Stripe's website",
    category: "shaders",
    group: "backgrounds",
    level: "atom",
    source: "https://stripe.com/",
    componentName: "RibbonWave",
    motionNote: "A continuous shader loop: it has no duration or easing. Speed sets its pace.",
    files: [
      {
        name: "ribbon-wave.tsx",
        path: "src/registry/shaders/backgrounds/ribbon-wave.tsx",
      },
    ],
    themeToggle: false,
    fullBleed: true,
    usageProps: ['className="pointer-events-none absolute inset-0 z-[1]"'],
    motion: {
      implementation: "required",
      intent:
        "A full-bleed background for a light hero: a sheet of silk folded in half, curling and corkscrewing along its length, sweeping across the section in soft painterly colour with fine fibre streaks and a sheen where it curls away. It holds its shape and only breathes, so slowly you notice it's alive rather than see it move.",
      trigger: shader.trigger,
      states: [
        "Geometry: a 400×400 plane subdivided 128×256, folded in half like paper: two layers a few units apart, joined by a tight half-cylinder. Built once on the CPU.",
        "Curl: three rotations in the vertex shader, each fading along the sheet with `expStep(x, n) = 2^(−2^n·x^n)`: {twistX} rad along the length (fade {twistPowerX}), {twistY} rad across (fade {twistPowerY}) and {twistZ} rad along the length (fade {twistPowerZ}). Because the angles fade, the sheet curls progressively, which is what makes it read as fabric.",
        "Placement: scaled ×{scale} (on a 9 × 8 × 5 base), rotated ({rotationX}°, {rotationY}°, {rotationZ}°), at ({positionX}, {positionY}) px for a 761px-tall section, scaling with the section height. Orthographic camera, no perspective; a depth buffer sorts the two layers.",
        "Colour: a soft painterly 2D palette (blurred blobs of {color1}, {color2}, {color3}, {color4} and {color5}, with a pale streak along the fold) sampled by position on the sheet, so colour changes along the ribbon as well as across it. Saturation {saturation}.",
        "Fibres: simplex noise very fine across the sheet (frequency 600) and long along it, faded towards the long edges and stronger on warm colours, strength ×{fibres}.",
        "Sheen: brightness from how stretched the surface is on screen (`dFdy(uv)` × {glow}), so curls and folds catch light without any lights. Film grain {grain}.",
        "Everywhere else the canvas is transparent.",
      ],
      timing: [
        "The only motion: the main curl wobbles ±0.1 rad and the sheet drifts by noise, advancing {speed} × 0.04 units per second (Stripe's pace). It reads as nearly still.",
        "Each frame advances time by at most 0.1s, so coming back to a background tab doesn't jump the shape.",
        "{paused|true=`paused` is on: it renders one still frame and the loop stays idle.|*=}",
      ],
      interruption: shader.interruption,
      reducedMotion: shader.reducedMotion,
      responsive:
        "Positions and sizes are in px at a 761px-tall section and scale with the section height, so the composition holds as the hero grows or shrinks. On phones, move it with `positionX` / `positionY` or shrink it with `scale` if it covers the copy. Rendering resolution is capped at {maxPixelRatio}× device pixels.",
      rules: [
        ...shader.rules,
        "Don't speed it up to make it livelier: the stillness is the point.",
        "It's transparent, so it doesn't replace the section's background colour: keep that on the section.",
        "Keep the defaults (`RIBBON_WAVE_DEFAULTS`) for anything I haven't set. The twist values are a set: change them together and check the shape.",
      ],
      checks: [
        "A folded ribbon curls across the section with soft, patchy colour, fine fibre streaks and a sheen on its curls, and the rest of the section stays its own background colour.",
        "Over 10 seconds it shifts only slightly. Its edges are clean, the two layers of the fold never poke through each other, and nothing shimmers.",
        ...shader.checks,
      ],
      apply: [
        "Add the component file below as written, then render it as the background of the section I name (the hero if I don't name one). Keep that section's content, layout and text as they are.",
        "The section gets `position: relative`, `overflow: hidden` and `isolation: isolate`. The component goes in as its first child with `className=\"pointer-events-none absolute inset-0 z-[1]\"`, and the content gets `position: relative; z-index: 2`. If the headline should blend through it, use the Blend-through headline, which slots its two copies around `z-index: 1`.",
        "The canvas is transparent, so the section keeps its own background colour (white in the original). That's also the fallback when WebGL2 is missing.",
      ],
    },
    controls: [
      { type: "color", name: "color1", label: "Pale light", default: "#C9DAFF" },
      { type: "color", name: "color2", label: "Violet", default: "#9A6BFF" },
      { type: "color", name: "color3", label: "Pink", default: "#FF78C8" },
      { type: "color", name: "color4", label: "Orange", default: "#FF9F1A" },
      { type: "color", name: "color5", label: "Highlight", default: "#FFD9A8" },
      { type: "number", name: "speed", label: "Speed", default: 1, min: 0, max: 20, step: 0.5 },
      { type: "number", name: "twistX", label: "Curl", default: -0.65, min: -3, max: 3, step: 0.01 },
      { type: "number", name: "twistZ", label: "Second curl", default: -0.58, min: -3, max: 3, step: 0.01 },
      { type: "number", name: "twistY", label: "Cross twist", default: 0.41, min: -2, max: 2, step: 0.01 },
      { type: "number", name: "twistPowerX", label: "Curl fade", default: 3.63, min: 0.2, max: 8, step: 0.01 },
      { type: "number", name: "twistPowerZ", label: "Second curl fade", default: 3.95, min: 0.2, max: 8, step: 0.01 },
      { type: "number", name: "twistPowerY", label: "Cross twist fade", default: 0.7, min: 0.2, max: 8, step: 0.01 },
      { type: "number", name: "rotationX", label: "Rotation X", default: -25.76, min: -180, max: 180, step: 0.1, unit: "°" },
      { type: "number", name: "rotationY", label: "Rotation Y", default: -6.74, min: -180, max: 180, step: 0.1, unit: "°" },
      { type: "number", name: "rotationZ", label: "Rotation Z", default: 107.4, min: -180, max: 180, step: 0.1, unit: "°" },
      { type: "number", name: "positionX", label: "Position X", default: 593, min: -1200, max: 1200, step: 1, unit: "px" },
      { type: "number", name: "positionY", label: "Position Y", default: -302, min: -1200, max: 1200, step: 1, unit: "px" },
      { type: "number", name: "scale", label: "Scale", default: 1, min: 0.2, max: 3, step: 0.01, motion: false },
      { type: "number", name: "fibres", label: "Fibres", default: 1, min: 0, max: 3, step: 0.05 },
      { type: "number", name: "glow", label: "Sheen", default: 1.98, min: 0, max: 5, step: 0.05 },
      { type: "number", name: "saturation", label: "Saturation", default: 1, min: 0, max: 2, step: 0.01 },
      { type: "number", name: "grain", label: "Grain", default: 1.1, min: 0, max: 2, step: 0.01 },
      { type: "number", name: "maxPixelRatio", label: "Max pixel ratio", default: 2, min: 0.5, max: 3, step: 0.5 },
      { type: "boolean", name: "paused", label: "Paused", default: false },
    ],
    promptNotes: [
      "It's a named export: `import { RibbonWave } from \"@/components/animations/ribbon-wave\"`.",
      "It renders a bare, transparent `<canvas>` (aria-hidden) that fills its parent.",
      "Raw WebGL2, no three.js: one indexed mesh (about 33k vertices) drawn once per frame with a depth buffer and MSAA. The palette is generated on a 2D canvas from the five colours; pass `paletteSrc` (a CORS-enabled image) to use your own.",
      "The technique follows Stripe's homepage hero (a folded plane, fading twist rotations, orthographic camera, palette texture, noise fibres, derivative sheen, a speed of 4e-5 per ms); the defaults are its homepage settings. The code and palette are our own.",
    ],
  },
  {
    slug: "prism-flow",
    title: "Prism flow",
    description:
      "A soft stream of light sweeps across a deep navy field, splitting into cycling rainbow layers along its edge and melting into haze, a WebGL shader background",
    category: "shaders",
    group: "backgrounds",
    level: "atom",
    componentName: "PrismFlow",
    motionNote: "A continuous shader loop: it has no duration or easing. Speed sets its overall pace; Colour cycle sets how fast the spectrum travels.",
    files: [
      {
        name: "prism-flow.tsx",
        path: "src/registry/shaders/backgrounds/prism-flow.tsx",
      },
    ],
    themeToggle: false,
    fullBleed: true,
    usageProps: ['className="absolute inset-0 -z-10"'],
    motion: {
      implementation: "required",
      intent:
        "A full-bleed animated background for a dark hero: a broad, blurred stream of light sweeps diagonally across a deep navy field. Along its edge the light splits into soft rainbow layers that keep flowing along the stream, and further in it melts into a pale haze and then electric blue. Everything is soft-focus with no hard lines: it should feel like light through a prism, lively but calm behind the copy.",
      trigger: shader.trigger,
      states: [
        "Field: {colorDeep} outside the stream, lifting slightly towards it.",
        "Stream: a diagonal band at {angle}° whose edge crosses the middle {offset} section-heights up and undulates slowly. The edge is {softness} section-heights soft.",
        "Spectrum: {spectrum1} → {spectrum2} → {spectrum3} → {spectrum4} → {spectrum5}, looped and softened slightly towards {colorHaze}, in {spread} layers parallel to the edge, broken up by noise and cycling along the stream. It only lives in a narrow band at the edge (fading as e^(−2.4 × depth)). A soft glow follows the edge in its own colour.",
        "Depth: over {width} section-heights the spectrum melts into {colorHaze}, then settles into {colorBase} on the far side.",
        "The whole field is domain-warped by slow noise ({warp}), so every line bends softly. Fine grain ({grain}) stops the gradients banding.",
      ],
      timing: [
        "Shape: the warp and the edge's undulation drift slowly (speed {speed}).",
        "Colour: the spectrum cycles {cycle} times per second along the stream at speed {speed}, the most visible motion.",
        "Each frame advances time by at most 0.1s, so coming back to a background tab doesn't jump.",
        "{paused|true=`paused` is on: it renders one still frame and the loop stays idle.|*=}",
      ],
      interruption: shader.interruption,
      reducedMotion: shader.reducedMotion,
      responsive:
        "Sizes are in section heights, so the stream keeps its shape at any height and extends further on wide sections. It's soft, so rendering is capped at {maxPixelRatio}× device pixels without visible loss.",
      rules: [...shader.rules, "Keep the defaults (`PRISM_FLOW_DEFAULTS`) for anything I haven't set."],
      checks: [
        "A soft rainbow-edged stream sweeps diagonally across a navy field, its colours flowing along it, with no hard lines and no banding in the gradients.",
        "White text over it stays readable, especially over the haze.",
        ...shader.checks,
      ],
      apply: shader.apply,
    },
    controls: [
      { type: "color", name: "colorDeep", label: "Deep", default: "#03055C" },
      { type: "color", name: "colorBase", label: "Base blue", default: "#2A2CE0" },
      { type: "color", name: "colorHaze", label: "Haze", default: "#A9B9F2" },
      { type: "color", name: "spectrum1", label: "Spectrum 1", default: "#FF5E62" },
      { type: "color", name: "spectrum2", label: "Spectrum 2", default: "#F4D35E" },
      { type: "color", name: "spectrum3", label: "Spectrum 3", default: "#5CD38E" },
      { type: "color", name: "spectrum4", label: "Spectrum 4", default: "#6FC8F5" },
      { type: "color", name: "spectrum5", label: "Spectrum 5", default: "#E68BE3" },
      { type: "number", name: "speed", label: "Speed", default: 1, min: 0, max: 4, step: 0.1 },
      { type: "number", name: "cycle", label: "Colour cycle", default: 0.05, min: 0, max: 0.4, step: 0.01 },
      { type: "number", name: "spread", label: "Spectrum layers", default: 1, min: 0.2, max: 4, step: 0.05 },
      { type: "number", name: "angle", label: "Angle", default: -20, min: -90, max: 90, step: 1, unit: "°" },
      { type: "number", name: "offset", label: "Edge position", default: 0.14, min: -0.6, max: 0.6, step: 0.01 },
      { type: "number", name: "width", label: "Band depth", default: 0.8, min: 0.1, max: 1.5, step: 0.01 },
      { type: "number", name: "softness", label: "Edge softness", default: 0.14, min: 0.01, max: 0.5, step: 0.01 },
      { type: "number", name: "warp", label: "Warp", default: 0.22, min: 0, max: 0.6, step: 0.01 },
      { type: "number", name: "grain", label: "Grain", default: 1, min: 0, max: 2, step: 0.1 },
      { type: "number", name: "maxPixelRatio", label: "Max pixel ratio", default: 1, min: 0.5, max: 2, step: 0.5 },
      { type: "boolean", name: "paused", label: "Paused", default: false },
    ],
    promptNotes: [
      "It's a named export: `import { PrismFlow } from \"@/components/animations/prism-flow\"`.",
      "It renders a bare `<canvas>` (aria-hidden) that fills its parent.",
      "Raw WebGL2, one fullscreen pass: a rotated frame for the stream, four-octave value-noise warp, an undulating edge, a looping five-colour spectrum, and a haze/base falloff. Use the deep colour as the section's fallback background.",
    ],
  },
  {
    slug: "neon-marble",
    title: "Neon marble",
    description:
      "Saturated neon liquid in violet, magenta, orange, lime and teal, folding into long marbled streaks under a film grain, a WebGL shader background",
    category: "shaders",
    group: "backgrounds",
    level: "atom",
    componentName: "NeonMarble",
    motionNote: "A continuous shader loop: it has no duration or easing. Speed sets its overall pace; Colour cycle sets how fast the palette travels.",
    files: [
      {
        name: "neon-marble.tsx",
        path: "src/registry/shaders/backgrounds/neon-marble.tsx",
      },
    ],
    themeToggle: false,
    fullBleed: true,
    usageProps: ['className="absolute inset-0 -z-10"'],
    motion: {
      implementation: "required",
      intent:
        "A full-bleed animated background for a bold hero: the whole section is a flowing neon liquid, folded and marbled into long diagonal streaks, with darker pockets for depth and a visible film grain. It should feel vivid and alive, with colour travelling through the folds, while staying soft enough to put white type over.",
      trigger: shader.trigger,
      states: [
        "Liquid: layered domain warping. Noise bends the coordinates of noise, which bend the coordinates of noise again (fold strength {warp}), at feature size {scale}.",
        "Streaks: the field is drawn out {stretch}× along {angle}°, so the folds become long diagonal streaks.",
        "Colour: {color1} → {color2} → {color3} → {color4} → {color5}, looped, picked by where the liquid ended up ({spread} bands per fold), so colour follows the folds.",
        "Depth: pockets where the second warp layer runs low sink towards {colorShadow} (strength {shadow}).",
        "Film grain ({grain}) over everything.",
      ],
      timing: [
        "The liquid evolves continuously at speed {speed}: within a few seconds the folds have visibly moved.",
        "The palette travels through the folds at {cycle} cycles per second (at speed {speed}).",
        "Each frame advances time by at most 0.1s, so coming back to a background tab doesn't jump.",
        "{paused|true=`paused` is on: it renders one still frame and the loop stays idle.|*=}",
      ],
      interruption: shader.interruption,
      reducedMotion: shader.reducedMotion,
      responsive:
        "Sizes are in section heights, so the folds keep their size relative to the section at any height. It's soft, so rendering is capped at {maxPixelRatio}× device pixels without visible loss (the grain is drawn per pixel at that resolution).",
      rules: [...shader.rules, "Keep the defaults (`NEON_MARBLE_DEFAULTS`) for anything I haven't set."],
      checks: [
        "The whole section is a flowing neon liquid in long diagonal streaks with darker pockets and a fine grain, and it keeps moving smoothly with no flicker.",
        "White text over it stays readable. If not, raise `shadow` or darken the palette rather than adding an overlay.",
        ...shader.checks,
      ],
      apply: shader.apply,
    },
    controls: [
      { type: "color", name: "color1", label: "Colour 1", default: "#6E4BF2" },
      { type: "color", name: "color2", label: "Colour 2", default: "#E24FB6" },
      { type: "color", name: "color3", label: "Colour 3", default: "#FF7A2E" },
      { type: "color", name: "color4", label: "Colour 4", default: "#B8EE4C" },
      { type: "color", name: "color5", label: "Colour 5", default: "#5FA7A0" },
      { type: "color", name: "colorShadow", label: "Shadow", default: "#3A1468" },
      { type: "number", name: "speed", label: "Speed", default: 1, min: 0, max: 4, step: 0.1 },
      { type: "number", name: "cycle", label: "Colour cycle", default: 0.03, min: 0, max: 0.3, step: 0.01 },
      { type: "number", name: "scale", label: "Scale", default: 0.5, min: 0.3, max: 3, step: 0.05, motion: false },
      { type: "number", name: "warp", label: "Fold strength", default: 0.85, min: 0, max: 2, step: 0.05 },
      { type: "number", name: "stretch", label: "Streak length", default: 2.2, min: 1, max: 5, step: 0.1 },
      { type: "number", name: "angle", label: "Angle", default: -28, min: -90, max: 90, step: 1, unit: "°" },
      { type: "number", name: "spread", label: "Colour bands", default: 0.8, min: 0.3, max: 4, step: 0.05 },
      { type: "number", name: "shadow", label: "Shadow depth", default: 0.55, min: 0, max: 1, step: 0.05 },
      { type: "number", name: "grain", label: "Grain", default: 1, min: 0, max: 2, step: 0.1 },
      { type: "number", name: "maxPixelRatio", label: "Max pixel ratio", default: 1, min: 0.5, max: 2, step: 0.5 },
      { type: "boolean", name: "paused", label: "Paused", default: false },
    ],
    promptNotes: [
      "It's a named export: `import { NeonMarble } from \"@/components/animations/neon-marble\"`.",
      "It renders a bare `<canvas>` (aria-hidden) that fills its parent.",
      "Raw WebGL2, one fullscreen pass: a rotated, stretched frame, three layers of three-octave value-noise domain warping, a looping five-colour palette and a shadow mix. Use the shadow colour as the section's fallback background.",
    ],
  },


];

export function getEntry(slug: string) {
  return registry.find((entry) => entry.slug === slug);
}

export function getGroupEntries(categoryId: string, groupId: string) {
  return registry.filter((e) => e.category === categoryId && e.group === groupId);
}

export function getGroup(entry: RegistryEntry) {
  return categories
    .find((c) => c.id === entry.category)
    ?.groups.find((g) => g.id === entry.group);
}

export function getNeighbors(slug: string) {
  const index = registry.findIndex((e) => e.slug === slug);
  return {
    prev: index > 0 ? registry[index - 1] : undefined,
    next: index < registry.length - 1 ? registry[index + 1] : undefined,
  };
}

export function getDefaultValues(entry: RegistryEntry): ControlValues {
  return Object.fromEntries(entry.controls.map((c) => [c.name, c.default]));
}
