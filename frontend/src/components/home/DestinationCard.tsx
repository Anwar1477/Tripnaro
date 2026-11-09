import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { Destination } from "@/types";

export function DestinationCard({ destination, className, size = "md" }: { destination: Destination; className?: string; size?: "md" | "lg" }) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className={cn("group relative block overflow-hidden rounded-(--radius-card) bg-ink-200", size === "lg" ? "aspect-[4/5] sm:aspect-auto sm:h-full sm:min-h-[26rem]" : "aspect-[4/5]", className)}
    >
      <Image src={destination.image} alt={destination.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
        <p className="text-xs font-semibold tracking-wide text-white/75 uppercase">{destination.country}</p>
        <h3 className={cn("font-display font-semibold text-white", size === "lg" ? "text-3xl" : "text-xl")}>{destination.name}</h3>
        {size === "lg" && destination.tagline && <p className="mt-1 line-clamp-2 text-sm text-white/85">{destination.tagline}</p>}
        <div className="mt-2 flex items-center justify-between">
          {destination.startingPrice > 0 && <span className="text-sm text-white/90">from {formatPrice(destination.startingPrice)}</span>}
          <span className="grid size-8 place-items-center rounded-full bg-white/20 backdrop-blur transition group-hover:bg-coral-500">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
