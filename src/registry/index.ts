import type { Category, ControlValues, RegistryEntry } from "./types";

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
    slug: "fill-sweep",
    title: "Fill sweep",
    description: "Background fills from one edge while the label inverts",
    category: "interactions",
    group: "button-hovers",
    level: "atom",
    componentName: "FillSweepButton",
    files: [
      {
        name: "fill-sweep-button.tsx",
        path: "src/registry/interactions/button-hovers/fill-sweep-button.tsx",
      },
    ],
    usageChildren: "Get started",
    themeToggle: false,
    motion: {
      intent:
        "A hover state for a call-to-action button. A solid fill sweeps across the button from the {direction} edge while the label colour flips so it stays readable. It should feel quick and confident: fast at the start, settling softly at the end, never bouncy.",
      trigger: hoverTrigger("filled state"),
      states: [
        "Fill: a solid layer behind the label that covers the whole button. At rest it is {direction|left=`scaleX(0)` with `transform-origin: left`|bottom=`scaleY(0)` with `transform-origin: bottom`}. When active it is at scale 1.",
        "Label: its colour changes from the rest colour to the filled colour, at the same time and on the same curve as the fill.",
        "Nothing else moves. The button's size, border, padding and label position stay the same.",
      ],
      timing: [
        "Duration: {duration}ms for both the fill and the label colour, in and out.",
        "Easing: `cubic-bezier(0.23, 1, 0.32, 1)` (a strong ease-out) for both.",
        "No delay and no stagger: the fill and the label start together.",
      ],
      interruption: transitionInterruption("the fill"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, remove both transitions so the filled state appears instantly on hover and focus. Keep the state change itself.",
      rules: [
        "Animate the fill with `transform: scale` on its own absolutely positioned layer behind the label. Don't animate width, left, background-position or a gradient: those repaint every frame.",
        "The button needs `overflow: hidden`, and a stacking context (`isolation: isolate`) with the fill on a negative z-index, so the fill is clipped to the button's rounded shape and stays behind the label.",
      ],
      checks: [
        "Hover: the fill sweeps in from the {direction} edge over {duration}ms, and the label stays readable the whole way.",
        "Move the pointer off halfway: the fill goes back from where it was, with no snap.",
        ...hoverChecks("filled state"),
      ],
    },
    controls: [
      {
        type: "select",
        name: "direction",
        label: "Direction",
        default: "left",
        options: [
          { label: "From left", value: "left" },
          { label: "From bottom", value: "bottom" },
        ],
      },
      {
        type: "number",
        name: "duration",
        label: "Duration",
        default: 400,
        min: 150,
        max: 800,
        step: 10,
        unit: "ms",
      },
      { type: "color", name: "textColor", label: "Text color", default: "#FFFFFF" },
      { type: "color", name: "fillColor", label: "Fill color", default: "#fafafa" },
      { type: "color", name: "hoverTextColor", label: "Hover text", default: "#0a0a0a" },
    ],
    promptNotes: [
      "It renders an <a>, like the other button hovers; pass `href` and any other anchor props. For an action that isn't a link, swap the element for a <button type=\"button\">.",
      "All colours are props: `textColor` and `borderColor` (default white at 15%) at rest, `fillColor` and `hoverTextColor` once filled. The focus outline uses `fillColor` with a 2px offset, so it reads on any background.",
    ],
  },
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
    usageChildren: "Request Demo",
    motion: {
      intent:
        "A hover state for a pill call-to-action. An ellipse in a second colour grows out of a point just past the bottom-right corner until it floods the whole pill, like ink spreading from the corner. It should feel smooth and even: eased in and out, never bouncy.",
      trigger: hoverTrigger("flooded state"),
      states: [
        "Bloom: an ellipse (`border-radius: 50%`) behind the label, sized to the button plus 100px on each axis (`width/height: calc(100% + 100px)`) and positioned 50px outside the bottom-right corner (`right: -50px; bottom: -50px`). At full size it covers all four corners of the pill. At rest it is `scale(0)` with `transform-origin: bottom right`; when active it is `scale(1)`.",
        "Label and arrow: they keep their colour and don't move. The label colour has to read on both the resting colour and the bloom colour.",
        "Nothing else changes. The pill's size, padding and resting background stay the same.",
      ],
      timing: [
        "Duration: {duration}ms, in and out.",
        "Easing: `ease-in-out` (`cubic-bezier(0.42, 0, 0.58, 1)`).",
        "No delay.",
      ],
      interruption: transitionInterruption("the bloom"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, remove the transition so the flooded state appears instantly on hover and focus. Keep the state change itself.",
      rules: [
        "Animate the bloom with `transform: scale` on its own absolutely positioned layer. Don't animate its width, height or border-radius: those trigger layout and paint every frame.",
        "The pill needs `overflow: hidden`, and a stacking context (`isolation: isolate`) with the bloom on a negative z-index. Also add `mask-image: radial-gradient(white, black)` on the pill: without it Safari doesn't clip a transforming child to the rounded corners.",
        "Give the bloom `pointer-events: none` so it never interferes with the hover.",
      ],
      checks: [
        "Hover: the ellipse grows from just past the bottom-right corner over {duration}ms. At full size it covers the whole pill, including the rounded left end.",
        "Move the pointer off halfway: the bloom shrinks back from where it was, with no snap.",
        "In Safari: the pill's rounded corners stay clipped while the bloom grows.",
        ...hoverChecks("flooded state"),
      ],
    },
    controls: [
      { type: "color", name: "color", label: "Button color", default: "#308970" },
      { type: "color", name: "bloomColor", label: "Bloom color", default: "#1C212B" },
      { type: "color", name: "textColor", label: "Text color", default: "#F2F1EE" },
      {
        type: "number",
        name: "duration",
        label: "Duration",
        default: 400,
        min: 200,
        max: 1000,
        step: 10,
        unit: "ms",
      },
      { type: "boolean", name: "arrow", label: "Arrow", default: true },
      { type: "text", name: "href", label: "Link", default: "/request-demo", always: true },
    ],
    promptNotes: [
      "It renders an <a>; pass `href` and any other anchor props. The arrow is optional (`arrow={false}`).",
      "The pill never grows wider than its container (`max-w-full`); a long label wraps and stays centred beside the arrow.",
      "The original uses the Moderat typeface; the component inherits the site's font.",
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
    usageChildren: "Explore Sophos Fusion",
    themeToggle: false,
    motion: {
      intent:
        "A hover state for an outlined (ghost) pill button. The transparent pill fills solid and the label switches to the brand colour. It's a quick, linear colour change: fast enough to feel like instant feedback, soft enough not to flash.",
      trigger: hoverTrigger("filled state"),
      states: [
        "Background: transparent → the fill colour.",
        "Label: the outline colour → the hover text colour (the brand colour).",
        "The border keeps its colour and width. Nothing moves or changes size.",
      ],
      timing: [
        "Duration: {duration}ms for both the background and the label colour, in and out.",
        "Easing: `linear` for both.",
        "No delay: both change together.",
      ],
      interruption: transitionInterruption("the colour"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, remove the transition so the colours swap instantly. Keep the state change itself.",
      rules: [
        "Transition only `background-color` and `color`, not `all`, so the focus outline, border and layout never animate.",
      ],
      checks: [
        "Hover: the pill fills and the label turns the brand colour within {duration}ms, with no flash or flicker.",
        ...hoverChecks("filled state"),
      ],
    },
    controls: [
      { type: "color", name: "color", label: "Outline & text", default: "#FFFFFF" },
      { type: "color", name: "fillColor", label: "Fill color", default: "#FFFFFF" },
      { type: "color", name: "hoverTextColor", label: "Hover text", default: "#2006F7" },
      {
        type: "number",
        name: "duration",
        label: "Duration",
        default: 100,
        min: 0,
        max: 500,
        step: 10,
        unit: "ms",
      },
      { type: "text", name: "href", label: "Link", default: "/products", always: true },
    ],
    promptNotes: [
      "It renders an <a>; pass `href` and any other anchor props.",
      "Designed for dark or saturated backgrounds (the original sits on a blue gradient).",
      "The original uses Inter at weight 700; the component inherits the site's font.",
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
    usageChildren: "Learn about our model",
    motion: {
      intent:
        "A hover and press state for a solid pill button. The background snaps from its resting colour to a bright accent on hover, and to a lighter tint while pressed. The original has no transition at all: the instant swap is what makes it feel crisp.",
      trigger:
        "Pointer hover, only on devices that really hover (`@media (hover: hover)`; Tailwind v4's `hover:` already does this), and keyboard focus (`:focus-visible`) show the hover colour. Pressing (`:active`) shows the pressed colour on every device, including touch.",
      states: [
        "Background: resting colour → hover colour on hover and focus → pressed colour while pressed.",
        "The label colour, size, padding and position never change.",
      ],
      timing: [
        "Background colour: {duration}ms, `linear`.{duration|0= That's an instant swap, which matches the original. Don't add a transition.|*=}",
        "No delay.",
      ],
      interruption:
        "{duration|0=With an instant swap there's nothing to interrupt.|*=Use a CSS transition on `background-color`, so leaving mid-change reverses from the current colour.}",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, there's no transition: the colours swap instantly.",
      rules: [
        "Only `background-color` changes. Don't add scale, shadow or lift effects on hover or press.",
      ],
      checks: [
        "Hover: the background turns the hover colour {duration|0=instantly|*=over {duration}ms}.",
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
      {
        type: "number",
        name: "duration",
        label: "Duration",
        default: 0,
        min: 0,
        max: 400,
        step: 10,
        unit: "ms",
      },
      { type: "text", name: "href", label: "Link", default: "/our-model", always: true },
    ],
    promptNotes: [
      "It renders an <a>; pass `href` and any other anchor props.",
      "The original uses Montserrat at weight 600 (Google Font); the component inherits the site's font.",
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
        "Easing: `cubic-bezier(0.4, 0, 0.2, 1)`.",
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
      { type: "text", name: "href", label: "Link", default: "/platform", always: true },
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
    usageChildren: "Read our blog",
    motion: {
      intent:
        "A hover state for an outlined pill button. A solid, pill-shaped fill sweeps in from the left and keeps its rounded leading edge. The label colour changes more slowly, so it flips around the moment the fill passes the middle.",
      trigger: hoverTrigger("filled state"),
      states: [
        "Fill: a solid layer that covers the button including its 1px border (`inset: -1px`), with fully rounded corners. At rest it is `clip-path: inset(0 100% 0 0 round 9999px)` (hidden to the left); when active it is `clip-path: inset(0 0 0 0 round 9999px)`.",
        "Label: the outline colour → the hover text colour, on its own slower timing (below).",
        "The border, size and padding stay the same. Nothing moves.",
      ],
      timing: [
        "Fill: {duration}ms, `ease-in-out` (`cubic-bezier(0.42, 0, 0.58, 1)`).",
        "Label colour: {duration*7/3}ms (7/3 of the fill), `cubic-bezier(0.86, 0, 0.07, 1)` (ease-in-out quint). This curve holds the old colour, flips sharply in the middle and then settles, so the label changes as the fill passes under it.",
        "Both start together, with no delay.",
      ],
      interruption: transitionInterruption("the fill (and the label colour)"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, remove both transitions so the filled state appears instantly on hover and focus. Keep the state change itself.",
      rules: [
        "Reveal the fill with `clip-path: inset(... round 9999px)`. Don't use `scaleX`, which squashes the rounded end into an oval, and don't animate `width`, which triggers layout every frame.",
        "The button needs `overflow: hidden`, and a stacking context (`isolation: isolate`) with the fill on a negative z-index.",
      ],
      checks: [
        "Hover: the fill sweeps in from the left over {duration}ms, with a rounded leading edge the whole way.",
        "The label flips around the halfway point of the sweep and has fully settled by {duration*7/3}ms.",
        "Move the pointer off halfway: the fill goes back from where it was, with no snap.",
        ...hoverChecks("filled state"),
      ],
    },
    controls: [
      { type: "color", name: "color", label: "Outline & text", default: "#6B00DF" },
      { type: "color", name: "fillColor", label: "Fill color", default: "#6B00DF" },
      { type: "color", name: "hoverTextColor", label: "Hover text", default: "#FFFFFF" },
      {
        type: "number",
        name: "duration",
        label: "Duration",
        default: 300,
        min: 150,
        max: 800,
        step: 10,
        unit: "ms",
      },
      { type: "text", name: "href", label: "Link", default: "/blog", always: true },
    ],
    promptNotes: [
      "It renders an <a>; pass `href` and any other anchor props.",
      "The original uses the licensed Lota Grotesque at weight 400; the closest Google Font is Hanken Grotesk. The component inherits the site's font.",
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
    usageProps: ['src="/images/ducati.webp"', 'logo="/images/ducati-logo.svg"', 'logoAlt="Ducati"'],
    motion: {
      intent:
        "A hover state for a linked customer tile: a photo in a rounded frame, a logo in its corner and a caption below. Hovering anywhere on the card slowly grows the photo inside the frame: the picture moves, the frame, logo and caption don't. It should feel calm and barely there, an invitation to click rather than a jump.",
      trigger:
        "Pointer hover anywhere on the card (frame or caption), only on devices that really hover (`@media (hover: hover)`; Tailwind v4's `hover:` already does this). Keyboard focus on the card (`:focus-visible`) shows the same zoom. On touch there is no zoom; a tap just follows the link.",
      states: [
        "Photo: `scale(1)` at rest → `scale({scale})` when active, from the centre (the default `transform-origin`).",
        "Frame: keeps its size and rounded corners and clips the growing photo.",
        "{scrim|true=Corner scrim (a black gradient in the top-left behind the logo) and logo: they sit above the photo and don't move or zoom.|*=Logo: sits above the photo and doesn't move or zoom.}",
        "Caption: doesn't change.",
      ],
      timing: [
        "Duration: {duration}ms, in and out.",
        "Easing: `cubic-bezier(0, 0, 0.2, 1)` (Tailwind's `ease-out`).",
        "No delay.",
      ],
      interruption: transitionInterruption("the zoom"),
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the photo doesn't zoom at all: it stays at `scale(1)` on hover and focus (gate the scale with `motion-safe:`). Don't swap the zoom for an instant jump.",
      rules: [
        "The whole card is one link, and the hover is on the card, so the zoom starts wherever the pointer enters it, caption included.",
        "Animate the photo with `transform: scale`. Don't animate its width, height or `background-size`.",
        "The frame needs `overflow: hidden` plus `isolation: isolate`; without the isolation, Safari loses the rounded corners while the photo is transformed.",
        "Put the scrim and logo in the frame above the photo, not inside the scaled element, so they hold still.",
        "If the site has its own Image component, put the transition on the element that renders the photo and keep it filling the frame with `object-fit: cover`.",
      ],
      checks: [
        "Hover the caption, not the photo: the photo still grows to {scale}× over {duration}ms, and the logo doesn't move.",
        "The frame's rounded corners stay rounded while the photo grows, including in Safari.",
        "Move the pointer off halfway: the photo shrinks back from where it was, with no snap.",
        "Tab to the card: the photo zooms and the card shows a visible focus outline.",
        "Turn on reduced motion: the photo doesn't zoom.",
        "On a touch device: tapping doesn't leave the photo stuck zoomed.",
      ],
    },
    controls: [
      { type: "text", name: "title", label: "Caption", default: "Ducati fuels motorsport innovation with NetApp", always: true },
      { type: "number", name: "scale", label: "Zoom scale", default: 1.04, min: 1, max: 1.2, step: 0.01 },
      { type: "number", name: "duration", label: "Duration", default: 500, min: 100, max: 1200, step: 10, unit: "ms" },
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
      { type: "color", name: "titleColor", label: "Caption color", default: "#000000" },
      { type: "text", name: "href", label: "Link", default: "/customers/ducati", always: true },
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
      "Other props: `easing` (any CSS timing function, default Tailwind's ease-out), `frameColor` (shows under the photo while it loads, default NetApp's #0054D7), `alt`.",
      "The frame is fluid: it fills its column and keeps `aspectRatio`. The original uses 301 / 360 in its grid and 330 / 360 in the single-column mobile layout.",
      "It renders plain <img> tags. If the site has its own Image component (e.g. components/common/Image), swap it in for the photo with fill/object-cover and keep the transition and scale classes on it.",
      "No client JavaScript, so it works in a Server Component.",
      "Original typography: F37 Judge (licensed), caption 20px / 32px with 0.2px tracking (16px / 26px below the xl breakpoint), black. The component inherits the site's font; the demo uses Inter Tight as the closest Google Font.",
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
    usageProps: ['src="/images/catalog-tile.png"'],
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
        "Label and chevron: 300ms, CSS `ease`.",
        "Gradient: 600ms, CSS `ease`. It's twice as slow as the label, so the label arrives first and the gradient settles in behind it.",
        "{lift|true=Card lift and shadow: 300ms, CSS `ease`.|*=No card lift.}",
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
        "Hover: the label fades up 5px and the chevron nudges right over 300ms, while the gradient rises and finishes later, at 600ms.",
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
      { type: "text", name: "href", label: "Link", default: "/customers/business-continuity", always: true },
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
    usageProps: ['src="/images/story-tile.webp"'],
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
        "Easing: `cubic-bezier(0, 0, 0.2, 1)` (Tailwind's `ease-out`) for all of them.",
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
      { type: "text", name: "title", label: "Title", default: "Unleashing imagination with data — petabytes at a time", always: true },
      { type: "text", name: "description", label: "Description", default: "" },
      { type: "text", name: "ctaLabel", label: "CTA label", default: "Explore the IDC study", always: true },
      { type: "number", name: "scale", label: "Zoom scale", default: 1.1, min: 1, max: 1.3, step: 0.01 },
      { type: "number", name: "duration", label: "Duration", default: 500, min: 200, max: 1200, step: 10, unit: "ms" },
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
      { type: "text", name: "href", label: "Link", default: "/customers/dreamworks", always: true },
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
        "Easing: `cubic-bezier(0, 0, 0.2, 1)` (Tailwind's `ease-out`).",
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
      { type: "number", name: "scale", label: "Zoom scale", default: 1.04, min: 1, max: 1.2, step: 0.01 },
      { type: "number", name: "duration", label: "Duration", default: 500, min: 100, max: 1200, step: 10, unit: "ms" },
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
      "Other props: `easing`, `chipFrom` / `chipTo` (the light chip's hover gradient).",
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
    usageProps: ['heading="Meeting Rooms"', "groups={groups}"],
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
        "Location toggle (when there's more than one group): the active tab is a white pill with black text, the others 50% black on #F3F3F3. Switching swaps the list and closes any open row.",
      ],
      timing: [
        "Row tint: {duration}ms, `cubic-bezier(0.22, 1, 0.36, 1)`, in and out.",
        "Detail card: {cardDuration}ms `ease-out` for opacity and scale{cardDuration|0= (0 = it just appears, as on Hatch)|*=}.",
        "Inline accordion: {duration}ms, the same curve as the tint.",
      ],
      interruption:
        "All CSS transitions: moving to the next row fades the old card out while the new one fades in, and the tints cross over, both retargeting from wherever they are. Moving the pointer onto the card keeps its row hovered (the card is a child of the row).",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, the tint, card and accordion change instantly.",
      responsive:
        "From 900px of container width: rows 32px top and bottom with 75px left and 60px right padding, a 112px thumbnail (60px 60px 30px 30px arch), titles clamp(40px, 4.3cqw, 62px) and 38px indexes, and the floating card. Below 900px: 18px 20px rows, a 50px thumbnail, 28px titles, 20px indexes, and the inline accordion instead of the card.",
      rules: [
        "Keep the hover in CSS (`group-hover`, `group-focus-within`); state is only the selected group and the open row for taps.",
        "Hide closed cards with `visibility: hidden` (transitioned along with opacity) so the invisible cards, which overhang the neighbouring rows, never catch the pointer or a click.",
        "Put the card inside the row, not in a shared overlay, so hovering the card keeps the row hovered and the card sits beside its own row.",
        "Animate only `opacity`, `scale` and `background-color` (plus `grid-template-rows` for the small-screen accordion).",
      ],
      checks: [
        "Hover a row: it tints to {accent} over {duration}ms and its card scales up into place beside the title, overlapping the rows above and below.",
        "Sweep down the list: each row's card takes over smoothly, with no flicker or stuck cards.",
        "Move the pointer from the row onto its card: the card stays open.",
        "Tab through the rows: each one tints and shows its card.",
        "Switch the toggle: the other list shows and nothing is left open.",
        "Below 900px or on a phone: tapping a row opens its details inline; tapping again closes them.",
        "Turn on reduced motion: everything changes instantly.",
      ],
    },
    controls: [
      { type: "color", name: "accent", label: "Accent", default: "#CDCEA6" },
      { type: "number", name: "duration", label: "Tint", default: 400, min: 0, max: 1000, step: 10, unit: "ms" },
      { type: "number", name: "cardDuration", label: "Card reveal", default: 200, min: 0, max: 600, step: 10, unit: "ms" },
      { type: "boolean", name: "numbered", label: "Index numbers", default: true },
    ],
    assets: [
      {
        prop: "groups[].items[].thumb",
        label: "Row thumbnail",
        fit: "A square, arch-shaped thumbnail at the start of the row: 50px, 112px from 900px, object-cover",
        placeholder: "224x224",
        optional: true,
      },
      {
        prop: "groups[].items[].image",
        label: "Card photo",
        fit: "The photo on the hover card, 299 / 222, object-cover. Defaults to `thumb`",
        placeholder: "660x490",
        optional: true,
      },
    ],
    promptNotes: [
      "`groups` is an array of `{ label, items }`; with more than one group a toggle shows (Hatch uses one per location), with one it doesn't. Each item is `{ title, thumb?, image?, alt?, tags?, bullets?, href? }`: `image` (the card photo) defaults to `thumb`, `tags` are `{ icon?, label }` pills, and `href` makes the row a link. Items without an image, tags or bullets get no card.",
      "The file also exports `HourglassIcon` and `ArmchairIcon` (Tabler icons, MIT) for duration and capacity tags.",
      "Other props: `heading`, `background` (#FAFAFA, the resting row colour), `numbered` (01, 02... at the end of each row).",
      "Deliberate change: on Hatch the card just appears (it mounts on hover). Here it fades and scales in over `cardDuration` (200ms) so sweeping the list reads as one motion; set `cardDuration={0}` for the original snap. The tint uses Framer's 0.4s spring there, matched with an ease-out curve here. Hatch's card also carries a faint stripe pattern in the corner (brand artwork, not included).",
      "It renders plain <img> tags. If the site has its own Image component, swap it in with object-cover and keep the classes.",
      "It's a Client Component (\"use client\") for the toggle and the tap-to-open state; the hover itself is CSS.",
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
      timing: ["Letters: {duration}s each, `power2.out`, {stagger}s between one letter starting and the next."],
      interruption:
        "It's a one-shot intro: nothing can interrupt or reverse it. If the text changes, the tween is reverted and plays again from hidden.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce` the letters are shown in place, with no motion. The pre-hydration hiding is scoped to `prefers-reduced-motion: no-preference`, so nothing is hidden even before JavaScript runs.",
      rules: [
        "Split into words → letters. Wrap each word in a `white-space: nowrap` inline-block so inline-block letters never break mid-word. The split spans are `aria-hidden`; screen readers get the full headline once from a visually hidden copy inside the heading.",
        "Hide the letters with CSS before hydration (clipped and pushed down), so nothing flashes, and add a `<noscript>` rule that shows them when JavaScript is off.",
        "Animate only `clip-path` and `transform`: no layout properties. Run it as one staggered GSAP tween in a `gsap.context` scoped to the heading and revert it on unmount.",
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
        "Each letter: {duration}ms, `cubic-bezier(0.22, 0.61, 0.36, 1)`, `fill-mode: backwards` (held hidden through its own delay).",
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
        "Lines: {duration}s each, `{ease}`, {stagger}s between one line starting and the next, led from the {from|start=first line|end=last line|center=middle line|random=lines in random order}.",
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
      {
        type: "select",
        name: "ease",
        label: "Easing",
        default: "power4.out",
        options: [
          { label: "Power 4 out", value: "power4.out" },
          { label: "Expo out", value: "expo.out" },
          { label: "Power 3 out", value: "power3.out" },
          { label: "Circ out", value: "circ.out" },
          { label: "Back out", value: "back.out(1.4)" },
        ],
      },
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
        "Each letter: {duration}ms with one `power2.out` ease (`cubic-bezier(0.33, 1, 0.68, 1)`) across the whole keyframe run, not per step, so the squash snaps and the wobble slows down. {stagger}ms between one letter starting and the next.",
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
        "{slowOnHover|true=Hover (mouse and pen only, not touch): the target speed drops to 0; leaving sets it back to {speed}px/s. The actual speed moves 10% of the way to the target per 60fps frame (`1 - 0.9^(dt / 16.67)`), so it glides to a stop in about half a second and glides back up.|*=No hover behaviour.}",
        "{scrollBoost|true=Scroll boost: page scroll velocity (px/ms, blended 50% toward each new reading, decaying ×0.92 per frame) is added as |v| × 900 px/s, and its sign sets the direction: scrolling down runs the {direction|right=right|*=left}, up runs it the other way.|*=}",
        "{fade|0=No edge fade.|*=Edges: a `mask-image` fades the strip out over the first and last {fade}% of its width.}",
      ],
      timing: [
        "Continuous: {speed}px/s, linear, frame-rate independent (distance = speed × frame time; frame time is capped at 100ms so a stalled tab doesn't leap).",
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
        "{easing|linear=Easing: linear (constant speed, no ease-in or ease-out), as in the original.|*=Easing: ease-out (cubic, `1 - (1 - t)^3`), so the count slows into the final value.}",
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
      {
        type: "select",
        name: "easing",
        label: "Easing",
        default: "linear",
        options: [
          { label: "Linear (original)", value: "linear" },
          { label: "Ease out", value: "ease-out" },
        ],
      },
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
    slug: "scroll-text-reveal",
    title: "Scroll text reveal",
    description:
      "A dimmed statement fills in letter by letter as its section scrolls through the viewport, after fading up into place, used on NetApp AI website",
    category: "animations",
    group: "scroll-triggers",
    level: "atom",
    source: "https://netapp.ai/",
    componentName: "ScrollTextReveal",
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
        "{rise|true=Rise: {riseDuration}ms, `cubic-bezier(0.25, 0.46, 0.45, 0.94)`, once on first entry.|*=No rise.}",
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
        "Crossfade: {duration}ms, CSS `ease`, for `background-color` and `color` together.",
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
      { type: "number", name: "duration", label: "Duration", default: 500, min: 0, max: 2000, step: 50, unit: "ms" },
      { type: "number", name: "arriveAt", label: "Switch at (viewport)", default: 0.8, min: 0.2, max: 1, step: 0.05 },
    ],
    promptNotes: [
      "`sections` is an array of `{ color, textColor?, className?, children? }`, one per section, in page order. Each renders as a transparent <section>; give it height and content as usual. The active section also gets a `data-active` attribute for styling its own content.",
      "Other props: `easing` (default `ease`), `arriveAt`, `duration`.",
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
        "Hover scale: 300ms, `cubic-bezier(0.4, 0, 0.2, 1)`, in and out.",
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
        "Hover a linked logo on desktop: it grows to {hoverScale}× over 300ms and the whole strip stops; move off and the strip carries on from the same place.",
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
        "Card open / close: {hoverDuration}ms, CSS `ease`, on height, background, border, shadow, and the copy's rows and opacity together.",
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
      { type: "number", name: "speed", label: "Speed", default: 77, min: 10, max: 200, step: 1, unit: "px/s" },
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
      "Motion matches the original: a CSS keyframe marquee at about 77px/s (7500px every 97.8s), and on hover the card goes from 324px to 382px tall, rgb(163 9 187 / 0.05) to white, with a #D9CCDC border and `0 8px 28px rgb(11 6 35 / 0.12)` shadow over 300ms `ease`. Deliberate changes: the original's copy pops in with `display: none → block` and its card grows only as tall as the row allows; here the copy opens smoothly with the grow, the card grows evenly about its centre, and the row pauses on hover so the open card stays under the pointer.",
      "It is a Client Component (\"use client\") because it measures its width with a ResizeObserver. The keyframes and pause rules ship inside the component in a React 19 `<style href precedence>` tag; on React 18, move them into the global CSS.",
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
        "Width (`flex-grow`) and the detail card's fade: {duration}ms, `cubic-bezier(0.12, 0.23, 0.5, 1)`, together (Framer's tween in the original).",
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
      { type: "number", name: "duration", label: "Expand", default: 400, min: 150, max: 1000, step: 10, unit: "ms" },
      { type: "number", name: "speed", label: "Marquee speed", default: 100, min: 20, max: 300, step: 5, unit: "px/s" },
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
        "A row of slim, faded cards where the one you point at grows to fill the row and its content rises into view, so a set of testimonials can be browsed by sweeping across them. It should feel smooth and deliberate, never twitchy as the pointer moves.",
      trigger:
        "Pointer hover on a card (devices that really hover), or keyboard focus on it. One card is always open; leaving the row keeps the last one open.",
      states: [
        "Closed card: `flex: 0 0 {collapsedWidth}px` at `opacity: {inactiveOpacity}`; its content is hidden.",
        "Open card: adds `flex-grow: 1` (fills the rest of the row) at `opacity: 1`.",
        "Open card's content: from `opacity: 0; translateY(50px)` to `opacity: 1; translateY(0)`. It keeps a fixed 420px min width, so the text never reflows while the card grows; the card clips it.",
      ],
      timing: [
        "Card width and opacity: {duration}ms, `cubic-bezier(0.4, 0, 1, 1)`, together.",
        "Content fade and rise: {contentDuration}ms, `ease-in-out`.",
      ],
      interruption:
        "After a hover opens a card, further hovers are ignored for 800ms, so sweeping the pointer across the row doesn't make cards flicker open and shut. When the lock ends, the card under the pointer (if different) opens. Keyboard focus opens a card immediately, ignoring the lock. Transitions retarget from their current values.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, cards switch instantly: no width, fade or rise transitions.",
      responsive:
        "Expands from 1200px wide. Below that the cards become a horizontal scroll-snap row of full, open cards {mobileHeight}px tall (vs {height}px on desktop); no hover expansion.",
      rules: [
        "Animate the width with `flex-grow` on flex items so one transition handles every card, not by setting pixel widths in JS.",
        "Only the active index is state; widths and fades are CSS transitions.",
        "If a card's media is a video, play it only while that card is open.",
      ],
      checks: [
        "Hover a closed card: it grows to fill the row over {duration}ms while the open one shrinks to {collapsedWidth}px and fades to {inactiveOpacity}.",
        "The new card's content fades in and rises 50px over {contentDuration}ms, without the text reflowing.",
        "Sweep the pointer quickly across the whole row: at most one change per 800ms, no flicker.",
        "Leave the row: the last card stays open.",
        "Tab through the cards: each opens as it gets focus.",
        "Below 1200px: a swipeable row of full cards.",
        "Turn on reduced motion: cards switch instantly.",
      ],
    },
    controls: [
      { type: "number", name: "height", label: "Height", default: 621, min: 400, max: 720, step: 1, unit: "px" },
      { type: "number", name: "mobileHeight", label: "Mobile height", default: 480, min: 320, max: 720, step: 10, unit: "px" },
      { type: "number", name: "collapsedWidth", label: "Closed width", default: 80, min: 40, max: 160, step: 2, unit: "px" },
      { type: "number", name: "gap", label: "Gap", default: 20, min: 0, max: 48, step: 2, unit: "px" },
      { type: "number", name: "radius", label: "Radius", default: 20, min: 0, max: 40, step: 1, unit: "px" },
      { type: "number", name: "inactiveOpacity", label: "Closed opacity", default: 0.2, min: 0.1, max: 1, step: 0.05 },
      { type: "number", name: "duration", label: "Expand", default: 400, min: 150, max: 1000, step: 10, unit: "ms" },
      { type: "number", name: "contentDuration", label: "Content reveal", default: 800, min: 200, max: 1400, step: 10, unit: "ms" },
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
        "Row slide: {duration}ms, CSS `ease`.",
        "Card focus change (opacity, blur, scale): {focusDuration}ms, `cubic-bezier(0.4, 0, 0.2, 1)`, starting at the same moment as the row slide, so the new card is sharp before the row stops.",
        "Dot width: 150ms, `cubic-bezier(0.4, 0, 0.2, 1)`. Arrow colours: 300ms, `cubic-bezier(0.4, 0, 0.2, 1)`.",
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
      { type: "number", name: "duration", label: "Slide", default: 500, min: 150, max: 1200, step: 10, unit: "ms" },
      { type: "number", name: "focusDuration", label: "Focus", default: 150, min: 0, max: 800, step: 10, unit: "ms" },
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
      "`SpotlightSlide` options: `onPlay` shows a 90px play button (60px on small cards) that scales to 1.1 on hover over 200ms; `playIcon` replaces its default white circle (the original uses its own play image). `pattern={{ wide, narrow }}` overlays a decorative image on the card's right side (1012×569 on wide cards, 327px wide on small ones), above the media and under the text.",
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
        "Arrows: no hover state in the original; this version adds a faint grey fill on hover and a 0.97 press scale (200ms ease-out).",
      ],
      timing: [
        "Row: {duration}ms, CSS `ease` (Swiper's default).",
        "Dot width and opacity: 300ms `ease-in-out`.",
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
        "Click next: the row moves one card over {duration}ms with `ease`, and the next card still peeks at the edge.",
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
      "Below 992px the arrows hide. Cards keep their 280px width (capped at the row width), so tablets show two or more with the next peeking and phones show one with the next peeking past the edge; swipe (50px threshold, rubber-bands at the ends) plus 10px pill dots (active one 30px wide, others 20% opacity, width over 300ms ease-in-out) move between them. Keep `min-[992px]:` rather than a Tailwind default breakpoint.",
      "Card glow: two blurred SVG shapes from the original, inlined as a data-URI background: `#E3308C` at 50% from the top right and `#A309BB` at 30% along the bottom left, on whatever background the section has (white in the original). Change them with `glowTop` / `glowBottom`.",
      "The original arrows are 120×70 pills with a 1px rgba(160,160,160,.3) border, 45px radius and a 31×23 arrow (#0B0623), 15px apart. They have no hover state in the original; this version adds a faint grey fill on hover and a 0.97 press scale.",
      "Typography from the original: heading 66px / 1, weight 300, -1.72px tracking (36px / 1.2, weight 400 below 992px), max 860px wide; description 18px / 1.6; award names 28px / 1.2 (22px below 992px), -0.56px tracking, 21px above. All #410051. The original uses Cabinet Grotesk (free from Fontshare, not on Google Fonts) for the heading and names and Mona Sans (Google Font) for the description; the component inherits the site's font. The demo uses Hanken Grotesk as the closest Google Font.",
      "It is a Client Component (\"use client\"). State is the index, the drag offset and the measured row width (ResizeObserver). The track position is a CSS transition. Reduced motion: the row jumps without a transition.",
      "It renders whatever you pass as `image`. If the site has its own Image component (e.g. components/common/Image), use it and keep a 100px height.",
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
        "No fixed duration: progress follows scroll. Each frame, the displayed value moves 0.2 of the way toward the scroll-based target (frame-rate independent, as at 60fps), and a 0.2s linear CSS transition on transform, opacity and filter smooths it further.",
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
        "Crossfade: {duration}ms, `cubic-bezier(0.4, 0, 0.2, 1)`, outgoing and incoming at the same time.",
        "Phone row and progress fill: {slideDuration}ms, CSS `ease`.",
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
        "Don't add GSAP or a carousel library either. The original uses GSAP ScrollTrigger (only its onEnter/onEnterBack callbacks, no scrub) for the swap and react-slick for the phone row; its values are matched here: `waitForAnimate: true`, `touchThreshold: 5`, `edgeFriction: 0.35`, speed 500, `ease`.",
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
      { type: "number", name: "inactiveOpacity", label: "Inactive text", default: 1, min: 0.2, max: 1, step: 0.05 },
      { type: "number", name: "slideDuration", label: "Phone slide", default: 500, min: 0, max: 1200, step: 10, unit: "ms" },
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
    slug: "vertical-tab-slider",
    title: "Vertical tab slider",
    description:
      "Hovering a list of service titles slides a tall photo card to match, steps the title forward on a leader line and glows the card's colours behind it, while the section fades to a dark plate, used on eight25 website",
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
        "A services list that drives a photo card: running the pointer down the titles slides a 400×520 card window up or down to that service's card, and the hovered title steps forward with a hairline running into it from behind the card, so the list and the card read as one control. The card's own photo glows, blurred, behind the column.{reveal|true= As the section scrolls in, the whole band fades from {background} to a dark {revealBackground} plate, and fades back when it leaves.|*=}",
      trigger:
        "Desktop (container ≥ 960px): hovering a title with a mouse selects it (`pointerenter`, `pointerType === \"mouse\"` only, so a tap or a pen hovering doesn't select). Click selects too, as the fallback. Keyboard: Enter/Space select; focus alone doesn't (tabbing through doesn't drag the track), but a focused title shows at full opacity. Narrow: swiping the card carousel; the card nearest the scroller's centre becomes active.{reveal|true= Plate: scroll position, via two IntersectionObservers: it goes dark once the section's top has risen above 34% of the viewport height (`rootMargin: 0 0 -66% 0`) and back once its bottom has risen above 30% (`rootMargin: -30% 0 0 0`). It's dark only while both report intersecting, and it never latches, so it plays on every pass.|*=}",
      states: [
        "Card track: a column of 520px cards with 10px gaps inside a 400×520 `overflow: hidden` window. Active card n → `translateY(-n × 530px)`.",
        "Active title: `opacity: 1` and `translateX(-{tabShift}px)`. The others: `opacity: {inactiveOpacity}`.",
        "Leader rule: a 1px line, 729px long, ending at the active title's left edge at its vertical centre, `linear-gradient(to right, currentColor 85%, transparent)`, opacity 0 → 1. It belongs to each title (so it follows a title that wraps) and paints behind the card.",
        "{glow|true=Glow: every card's photo stacked in one box (938×1024 desktop, 518×565 narrow), mirrored horizontally, `blur(75px)` (41px narrow) with a 403px corner radius, centred on the card column; only the active one is at opacity 1, so the colours dissolve between cards. The box is at `opacity: 0.4`{reveal|true= once the plate is dark, 0 before|*=}.|*=No glow.}",
        "{reveal|true=Plate: section `background-color` {background} → {revealBackground} and `color` {color} → {revealColor}. The titles and leader rule inherit the colour; the card copy is always white on its dark scrim.|*=No plate change: the section stays {background} with {color} text.}",
        "Narrow (< 960px): the same cards as a horizontal scroll-snap carousel (300px wide; the active card is 420px tall, the others 400px), with a 5px progress bar filled to (active + 1) / count and an `n / total` counter. No tab column.",
        "Plus link: a white disc with a purple plus; on hover of the disc itself a violet disc wipes in from the bottom-left corner (`clip-path: circle(0% at 0% 100%)` → `circle(150% at 0% 100%)`).",
      ],
      timing: [
        "Card track: {slideDuration}ms `ease-out` on `transform`.",
        "Title step and opacity, leader rule: 300ms `ease-out`.",
        "Narrow card height (400 ↔ 420): 300ms `ease-out`.",
        "{glow|true=Glow crossfade: 700ms `ease-out`.|*=}",
        "{reveal|true=Plate: 700ms `ease-out` on `background-color` and `color`.|*=}",
        "Plus wipe: 300ms `ease-out`.",
      ],
      interruption:
        "Everything is a CSS transition on state, so running the pointer quickly down the list retargets the track from wherever it is, with no queue. The plate reverses mid-fade the same way.",
      reducedMotion:
        "Under `prefers-reduced-motion: reduce`, keep the selection (it's how the card is chosen) but make the track move, title step and crossfades instant, and skip the plus wipe. The plate can still change colour, without the fade.",
      rules: [
        "Translate the `<ul>` inside the window with a CSS custom property set from state; don't scroll it.",
        "On narrow screens use a native `scroll-snap` carousel so touch keeps the browser's own inertia, and read the active card back out of the scroll position (the slide whose centre is nearest the scroller's centre) rather than driving it.",
        "Measure the plate's IntersectionObservers against the nearest scrolling ancestor if there is one, otherwise the viewport.",
        "Stack the glow images and crossfade them on opacity rather than swapping one `src`, so a change is a dissolve, not a pop while bytes load. At 75px of blur a small image is enough.",
        "Lift the card window above the tab column (`z-index`) so the leader rule passes behind the card.",
      ],
      checks: [
        "Run the pointer down the titles: the card window slides to each card in {slideDuration}ms, the hovered title steps {tabShift}px left at full opacity with the line running into it from behind the card, and the others dim to {inactiveOpacity}.",
        "Tap a title on a touch screen: it selects only on the tap, not on touch-down.",
        "Tab through the titles with the keyboard: focus shows on each without moving the card; Enter selects.",
        "{reveal|true=Scroll the section in: the band fades to {revealBackground} with white type once its top passes a third of the way up the screen, and back as it leaves the top; scroll back and it plays again.|*=}",
        "Narrow the container below 960px: the cards become a swipe carousel with the progress bar and counter, and the counter follows the swipe.",
      ],
    },
    controls: [
      { type: "number", name: "slideDuration", label: "Card slide", default: 500, min: 0, max: 1200, step: 50, unit: "ms" },
      { type: "number", name: "tabShift", label: "Active tab step", default: 40, min: 0, max: 80, step: 2, unit: "px" },
      { type: "number", name: "inactiveOpacity", label: "Inactive tabs", default: 0.4, min: 0.1, max: 1, step: 0.05 },
      { type: "boolean", name: "glow", label: "Photo glow", default: true },
      { type: "boolean", name: "reveal", label: "Dark plate on scroll", default: true },
      { type: "color", name: "background", label: "Background", default: "#FFFFFF" },
      { type: "color", name: "color", label: "Text", default: "#4E008E" },
      { type: "color", name: "revealBackground", label: "Plate background", default: "#290044" },
      { type: "color", name: "revealColor", label: "Plate text", default: "#FFFFFF" },
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
      "`children` render above the card row (headline, intro copy, a CTA) and inherit the section's text colour, so they flip with the plate. The original has an 80px headline, then copy indented to the tab column's left edge (550px).",
      "The original darkens the WHOLE PAGE (it sets `data-plate=\"dark\"` on <html> and recolours the neighbouring sections and the header). This component scopes the plate to its own section. If the site wants the page-wide version, set a data attribute on <html> from the same `revealed` state.",
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
        "{autoplay|true={progress|true=Fill: {interval}ms, `linear`. It completes exactly as the tab changes.|*=Timer: {interval}ms.}|*=}",
        "Panel slide: {duration}ms, CSS `ease`.",
        "Active tab background and label colour: 300ms `ease-out`.",
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
      { type: "number", name: "duration", label: "Slide", default: 600, min: 0, max: 1200, step: 10, unit: "ms" },
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
      "Motion matches the original Swiper setup: each tab holds for 4500ms, then panels slide 600ms `ease` with a 10px gap, rewinding to the first tab after the last. The active tab gets a `linear-gradient(90deg, #410051, #E3308C)` background, and a `linear-gradient(90deg, transparent, #E3308C)` fill at 50% opacity sweeps across it linearly. Keep these unless asked. One deliberate change: the original sweep runs 5000ms and gets cut off at 90%; here it runs exactly `interval`, so it completes as the tab changes.",
      "Tab labels default to `font-mono text-sm lowercase`; the original uses Space Mono 14px (a Google Font). Pass `tabClassName` to set the site's mono font. The original's panel title uses Cabinet Grotesk (licensed); use the site's display font or a close Google Font such as Bricolage Grotesque.",
      "The progress fill's CSS animation is the timer: its `animationend` advances the tab, so pausing the animation pauses autoplay exactly. Autoplay waits while the component is less than 25% on screen or the browser tab is hidden. Clicking a tab restarts the timer from zero (autoplay keeps going, like the original).",
      "Accessibility: WAI-ARIA tabs (role tablist/tab/tabpanel, roving tabindex, arrow keys, Home, End); inactive panels are `inert`. Give images real alt text. For WCAG 2.2.2, a 45px pause / play button sits at the end of the tab bar while autoplay is on (`pauseButton`, default true; keep it unless the site has another way to stop the motion), and autoplay also holds while keyboard focus is inside the component.",
      "Below 640px the tab row becomes a horizontal scroll that keeps the active tab centred (the original switches to a stacked, sticky scroll-spy layout there, which is a separate pattern).",
      "It is a Client Component (\"use client\"). Only the active tab is state; the fill and slide are CSS. Reduced motion: no autoplay or fill, and panels switch instantly.",
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
        "{autoplay|true=Progress fill: {interval}ms, `linear`. The tab changes exactly when it completes.|*=}",
        "Panel open / close: {duration}ms from 960px ({duration}ms halved below), `cubic-bezier(0.3, 0.52, 0.49, 0.9)`. The closing and opening tabs move together.",
        "Media fade: {fade}ms, `cubic-bezier(0.25, 1, 0.5, 1)`.",
        "Chip hover: 150ms colour transition. Mobile chevron turn: 300ms `ease-out`.",
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
      { type: "number", name: "fade", label: "Media fade", default: 600, min: 0, max: 1200, step: 10, unit: "ms" },
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
      "Ported from PandaDoc's BenefitsTabs (Next.js + Contentful). Values match it: 12000ms per tab, 400ms panel (200ms below 960px) on `cubic-bezier(0.3, 0.52, 0.49, 0.9)`, sand #F8F5F3 open card, #242424 text, #248567 hover, 2px progress bar, 31.25% / 65.625% columns, media sticky at 80px. Keep these unless asked.",
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
        "Card crossfade: {fadeDuration}ms, CSS `ease`.",
        "Image slide: {slideDuration}ms, `cubic-bezier(0.33, 1, 0.68, 1)` (easeOutCubic), both in and out.",
        "Pill gradient, shadow and label colour: 300ms `ease-out`.",
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
      { type: "number", name: "slideDuration", label: "Image slide", default: 700, min: 0, max: 1400, step: 10, unit: "ms" },
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
        "An FAQ list of rounded, numbered question cards. {collapsible|true=One answer is open at a time, and clicking the open card closes it.|*=One answer is always open: opening a card closes the one that was open, and clicking the open card does nothing.} The answer slides open to its own height while the chevron turns over, on one long ease-out, so it feels smooth and unhurried.",
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
        "Easing: `cubic-bezier(0, 0, 0.2, 1)` (Tailwind's `ease-out`) for both.",
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
      { type: "number", name: "duration", label: "Duration", default: 500, min: 100, max: 1200, step: 10, unit: "ms" },
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
    slug: "ribbon-wave",
    title: "Ribbon wave",
    description:
      "A folded silk ribbon, rendered as a real 3D mesh that curls along its length and only breathes, on a transparent WebGL canvas, from Stripe's website",
    category: "shaders",
    group: "backgrounds",
    level: "atom",
    source: "https://stripe.com/",
    componentName: "RibbonWave",
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
      { type: "number", name: "scale", label: "Scale", default: 1, min: 0.2, max: 3, step: 0.01 },
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
      { type: "number", name: "scale", label: "Scale", default: 0.5, min: 0.3, max: 3, step: 0.05 },
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
