import type { Metadata } from "next";

export const siteConfig = {
  name: "Tripnaro",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  description:
    "Book flights, hotels, tour packages, bus tickets and visas in one place. Tripnaro curates trips across Bangladesh and beyond with transparent prices and local payment options.",
  ogImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&h=630&q=80",
  phone: "+880 9612-345678",
  email: "support@tripnaro.com",
};

interface PageMeta {
  title: string;
  description?: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}

/** Consistent title, description, canonical, Open Graph and Twitter metadata for every page. */
export function buildMetadata({ title, description = siteConfig.description, path, image, noIndex }: PageMeta): Metadata {
  const url = `${siteConfig.url}${path}`;
  const images = [{ url: image ?? siteConfig.ogImage, width: 1200, height: 630, alt: title }];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: siteConfig.name, images, locale: "en_BD" },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.svg`,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
    priceRange: "৳৳",
  };
}
