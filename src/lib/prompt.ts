import type { Control, ControlValues, RegistryEntry } from "@/registry/types";

function formatProp(control: Control, value: ControlValues[string]) {
  if (typeof value === "string") return `${control.name}="${value}"`;
  if (value === true) return control.name;
  return `${control.name}={${value}}`;
}

/** JSX usage snippet, only including props that differ from the defaults. */
export function buildUsage(entry: RegistryEntry, values: ControlValues) {
  const props = [
    ...(entry.usageProps ?? []),
    ...entry.controls
    .filter((c) => values[c.name] !== undefined && (c.always || values[c.name] !== c.default))
    .map((c) => formatProp(c, values[c.name])),
  ];

  const open = props.length
    ? `<${entry.componentName}\n  ${props.join("\n  ")}\n>`
    : `<${entry.componentName}>`;

  return entry.usageChildren
    ? `${open}\n  ${entry.usageChildren}\n</${entry.componentName}>`
    : open.replace(/>$/, " />");
}

type Source = { name: string; code: string };

/** Notes about setting up the reference component (not the motion itself). */
function setupNotes(entry: RegistryEntry, sources: Source[]) {
  const usesCn = sources.some((f) => f.code.includes("@/lib/utils"));
  const colorProps = entry.controls.filter((c) => c.type === "color").map((c) => `\`${c.name}\``);
  // Full-bleed sections and backgrounds are the background, so the
  // "place it on a dark background" advice doesn't apply to them.
  const darkOnly = entry.themeToggle === false && !entry.fullBleed;

  return [
    ...(usesCn
      ? [
          "The file imports `cn` from `@/lib/utils` (the shadcn/ui helper). If the project already has it, keep the import as is. If not, create a `utils.ts` in the project's lib folder that exports `cn` built from `clsx` + `tailwind-merge` (install both), and point the import at it with the project's existing path alias or a relative path. Don't change the build config or tsconfig just to add an alias.",
        ]
      : []),
    ...(darkOnly
      ? [
          colorProps.length
            ? `It's designed for a dark background, so its default colours are light. If you place it on a light background, pass dark values through its colour props (${colorProps.join(", ")}) where you render it, rather than editing the defaults in the file.`
            : "It's designed for a dark background. If the page is light where you place it, put it inside a dark section rather than editing the component.",
        ]
      : []),
    ...(entry.promptNotes ?? []),
  ];
}

function fileBlocks(sources: Source[]) {
  return sources
    .map((f) => `\`components/animations/${f.name}\`\n\n\`\`\`tsx\n${f.code.trim()}\n\`\`\``)
    .join("\n\n");
}

/** Bullet list; items left empty by an option token are dropped. */
const bullets = (items: string[]) =>
  items
    .filter((n) => n.trim())
    .map((n) => `- ${n}`)
    .join("\n");

/**
 * Replaces tokens with the developer's current Customize values:
 * - `{duration}` -> the value, e.g. `400`
 * - `{duration*7/3}` -> a value derived from it, rounded, e.g. `933`
 * - `{direction|left=from the left|bottom=from the bottom}` -> the text for
 *   the chosen option, so the spec only describes what they picked. `*=`
 *   is the fallback for any other value.
 */
function fillValues(text: string, entry: RegistryEntry, values: ControlValues): string {
  // Option text can hold tokens of its own, e.g. `{duration|0=instantly|*=over {duration}ms}`.
  // Tokens with no braces inside are filled first, so repeat until nothing changes.
  const filled = fillTokens(text, entry, values);
  return filled === text ? filled : fillValues(filled, entry, values);
}

function fillTokens(text: string, entry: RegistryEntry, values: ControlValues) {
  return text.replace(
    /\{(\w+)(?:\*(\d+)(?:\/(\d+))?)?((?:\|[^|{}=]+=[^|{}]*)*)\}/g,
    (match, name: string, mul?: string, div?: string, cases?: string) => {
      const control = entry.controls.find((c) => c.name === name);
      if (!control) return match;
      const raw = values[name] ?? control.default;
      if (mul) return String(Math.round((Number(raw) * Number(mul)) / Number(div ?? 1)));
      const value = String(raw);
      if (!cases) return value;
      const options = Object.fromEntries(
        cases
          .slice(1)
          .split("|")
          .map((c) => {
            const i = c.indexOf("=");
            return [c.slice(0, i), c.slice(i + 1)];
          })
      );
      return options[value] ?? options["*"] ?? value;
    }
  );
}

/**
 * Builds the prompt a developer pastes into their coding agent. Entries with
 * a `motion` spec get a motion brief (the animation is the requirement, the
 * code is a reference); the rest still get the install-style prompt.
 */
export function buildPrompt(entry: RegistryEntry, sources: Source[], values: ControlValues) {
  return entry.motion
    ? buildMotionPrompt(entry, sources, values)
    : buildInstallPrompt(entry, sources, values);
}

/**
 * Colours the effect uses. Ones the developer changed in Customize are
 * deliberate, so the agent must use them; untouched defaults are only a
 * reference, and the agent should map them to the site's palette.
 */
