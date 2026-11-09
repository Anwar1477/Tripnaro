"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { ErrorState, Skeleton } from "@/components/common/Feedback";
import { Checkbox, Input, Textarea } from "@/components/common/FormControls";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage, get, send } from "@/lib/api";
import { toast } from "@/store/toast";
import type { SiteSettings } from "@/types";

const SOCIAL = ["facebook", "instagram", "youtube", "linkedin", "x"];

export default function AdminSettingsPage() {
  const { data, loading, error, reload } = useAsync(() => get<SiteSettings>("/admin/settings"), []);
  const [edited, setS] = useState<SiteSettings | null>(null);
  const s = edited ?? data;
  const [saving, setSaving] = useState(false);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !s) return <Skeleton className="h-96" />;
  const set = (patch: Partial<SiteSettings>) => setS({ ...s, ...patch });

  async function save() {
    setSaving(true);
    try {
      const res = await send<SiteSettings>("put", "/admin/settings", s);
      setS(res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="font-display text-2xl font-semibold">Site settings</h1>
      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">Brand &amp; contact</h2>
        <Input label="Site name" value={s.siteName} onChange={(e) => set({ siteName: e.target.value })} />
        <Input label="Tagline" value={s.tagline} onChange={(e) => set({ tagline: e.target.value })} />
        <Input label="Support email" type="email" value={s.supportEmail} onChange={(e) => set({ supportEmail: e.target.value })} />
        <Input label="Support phone" value={s.supportPhone} onChange={(e) => set({ supportPhone: e.target.value })} />
        <Textarea label="Address" wrapperClassName="sm:col-span-2" rows={2} value={s.address} onChange={(e) => set({ address: e.target.value })} />
      </section>
      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">Pricing</h2>
        <Input label="Service fee (%)" type="number" min={0} max={20} step={0.5} value={s.serviceFeePercent} onChange={(e) => set({ serviceFeePercent: Number(e.target.value) })} hint="Applied to every booking quote on the server." />
        <Input label="Currency" value={s.currency} disabled readOnly />
      </section>
      <section className="card grid gap-4 p-5">
        <h2 className="font-bold">Notice bar</h2>
        <Checkbox label="Show notice bar on the website" checked={!!s.noticeBar?.active} onChange={(e) => set({ noticeBar: { ...s.noticeBar, active: e.target.checked } })} />
        <Input label="Text" value={s.noticeBar?.text ?? ""} onChange={(e) => set({ noticeBar: { ...s.noticeBar, active: !!s.noticeBar?.active, text: e.target.value } })} />
        <Input label="Link" value={s.noticeBar?.link ?? ""} onChange={(e) => set({ noticeBar: { ...s.noticeBar, active: !!s.noticeBar?.active, link: e.target.value } })} />
      </section>
      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">Social links</h2>
        {SOCIAL.map((k) => <Input key={k} label={k === "x" ? "X / Twitter" : k[0].toUpperCase() + k.slice(1)} value={s.social?.[k] ?? ""} onChange={(e) => set({ social: { ...s.social, [k]: e.target.value } })} />)}
      </section>
      <Button onClick={save} loading={saving}>Save settings</Button>
      <p className="text-xs text-ink-500">Public pages refresh cached settings within a few minutes.</p>
    </div>
  );
}
