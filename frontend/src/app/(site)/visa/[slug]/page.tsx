import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { LinkButton } from "@/components/common/Button";
import { Breadcrumbs, JsonLd } from "@/components/common/Misc";
import { serverGet } from "@/lib/server-api";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";
import type { VisaCountry } from "@/types";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const c = await serverGet<VisaCountry>(`/visa/countries/${slug}`);
  if (!c) return { title: "Visa not found" };
  return buildMetadata({ title: `${c.country} Visa from Bangladesh: Requirements, Fees & Apply Online`, description: c.description.slice(0, 155), path: `/visa/${slug}`, image: c.image });
}

export default async function VisaCountryPage({ params }: Params) {
  const { slug } = await params;
  const c = await serverGet<VisaCountry>(`/visa/countries/${slug}`);
  if (!c) notFound();

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: `What documents are needed for a ${c.country} visa?`, acceptedAnswer: { "@type": "Answer", text: c.documents.join("; ") } },
      ...c.visaTypes.map((v) => ({ "@type": "Question", name: `How long does a ${c.country} ${v.name} take?`, acceptedAnswer: { "@type": "Answer", text: `Typically ${v.processingDays} working days. Total fee ${v.fee + v.serviceFee} BDT.` } })),
    ],
  };

  return (
    <div className="container-page py-6">
      <JsonLd data={faq} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Visa", path: "/visa" }, { name: c.country, path: `/visa/${slug}` }])} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Visa", href: "/visa" }, { name: c.country }]} className="mb-4" />

      <div className="relative overflow-hidden rounded-(--radius-card) bg-ink-900 text-white">
        {c.image && <Image src={c.image} alt="" fill priority sizes="100vw" className="object-cover opacity-45" />}
        <div className="relative p-6 sm:p-10">
          <p className="text-4xl" aria-hidden>{c.flag}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-5xl">{c.country} visa</h1>
          <p className="mt-3 max-w-2xl text-white/90">{c.description}</p>
        </div>
      </div>

      <section className="mt-8" aria-labelledby="types-h">
        <h2 id="types-h" className="mb-4 text-xl font-bold">Visa types &amp; fees</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {c.visaTypes.map((v) => (
            <div key={v._id} className="card flex flex-col p-5">
              <p className="text-lg font-bold">{v.name}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <dt className="text-ink-500">Entry</dt><dd className="text-right font-semibold">{v.entry}</dd>
                {v.validityDays && <><dt className="text-ink-500">Validity</dt><dd className="text-right font-semibold">{v.validityDays} days</dd></>}
                {v.maxStayDays && <><dt className="text-ink-500">Max stay</dt><dd className="text-right font-semibold">{v.maxStayDays} days</dd></>}
                <dt className="text-ink-500">Processing</dt><dd className="text-right font-semibold">{v.processingDays} days</dd>
                <dt className="text-ink-500">Embassy fee</dt><dd className="text-right">{formatPrice(v.fee)}</dd>
                <dt className="text-ink-500">Service fee</dt><dd className="text-right">{formatPrice(v.serviceFee)}</dd>
              </dl>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink-100 pt-4">
                <span className="text-xl font-bold">{formatPrice(v.fee + v.serviceFee)}</span>
                <LinkButton href={`/visa/${c.slug}/apply?type=${encodeURIComponent(v.name)}`} variant="accent" size="sm">Apply now</LinkButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <section className="card p-5" aria-labelledby="docs-h">
          <h2 id="docs-h" className="font-bold">Required documents</h2>
          <ul className="mt-3 space-y-2 text-sm">{c.documents.map((d) => <li key={d} className="flex items-start gap-2"><FileText className="mt-0.5 size-4 shrink-0 text-brand-600" />{d}</li>)}</ul>
        </section>
        <section className="card p-5" aria-labelledby="req-h">
          <h2 id="req-h" className="font-bold">Eligibility &amp; requirements</h2>
          <ul className="mt-3 space-y-2 text-sm">{c.requirements.map((d) => <li key={d} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />{d}</li>)}</ul>
        </section>
        <section className="card p-5" aria-labelledby="notes-h">
          <h2 id="notes-h" className="font-bold">Good to know</h2>
          <ul className="mt-3 space-y-2 text-sm">{c.notes.map((d) => <li key={d} className="flex items-start gap-2"><AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />{d}</li>)}</ul>
        </section>
      </div>
      <p className="mt-6 text-xs text-ink-500">Visa approval is decided solely by the embassy or immigration authority. Fees shown are current estimates and may change.</p>
    </div>
  );
}
