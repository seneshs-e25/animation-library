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
  "Open Customize to tune its props to your brand.",
  "Copy prompt and paste it into your coding agent. It contains the full source and the usage with your values.",
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 pt-10 pb-16 md:px-10 md:pt-14">
      <h1 className="text-4xl font-medium tracking-tight md:text-5xl">Animation Library</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Production-ready motion for enterprise marketing websites. Every component is built on
        transform and opacity, respects reduced motion, and ships as a copyable prompt.
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
