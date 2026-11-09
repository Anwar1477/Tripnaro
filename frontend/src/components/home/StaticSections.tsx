import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChevronDown, Headphones, Quote, ShieldCheck, Wallet, Zap } from "lucide-react";
import { SectionHeading, Stars } from "../common/Misc";

const img = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export function WhyChoose() {
  const items = [
    { icon: Wallet, title: "Transparent prices", text: "Taxes and fees shown upfront. What you see at search is what you pay at checkout." },
    { icon: ShieldCheck, title: "Secure local payments", text: "bKash, Nagad, cards and bank transfers, verified on our servers before any booking is confirmed." },
    { icon: Zap, title: "Instant confirmation", text: "Most hotels, tours and bus seats confirm in seconds, with e-tickets in your account." },
    { icon: Headphones, title: "Humans, 24/7", text: "Real travel experts on phone and chat, before, during and after your trip." },
  ];
  return (
    <section className="container-page py-16" aria-labelledby="why-heading">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
        <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[1.75rem] lg:block">
          <Image src={img("1503220317375-aaad61436b1b", 1000)} alt="Traveller looking over a mountain lake" fill sizes="40vw" className="object-cover" />
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
            <p className="flex items-center gap-2 text-sm font-bold">
              <BadgeCheck className="size-5 text-brand-600" /> 120,000+ happy travellers
            </p>
            <p className="mt-1 text-[13px] text-ink-500">Rated 4.8/5 across hotels, tours and flights booked with Tripnaro.</p>
          </div>
        </div>
        <div>
          <SectionHeading eyebrow="Why Tripnaro" title="Travel planning that feels effortless" description="We combine local know-how with modern booking technology, so every trip is simpler to plan and safer to pay for." />
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-5">
                <span className="mb-3 grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Experiences() {
  const items = [
    { title: "Island hopping", text: "Speedboats, snorkelling and hidden coves.", image: img("1544551763-46a013bb70d5"), href: "/tours?category=beach" },
    { title: "Into the hills", text: "Cloud-top cottages, treks and sunrises.", image: img("1470071459604-3b5ec3a7fe05"), href: "/tours?category=adventure" },
    { title: "Escapes for two", text: "Villas, spa days and private dinners.", image: img("1584132967334-10e028bd69f7"), href: "/tours?category=honeymoon" },
    { title: "With the whole crew", text: "Group departures with a local host.", image: img("1539635278303-d4002c07eae3"), href: "/tours?category=group" },
  ];
  return (
    <section className="container-page py-16" aria-labelledby="exp-heading">
      <SectionHeading eyebrow="Recommended experiences" title="Pick a feeling, we'll plan the trip" />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {items.map((x) => (
          <Link key={x.title} href={x.href} className="group relative block aspect-[3/4] overflow-hidden rounded-(--radius-card)">
            <Image src={x.image} alt={x.title} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <h3 className="font-display text-lg font-semibold text-white sm:text-xl">{x.title}</h3>
              <p className="mt-0.5 text-[13px] text-white/80">{x.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Testimonials() {
  const items = [
    { name: "Farhana Akter", trip: "Sajek Valley Cloud Trail", text: "The cottage was right on the ridge and our guide timed the sunrise perfectly. Payment with bKash took ten seconds.", rating: 5 },
    { name: "Rezaul Karim", trip: "Dhaka → Dubai, Business", text: "Clear fare breakdown, no surprises at checkout, and support called me back within minutes when I changed dates.", rating: 5 },
    { name: "Ayesha Siddiqua", trip: "Bali Honeymoon Bliss", text: "Every transfer, villa and dinner was exactly as promised. Tripnaro made our honeymoon feel completely stress-free.", rating: 5 },
  ];
  return (
    <section className="bg-brand-50/60 py-16" aria-labelledby="testimonials-heading">
      <div className="container-page">
        <SectionHeading eyebrow="Traveller stories" title="Loved by people who travel a lot" />
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((t) => (
            <figure key={t.name} className="card flex flex-col p-6">
              <Quote className="size-7 text-brand-300" aria-hidden />
              <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-700">“{t.text}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-4">
                <span className="grid size-10 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {t.name.split(" ").map((p) => p[0]).join("")}
                </span>
                <span>
                  <span className="block text-sm font-bold">{t.name}</span>
                  <span className="block text-xs text-ink-500">{t.trip}</span>
                </span>
                <Stars count={t.rating} className="ml-auto" />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export const HOME_FAQ = [
  { q: "How do I know my booking is confirmed?", a: "Once our server verifies your payment with the payment provider, your booking moves to Confirmed, you receive an email and in-app notification, and the e-ticket appears under My bookings." },
  { q: "Which payment methods can I use?", a: "Tripnaro is built for bKash, Nagad, SSLCommerz (local cards, mobile and internet banking) and Stripe for international cards. Methods that are not yet activated on this server are shown as unavailable." },
  { q: "How long is my seat or room held before payment?", a: "Every new booking is held for 30 minutes. If payment is not completed in that window the hold is released automatically so others can book." },
  { q: "Can I cancel or get a refund?", a: "Unpaid bookings can be cancelled instantly from your dashboard. For paid bookings you can request a cancellation or refund; our operations team reviews it according to the supplier's policy." },
  { q: "Do you help with visas?", a: "Yes. Choose your destination on the Visa page, upload your documents securely and track your application status online with your reference and passport number." },
  { q: "Can you build a custom tour for my family or office?", a: "Absolutely. Send us a custom tour request with your dates, budget and group size and a travel expert will reply within 24 hours." },
];

export function FAQ() {
  return (
    <section className="container-page py-16" aria-labelledby="faq-heading">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" description="Can't find what you're looking for? Call 09612-345678 any time." />
        <div className="divide-y divide-ink-100 rounded-(--radius-card) border border-ink-100 bg-white">
          {HOME_FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink-900">
                {f.q}
                <ChevronDown className="size-5 shrink-0 text-ink-400 transition group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
