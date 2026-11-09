import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { cn, discountPercent, titleCase } from "@/lib/utils";
import type { Tour } from "@/types";
import { Badge } from "../common/Badge";
import { Price, RatingPill } from "../common/Misc";
import { WishlistButton } from "../common/WishlistButton";

export function TourCard({ tour, className }: { tour: Tour; className?: string }) {
  const href = `/tours/${tour.slug}`;
  const off = discountPercent(tour.priceAdult, tour.originalPrice);
  return (
    <article className={cn("card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-(--shadow-lift)", className)}>
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-ink-100">
        {tour.images[0] && (
          <Image src={tour.images[0]} alt={tour.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-900/60 to-transparent" />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink-800">
          <Clock className="size-3.5 text-brand-600" />
          {tour.durationDays}D{tour.durationNights ? ` / ${tour.durationNights}N` : ""}
        </span>
        {off > 0 && <Badge className="absolute top-3 left-3 bg-coral-500 text-white">Save {off}%</Badge>}
      </Link>
      <WishlistButton itemType="tour" itemId={tour._id} className="absolute top-3 right-3" />
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 flex items-center gap-1 text-[13px] text-ink-500">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{tour.destination?.name}</span>
          {tour.categories[0] && <span className="truncate">· {titleCase(tour.categories[0])}</span>}
        </p>
        <h3 className="line-clamp-2 text-[17px] leading-snug font-bold">
          <Link href={href} className="hover:text-brand-700">
            {tour.title}
          </Link>
        </h3>
        <RatingPill rating={tour.rating} reviews={tour.reviewCount} className="mt-3" />
        <div className="mt-auto pt-4">
          <p className="text-[11px] font-semibold tracking-wide text-ink-500 uppercase">From</p>
          <Price amount={tour.priceAdult} original={tour.originalPrice} suffix="/ person" />
        </div>
      </div>
    </article>
  );
}
