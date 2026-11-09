import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/common/Misc";
import { buildMetadata } from "@/lib/seo";
import { INFO_PAGES } from "./content";

type Params = { params: Promise<{ page: string }> };

export function generateStaticParams() {
  return Object.keys(INFO_PAGES).map((page) => ({ page }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { page } = await params;
  const p = INFO_PAGES[page];
  return p ? buildMetadata({ title: p.title, description: p.description, path: `/info/${page}` }) : { title: "Not found" };
}

export default async function InfoPage({ params }: Params) {
  const { page } = await params;
  const p = INFO_PAGES[page];
  if (!p) notFound();
  return (
    <div className="container-page max-w-3xl py-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: p.title }]} className="mb-4" />
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{p.title}</h1>
      <p className="mt-3 text-lg text-ink-600">{p.description}</p>
      <div className="mt-8 space-y-7">
        {p.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-xl font-bold">{s.h}</h2>
            {s.p.map((para, i) => <p key={i} className="mt-2 leading-relaxed text-ink-700">{para}</p>)}
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-ink-500">Last updated: November 2026</p>
    </div>
  );
}
