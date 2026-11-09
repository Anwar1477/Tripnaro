import { Suspense } from "react";
import { Compass, Headphones, Wallet } from "lucide-react";
import { PageLoader } from "@/components/common/Feedback";
import { Breadcrumbs } from "@/components/common/Misc";
import { buildMetadata } from "@/lib/seo";
import { CustomTourForm } from "./CustomTourForm";

export const metadata = buildMetadata({
  title: "Request a Custom Tour",
  description: "Tell Tripnaro where, when and how you want to travel. Our trip designers send a personalised itinerary and quote within 24 hours.",
  path: "/tours/custom-request",
});

export default function CustomRequestPage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Tours", href: "/tours" }, { name: "Custom request" }]} className="mb-4" />
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Design your own trip</h1>
          <p className="mt-2 max-w-xl text-ink-600">Share a few details and a Tripnaro trip designer will build a tailored itinerary, with hotels, transfers and activities, and send you a quote within 24 hours.</p>
          <Suspense fallback={<PageLoader />}>
            <CustomTourForm />
          </Suspense>
        </div>
        <aside className="space-y-4">
          {[
            { Icon: Compass, t: "Built around you", d: "Any destination, any pace: honeymoon, family, corporate or solo." },
            { Icon: Wallet, t: "Transparent pricing", d: "A clear, itemised quote before you pay anything." },
            { Icon: Headphones, t: "Human support", d: "One dedicated planner from first message to the trip home." },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="card flex gap-4 p-5">
              <Icon className="size-8 shrink-0 text-brand-600" />
              <div><p className="font-bold">{t}</p><p className="text-sm text-ink-600">{d}</p></div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
