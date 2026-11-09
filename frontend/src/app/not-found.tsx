import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonClasses } from "@/components/common/Button";

export default function NotFound() {
  return (
    <main id="main" className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <Compass className="size-14 text-brand-600" />
      <p className="mt-4 font-mono text-sm font-bold text-coral-600">404</p>
      <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">This page took a detour</h1>
      <p className="mt-2 max-w-md text-ink-600">The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClasses("primary")}>Go home</Link>
        <Link href="/tours" className={buttonClasses("outline")}>Browse tours</Link>
      </div>
    </main>
  );
}
