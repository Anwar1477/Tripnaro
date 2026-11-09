"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AccountHeading } from "@/components/account/AccountShell";
import { Button } from "@/components/common/Button";
import { Checkbox, Input } from "@/components/common/FormControls";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/api";
import { accountService, authService } from "@/services";
import { toast } from "@/store/toast";
import type { User } from "@/types";

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "At least 8 characters").regex(/[A-Za-z]/, "Include a letter").regex(/\d/, "Include a number"),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

const PREFS: { key: keyof User["notificationPrefs"]; label: string; hint: string }[] = [
  { key: "bookingUpdates", label: "Booking updates", hint: "Confirmations, schedule changes, refunds" },
  { key: "email", label: "Email notifications", hint: "Send updates to my inbox" },
  { key: "sms", label: "SMS notifications", hint: "Text messages for urgent changes" },
  { key: "promotions", label: "Deals & offers", hint: "Coupons and seasonal campaigns" },
];

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [prefs, setPrefs] = useState<User["notificationPrefs"]>(user?.notificationPrefs ?? { email: true, sms: false, promotions: true, bookingUpdates: true });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof pwSchema>>({ resolver: zodResolver(pwSchema) });

  async function savePrefs() {
    setSavingPrefs(true);
    try {
      await accountService.updatePrefs(prefs);
      if (user) setUser({ ...user, notificationPrefs: prefs });
      toast.success("Preferences saved");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingPrefs(false);
    }
  }

  return (
    <>
      <AccountHeading title="Settings & security" />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5 sm:p-6" aria-labelledby="prefs-h">
          <h2 id="prefs-h" className="font-bold">Notification preferences</h2>
          <div className="mt-4 space-y-3">
            {PREFS.map((p) => (
              <Checkbox key={p.key} label={<span><span className="font-semibold">{p.label}</span><span className="block text-xs text-ink-500">{p.hint}</span></span>} checked={prefs[p.key]} onChange={(e) => setPrefs({ ...prefs, [p.key]: e.target.checked })} />
            ))}
          </div>
          <Button className="mt-5" onClick={savePrefs} loading={savingPrefs}>Save preferences</Button>
        </section>
        <section className="card p-5 sm:p-6" aria-labelledby="pw-h">
          <h2 id="pw-h" className="font-bold">Change password</h2>
          <form
            noValidate
            className="mt-4 space-y-3"
            onSubmit={handleSubmit(async (v) => {
              try {
                await authService.changePassword(v.currentPassword, v.newPassword);
                reset();
                toast.success("Password changed. Other sessions have been signed out.");
              } catch (err) {
                toast.error(errorMessage(err));
              }
            })}
          >
            <Input type="password" label="Current password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
            <Input type="password" label="New password" autoComplete="new-password" error={errors.newPassword?.message} {...register("newPassword")} />
            <Input type="password" label="Confirm new password" autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />
            <Button type="submit" loading={isSubmitting}>Update password</Button>
          </form>
        </section>
      </div>
    </>
  );
}
