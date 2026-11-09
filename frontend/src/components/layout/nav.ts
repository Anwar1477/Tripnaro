import { Bus, Hotel, Map, Plane, Stamp, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { label: "Flights", href: "/flights", icon: Plane },
  { label: "Hotels", href: "/hotels", icon: Hotel },
  { label: "Tours", href: "/tours", icon: Map },
  { label: "Bus", href: "/bus", icon: Bus },
  { label: "Visa", href: "/visa", icon: Stamp },
];

export const FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Book",
    links: [
      { label: "Flights", href: "/flights" },
      { label: "Hotels & resorts", href: "/hotels" },
      { label: "Tour packages", href: "/tours" },
      { label: "Bus tickets", href: "/bus" },
      { label: "Visa services", href: "/visa" },
      { label: "Custom tour request", href: "/tours/custom-request" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "All destinations", href: "/destinations" },
      { label: "Bangladesh", href: "/destinations/bangladesh" },
      { label: "Cox's Bazar", href: "/tours/coxs-bazar" },
      { label: "Sajek Valley", href: "/tours/sajek-valley" },
      { label: "Bali", href: "/tours/bali" },
      { label: "Maldives", href: "/hotels/maldives" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Tripnaro", href: "/info/about" },
      { label: "Contact us", href: "/info/contact" },
      { label: "Track visa application", href: "/visa/track" },
      { label: "Careers", href: "/info/careers" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Terms of use", href: "/info/terms" },
      { label: "Privacy policy", href: "/info/privacy" },
      { label: "Refund & cancellation", href: "/info/refund-policy" },
      { label: "Payment security", href: "/info/payment-security" },
    ],
  },
];
