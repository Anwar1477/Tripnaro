"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Tag, UserRound, X } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/api";
import { bookingService, accountService } from "@/services";
import { toast } from "@/store/toast";
import type { BookingType, SavedTraveler } from "@/types";
import { Button, LinkButton } from "../common/Button";
import { Alert, PageLoader, Skeleton } from "../common/Feedback";
import { Checkbox, Input, Select, Textarea } from "../common/FormControls";
import { PriceSummary } from "./PriceSummary";

export interface TravelerSlot {
  type: "adult" | "child" | "infant";
  label: string;
  seat?: string;
}

const phoneRe = /^\+?[0-9\s-]{8,16}$/;

function buildSchema(opts: { requireDob: boolean; requirePassport: boolean }) {
  const traveler = z
    .object({
      type: z.enum(["adult", "child", "infant"]),
      title: z.string().optional(),
      firstName: z.string().trim().min(1, "First name is required").max(60),
      lastName: z.string().trim().min(1, "Last name is required").max(60),
      gender: z.string().optional(),
      dateOfBirth: z.string().optional(),
      nationality: z.string().optional(),
      passportNumber: z.string().trim().optional(),
      passportExpiry: z.string().optional(),
      seat: z.string().optional(),
    })
    .superRefine((t, ctx) => {
      if (opts.requireDob && !t.dateOfBirth) ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Date of birth is required" });
      if (opts.requirePassport) {
        if (!t.passportNumber || t.passportNumber.length < 6) ctx.addIssue({ code: "custom", path: ["passportNumber"], message: "Valid passport number required" });
        if (!t.passportExpiry) ctx.addIssue({ code: "custom", path: ["passportExpiry"], message: "Passport expiry is required" });
      }
    });
  return z.object({
    contact: z.object({
      name: z.string().trim().min(2, "Contact name is required").max(80),
      email: z.string().trim().email("Enter a valid email"),
      phone: z.string().trim().regex(phoneRe, "Enter a valid phone number"),
    }),
    travelers: z.array(traveler),
    specialRequests: z.string().max(1000).optional(),
    agree: z.literal(true, { error: "Please accept the booking terms" }),
  });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

interface BookingFormProps {
  type: BookingType;
  /** Type-specific fields sent to the API (ids, dates, counts, seats…). */
  payload: Record<string, unknown>;
  travelerSlots: TravelerSlot[];
  requireDob?: boolean;
  requirePassport?: boolean;
  /** Summary of the selected item, shown in the sidebar above the price. */
  summary: ReactNode;
  travelerHeading?: string;
  note?: ReactNode;
}

/**
 * Shared traveller / contact form for every booking type. Prices are fetched from
 * `/bookings/quote`; the booking itself is created server-side and then paid at /checkout.
 */
export function BookingForm({ type, payload, travelerSlots, requireDob = false, requirePassport = false, summary, travelerHeading = "Traveller details", note }: BookingFormProps) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string>("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const payloadKey = JSON.stringify(payload);
  const quote = useAsync(() => bookingService.quote({ ...payload, type, couponCode: coupon || undefined }), [payloadKey, coupon, type]);

  // An invalid coupon makes the quote fail: report it and fall back to the plain price.
  if (quote.error && coupon) {
    setCouponError(quote.error);
    setCoupon("");
  }

  const saved = useAsync(() => accountService.travelers(), [user?._id], { enabled: !!user });

  const schema = useMemo(() => buildSchema({ requireDob, requirePassport }), [requireDob, requirePassport]);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contact: { name: "", email: "", phone: "" },
      travelers: travelerSlots.map((s) => ({ type: s.type, title: "", firstName: "", lastName: "", gender: "", dateOfBirth: "", nationality: "Bangladeshi", passportNumber: "", passportExpiry: "", seat: s.seat })),
      specialRequests: "",
      agree: undefined as unknown as true,
    },
  });
  const { fields } = useFieldArray({ control, name: "travelers" });

  // Prefill the contact block from the signed-in profile.
  useEffect(() => {
    if (user) {
      setValue("contact.name", user.name);
      setValue("contact.email", user.email);
      if (user.phone) setValue("contact.phone", user.phone);
    }
  }, [user, setValue]);

  // Keep the traveller array in sync with the slots (e.g. bus seats change).
  const slotsKey = JSON.stringify(travelerSlots);
  useEffect(() => {
    reset((v) => ({
      ...v,
      travelers: travelerSlots.map((s, i) => ({ ...(v.travelers?.[i] ?? { firstName: "", lastName: "", nationality: "Bangladeshi" }), type: s.type, seat: s.seat })),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotsKey, reset]);

  function fillFromSaved(index: number, id: string) {
    const t = saved.data?.find((s) => s._id === id);
    if (!t) return;
    const map: Partial<Record<keyof SavedTraveler, string | undefined>> = t as never;
    setValue(`travelers.${index}.title`, map.title ?? "");
    setValue(`travelers.${index}.firstName`, t.firstName, { shouldValidate: true });
    setValue(`travelers.${index}.lastName`, t.lastName, { shouldValidate: true });
    setValue(`travelers.${index}.gender`, t.gender ?? "");
    setValue(`travelers.${index}.dateOfBirth`, t.dateOfBirth?.slice(0, 10) ?? "");
    setValue(`travelers.${index}.nationality`, t.nationality ?? "Bangladeshi");
    setValue(`travelers.${index}.passportNumber`, t.passportNumber ?? "");
    setValue(`travelers.${index}.passportExpiry`, t.passportExpiry?.slice(0, 10) ?? "");
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const travelers = values.travelers.map((t) => Object.fromEntries(Object.entries(t).filter(([, v]) => v !== "" && v !== undefined)));
      const booking = await bookingService.create({ ...payload, type, travelers, contact: values.contact, specialRequests: values.specialRequests || undefined, couponCode: coupon || undefined });
      toast.success(`Booking ${booking.reference} created. Complete payment to confirm.`);
      router.push(`/checkout/${booking._id}`);
    } catch (err) {
      setSubmitError(errorMessage(err));
      quote.reload();
    }
  }

  if (!ready) return <PageLoader />;

  const next = `${pathname}?${sp.toString()}`;
  const priceCard = (
    <div className="card p-5">
      {quote.loading && !quote.data ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4" />
          <Skeleton className="h-8" />
        </div>
      ) : quote.data ? (
        <PriceSummary pricing={quote.data.pricing} />
      ) : (
        <Alert tone="error" title="Unable to price this selection">{quote.error}</Alert>
      )}
      {user && (
        <div className="mt-4 border-t border-ink-100 pt-4">
          {coupon && quote.data?.coupon ? (
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <span className="flex items-center gap-2 font-semibold"><Tag className="size-4" />{quote.data.coupon.code} applied</span>
              <button type="button" onClick={() => setCoupon("")} aria-label="Remove coupon" className="rounded p-1 hover:bg-emerald-100"><X className="size-4" /></button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCouponError(null);
                if (couponInput.trim()) setCoupon(couponInput.trim().toUpperCase());
              }}
              className="flex gap-2"
            >
              <label htmlFor="coupon" className="sr-only">Coupon code</label>
              <input id="coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Promo code" className="field h-10 uppercase" />
              <Button type="submit" variant="secondary" size="sm" className="h-10">Apply</Button>
            </form>
          )}
          {couponError && <p className="mt-2 text-[13px] text-coral-600" role="alert">{couponError}</p>}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-6">
        {!user ? (
          <div className="card p-6 text-center">
            <UserRound className="mx-auto size-10 text-brand-600" />
            <h2 className="mt-3 text-lg font-bold">Sign in to continue your booking</h2>
            <p className="mt-1 text-sm text-ink-600">Your booking, tickets and refunds are kept safely in your Tripnaro account.</p>
            <div className="mt-4 flex justify-center gap-3">
              <LinkButton href={`/login?next=${encodeURIComponent(next)}`}>Sign in</LinkButton>
              <LinkButton href={`/register?next=${encodeURIComponent(next)}`} variant="outline">Create account</LinkButton>
            </div>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-label="Booking details">
            {note}
            <section className="card p-5 sm:p-6" aria-labelledby="travellers-h">
              <h2 id="travellers-h" className="text-lg font-bold">{travelerHeading}</h2>
              <p className="mt-1 text-sm text-ink-500">Names must match the traveller&apos;s NID or passport.</p>
              <div className="mt-5 space-y-6">
                {fields.map((f, i) => {
                  const slot = travelerSlots[i];
                  const e = errors.travelers?.[i];
                  return (
                    <fieldset key={f.id} className="rounded-xl border border-ink-100 p-4">
                      <legend className="px-1 text-sm font-bold text-ink-800">{slot?.label ?? `Traveller ${i + 1}`}</legend>
                      {!!saved.data?.length && (
                        <Select
                          label="Fill from saved travellers"
                          wrapperClassName="mb-3"
                          placeholder="Choose a saved traveller"
                          options={saved.data.map((s) => ({ value: s._id, label: `${s.firstName} ${s.lastName}` }))}
                          onChange={(ev) => fillFromSaved(i, ev.target.value)}
                          defaultValue=""
                        />
                      )}
                      <div className="grid gap-3 sm:grid-cols-[6rem_1fr_1fr]">
                        <Select label="Title" options={(slot?.type === "adult" ? ["Mr", "Mrs", "Ms"] : ["Mstr", "Miss"]).map((v) => ({ value: v, label: v }))} placeholder="—" {...register(`travelers.${i}.title`)} />
                        <Input label="First name" required autoComplete={i === 0 ? "given-name" : "off"} error={e?.firstName?.message} {...register(`travelers.${i}.firstName`)} />
                        <Input label="Last name" required autoComplete={i === 0 ? "family-name" : "off"} error={e?.lastName?.message} {...register(`travelers.${i}.lastName`)} />
                      </div>
                      {(requireDob || requirePassport) && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <Select label="Gender" options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]} placeholder="—" {...register(`travelers.${i}.gender`)} />
                          <Input type="date" label="Date of birth" required={requireDob} error={e?.dateOfBirth?.message} {...register(`travelers.${i}.dateOfBirth`)} />
                          <Input label="Nationality" {...register(`travelers.${i}.nationality`)} />
                        </div>
                      )}
                      {requirePassport && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <Input label="Passport number" required error={e?.passportNumber?.message} {...register(`travelers.${i}.passportNumber`)} />
                          <Input type="date" label="Passport expiry" required error={e?.passportExpiry?.message} {...register(`travelers.${i}.passportExpiry`)} />
                        </div>
                      )}
                    </fieldset>
                  );
                })}
              </div>
            </section>

            <section className="card p-5 sm:p-6" aria-labelledby="contact-h">
              <h2 id="contact-h" className="text-lg font-bold">Contact details</h2>
              <p className="mt-1 text-sm text-ink-500">We&apos;ll send your e-ticket and updates here.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Input label="Full name" required autoComplete="name" error={errors.contact?.name?.message} {...register("contact.name")} />
                <Input type="email" label="Email" required autoComplete="email" error={errors.contact?.email?.message} {...register("contact.email")} />
                <Input type="tel" label="Mobile" required autoComplete="tel" placeholder="+8801XXXXXXXXX" error={errors.contact?.phone?.message} {...register("contact.phone")} />
              </div>
              <Textarea label="Special requests (optional)" wrapperClassName="mt-3" rows={3} {...register("specialRequests")} />
            </section>

            <div className="card space-y-4 p-5 sm:p-6">
              <Checkbox
                label={
                  <>
                    I agree to the <Link href="/info/terms" className="font-semibold text-brand-700 underline" target="_blank">terms</Link>, <Link href="/info/refund-policy" className="font-semibold text-brand-700 underline" target="_blank">cancellation &amp; refund policy</Link> and <Link href="/info/privacy" className="font-semibold text-brand-700 underline" target="_blank">privacy policy</Link>.
                  </>
                }
                {...register("agree")}
              />
              {errors.agree && <p className="text-[13px] text-coral-600" role="alert">{errors.agree.message}</p>}
              {submitError && <Alert tone="error" title="We couldn't create your booking">{submitError}</Alert>}
              <Button type="submit" variant="accent" size="lg" className="w-full sm:w-auto" loading={isSubmitting} disabled={!quote.data}>
                <Lock className="size-4" /> Continue to payment
              </Button>
              <p className="text-xs text-ink-500">Your selection is held for 30 minutes while you complete payment.</p>
            </div>
          </form>
        )}
      </div>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="card overflow-hidden">{summary}</div>
        {priceCard}
      </aside>
    </div>
  );
}
