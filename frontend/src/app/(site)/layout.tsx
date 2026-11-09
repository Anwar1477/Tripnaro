import Link from "next/link";
import { Megaphone } from "lucide-react";
import { JsonLd } from "@/components/common/Misc";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { serverGet } from "@/lib/server-api";
import { organizationJsonLd } from "@/lib/seo";
import type { SiteSettings } from "@/types";

async function NoticeBar() {
  const settings = await serverGet<SiteSettings>("/content/settings", 300);
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

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NoticeBar />
      <Header />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer />
      <JsonLd data={organizationJsonLd()} />
    </>
  );
}
