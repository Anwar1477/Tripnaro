import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { serverGet } from "@/lib/server-api";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

type Gateway = Exclude<PaymentMethod["provider"], "demo">;

/**
 * Brands shown in the footer, and the gateways (backend payment adapters) that can process each one.
 * Logos: Visa, Mastercard, American Express and SSLCommerz from Wikimedia Commons (public domain marks);
 * bKash, Nagad and Rocket from the brands' own websites. Trademarks belong to their owners.
 * `className` sets the logo's height so marks with different proportions look the same optical size.
 */
const BRANDS: { name: string; src: string; width: number; height: number; via: Gateway[]; className: string }[] = [
  { name: "Visa", src: "/payments/visa.svg", width: 1000, height: 325, via: ["sslcommerz", "stripe"], className: "max-h-[18px]" },
  { name: "Mastercard", src: "/payments/mastercard.svg", width: 1000, height: 618, via: ["sslcommerz", "stripe"], className: "max-h-7" },
  { name: "American Express", src: "/payments/amex.svg", width: 1000, height: 998, via: ["sslcommerz", "stripe"], className: "max-h-8" },
  { name: "bKash", src: "/payments/bkash.svg", width: 87, height: 40, via: ["bkash", "sslcommerz"], className: "max-h-7" },
  { name: "Nagad", src: "/payments/nagad.webp", width: 274, height: 96, via: ["nagad", "sslcommerz"], className: "max-h-7" },
  { name: "Rocket", src: "/payments/rocket.webp", width: 261, height: 84, via: ["sslcommerz"], className: "max-h-7" },
  { name: "SSLCommerz", src: "/payments/sslcommerz.svg", width: 350, height: 67, via: ["sslcommerz"], className: "max-h-4" },
];

const GATEWAY_LABEL: Record<Gateway, string> = { sslcommerz: "SSLCommerz", bkash: "bKash", nagad: "Nagad", stripe: "Stripe" };

/**
 * Footer payment strip. Availability comes from the API (`/payments/methods`), so the footer never
 * claims a method is live unless a gateway that can process it is configured on this server.
 */
export async function PaymentMethods() {
  const methods = (await serverGet<PaymentMethod[]>("/payments/methods", 300)) ?? [];
  const live = new Set(methods.filter((m) => m.available && !m.isDemo).map((m) => m.provider as Gateway));
  const anyLive = live.size > 0;

  return (
    <section aria-labelledby="footer-payments" className="min-w-0">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-coral-300">
          <ShieldCheck className="size-[18px]" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="footer-payments" className="text-sm font-bold text-white">
            {anyLive ? "We accept secure payments" : "Secure payment partners"}
          </h2>
          <p className="mt-0.5 text-[13px] leading-snug text-brand-200/75">
            {anyLive
              ? "Your payments are protected with secure, gateway-verified processing."
              : "Online checkout is in demo mode, so no real charges are made. These methods go live once their payment gateways are connected."}
          </p>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-2.5 lg:w-max" aria-label="Payment methods">
        {BRANDS.map((brand) => {
          const active = brand.via.some((g) => live.has(g));
          const planned = anyLive && !active;
          const route = brand.via.map((g) => GATEWAY_LABEL[g]).join(" or ");
          return (
            <li
              key={brand.name}
              title={planned ? `${brand.name}: coming soon` : brand.name === "SSLCommerz" ? "SSLCommerz payment gateway" : `${brand.name} via ${route}`}
              className={cn(
                "relative grid h-12 w-full place-items-center rounded-lg bg-white px-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.2)] ring-1 ring-black/5 sm:px-2.5 lg:w-24",
                planned && "opacity-55",
              )}
            >
              <Image
                src={brand.src}
                alt={planned ? `${brand.name} (coming soon)` : brand.name}
                width={brand.width}
                height={brand.height}
                sizes="96px"
                className={cn("h-auto w-auto max-w-full", brand.className)}
              />
              {planned && (
                <span aria-hidden className="absolute -top-1.5 -right-1.5 rounded-full bg-ink-800 px-1.5 py-px text-[9px] font-bold tracking-wide text-white uppercase">
                  Soon
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
