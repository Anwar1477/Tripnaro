import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, MapPin, Moon, Users, X } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { LinkButton } from "@/components/common/Button";
import { Gallery } from "@/components/common/Gallery";
import { Breadcrumbs, JsonLd, RatingPill, SectionHeading } from "@/components/common/Misc";
import { ReviewsSection } from "@/components/common/Reviews";
import { WishlistButton } from "@/components/common/WishlistButton";
import { TourBookingWidget } from "@/components/tours/TourBookingWidget";
import { TourCard } from "@/components/tours/TourCard";
import { serverGet, serverGetWithMeta } from "@/lib/server-api";
import { breadcrumbJsonLd, buildMetadata, siteConfig } from "@/lib/seo";
import { titleCase } from "@/lib/utils";
import type { Destination, Review, Tour } from "@/types";

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const detail = await serverGet<{ tour: Tour; reviews: Review[]; similar: Tour[] }>(`/tours/${slug}`);
  if (detail) return { kind: "tour" as const, ...detail };
  const dest = await serverGet<{ kind: string; destination?: Destination }>(`/destinations/${slug}`);
  if (dest?.kind === "destination" && dest.destination) {
    const tours = await serverGetWithMeta<Tour[]>(`/tours?destination=${slug}&limit=24`);
    return { kind: "destination" as const, destination: dest.destination, tours: tours?.data ?? [] };
  }
  return null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Tour not found" };
  if (data.kind === "destination") {
    const d = data.destination;
    return buildMetadata({ title: `${d.name} Tour Packages: Prices & Itineraries`, description: `Book ${d.name} tour packages with fixed departures, hotels, transfers and guides. ${data.tours.length} trips from trusted Tripnaro partners.`, path: `/tours/${slug}`, image: d.image });
  }
  const t = data.tour;
  return buildMetadata({ title: `${t.title}: ${t.durationDays}D/${t.durationNights}N Tour Package`, description: t.shortDescription ?? t.overview.slice(0, 155), path: `/tours/${slug}`, image: t.images[0] });
}

