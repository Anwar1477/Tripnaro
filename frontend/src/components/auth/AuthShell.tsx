import Image from "next/image";
import type { ReactNode } from "react";
import { img } from "@/lib/images";

/** Two-column frame shared by sign-in, register and password pages. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="container-page grid min-h-[calc(100vh-10rem)] items-center gap-10 py-10 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-ink-600">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      <div className="relative hidden h-[34rem] overflow-hidden rounded-[2rem] lg:block">
        <Image src={img("photo-1507525428034-b723cf961d3e", 1200)} alt="" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="font-display text-3xl font-semibold">Every journey, one account.</p>
          <p className="mt-2 text-white/85">Bookings, e-tickets, visa applications and refunds, all in one place.</p>
        </div>
      </div>
    </div>
  );
}
