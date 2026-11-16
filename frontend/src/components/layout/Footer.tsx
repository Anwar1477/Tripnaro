import Link from "next/link";
import { Headphones, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/seo";
import type { SiteSettings } from "@/types";
import { Logo } from "./Logo";
import { FOOTER_LINKS } from "./nav";
import { PaymentMethods } from "./PaymentMethods";

/** Icon paths for the social networks an admin can link in Site settings. */
const SOCIAL_ICONS: { key: string; label: string; path: string }[] = [
  { key: "facebook", label: "Facebook", path: "M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H7v4h2v9h4v-9h3l1-4h-4V9c0-.6.4-1 1-1z" },
  { key: "instagram", label: "Instagram", path: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.2-1.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" },
  { key: "youtube", label: "YouTube", path: "M22 8.2a3 3 0 0 0-2-2.1C18.2 5.6 12 5.6 12 5.6s-6.2 0-8 .5a3 3 0 0 0-2 2.1A31 31 0 0 0 1.6 12a31 31 0 0 0 .4 3.8 3 3 0 0 0 2 2.1c1.8.5 8 .5 8 .5s6.2 0 8-.5a3 3 0 0 0 2-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8zM10 15V9l5.2 3z" },
  { key: "linkedin", label: "LinkedIn", path: "M4 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM2.5 9h3v12h-3zM9 9h2.9v1.7h.1c.4-.8 1.4-1.9 3.3-1.9 3.4 0 4.1 2.3 4.1 5.2V21h-3v-6.2c0-1.5 0-3.3-2-3.3s-2.4 1.6-2.4 3.2V21H9z" },
  { key: "x", label: "X (Twitter)", path: "M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z" },
];

const isHttpUrl = (u?: string) => !!u && /^https?:\/\//i.test(u);

export function Footer({ settings }: { settings?: SiteSettings | null }) {
  const phone = settings?.supportPhone || siteConfig.phone;
  const email = settings?.supportEmail || siteConfig.email;
  const address = settings?.address || "House 42, Road 11, Banani, Dhaka 1213";
  const social = SOCIAL_ICONS.filter((s) => isHttpUrl(settings?.social?.[s.key]));

  return (
    <footer className="mt-20 bg-brand-950 text-brand-100">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-sm sm:col-span-2 lg:col-span-1">
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-brand-200/80">
            Flights, stays, tours, bus tickets and visas, planned beautifully. Built in Dhaka for travellers going everywhere.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-coral-300" aria-hidden />
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hover:text-white">
                {phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-coral-300" aria-hidden />
              <a href={`mailto:${email}`} className="break-all hover:text-white">
                {email}
              </a>
            </li>
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-coral-300" aria-hidden /> <span>{address}</span>
            </li>
            <li className="flex gap-2.5">
              <Headphones className="mt-0.5 size-4 shrink-0 text-coral-300" aria-hidden /> 24/7 travel support
            </li>
          </ul>
        </div>
        {FOOTER_LINKS.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-bold tracking-wide text-white">{group.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {group.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-brand-200/80 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-6 py-7 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <PaymentMethods />
          {social.length > 0 && (
            <ul className="flex shrink-0 items-center gap-2" aria-label="Tripnaro on social media">
              {social.map((s) => (
                <li key={s.key}>
                  <a href={settings!.social![s.key]} target="_blank" rel="noopener noreferrer" aria-label={`Tripnaro on ${s.label}`} className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-coral-500">
                    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                      <path d={s.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Extra bottom padding on small screens keeps the copyright clear of the floating chat button. */}
        <p className="container-page pb-24 text-xs text-brand-200/60 sm:pb-6">© {new Date().getFullYear()} Tripnaro Travel Technologies Ltd. All rights reserved.</p>
      </div>
    </footer>
  );
}
