import type { MetadataRoute } from "next";
import { serverGet, serverGetWithMeta } from "@/lib/server-api";
import { siteConfig } from "@/lib/seo";
import type { Destination, Hotel, Tour, VisaCountry } from "@/types";
import { INFO_PAGES } from "./(site)/info/[page]/content";

export const revalidate = 3600;

/** Dynamic sitemap built from published catalogue content. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();
  const [destinations, hotels, tours, visas] = await Promise.all([
    serverGet<Destination[]>("/destinations?limit=50", 3600),
    serverGetWithMeta<Hotel[]>("/hotels?limit=48", 3600),
    serverGetWithMeta<Tour[]>("/tours?limit=48", 3600),
    serverGet<VisaCountry[]>("/visa/countries", 3600),
  ]);
  const page = (path: string, priority = 0.7, changeFrequency: "daily" | "weekly" | "monthly" = "weekly") => ({ url: `${base}${path}`, lastModified: now, changeFrequency, priority });

  const countries = [...new Set((destinations ?? []).map((d) => d.countrySlug))];
  return [
    page("/", 1, "daily"),
    ...["/flights", "/hotels", "/tours", "/bus", "/visa", "/destinations"].map((p) => page(p, 0.9, "daily")),
    page("/tours/custom-request", 0.6, "monthly"),
    page("/visa/track", 0.4, "monthly"),
    ...countries.map((c) => page(`/destinations/${c}`, 0.7)),
    ...(destinations ?? []).flatMap((d) => [page(`/destinations/${d.slug}`, 0.8), page(`/tours/${d.slug}`, 0.7), page(`/hotels/${d.slug}`, 0.7)]),
    ...(hotels?.data ?? []).map((h) => page(`/hotels/${h.slug}`, 0.8)),
    ...(tours?.data ?? []).map((t) => page(`/tours/${t.slug}`, 0.8)),
    ...(visas ?? []).map((v) => page(`/visa/${v.slug}`, 0.7)),
    ...Object.keys(INFO_PAGES).map((p) => page(`/info/${p}`, 0.3, "monthly")),
  ];
}
