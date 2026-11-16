/**
 * The library's shared motion vocabulary. Components take plain CSS values
 * (so their files stay standalone when copied into a site), and their
 * Customize controls offer these named options, so every component speaks
 * the same curves.
 *
 * No ease-in: it starts slow, which makes UI feel late.
 */
export const easings = {
  /** Strong ease-out: things entering or responding to input. */
  out: "cubic-bezier(0.23, 1, 0.32, 1)",
  /** Expo ease-out: a longer, softer settle. */
  expo: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** iOS drawer curve: quick but even, no snap-then-crawl. Smooth sweeps and panels. */
  drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
  /** Strong ease-in-out: something moving from one place to another on screen. */
  inOut: "cubic-bezier(0.77, 0, 0.175, 1)",
  /**
   * eight25media.com's image zoom curve: a quick start that settles gently.
   * Not a preset in `easingOptions`, so the Customize panel lists it as Custom.
   */
  cssOut: "cubic-bezier(0, 0, 0.58, 1)",
  /** Plain CSS ease-in-out: the gentle browser curve, for matching originals that use it. */
  easeInOut: "ease-in-out",
  /** Plain ease: small colour or opacity changes. */
  ease: "ease",
  /** Constant motion: marquees, progress fills. */
  linear: "linear",
} as const;

/** Options for an easing `select` control. Values are the CSS timing functions. */
export const easingOptions = [
  { label: "Drawer (smooth)", value: easings.drawer },
  { label: "Strong ease-out", value: easings.out },
  { label: "Expo ease-out", value: easings.expo },
  { label: "Strong ease-in-out", value: easings.inOut },
  { label: "Ease-in-out", value: easings.easeInOut },
  { label: "Ease", value: easings.ease },
  { label: "Linear", value: easings.linear },
];