function colourSpec(entry: RegistryEntry, values: ControlValues) {
  const colours = entry.controls.filter((c) => c.type === "color");
  if (!colours.length) return [];

  const line = (c: (typeof colours)[number]) => `${c.label}: \`${values[c.name] ?? c.default}\``;
  const chosen = colours.filter(
    (c) => values[c.name] !== undefined && String(values[c.name]).toLowerCase() !== c.default.toLowerCase()
  );
  const defaults = colours.filter((c) => !chosen.includes(c));

  return [
    ...(chosen.length
      ? [`**Colours I chose (use these exactly):**\n${bullets(chosen.map(line))}`]
      : []),
    ...(defaults.length
      ? [
          `**Reference colours${chosen.length ? " for the rest" : ""}:** these are the library's defaults. If the site's palette has a natural match for a role (its brand, accent, surface or text colours), use the site's colour instead. Use these only where the site has no equivalent, and keep text readable in every state.\n${bullets(defaults.map(line))}`,
        ]
      : []),
  ];
}

function buildMotionPrompt(entry: RegistryEntry, sources: Source[], values: ControlValues) {
  const m = entry.motion!;
  const f = (text: string) => fillValues(text, entry, values);
  const deps = entry.dependencies?.length
    ? `Install these dependencies first: ${entry.dependencies.join(", ")}.\n\n`
    : "";

  const spec = [
    `**Trigger:** ${f(m.trigger)}`,
    `**What changes:**\n${bullets(m.states.map(f))}`,
    `**Timing:**\n${bullets(m.timing.map(f))}`,
    `**Interruption:** ${f(m.interruption)}`,
    `**Reduced motion:** ${f(m.reducedMotion)}`,
    ...(m.responsive ? [`**Responsive:** ${f(m.responsive)}`] : []),
    ...colourSpec(entry, values),
  ].join("\n\n");

  const required = m.implementation === "required";

  const rules = [
    ...(required
      ? [
          "Use the component as written. Its motion is the code itself, so don't rewrite it in CSS, a canvas 2D loop or an animation library. Tune it only through its props.",
        ]
      : [
          "Match the motion spec exactly: the same properties, values, durations and easing curves. Don't change them unless I ask.",
          "Use CSS transitions or plain JS. Don't add an animation library.",
        ]),
    ...(m.rules ?? []).map(f),
  ];

  const apply = m.apply
    ? bullets(m.apply.map(f))
    : `- **If the site already has the element this belongs on** (its own button, card or section component), add this motion to that element using the site's existing styling approach. Keep its markup, colours and spacing, and only add what the motion needs.
- **If there's nothing suitable**, add the reference component below and use it.`;

  const intro = required
    ? "The spec below describes what it does and what each setting controls. The motion lives in the code, so the component is used as written; the site's own content and layout stay as they are."
    : "The motion below is the requirement. The site's own fonts, spacing and markup stay as they are; colours are covered in the spec.";

  const codeIntro = required
    ? `## Implementation (use as written)

React + WebGL2, no dependencies. Create ${sources.length > 1 ? "these files" : "this file"} in an \`animations\` folder inside the project's components directory (e.g. \`src/components/animations/\` if the project uses \`src/\`), without changing the code.`
    : `## Reference implementation

React + Tailwind CSS v4. It's a working example of the spec; adapt it to the site's stack if needed. Create ${sources.length > 1 ? "these files" : "this file"} in an \`animations\` folder inside the project's components directory (e.g. \`src/components/animations/\` if the project uses \`src/\`).`;

  return `# ${entry.title}: animation brief

Add the "${entry.title}" animation to this site. ${f(m.intent)}
${entry.source ? `\nSeen live on ${entry.source}. Open it to compare the motion if anything in the spec is unclear.\n` : ""}
${intro}

## Motion spec

${spec}

## Implementation rules

${bullets(rules)}

## How to apply

${apply}

${codeIntro}

${deps}${fileBlocks(sources)}

Usage:

\`\`\`tsx
${buildUsage(entry, values)}
\`\`\`

${bullets(setupNotes(entry, sources))}

## Check it

When it's in, confirm each of these:

${bullets(m.checks.map(f))}
`;
}

function buildInstallPrompt(entry: RegistryEntry, sources: Source[], values: ControlValues) {
  const deps = entry.dependencies?.length
    ? `\nInstall these dependencies first: ${entry.dependencies.join(", ")}.\n`
    : "";

  const notes = [
    "Keep the easing curves, durations and the prefers-reduced-motion handling as written.",
    ...setupNotes(entry, sources),
  ];

  return `Add the "${entry.title}" animation to this project.

${entry.description}.
${entry.source ? `\nSeen live on ${entry.source}.\n` : ""}
Stack: React + Tailwind CSS v4 (Next.js App Router). If the project uses a different setup, adapt the component while keeping the same motion.
${deps}
Create the following file${sources.length > 1 ? "s" : ""} in an \`animations\` folder inside the project's components directory (e.g. \`src/components/animations/\` if the project uses \`src/\`):

${fileBlocks(sources)}

Then use it like this:

\`\`\`tsx
${buildUsage(entry, values)}
\`\`\`

Notes:
${bullets(notes)}
`;
}
