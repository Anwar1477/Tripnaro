import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarHeart, Tag } from "lucide-react";
import { LinkButton } from "@/components/common/Button";
import { Breadcrumbs, JsonLd, SectionHeading } from "@/components/common/Misc";
import { HotelCard } from "@/components/hotels/HotelCard";
import { DestinationCard } from "@/components/home/DestinationCard";
import { TourCard } from "@/components/tours/TourCard";
import { serverGet } from "@/lib/server-api";
import { breadcrumbJsonLd, buildMetadata, siteConfig } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";
import type { Destination, Hotel, Tour } from "@/types";

type Resolved =
  | { kind: "destination"; destination: Destination; tours: Tour[]; hotels: Hotel[] }
  | { kind: "country"; country: string; countrySlug: string; destinations: Destination[]; tours: Tour[]; hotels: Hotel[] };
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await serverGet<Resolved>(`/destinations/${slug}`);
  if (!data) return { title: "Destination not found" };
  if (data.kind === "country") {
    return buildMetadata({ title: `${data.country} Travel Guide: Top Places, Tours & Hotels`, description: `Plan a trip to ${data.country}: ${data.destinations.map((d) => d.name).join(", ")}. Tour packages, hotels and travel tips.`, path: `/destinations/${slug}`, image: data.destinations[0]?.image });
  }
  const d = data.destination;
  return buildMetadata({ title: `${d.name}, ${d.country}: Travel Guide, Tours & Hotels`, description: d.tagline ?? d.description.slice(0, 155), path: `/destinations/${slug}`, image: d.image });
}

export default async function DestinationPage({ params }: Params) {
  const { slug } = await params;
  const data = await serverGet<Resolved>(`/destinations/${slug}`);
  if (!data) notFound();

  if (data.kind === "country") {
    return (
      <div className="container-page py-8">
        <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Destinations", path: "/destinations" }, { name: data.country, path: `/destinations/${slug}` }])} />
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Destinations", href: "/destinations" }, { name: data.country }]} className="mb-4" />
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">Travel {data.country}</h1>
        <p className="mt-2 text-ink-600">{data.destinations.length} destinations, tours and handpicked stays.</p>
        <section className="mt-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{data.destinations.map((d) => <DestinationCard key={d._id} destination={d} />)}</div>
        </section>
        <Listings tours={data.tours} hotels={data.hotels} name={data.country} />
      </div>
    );
  }

  const d = data.destination;
  const placeLd = { "@context": "https://schema.org", "@type": "TouristDestination", name: d.name, description: d.description, image: d.image, url: `${siteConfig.url}/destinations/${d.slug}`, containedInPlace: { "@type": "Country", name: d.country } };

  return (
    <div>
      <JsonLd data={placeLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Destinations", path: "/destinations" }, { name: d.country, path: `/destinations/${d.countrySlug}` }, { name: d.name, path: `/destinations/${d.slug}` }])} />
      <section className="relative isolate overflow-hidden bg-ink-900 text-white">
        <Image src={d.image} alt={d.name} fill priority sizes="100vw" className="-z-10 object-cover opacity-55" />
        <div className="container-page py-14 sm:py-24">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Destinations", href: "/destinations" }, { name: d.country, href: `/destinations/${d.countrySlug}` }, { name: d.name }]} className="mb-4 text-white/80 [&_a]:text-white/80" />
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">{d.name}</h1>
          {d.tagline && <p className="mt-3 max-w-2xl text-lg text-white/90">{d.tagline}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href={`/tours/${d.slug}`} variant="accent">Tours in {d.name}</LinkButton>
            <LinkButton href={`/hotels/${d.slug}`} variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">Hotels in {d.name}</LinkButton>
          </div>
        </div>
      </section>
      <div className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <section>
            <h2 className="text-xl font-bold">About {d.name}</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-600">{d.description}</p>
            {d.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{d.tags.map((t) => <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800"><Tag className="size-3" />{t}</span>)}</div>}
          </section>
          <aside className="card space-y-3 self-start p-5 text-sm">
            {d.bestTimeToVisit && <p className="flex items-start gap-2"><CalendarHeart className="mt-0.5 size-4 shrink-0 text-coral-500" /><span><strong>Best time to visit:</strong> {d.bestTimeToVisit}</span></p>}
            {d.startingPrice > 0 && <p><strong>Trips from</strong> {formatPrice(d.startingPrice)}</p>}
            {d.region && <p><strong>Region:</strong> {d.region}</p>}
          </aside>
        </div>
        {d.gallery.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {d.gallery.slice(0, 4).map((g, i) => <div key={g + i} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-100"><Image src={g} alt={`${d.name} photo ${i + 1}`} fill sizes="25vw" className="object-cover" /></div>)}
          </div>
        )}
        <Listings tours={data.tours} hotels={data.hotels} name={d.name} slug={d.slug} />
      </div>
    </div>
  );
}

function Listings({ tours, hotels, name, slug }: { tours: Tour[]; hotels: Hotel[]; name: string; slug?: string }) {
  return (
    <>
      {tours.length > 0 && (
        <section className="mt-12">
          <SectionHeading title={`Tours in ${name}`} action={slug ? <LinkButton href={`/tours/${slug}`} variant="outline" size="sm">All tours</LinkButton> : undefined} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{tours.slice(0, 4).map((t) => <TourCard key={t._id} tour={t} />)}</div>
        </section>
      )}
      {hotels.length > 0 && (
        <section className="mt-12">
          <SectionHeading title={`Where to stay in ${name}`} action={slug ? <LinkButton href={`/hotels/${slug}`} variant="outline" size="sm">All hotels</LinkButton> : undefined} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{hotels.slice(0, 4).map((h) => <HotelCard key={h._id} hotel={h} />)}</div>
        </section>
      )}
    </>
  );
}
