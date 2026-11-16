import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/common/Toaster";
import { siteConfig } from "@/lib/seo";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "Tripnaro · Flights, Hotels, Tours, Bus & Visa", template: "%s · Tripnaro" },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ["travel Bangladesh", "flight booking", "hotel booking", "tour packages", "bus tickets", "visa processing", "Cox's Bazar", "Sajek"],
  openGraph: { siteName: siteConfig.name, type: "website", locale: "en_BD", images: [siteConfig.ogImage] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1d6c68" },
    { media: "(prefers-color-scheme: dark)", color: "#0c121d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. ColorZilla's `cz-shortcut-listen`, Grammarly)
    // add attributes to <html>/<body> before React hydrates. It applies to these two elements' own
    // attributes only, so genuine mismatches inside the app are still reported.
    // data-theme is also set by THEME_SCRIPT before React hydrates (the reason it is not in the markup).
    <html lang="en" className={`${jakarta.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        {/* Runs before first paint so the stored or device theme applies with no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow">
          Skip to content
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
