"use client";

import * as React from "react";
import Link from "next/link";
import { levelLabels, type ComponentLevel } from "@/registry/types";
import { cn } from "@/lib/utils";

const levels: { id: ComponentLevel; body: string }[] = [
  { id: "atom", body: "A single element, like a button, a number or a headline." },
  { id: "box", body: "A card or block made of a few elements." },
  { id: "section", body: "A full band of the page, with its own layout and content." },
  { id: "page", body: "Behaviour that runs across several sections." },
];

type Item = { slug: string; title: string; level: ComponentLevel };

/** Level pills on the Introduction page; the selected one lists its components. */
export function LevelBrowser({ items }: { items: Item[] }) {
  const [active, setActive] = React.useState<ComponentLevel>("atom");
  const current = levels.find((l) => l.id === active)!;
  const list = items.filter((item) => item.level === active);

  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium text-muted-foreground">Components by level</h2>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Component level">
        {levels.map((level) => {
          const count = items.filter((item) => item.level === level.id).length;
          const selected = level.id === active;
          return (
            <button
              key={level.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(level.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ease-[ease]",
                selected
                  ? "bg-foreground text-background"
                  : "bg-white/10 text-muted-foreground hover:bg-white/15 hover:text-foreground",
              )}
            >
              {levelLabels[level.id]} level
              <span className={cn("ml-1.5", selected ? "opacity-60" : "opacity-70")}>{count}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-4 rounded-2xl border p-5">
        <p className="text-sm text-muted-foreground">{current.body}</p>
        {list.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {list.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/components/${item.slug}`}
                  className="block rounded-lg border px-3 py-1.5 text-sm transition-colors duration-150 ease-[ease] hover:bg-white/[0.04]"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">None yet.</p>
        )}
      </div>
    </section>
  );
}
