import Link from "next/link";
import { Breadcrumbs, JsonLd, SectionHeading } from "@/components/common/Misc";
import { DestinationCard } from "@/components/home/DestinationCard";
import { serverGet } from "@/lib/server-api";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import type { Destination } from "@/types";

export const metadata = buildMetadata({
  title: "Destinations: Travel Guides for Bangladesh & Beyond",
  description: "Explore Cox's Bazar, Sylhet, Sajek, Sundarbans, Bandarban and top international destinations. Best time to visit, tours and hotels.",
  path: "/destinations",
});

export default async function DestinationsPage() {
  const all = (await serverGet<Destination[]>("/destinations?limit=50")) ?? [];
  const domestic = all.filter((d) => d.scope === "domestic");
  const international = all.filter((d) => d.scope === "international");
  const countries = [...new Map(all.map((d) => [d.countrySlug, d.country])).entries()];
  return (
    <div className="container-page py-8">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Destinations", path: "/destinations" }])} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Destinations" }]} className="mb-4" />
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Where to next?</h1>
      <p className="mt-2 max-w-2xl text-ink-600">Guides, tours and stays for the places our travellers love most.</p>
      <nav aria-label="Countries" className="mt-5 flex flex-wrap gap-2">
        {countries.map(([slug, name]) => (
          <Link key={slug} href={`/destinations/${slug}`} className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700">{name}</Link>
        ))}
      </nav>
      {domestic.length > 0 && (
        <section className="mt-10">
          <SectionHeading eyebrow="Bangladesh" title="Discover home" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{domestic.map((d) => <DestinationCard key={d._id} destination={d} />)}</div>
        </section>
      )}
      {international.length > 0 && (
        <section className="mt-12">
          <SectionHeading eyebrow="International" title="Go further" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{international.map((d) => <DestinationCard key={d._id} destination={d} />)}</div>
        </section>
      )}
    </div>
  );
}
