import type { SiteSettings } from "@/types";

/**
 * Facebook Messenger chat configuration.
 *
 * Meta retired the Messenger Customer Chat plugin (the `xfbml.customerchat` SDK widget) on
 * 9 May 2024, so an embedded in-page chat window can no longer be loaded from Meta. The supported
 * entry point is an m.me link: it opens the Page's conversation in the Messenger app on mobile and
 * in messenger.com / facebook.com on desktop. No Meta SDK script is loaded.
 *
 * Resolution order for the Page: admin Site settings → `MESSENGER_PAGE` environment variable.
 */
export interface MessengerConfig {
  page: string;
  greeting: string;
}

const PAGE_PATTERN = /^[A-Za-z0-9.]{3,64}$/;
const DEFAULT_GREETING = "Hi! Questions about a flight, hotel, tour or visa? Message our travel experts on Messenger.";

export function resolveMessengerConfig(settings: SiteSettings | null | undefined, envPage = process.env.MESSENGER_PAGE): MessengerConfig | null {
  if (settings?.messenger?.enabled === false) return null;
  const page = (settings?.messenger?.pageUsername || envPage || "").trim();
  if (!page) return null;
  if (!PAGE_PATTERN.test(page)) {
    console.warn(`[messenger] Ignoring invalid Messenger page "${page}". Use a Facebook Page username or numeric Page ID.`);
    return null;
  }
  return { page, greeting: settings?.messenger?.greeting?.trim() || DEFAULT_GREETING };
}

/**
 * Builds the m.me deep link. `ref` is forwarded to the Page's webhook as a referral so agents can
 * see which page the visitor came from. Only the pathname is sent (never query strings, which can
 * hold search details or tokens), reduced to the characters m.me accepts.
 */
export function messengerLink(page: string, pathname?: string) {
  const url = new URL(`https://m.me/${encodeURIComponent(page)}`);
  if (pathname) {
    const ref = `web${pathname === "/" ? "/home" : pathname}`.replace(/[^A-Za-z0-9_=-]+/g, "_").slice(0, 120);
    url.searchParams.set("ref", ref);
  }
  return url.toString();
}
