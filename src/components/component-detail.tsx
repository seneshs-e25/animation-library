"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ControlsPanel } from "@/components/controls-panel";
import { CopyIcon } from "@/components/copy-icon";
import { PreviewStage } from "@/components/preview-stage";
import { getDefaultValues, getEntry, getNeighbors, levelLabels, type ControlValues } from "@/registry";
import { previews } from "@/registry/previews";
import { buildPrompt, buildUsage } from "@/lib/prompt";
import { cn } from "@/lib/utils";

type Source = { name: string; code: string; html: string };

/**
 * Renders the description with the site name in "used on <Site> website"
 * linked to the source, e.g. "used on [Ironclad] website".
 */
function Description({ text, source }: { text: string; source?: string }) {
  const match = source ? text.match(/^(.*used on )(.+?)( website)$/) : null;
  if (!match) return text;
  const [, before, site, after] = match;
  return (
    <>
      {before}
      <a
        href={source}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 transition-colors duration-150 hover:text-foreground"
      >
        {site}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      {after}
    </>
  );
}

export function ComponentDetail({ slug, sources }: { slug: string; sources: Source[] }) {
  const entry = getEntry(slug)!;
  const { prev, next } = getNeighbors(slug);
  const Preview = previews[slug];

  const [values, setValues] = React.useState<ControlValues>(() => getDefaultValues(entry));
  const [customizing, setCustomizing] = React.useState(false);
  const hasControls = entry.controls.length > 0;
  const usage = buildUsage(entry, values);
  const prompt = buildPrompt(entry, sources, values);

  async function copy(text: string, message: string) {
    try {
      await writeClipboard(text);
      toast.success(message);
    } catch {
      toast.error("Couldn't access the clipboard");
      throw new Error("copy failed");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pt-6 pb-16 md:px-10 md:pt-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-medium tracking-tight md:text-5xl">{entry.title}</h1>
            <span
              className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
            >
              {levelLabels[entry.level]} level component
            </span>
          </div>
          <p className="mt-3 text-lg text-muted-foreground">
            <Description text={entry.description} source={entry.source} />
          </p>
          {entry.recreated && (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-medium text-foreground">
                Recreated
              </span>
              Rebuilt by studying the live site. It runs on {entry.recreated}, so there was no component source code to port.
            </p>
          )}
        </div>
        <nav className="flex shrink-0 gap-2" aria-label="Component navigation">
          <NavArrow href={prev && `/components/${prev.slug}`} label={prev?.title} dir="prev" />
          <NavArrow href={next && `/components/${next.slug}`} label={next?.title} dir="next" />
        </nav>
      </div>

      <Tabs defaultValue="preview" className="mt-8 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="h-10! rounded-full bg-white/[0.04] p-1">
            {["preview", "code", "prompt"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-full px-4 capitalize data-[state=active]:border-transparent! data-[state=active]:bg-white/10! data-[state=active]:shadow-none"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex gap-2">
            {hasControls && (
              <Button
                variant="outline"
                className={cn("h-10 rounded-full px-4", customizing && "bg-white/10")}
                aria-pressed={customizing}
                onClick={() => setCustomizing((v) => !v)}
              >
                <SlidersHorizontal />
                Customize
              </Button>
            )}
            <CopyButton
              className="h-10 rounded-full px-4"
              onCopy={() => copy(prompt, "Prompt copied")}
            >
              Copy prompt
            </CopyButton>
          </div>
        </div>

        <TabsContent value="preview">
          <div
            className={cn(
              "grid min-h-[min(62vh,580px)] overflow-hidden rounded-3xl border bg-card",
              customizing && "md:grid-cols-[1fr_300px]"
            )}
          >
            <PreviewStage
              themeToggle={entry.themeToggle ?? true}
              fullBleed={entry.fullBleed}
              defaultTheme={entry.defaultTheme}
              clickNotice={entry.group === "button-hovers"}
            >
              {Preview ? <Preview values={values} /> : <p className="text-muted-foreground">No preview</p>}
            </PreviewStage>
            {customizing && (
              <aside className="border-t p-5 md:border-t-0 md:border-l">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-sm font-medium">Props</h2>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Reset props"
                        onClick={() => setValues(getDefaultValues(entry))}
                      >
                        <RotateCcw />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset</TooltipContent>
                  </Tooltip>
                </div>
                <ControlsPanel
                  controls={entry.controls}
                  values={values}
                  onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))}
                />
              </aside>
            )}
          </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <CodeCard title="Usage" onCopy={() => copy(usage, "Usage copied")}>
            <pre className="overflow-x-auto px-6 py-5 font-mono text-[13px] leading-[1.7] text-foreground/90">
              {usage}
            </pre>
          </CodeCard>
          {sources.map((file) => (
            <CodeCard key={file.name} title={file.name} onCopy={() => copy(file.code, "Code copied")}>
              <div className="code-block max-h-[560px] overflow-auto" dangerouslySetInnerHTML={{ __html: file.html }} />
            </CodeCard>
          ))}
        </TabsContent>

        <TabsContent value="prompt">
          <CodeCard title="Prompt" onCopy={() => copy(prompt, "Prompt copied")}>
            <pre className="max-h-[640px] overflow-auto px-6 py-5 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap text-foreground/90">
              {prompt}
            </pre>
          </CodeCard>
          {hasControls && (
            <p className="mt-3 text-sm text-muted-foreground">
              The usage in this prompt reflects your current Customize settings.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

/** Clipboard API, falling back to execCommand where it's blocked (iframes, embedded viewers). */
async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    if (!ok) throw new Error("copy failed");
  }
}

function NavArrow({ href, label, dir }: { href?: string; label?: string; dir: "prev" | "next" }) {
  const Icon = dir === "prev" ? ArrowLeft : ArrowRight;
  const aria = dir === "prev" ? "Previous component" : "Next component";

  if (!href) {
    return (
      <Button variant="secondary" size="icon" className="size-10 rounded-full" disabled aria-label={aria}>
        <Icon />
      </Button>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="secondary" size="icon" className="size-10 rounded-full" asChild>
          <Link href={href} aria-label={aria}>
            <Icon />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function CopyButton({
  onCopy,
  className,
  children,
}: {
  onCopy: () => Promise<void>;
  className?: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <Button
      variant="outline"
      size={children ? "default" : "icon-sm"}
      className={className}
      aria-label={children ? undefined : "Copy"}
      onClick={() => onCopy().then(() => setCopied(true), () => {})}
    >
      <CopyIcon copied={copied} />
      {children}
    </Button>
  );
}

function CodeCard({
  title,
  onCopy,
  children,
}: {
  title: string;
  onCopy: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">{title}</span>
        <CopyButton onCopy={onCopy} className="border-0 bg-transparent" />
      </header>
      {children}
    </section>
  );
}
