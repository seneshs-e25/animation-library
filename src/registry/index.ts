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
      { id: "scroll-triggers", title: "Scroll triggers" },
      { id: "carousels", title: "Carousels" },
      { id: "pin-scrollers", title: "Pin scrollers" },
      { id: "tabs", title: "Tabs" },
    ],
  },
  {
    id: "shaders",
    title: "Shaders",
    groups: [{ id: "backgrounds", title: "Backgrounds" }],
  },
];

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
    componentName: "FillSweepButton",
    files: [
      {
        name: "fill-sweep-button.tsx",
        path: "src/registry/interactions/button-hovers/fill-sweep-button.tsx",
      },
    ],
    usageChildren: "Get started",
    themeToggle: false,
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
    componentName: "CornerBloomButton",
    files: [
      {
        name: "corner-bloom-button.tsx",
        path: "src/registry/interactions/button-hovers/corner-bloom-button.tsx",
      },
    ],
    usageChildren: "Request Demo",
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
      "It renders an <a>; pass `href` and any other anchor props.",
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
    componentName: "GhostFillButton",
    files: [
      {
        name: "ghost-fill-button.tsx",
        path: "src/registry/interactions/button-hovers/ghost-fill-button.tsx",
      },
    ],
    usageChildren: "Explore Sophos Fusion",
    themeToggle: false,
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
    componentName: "ColorSnapButton",
    files: [
      {
        name: "color-snap-button.tsx",
        path: "src/registry/interactions/button-hovers/color-snap-button.tsx",
      },
    ],
    usageChildren: "Learn about our model",
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
      "The swap is intentionally instant (duration 0), matching the original. Keep it unless asked otherwise.",
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
    componentName: "CircleRevealButton",
    files: [
      {
        name: "circle-reveal-button.tsx",
        path: "src/registry/interactions/button-hovers/circle-reveal-button.tsx",
      },
    ],
    usageChildren: "Explore More",
    themeToggle: false,
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
      "The pill never grows wider than its container (`max-w-full`), and a long label wraps onto a second centred line instead of overflowing. The reveal animates `clip-path: circle()` from 0% to 100% at the center; a percentage radius is relative to the box diagonal, so it covers any button width. Keep the easing cubic-bezier(0.4, 0, 0.2, 1).",
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
    componentName: "OutlineSweepButton",
    defaultTheme: "light",
    files: [
      {
        name: "outline-sweep-button.tsx",
        path: "src/registry/interactions/button-hovers/outline-sweep-button.tsx",
      },
    ],
    usageChildren: "Read our blog",
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
      "The fill is revealed with `clip-path: inset(0 100% 0 0 round 9999px)` → `inset(0 0 0 0 round 9999px)` so its leading edge stays rounded; don't swap it for scaleX, which squashes the rounded end.",
      "The label color transition is intentionally slower (7/3 × duration) on cubic-bezier(0.86, 0, 0.07, 1), so it flips as the fill passes the middle. Keep both curves.",
      "The original uses the licensed Lota Grotesque at weight 400; the closest Google Font is Hanken Grotesk. The component inherits the site's font.",
    ],
  },
  {
    slug: "zoom-image-card",
    title: "Zoom image card",
    description:
      "Hovering the card scales its image inside a fixed rounded frame, used on Seemplicity website",
    category: "interactions",
    group: "image-hovers",
    componentName: "ZoomImageCard",
    defaultTheme: "light",
    files: [
      {
        name: "zoom-image-card.tsx",
        path: "src/registry/interactions/image-hovers/zoom-image-card.tsx",
      },
    ],
    usageProps: ['src="/images/report-cover.webp"', 'eyebrow="Whitepapers & research"', 'title="2026 Risk Exposure Report"'],
    controls: [
      { type: "number", name: "scale", label: "Zoom scale", default: 1.1, min: 1, max: 1.3, step: 0.01 },
      { type: "number", name: "duration", label: "Duration", default: 300, min: 100, max: 1000, step: 10, unit: "ms" },
      { type: "number", name: "radius", label: "Corner radius", default: 20, min: 0, max: 40, step: 1, unit: "px" },
      {
        type: "select",
        name: "aspectRatio",
        label: "Aspect ratio",
        default: "2 / 1",
        options: [
          { label: "2:1", value: "2 / 1" },
          { label: "16:9", value: "16 / 9" },
          { label: "4:3", value: "4 / 3" },
          { label: "1:1", value: "1 / 1" },
        ],
      },
      { type: "color", name: "eyebrowColor", label: "Eyebrow color", default: "#E3308C" },
      { type: "color", name: "titleColor", label: "Title color", default: "#0B0623" },
      { type: "text", name: "href", label: "Link", default: "/resources/risk-exposure-report", always: true },
    ],
    promptNotes: [
      "The whole card is one <a>: hovering anywhere on it (or keyboard focus) zooms the image. Pass `href` and any other anchor props.",
      "Matches the original: image scales 1 → 1.1 over 300ms with CSS `ease` (change it with `easing`, any CSS timing function), inside a 2:1 frame with 20px corners. Only `transform` animates; the frame clips with overflow-hidden + isolate so the corners stay rounded in Safari.",
      "`eyebrow` and `title` are optional; omit both to use it as a bare zoom image. The eyebrow renders as a lowercase `/label` in the site's mono font (the original uses Space Mono); the title inherits the site font (the original uses Cabinet Grotesk).",
      "Hover is gated to devices that can hover (Tailwind's `hover:` variant), so touch devices don't get a stuck zoom. With prefers-reduced-motion the image doesn't zoom.",
      "It renders a plain <img>. If the site has its own Image component (e.g. components/common/Image), swap it in with fill/object-cover and keep the transition classes on it.",
      "No client JavaScript, so it works in a Server Component.",
    ],
  },
  {
    slug: "reveal-link-card",
    title: "Reveal link card",
    description:
      "Hovering the image tile lifts it and fades up a Learn More link over a rising gradient, used on Qlik website",
    category: "interactions",
    group: "image-hovers",
    componentName: "RevealLinkCard",
    defaultTheme: "light",
    files: [
      {
        name: "reveal-link-card.tsx",
        path: "src/registry/interactions/image-hovers/reveal-link-card.tsx",
      },
    ],
    usageProps: ['src="/images/catalog-tile.png"'],
    controls: [
      { type: "text", name: "title", label: "Title", default: "Halcyon Cloud", always: true },
      { type: "text", name: "linkLabel", label: "Link label", default: "Learn More" },
      { type: "color", name: "color", label: "Card color", default: "#19426C" },
      { type: "color", name: "textColor", label: "Text color", default: "#FFFFFF" },
      { type: "boolean", name: "lift", label: "Lift on hover", default: true },
      { type: "text", name: "href", label: "Link", default: "/products/cloud", always: true },
    ],
    promptNotes: [
      "The whole card is one <a>; pass `href` and any other anchor props. Keyboard focus triggers the same reveal as hover.",
      "Motion matches the original (measured at 992px+): the label goes from opacity 0 / translateY(5px) to 1 / 0 over 300ms `ease`, and its chevron nudges 4px right. A gradient in the card color (solid for the bottom 20%, 60% of the card tall) rises from opacity .5 / translateY(30px) over 600ms, and the card lifts 2px with a `0 18px 20px rgba(97,97,97,.4)` shadow over 300ms. Keep these unless asked.",
      "The card is fluid: `width` (default 220) is a maximum, so it shrinks in a narrower column, and the height follows `aspectRatio` (default \"220 / 280\", the original; e.g. \"220 / 411\" for the tall variant). Pass `width=\"fill\"` to fill a grid cell. Corners are 14px. The image fills the card with object-cover, so export tile art at that ratio with any background baked in, or transparent to let `color` show through.",
      "On devices without hover (touch), the label and gradient are always shown so the link isn't hidden. With prefers-reduced-motion, nothing moves; the label still fades in.",
      "Only opacity and transform animate. No client JavaScript, so it works in a Server Component.",
      "It renders a plain <img>. If the site has its own Image component (e.g. components/common/Image), swap it in with fill/object-cover and keep the `absolute inset-0 -z-10` classes.",
      "The original uses Inter; the component inherits the site's font.",
    ],
  },
  {
    slug: "scroll-text-reveal",
    title: "Scroll text reveal",
    description:
      "A dimmed statement fills in letter by letter as it scrolls through the viewport, after fading up into place, used on NetApp AI website",
    category: "animations",
    group: "scroll-triggers",
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
    controls: [
      {
        type: "text",
        name: "text",
        label: "Text",
        default: "Analysts expect that through 2027, 60% of AI projects without AI-ready data will be abandoned",
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
      { type: "boolean", name: "rise", label: "Rise on enter", default: true },
      { type: "number", name: "riseDistance", label: "Rise distance", default: 48, min: 0, max: 120, step: 2, unit: "px" },
      { type: "number", name: "riseDuration", label: "Rise duration", default: 1400, min: 200, max: 2400, step: 50, unit: "ms" },
    ],
    promptNotes: [
      "This is a base component: it only handles the text and its motion. Font, size, colour, alignment and width come from `className` on the component (it renders a single `as` element, `h2` by default). The section, background and logo above it are not part of it.",
      "`text` must be a plain string because it is split into one span per character (or per word with `split=\"word\"`). Screen readers get the full text once from a visually hidden copy; the split spans are `aria-hidden`.",
      "Motion matches the original: the element defines a CSS `view-timeline`, and every character animates `opacity: 0.2 → 1` (linear) on it over its own slice of `animation-range: cover 20% … cover 45%`, so the fill sweeps through the text in reading order as you scroll and reverses when you scroll back. `start` and `end` set that range as % of the element's cover range (0 = its top meets the bottom of the viewport, 100 = its bottom leaves the top).",
      "The original's timeline is on the whole section (259px top / 251px bottom padding) rather than the heading. Since this one is measured on the text itself, 20% → 45% lands in about the same place for a 2–3 line heading. Tune `start` / `end` if the text is much taller.",
      "Gotcha: no ancestor between the text and the page scroller may have `overflow: hidden`/`auto`/`scroll`. Any of those makes that ancestor the scroll container, the view timeline attaches to it, and since it never scrolls the text stays frozen. Use `overflow: clip` (Tailwind `overflow-clip`) on the section to clip decorations instead.",
      "Rise: the first time the block enters the viewport it fades up 48px over 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94). The server HTML always shows the text; after hydration an IntersectionObserver hides it only if it starts below the fold, then reveals it on entry. A block already on screen at load stays put, so nothing flashes and the text never depends on JavaScript.",
      "Scroll-driven CSS animations run off the main thread with no scroll listeners. Browsers without `animation-timeline` support (Firefox today) show the text at full opacity, with the rise still working. Reduced motion: no rise and no dimming, the text is simply shown.",
      "Original typography: F37 Judge (licensed) at 60px / 66px, weight 100, -0.6px tracking, black, centred in a 1060px column (30px below 1280px). The demo uses Inter Tight weight 300 with -0.02em tracking as the closest Google Font.",
    ],
  },
  {
    slug: "logo-marquee",
    title: "Logo marquee",
    description:
      "An endless strip of customer logos scrolls sideways at a steady pace and pauses on hover, used on Ironclad website",
    category: "animations",
    group: "carousels",
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
    controls: [
      {
        type: "number",
        name: "secondsPerLogo",
        label: "Seconds per logo",
        default: 7.35,
        min: 1,
        max: 15,
        step: 0.05,
        unit: "s",
      },
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
      { type: "color", name: "background", label: "Background", default: "#F2F1EE" },
      {
        type: "number",
        name: "gap",
        label: "Gap (992px+)",
        default: 80,
        min: 16,
        max: 160,
        step: 4,
        unit: "px",
      },
      { type: "boolean", name: "fadeEdges", label: "Fade edges", default: false },
      { type: "boolean", name: "grayscale", label: "Grayscale", default: false },
    ],
    promptNotes: [
      "`logos` is an array of `{ src, alt }`. Every logo is fitted into a 112×44 box (`logoWidth` / `logoHeight`), so export logos at that ratio with their own padding baked in, as the original does.",
      "Speed is set per logo (7.35s each, which matches the original's 250s loop for 34 logos), so the pace stays the same however many logos the CMS returns. Lists shorter than 2560px wide are repeated automatically, so the loop never shows a gap.",
      "It's pure CSS with no client JavaScript, so it works in a Server Component. The keyframes ship inside the component in a React 19 `<style href precedence>` tag; on React 18, move that @keyframes rule into the global CSS.",
      "Spacing is 40px each side at 992px and wider, 20px below (the original's breakpoint). Keep `min-[992px]:` rather than a Tailwind default breakpoint.",
      "Accessibility: screen readers hear each logo once (the copies are aria-hidden). With prefers-reduced-motion the strip stops and becomes a horizontal scroll area. Pause on hover only applies to devices that can hover.",
      "It renders plain <img> tags. If the site has its own Image component (e.g. components/common/Image), swap it in and keep the fixed width and height.",
    ],
  },
  {
    slug: "expanding-cards",
    title: "Expanding cards",
    description:
      "A row of slim, faded testimonial cards where the hovered one grows to fill the row and slides its quote in, used on Ironclad website",
    category: "animations",
    group: "carousels",
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
    promptNotes: [
      "`items` is an array of `{ media, content, label }`. `media` fills the card behind everything (an image with `object-cover`, a video or a gradient; the component sizes it to the card). `content` is the testimonial block - logo, quote, CTA - and sits at the bottom left. `label` names the card for screen readers.",
      "The section heading and the CTA below the row are not part of this component - render them separately in the section.",
      "Motion matches the original: closed cards are `flex: 0 0 80px` at 20% opacity; the open card gets `flex-grow: 1` at full opacity over 400ms cubic-bezier(0.4, 0, 1, 1). Its content fades in and rises 50px over 0.8s ease-in-out. Keep these unless asked.",
      "Hover behaviour matches the original: a hover opens the card, then ignores hovers for 800ms so sweeping across the row doesn't flicker; afterwards the card under the pointer opens. Leaving the row keeps the last card open. Keyboard focus opens a card immediately.",
      "Content keeps a 420px min width so the quote never reflows while the card grows. Write quotes short enough to fit: the original uses a 30px / 1.2 quote with a 50px-high logo above it, inside 60px 120px 60px 60px padding, over a `linear-gradient(246deg, transparent 38.82%, #000 89.91%)` overlay.",
      "Expands from 1200px wide (`minWidth`), as in the original. Below that the cards become a horizontal scroll-snap row of full cards, `mobileHeight` tall (480px, vs 621px `height` on desktop) so a narrow card isn't a towering strip (the original uses a Swiper carousel there).",
      "It is a Client Component (\"use client\") because of the hover state. Only the active index is state; widths and fades are CSS transitions.",
      "If a card's media is a video, play it only while the card is open (the original pauses the others).",
      "Reduced motion: cards switch instantly, without the width or fade transitions.",
    ],
  },
  {
    slug: "spotlight-slider",
    title: "Spotlight slider",
    description:
      "One testimonial card in focus while its neighbours peek in blurred and faded, moved by arrows, swipes or a row of logo tabs, used on Sophos website",
    category: "animations",
    group: "carousels",
    componentName: "SpotlightSlider",
    files: [
      {
        name: "spotlight-slider.tsx",
        path: "src/registry/animations/carousels/spotlight-slider.tsx",
      },
    ],
    usageProps: [
      "items={stories.map((story) => ({\n    label: story.company,\n    tab: <img src={story.logo} alt={story.company} />,\n    content: (\n      <SpotlightSlide\n        logo={<img src={story.logo} alt=\"\" />}\n        quote={story.quote}\n        name={story.name}\n        role={story.role}\n        media={<img src={story.image} alt=\"\" />}\n        onPlay={() => openVideo(story.video)}\n      />\n    ),\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    controls: [
      { type: "number", name: "slideWidth", label: "Slide width", default: 1012, min: 600, max: 1200, step: 4, unit: "px" },
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
    promptNotes: [
      "The file exports two components: `SpotlightSlider` (the carousel: track, peeking neighbours, arrows, logo tabs, dots) and `SpotlightSlide` (the Sophos testimonial card layout). Any content can go in a slide; `SpotlightSlide` is the usual one.",
      "`items` is an array of `{ content, label, tab }`. `label` names the slide for screen readers and the tab buttons. `tab` is the logo in the row under the slider (when the slider is 1024px+ wide); below that, dots replace it. Leave `tab` out on every item, or pass `showTabs={false}`, to hide the tabs; the dots then show at every width so phones always have a control besides swiping. `showDots={false}` hides the dots.",
      "Motion matches the original (Slick): the track moves one slide with `translateX` over 500ms `ease`; non-focused cards are `opacity: .3; filter: blur(5px); scale: .95`, transitioned over 150ms cubic-bezier(.4,0,.2,1), so the new card sharpens while the row is still sliding. It stops at the first and last slide (`loop` is off), and the matching arrow is disabled there.",
      "The focused slide is 1012px wide (`slideWidth`) inside a 1220px area (`maxWidth`) with 50px white round arrows at its left and right edges. When the slider is narrower than 768px the arrows hide and the slide is the full width minus 20px each side, with swipe to move. All breakpoints are container queries (Tailwind `@container` with `@min-[…]:` variants and `@container` rules in the style tag) on the component's own width, so it adapts to the column it sits in; keep them that way. Neighbours peek past the slide and are clipped by the component's root (`overflow-x: clip`), so put it in a full-width section.",
      "Interaction: drag or swipe more than 50px changes slide (rubber-bands at the ends), clicking a peeking card focuses it, Left/Right keys work while focus is inside the slider. Non-focused cards are `inert`, so Tab only reaches the focused card's play button.",
      "`SpotlightSlide`: black card (`cardBackground` on the slider; tab dividers are `dividerColor`, inactive dots `dotColor`). It is its own container: from a 900px-wide card the text and media sit side by side with a min-height of 460px (below that, text on top and media underneath, 212px tall, 349px from a 600px card). Checked against the card's width, not the viewport, so the play button never covers the quote. Left text column 480px wide with 40px padding: white logo (max 180×36px, pushed to the top), a green `#00F2B3` quote mark, the quote (24px / 1.15, weight 300, -0.08em tracking, closing quote added for you), name (18px) and role (14px). The media sits right, 868px wide and 72px past the card edge, under a black-to-transparent gradient 489px wide. Pass `onPlay` to show the 90px white play button (60px on mobile), which scales to 1.1 on hover over 200ms.",
      "The original uses Lexend Exa (Google Font) for the quote and name and Inter for the role; the component inherits the site's font, so load Lexend Exa on the section if you want the match. The section around it is #EDF2F9 with a 44px weight-300 heading; the heading and 'See all case studies' button aren't part of this component.",
      "Opening the video (the original uses a Fancybox iframe modal for YouTube) is up to the site: `onPlay` is a plain callback.",
      "It is a Client Component (\"use client\"). State is only the active index and the drag offset; the track position, fades and blur are CSS transitions.",
      "Performance: `filter: blur()` on large cards repaints during the 150ms focus change only. If it janks on low-end devices, set `inactiveBlur={0}` and rely on the opacity and scale.",
      "Reduced motion: the row jumps and cards switch without transitions.",
    ],
  },
  {
    slug: "awards-carousel",
    title: "Awards carousel",
    description:
      "A row of award badges on soft pink and purple glows that two pill arrows beside the heading move one card at a time, used on Seemplicity website",
    category: "animations",
    group: "carousels",
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
    promptNotes: [
      "`items` is an array of `{ image, title, label?, href? }`. `image` is the award badge (an <img> or SVG); it is fitted into a 220×100 box centred in the glowing card. `title` is the award name under the card. `href` makes the whole card a link. `label` names the slide for screen readers when `title` isn't plain text.",
      "`heading` and `description` render the section header with the two arrows to its right, as in the original. Leave both out to render just the row (the arrows then sit above it on the right).",
      "Motion matches the original (Swiper): the track moves one card with `translate3d` over 600ms `ease`. From 992px it shows as many whole 280px cards as fit with 40px gaps (4 in a 1280px column), the next card peeks past the edge and is clipped by the component root (`overflow-x: clip`), so put it in a full-width section. It stops when the last card is in view, and the arrow at that end drops to 35% opacity and disables.",
      "Below 992px the arrows hide. Cards keep their 280px width (capped at the row width), so tablets show two or more with the next peeking and phones show one with the next peeking past the edge; swipe (50px threshold, rubber-bands at the ends) plus 10px pill dots (active one 30px wide, others 20% opacity, width over 300ms ease-in-out) move between them. Keep `min-[992px]:` rather than a Tailwind default breakpoint.",
      "Card glow: two blurred SVG shapes from the original, inlined as a data-URI background: `#E3308C` at 50% from the top right and `#A309BB` at 30% along the bottom left, on whatever background the section has (white in the original). Change them with `glowTop` / `glowBottom`.",
      "The original arrows are 120×70 pills with a 1px rgba(160,160,160,.3) border, 45px radius and a 31×23 arrow (#0B0623), 15px apart. They have no hover state in the original; this version adds a faint grey fill on hover and a 0.97 press scale.",
      "Typography from the original: heading 66px / 1, weight 300, -1.72px tracking (36px / 1.2, weight 400 below 992px), max 860px wide; description 18px / 1.6; award names 28px / 1.2 (22px below 992px), -0.56px tracking, 21px above. All #410051. The original uses Cabinet Grotesk (free from Fontshare, not on Google Fonts) for the heading and names and Mona Sans (Google Font) for the description; the component inherits the site's font. The demo uses Hanken Grotesk as the closest Google Font.",
      "Interaction: Left/Right keys move the row while focus is inside; tabbing to a card link that is out of view moves the row to it. Below 992px swipe works with any pointer; on wide screens touch and pen can swipe, the mouse uses the arrows.",
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
      "Motion values match the original exactly: covered cards ease to translateY(-60px), scale(0.96), blur(10px), opacity 0 with smoothstep easing over one card height + gap of scroll, smoothed by a 0.2 per-frame lerp and a 0.2s linear transition. Keep them unless asked.",
      "Stacking runs from 992px wide (`minWidth`). Below that the original switches to a swipe carousel, which is a separate component; here the cards fall back to a plain list with the same gap. Pass `minWidth={0}` to stack on phones too.",
      "It is a Client Component (\"use client\"): it needs a scroll listener. The listener is passive and writes styles in one requestAnimationFrame loop that stops when cards settle, so React never re-renders on scroll.",
      "Don't put the component inside an ancestor with `overflow: hidden` - that breaks position: sticky. An `overflow: auto` scroll container works.",
      "Reduced motion: cards still stack (scrolling is user-driven) but don't slide, scale, blur or fade.",
    ],
  },
  {
    slug: "focus-scroll",
    title: "Focus scroll",
    description:
      "A media column pins in place while text blocks scroll past, crossfading to the visual for the block in focus, used on Sophos website",
    category: "animations",
    group: "pin-scrollers",
    componentName: "FocusScroll",
    files: [
      {
        name: "focus-scroll.tsx",
        path: "src/registry/animations/pin-scrollers/focus-scroll.tsx",
      },
    ],
    usageProps: [
      "items={items.map((item) => ({\n    media: <img src={item.image} alt={item.imageAlt} className=\"size-full object-contain\" />,\n    content: <YourTextBlock {...item} />,\n  }))}",
    ],
    themeToggle: false,
    fullBleed: true,
    controls: [
      { type: "number", name: "stickyTop", label: "Sticky top", default: 180, min: 0, max: 240, step: 2, unit: "px" },
      { type: "number", name: "mediaHeight", label: "Media height", default: 450, min: 280, max: 560, step: 10, unit: "px" },
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
    ],
    promptNotes: [
      "`items` is an array of `{ media, content }` React nodes: `media` is the visual for the pinned column (usually an image with `object-contain`, filling the box), `content` is the text block (title, copy, CTA). The component handles layout and spacing; style the content with the site's typography.",
      "The section heading and intro above it are not part of this component - render them separately in the section.",
      "`stickyTop` should be the site header's height + 62px (the original's header is 118px, so 180). Pass the real value if the header height differs.",
      "Focus logic matches the original's GSAP ScrollTrigger without needing GSAP: a block becomes active when its top passes `stickyTop - 10 + height/4` scrolling down, or its bottom passes `stickyTop - 10 + height/2` scrolling up. Between zones the last active block stays. Crossfade is 500ms cubic-bezier(0.4, 0, 0.2, 1). Keep these unless asked.",
      "Text blocks are at least `mediaHeight` tall with 105px top / 155px bottom padding, as in the original, which spaces the swaps out. `inactiveOpacity` defaults to 1 (no dimming, like the original); lower it to fade out-of-focus text.",
      "Pins once the component itself is 900px wide (`minWidth`). It's a container query on the component's own width, not the viewport, so in a narrow column it stacks even on a wide screen and the text column never gets squeezed. Below that, each item renders as its media followed by its text (the original pins from a 768px viewport and swaps to a swipe carousel below it, which is a separate component). Keep the breakpoint a container query; don't turn it back into a media query.",
      "It is a Client Component (\"use client\"): it needs a scroll listener. The listener is passive, checks positions once per animation frame and only sets state when the active item changes.",
      "Don't put it inside an ancestor with `overflow: hidden` - that breaks position: sticky. Use `overflow: clip` if the section needs to clip a background; an `overflow: auto` scroll container also works.",
      "Accessibility: hidden media are aria-hidden, so give each image real alt text. Reduced motion: the media still swaps, without the fade.",
    ],
  },
  {
    slug: "collapsing-stack",
    title: "Collapsing stack",
    description:
      "Rows of heading, copy and art pin as you scroll, and each new row slides up over the last, folding it into a strip, used on NetApp AI website",
    category: "animations",
    group: "pin-scrollers",
    componentName: "CollapsingStack",
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
    controls: [
      { type: "number", name: "stickyTop", label: "Sticky top", default: 100, min: 0, max: 200, step: 4, unit: "px" },
      { type: "number", name: "peek", label: "Folded art", default: 200, min: 80, max: 320, step: 4, unit: "px" },
      { type: "number", name: "padding", label: "Row padding", default: 30, min: 8, max: 60, step: 2, unit: "px" },
      { type: "number", name: "speed", label: "Scroll per px", default: 1.5, min: 1, max: 3, step: 0.1 },
      { type: "number", name: "smoothing", label: "Smoothing", default: 0, min: 0, max: 2, step: 0.1, unit: "s" },
      { type: "number", name: "radius", label: "Art radius", default: 20, min: 0, max: 40, step: 1, unit: "px" },
      { type: "color", name: "background", label: "Row background", default: "#FFFFFF" },
      { type: "color", name: "borderColor", label: "Divider", default: "#F4F1ED" },
    ],
    promptNotes: [
      "This is the animated list only. The section intro above it in the demo (eyebrow, heading, paragraph, 100px above the list) and the section padding are not part of the component; render them in the section around it. Headings, copy and art come in through `items` as nodes, so typography is the site's own.",
      "`items` is an array of `{ title, description, media }` (the original has 3 rows). `title` stays visible in the pile; `description` folds away when the next row covers the row; `media` fills the art box (any `img`/`video` inside gets `object-cover` and full size). Art is 833:533 (`aspectRatio`).",
      "Layout from 1024px (`minWidth`): 367px text column, 80px gap, art fills the rest with a 20px radius, rows have 30px padding and a 1px `#F4F1ED` hairline on top, description 40px under the heading. Below 1024px the text sits above the art (20px gap), rows have 10px padding, art radius is 10px, description 16px under the heading.",
      "Motion is a dependency-free port of the original GSAP ScrollTrigger code, measured against the live site. Rows are measured in normal flow; then the list goes `position: sticky` at `stickyTop` (100px, the site header) and each row is absolutely placed at its pile slot with a `translateY` that starts it exactly where it sat in flow. Scrolling shrinks those offsets at 1/1.5 of the scroll distance (`speed`), locked to the scrollbar (the original's `scrub: 1` has no effect since there's no tween, so `smoothing` defaults to 0).",
      "Slots: 260px apart from 1024px (`padding` 30 + `peek` 200 + `padding` 30). Below 1024px: 10 + heading line + 20 + peek + 10, i.e. 150px on phones (peek 79px, `mobilePeek`) and about 240px from 768px (peek 170px, `tabletPeek`). A heading taller than that adds its extra lines to the slot.",
      "Folding: as the next row comes within `0.75 × row height − slot` px, the covered row's description goes `grid-template-rows: 1fr → 0fr` and opacity 1 → 0, and its art is cropped from the bottom with `clip-path: inset(0 0 Npx 0 round 20px)` to `peek + distance` (minus the still-open description on small screens, where it sits above the art), keeping a constant gap above the incoming row. Folded descriptions are `inert`. Rows are opaque (`background`) so each covers the last.",
      "Stacking turns on when `stickyTop + 2 × slot` fits in the viewport height (as in the original); otherwise, and with prefers-reduced-motion, it's a plain list with every description open. It re-measures on resize and after web fonts load. Writes go straight to the DOM once per frame; React doesn't re-render on scroll.",
      "Gotcha: `position: sticky` breaks if an ancestor has `overflow: hidden`; use `overflow: clip` on the section if you need clipping. It works inside any scroll container (it finds the nearest one), not just the window.",
      "Original typography: F37 Judge (licensed). Row headings 36px / 1.1 weight 100 (28px below 1024px), copy 20px / 32px #333 with 0.2px tracking (16px / 1.6 below), intro heading 70px / 1.1, eyebrow 16px uppercase 2.4px tracking #0054D7. The demo uses Inter Tight (Google Font) at weight 300 for headings and 400 for copy.",
    ],
  },
  {
    slug: "progress-tabs",
    title: "Progress tabs",
    description:
      "Autoplaying tabs where a fill sweeps across the active tab as its time runs out, then the media panel slides to the next one, used on Seemplicity website",
    category: "animations",
    group: "tabs",
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
    slug: "aurora",
    title: "Aurora",
    description:
      "Soft, flowing light seen through vertical fluted glass, a WebGL shader background used on NetApp website",
    category: "shaders",
    group: "backgrounds",
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
      "It's a named export like the other components: `import { Aurora } from \"@/components/animations/aurora\"`. It doesn't use `cn`, so ignore the note about it.",
      "It renders a bare `<canvas>` that fills its parent. Put it as the first child of a `relative overflow-hidden` section with `className=\"absolute inset-0 -z-10\"` (add `isolate` to the section so content sits above it).",
      "No dependencies: raw WebGL2 with five passes (gradient → polar wrap → time-based liquify → chromatic aberration → vertical blinds). The gradient and polar passes are cached until colors or size change. Prop changes update live without recreating the WebGL context.",
      "Keep the defaults (`AURORA_DEFAULTS`) unless asked. Lower `maxPixelRatio` for very large sections, since the effect is soft.",
      "It renders every animation frame while on screen; off screen (IntersectionObserver), with `paused`, or with prefers-reduced-motion the loop idles on the last frame. A lost WebGL context is rebuilt when the browser restores it. The canvas is aria-hidden. Without WebGL2 it renders nothing, so give the section a background color as a fallback.",
      "It is a Client Component (\"use client\"). Don't mount many on one page - each is a WebGL context and browsers cap them (~16).",
    ],
  },
  {
    slug: "curtain",
    title: "Curtain",
    description:
      "A deep-blue gradient with a curtain of slowly drifting, undulating layers that fades out toward the bottom, a WebGL shader background used on NetApp website",
    category: "shaders",
    group: "backgrounds",
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
      "It's a named export like the other components: `import { Curtain } from \"@/components/animations/curtain\"`. It doesn't use `cn`, so ignore the note about it.",
      "It renders a bare `<canvas>` (aria-hidden) that fills its parent. Put it as the first child of a `relative overflow-hidden` section with `className=\"absolute inset-0 -z-10\"` (add `isolate` to the section so content sits above it). Use light text on top: the background is dark blue to black.",
      "No dependencies: raw WebGL2, a single full-screen pass. The layer shapes come from a fitted field and per-layer shading measured from the original footage, then overlay-blended over a top-to-bottom gradient and faded out toward the bottom. Keep the defaults (`CURTAIN_DEFAULTS`) unless asked.",
      "Prop changes update live without recreating the WebGL context. Reduced motion holds a still frame, as does `paused` or `speed={0}`.",
      "It renders every animation frame while on screen and idles off screen (IntersectionObserver). A lost WebGL context is rebuilt when the browser restores it. Without WebGL2 it renders nothing, so give the section a dark background (e.g. #002F79 or black) as a fallback.",
      "It is a Client Component (\"use client\"). Don't mount many on one page - each is a WebGL context and browsers cap them (~16).",
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
