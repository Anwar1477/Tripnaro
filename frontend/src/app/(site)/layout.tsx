import Link from "next/link";
import { Megaphone } from "lucide-react";
import { JsonLd } from "@/components/common/Misc";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MessengerChat } from "@/components/layout/MessengerChat";
import { resolveMessengerConfig } from "@/lib/messenger";
import { serverGet } from "@/lib/server-api";
import { organizationJsonLd } from "@/lib/seo";
import type { SiteSettings } from "@/types";

function NoticeBar({ settings }: { settings: SiteSettings | null }) {
  const notice = settings?.noticeBar;
  if (!notice?.active || !notice.text) return null;
  return (
    <div className="bg-brand-900 text-brand-50">
      <div className="container-page flex items-center justify-center gap-2 py-2 text-center text-[13px] font-medium">
        <Megaphone className="size-4 shrink-0 text-coral-300" aria-hidden />
        {notice.link ? (
          <Link href={notice.link} className="underline-offset-2 hover:underline">
            {notice.text}
          </Link>
        ) : (
          <span>{notice.text}</span>
        )}
      </div>
    </div>
  );
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // One cached request feeds the notice bar, contact details and the Messenger launcher.
  const settings = await serverGet<SiteSettings>("/content/settings", 300);
  const messenger = resolveMessengerConfig(settings);

  return (
    <>
      <NoticeBar settings={settings} />
      <Header phone={settings?.supportPhone} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer settings={settings} />
      {messenger && <MessengerChat page={messenger.page} greeting={messenger.greeting} phone={settings?.supportPhone} />}
      <JsonLd data={organizationJsonLd()} />
    </>
  );
}
