import Image from "next/image";
import Link from "next/link";
import { FileCheck2, SearchCheck, ShieldCheck, Upload } from "lucide-react";
import { Breadcrumbs, JsonLd, SectionHeading } from "@/components/common/Misc";
import { LinkButton } from "@/components/common/Button";
import { VisaSearchForm } from "@/components/visa/VisaSearchForm";
import { serverGet } from "@/lib/server-api";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";
import type { VisaCountry } from "@/types";

export const metadata = buildMetadata({
  title: "Visa Processing: Apply Online for Tourist & Business Visas",
  description: "Apply online for Thailand, Malaysia, Singapore, Dubai, India and other visas from Bangladesh. Upload documents, pay the fee, and track your application.",
  path: "/visa",
});

export default async function VisaPage() {
  const countries = (await serverGet<VisaCountry[]>("/visa/countries")) ?? [];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Visa", path: "/visa" }])} />
      <section className="border-b border-ink-100 bg-white">
        <div className="container-page py-6">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Visa" }]} className="mb-3" />
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Visa services, made simple</h1>
              <p className="mt-2 max-w-xl text-ink-600">Check requirements, upload documents securely and follow every step of your application online.</p>
            </div>
            <LinkButton href="/visa/track" variant="outline"><SearchCheck className="size-4" /> Track an application</LinkButton>
          </div>
          <div className="mt-5"><VisaSearchForm /></div>
        </div>
      </section>

      <div className="container-page py-10">
        <ol className="mb-12 grid gap-4 sm:grid-cols-4">
          {[
            { Icon: FileCheck2, t: "Check requirements", d: "See documents and fees per visa type." },
            { Icon: Upload, t: "Apply & upload", d: "Fill the form and upload scans (PDF/JPG)." },
            { Icon: ShieldCheck, t: "Pay securely", d: "Fee is verified with the payment provider." },
            { Icon: SearchCheck, t: "Track progress", d: "Status updates by email and in your account." },
          ].map(({ Icon, t, d }, i) => (
            <li key={t} className="card p-5">
              <span className="text-xs font-bold text-coral-600">STEP {i + 1}</span>
              <Icon className="mt-2 size-7 text-brand-600" />
              <p className="mt-2 font-bold">{t}</p>
              <p className="text-sm text-ink-600">{d}</p>
            </li>
          ))}
        </ol>

        <SectionHeading eyebrow="Destinations" title="Choose your visa" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((c) => {
            const from = Math.min(...c.visaTypes.map((v) => v.fee + v.serviceFee));
            return (
              <Link key={c._id} href={`/visa/${c.slug}`} className="card group overflow-hidden transition hover:shadow-(--shadow-lift)">
                <div className="relative h-40 bg-ink-100">
                  {c.image && <Image src={c.image} alt={`${c.country}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />}
                  <span className="absolute top-3 left-3 rounded-lg bg-white/95 px-2 py-1 text-lg shadow" aria-hidden>{c.flag}</span>
                </div>
                <div className="p-4">
                  <p className="text-lg font-bold">{c.country}</p>
                  <p className="text-sm text-ink-500">{c.visaTypes.map((v) => v.name).join(" · ")}</p>
                  {Number.isFinite(from) && <p className="mt-2 text-sm">From <span className="font-bold">{formatPrice(from)}</span></p>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