export default async function TourSlugPage({ params }: Params) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  if (data.kind === "destination") {
    const d = data.destination;
    return (
      <div className="container-page py-8">
        <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Tours", path: "/tours" }, { name: d.name, path: `/tours/${slug}` }])} />
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Tours", href: "/tours" }, { name: d.name }]} className="mb-4" />
        <SectionHeading as="h1" eyebrow={d.country} title={`${d.name} tour packages`} description={d.tagline} action={<LinkButton href={`/tours?destination=${slug}`}>Filter by date & budget</LinkButton>} />
        {data.tours.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.tours.map((t) => <TourCard key={t._id} tour={t} />)}</div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-ink-600">No fixed packages to {d.name} right now.</p>
            <LinkButton href={`/tours/custom-request?destination=${encodeURIComponent(d.name)}`} className="mt-4">Request a custom {d.name} trip</LinkButton>
          </div>
        )}
        <p className="mt-8 text-sm text-ink-500">
          Also see <Link href={`/hotels/${slug}`} className="font-semibold text-brand-700 hover:underline">hotels in {d.name}</Link> and our <Link href={`/destinations/${slug}`} className="font-semibold text-brand-700 hover:underline">{d.name} travel guide</Link>.
        </p>
      </div>
    );
  }

  const { tour, reviews, similar } = data;
  const nextDep = tour.departures.find((d) => d.seatsLeft > 0);
  const tourLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.overview,
    image: tour.images,
    url: `${siteConfig.url}/tours/${tour.slug}`,
    touristType: tour.categories,
    itinerary: { "@type": "ItemList", itemListElement: tour.itinerary.map((d, i) => ({ "@type": "ListItem", position: i + 1, name: `Day ${d.day}: ${d.title}` })) },
    offers: {
      "@type": "Offer",
      price: tour.priceAdult,
      priceCurrency: "BDT",
      availability: nextDep ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      ...(nextDep ? { validFrom: nextDep.date } : {}),
      url: `${siteConfig.url}/tours/${tour.slug}`,
    },
    ...(tour.reviewCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: tour.rating, reviewCount: tour.reviewCount, bestRating: 5 } } : {}),
  };

  return (
    <div className="container-page py-6">
      <JsonLd data={tourLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Tours", path: "/tours" }, { name: tour.destination.name, path: `/tours/${tour.destination.slug}` }, { name: tour.title, path: `/tours/${tour.slug}` }])} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Tours", href: "/tours" }, { name: tour.destination.name, href: `/tours/${tour.destination.slug}` }, { name: tour.title }]} className="mb-4" />

      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone="brand">{tour.scope === "domestic" ? "Bangladesh" : "International"}</Badge>
            {tour.categories.map((c) => <Badge key={c}>{titleCase(c)}</Badge>)}
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{tour.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600">
            <span className="flex items-center gap-1.5"><Clock className="size-4 text-brand-600" />{tour.durationDays} days</span>
            <span className="flex items-center gap-1.5"><Moon className="size-4 text-brand-600" />{tour.durationNights} nights</span>
            {tour.startLocation && <span className="flex items-center gap-1.5"><MapPin className="size-4 text-brand-600" />Starts {tour.startLocation}</span>}
            {tour.groupSize && <span className="flex items-center gap-1.5"><Users className="size-4 text-brand-600" />{tour.groupSize}</span>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {tour.reviewCount > 0 && <RatingPill rating={tour.rating} reviews={tour.reviewCount} />}
          <WishlistButton itemType="tour" itemId={tour._id} className="border border-ink-200" />
        </div>
      </div>

      <Gallery images={tour.images} alt={tour.title} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_21rem]">
        <div className="min-w-0 space-y-8">
          <section className="card p-5 sm:p-6" aria-labelledby="overview-h">
            <h2 id="overview-h" className="text-xl font-bold">Overview</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-600">{tour.overview}</p>
            {tour.highlights.length > 0 && (
              <>
                <h3 className="mt-5 font-bold">Highlights</h3>
                <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  {tour.highlights.map((h) => <li key={h} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-brand-600" />{h}</li>)}
                </ul>
              </>
            )}
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="itinerary-h">
            <h2 id="itinerary-h" className="text-xl font-bold">Day-by-day itinerary</h2>
            <ol className="mt-5 space-y-0">
              {tour.itinerary.map((d, i) => (
                <li key={d.day} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < tour.itinerary.length - 1 && <span aria-hidden className="absolute top-9 bottom-0 left-[1.1rem] w-px bg-brand-200" />}
                  <span className="z-10 grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{d.day}</span>
                  <div className="min-w-0 pt-1">
                    <h3 className="font-bold">{d.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">{d.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {d.meals?.map((m) => <span key={m} className="rounded-full bg-sand-100 px-2 py-0.5 text-ink-700">{m}</span>)}
                      {d.stay && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-800">Stay: {d.stay}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-5 sm:grid-cols-2" aria-label="Inclusions and exclusions">
            <div className="card p-5">
              <h2 className="font-bold">What&apos;s included</h2>
              <ul className="mt-3 space-y-2 text-sm">{tour.included.map((x) => <li key={x} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />{x}</li>)}</ul>
            </div>
            <div className="card p-5">
              <h2 className="font-bold">Not included</h2>
              <ul className="mt-3 space-y-2 text-sm">{tour.excluded.map((x) => <li key={x} className="flex items-start gap-2"><X className="mt-0.5 size-4 shrink-0 text-coral-500" />{x}</li>)}</ul>
            </div>
          </section>

          <ReviewsSection targetType="tour" targetId={tour._id} rating={tour.rating} reviewCount={tour.reviewCount} reviews={reviews} />
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <TourBookingWidget tour={tour} />
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <SectionHeading title="You may also like" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{similar.map((t) => <TourCard key={t._id} tour={t} />)}</div>
        </section>
      )}
    </div>
  );
}
