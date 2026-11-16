import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonClasses } from "@/components/common/Button";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { serverGet } from "@/lib/server-api";
import type { SiteSettings } from "@/types";

/**
 * 404 for unknown URLs and for `notFound()` in any page. It renders outside the (site) layout,
 * so it brings the header and footer itself: visitors always have navigation to recover.
 */
export default async function NotFound() {
  const settings = await serverGet<SiteSettings>("/content/settings", 300);
  return (
    <>
      <Header phone={settings?.supportPhone} />
      <main id="main" className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-600">
          <Compass className="size-8" aria-hidden />
        </span>
        <p className="mt-5 font-mono text-sm font-bold text-coral-600">404</p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">This page took a detour</h1>
        <p className="mt-2 max-w-md text-ink-600">The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonClasses("primary")}>
            Go home
          </Link>
          <Link href="/tours" className={buttonClasses("outline")}>
            Browse tours
          </Link>
          <Link href="/destinations" className={buttonClasses("outline")}>
            Explore destinations
          </Link>
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
