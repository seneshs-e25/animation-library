import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categories, registry } from "@/registry";

const pillars: Record<string, string> = {
  interactions: "Micro-interactions on small UI: button hovers, links, icons.",
  animations: "Section-level motion: scroll triggers, carousels, pin scrollers.",
  shaders: "GPU-driven visuals for heroes and backgrounds.",
};

const steps = [
  "Pick a component from the sidebar and check it in Preview.",
  "Open Customize to tune it. The prompt uses your values, and any colour you change is treated as required.",
  "Copy prompt, paste it into your coding agent and say where it goes, e.g. \u201capply this to our hero CTA buttons\u201d.",
  "The agent adds the motion to your existing component, and only uses the reference code if nothing fits.",
  "Go through the checks at the end of the prompt to confirm it moves right.",
];

/** The sections of a copied prompt, in order. */
const promptSections = [
  {
    title: "Motion spec",
    body: "The requirement: trigger, what changes, timing and easing, interruption and reduced motion, with your Customize values.",
  },
  {
    title: "Colours",
    body: "Colours you changed are used exactly. Untouched defaults are matched to your site\u2019s palette.",
  },
  {
    title: "Implementation rules",
    body: "Which properties to animate so it stays smooth, and the traps to avoid.",
  },
  {
    title: "How to apply",
    body: "Your existing button, card or section first, and the reference component only when there\u2019s nothing suitable. Shader backgrounds go behind the section you name.",
  },
  {
    title: "Reference implementation",
    body: "Working code that meets the spec, for the agent to copy or adapt. For shaders the code is the motion, so it\u2019s used as written and only tuned through props.",
  },
  {
    title: "Check it",
    body: "Hover, interrupt halfway, keyboard focus, reduced motion and touch.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 pt-10 pb-16 md:px-10 md:pt-14">
      <h1 className="text-4xl font-medium tracking-tight md:text-5xl">Animation Library</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Production-ready motion for enterprise marketing websites. Every component respects
        reduced motion and ships as an animation brief: a prompt that tells your coding agent
        exactly how it should move, so it can add the motion to the components you already have.
      </p>

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {categories.map((category) => {
          const first = registry.find((e) => e.category === category.id);
          const count = registry.filter((e) => e.category === category.id).length;
          const body = (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{category.title}</h2>
                <span className="text-xs text-muted-foreground">
                  {count ? `${count} component${count > 1 ? "s" : ""}` : "Soon"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{pillars[category.id]}</p>
            </>
          );
          return first ? (
            <Link
              key={category.id}
              href={`/components/${first.slug}`}
              className="rounded-2xl border bg-card p-5 transition-colors duration-150 ease-[ease] hover:bg-white/[0.04]"
            >
              {body}
            </Link>
          ) : (
            <div key={category.id} className="rounded-2xl border p-5 opacity-60">
              {body}
            </div>
          );
        })}
      </div>

      <h2 className="mt-14 text-xl font-medium tracking-tight">How to use</h2>
      <ol className="mt-4 space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-muted-foreground">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs text-foreground">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <h2 className="mt-14 text-xl font-medium tracking-tight">What&apos;s in a prompt</h2>
      <p className="mt-2 text-muted-foreground">
        The motion is the requirement. Your site keeps its own markup, fonts and spacing, and the code
        is there as a reference.
      </p>
      <dl className="mt-5 divide-y rounded-2xl border">
        {promptSections.map((section) => (
          <div key={section.title} className="grid gap-1 px-5 py-4 md:grid-cols-[200px_1fr] md:gap-6">
            <dt className="font-medium">{section.title}</dt>
            <dd className="text-sm text-muted-foreground md:text-base">{section.body}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted-foreground">
        Button hovers, image hovers and shaders use this format today. The other components are moving to it.
      </p>

      {registry[0] && (
        <Link
          href={`/components/${registry[0].slug}`}
          className="mt-10 inline-flex items-center gap-2 text-sm font-medium"
        >
          Browse components <ArrowRight className="size-4" />
        </Link>
      )}
    </main>
  );
}
