import { Suspense } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { codeToHtml } from "shiki";
import { getEntry, registry } from "@/registry";
import { ComponentDetail } from "@/components/component-detail";

export function generateStaticParams() {
  return registry.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata(
  props: PageProps<"/components/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const entry = getEntry(slug);
  return entry ? { title: `${entry.title} — Animation Library`, description: entry.description } : {};
}

/**
 * Source is read straight from the registry files, so the Code tab and the
 * copied prompt can never drift from what the preview renders. Cached because
 * the files only change between builds.
 */
async function loadSources(slug: string) {
  "use cache";
  const entry = getEntry(slug)!;
  return Promise.all(
    entry.files.map(async (file) => {
      const code = await readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), file.path), "utf8");
      const html = await codeToHtml(code, { lang: "tsx", theme: "github-dark-default" });
      return { name: file.name, code, html };
    })
  );
}

export default function Page(props: PageProps<"/components/[slug]">) {
  return (
    <Suspense fallback={null}>
      <Detail params={props.params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) notFound();

  const sources = await loadSources(entry.slug);
  return <ComponentDetail slug={entry.slug} sources={sources} />;
}
