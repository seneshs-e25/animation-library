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

/**
 * Builds the prompt a developer pastes into their coding agent to add the
 * component to their own site.
 */
export function buildPrompt(
  entry: RegistryEntry,
  sources: { name: string; code: string }[],
  values: ControlValues
) {
  const files = sources
    .map((f) => `\`components/animations/${f.name}\`\n\n\`\`\`tsx\n${f.code.trim()}\n\`\`\``)
    .join("\n\n");

  const deps = entry.dependencies?.length
    ? `\nInstall these dependencies first: ${entry.dependencies.join(", ")}.\n`
    : "";

  const notes = [
    "Keep the easing curves, durations and the prefers-reduced-motion handling as written.",
    "The file imports `cn` from `@/lib/utils` (the shadcn/ui helper). If the project doesn't have it, create it with `clsx` + `tailwind-merge`, or replace `cn(...)` with a plain class string.",
    ...(entry.promptNotes ?? []),
  ];

  return `Add the "${entry.title}" animation to this project.

${entry.description}.

Stack: React + Tailwind CSS v4 (Next.js App Router). If the project uses a different setup, adapt the component while keeping the same motion.
${deps}
Create the following file${sources.length > 1 ? "s" : ""}:

${files}

Then use it like this:

\`\`\`tsx
${buildUsage(entry, values)}
\`\`\`

Notes:
${notes.map((n) => `- ${n}`).join("\n")}
`;
}
