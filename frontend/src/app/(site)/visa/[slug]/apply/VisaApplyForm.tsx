"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, FileUp, Paperclip, X } from "lucide-react";
import { PaymentMethods } from "@/components/booking/PaymentMethods";
import { Button, LinkButton } from "@/components/common/Button";
import { Alert, PageLoader } from "@/components/common/Feedback";
import { Input, Select, Textarea } from "@/components/common/FormControls";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/api";
import { formatPrice, todayInput } from "@/lib/utils";
import { visaService } from "@/services";
import type { VisaApplication, VisaCountry } from "@/types";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const schema = z
  .object({
    visaType: z.string().min(1, "Choose a visa type"),
    travelDate: z.string().min(1, "Travel date is required"),
    returnDate: z.string().optional(),
    purpose: z.string().max(300).optional(),
    applicant: z.object({
      firstName: z.string().trim().min(1, "Required"),
      lastName: z.string().trim().min(1, "Required"),
      email: z.string().trim().email("Enter a valid email"),
      phone: z.string().trim().regex(/^\+?[0-9\s-]{8,16}$/, "Enter a valid phone number"),
      dateOfBirth: z.string().min(1, "Required"),
      nationality: z.string().optional(),
      passportNumber: z.string().trim().min(5, "Passport number is required").max(20),
      passportExpiry: z.string().min(1, "Required"),
      occupation: z.string().optional(),
      address: z.string().optional(),
    }),
  })
  .refine((v) => !v.returnDate || v.returnDate >= v.travelDate, { path: ["returnDate"], message: "Return must be after travel date" });
type Values = z.infer<typeof schema>;

export function VisaApplyForm({ country }: { country: VisaCountry }) {
  const sp = useSearchParams();
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [application, setApplication] = useState<VisaApplication | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      visaType: sp.get("type") ?? country.visaTypes[0]?.name ?? "",
      travelDate: todayInput(30),
      applicant: { firstName: "", lastName: "", email: "", phone: "", nationality: "Bangladeshi" },
    },
  });
  useEffect(() => {
    if (!user) return;
    const [first, ...rest] = user.name.split(" ");
    setValue("applicant.firstName", first);
    setValue("applicant.lastName", rest.join(" "));
    setValue("applicant.email", user.email);
    if (user.phone) setValue("applicant.phone", user.phone);
  }, [user, setValue]);
  const type = country.visaTypes.find((v) => v.name === watch("visaType"));
  const docLabels = country.documents.length ? country.documents : ["Passport copy"];

  function pick(label: string, file?: File) {
    setFileError(null);
    if (file && !ACCEPT.includes(file.type)) return setFileError(`${file.name}: only PDF, JPG, PNG or WEBP files are accepted`);
    if (file && file.size > MAX_BYTES) return setFileError(`${file.name} is larger than 5 MB`);
    setFiles((f) => ({ ...f, [label]: file }));
  }

  if (!ready) return <PageLoader />;
  if (!user)
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold">Sign in to apply. Your documents are stored privately in your account.</p>
        <LinkButton href={`/login?next=${encodeURIComponent(`${pathname}?${sp}`)}`} className="mt-4">Sign in</LinkButton>
      </div>
    );

  if (application)
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Alert tone="success" title={`Application ${application.reference} submitted`}>
            We&apos;ve received your documents. Pay the fee now to start processing, or later from your account.
          </Alert>
          <PaymentMethods amount={application.fee} visaApplicationId={application._id} />
        </div>
        <aside className="card self-start p-5 text-sm">
          <CheckCircle2 className="size-8 text-emerald-600" />
          <p className="mt-2 font-bold">{application.countryName} · {application.visaType}</p>
          <p className="text-ink-600">{application.applicant.firstName} {application.applicant.lastName}</p>
          <p className="mt-2 text-lg font-bold">{formatPrice(application.fee)}</p>
          <LinkButton href={`/my-account/visa/${application._id}`} variant="outline" size="sm" className="mt-4">View application</LinkButton>
        </aside>
      </div>
    );

  const onSubmit = async (v: Values) => {
    setSubmitError(null);
    const chosen = Object.entries(files).filter((e): e is [string, File] => !!e[1]);
    if (!chosen.length) return setFileError("Please upload at least your passport copy");
    const form = new FormData();
    form.append("data", JSON.stringify({ ...v, countryId: country._id, returnDate: v.returnDate || undefined }));
    form.append("labels", JSON.stringify(chosen.map(([l]) => l)));
    chosen.forEach(([, f]) => form.append("documents", f));
    try {
      setApplication(await visaService.apply(form));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(errorMessage(err));
    }
  };

  const a = errors.applicant;
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-6">
        <section className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <h2 className="text-lg font-bold sm:col-span-2">Trip details</h2>
          <Select label="Visa type" required options={country.visaTypes.map((v) => ({ value: v.name, label: `${v.name} (${formatPrice(v.fee + v.serviceFee)})` }))} error={errors.visaType?.message} {...register("visaType")} />
          <Input label="Purpose of travel" placeholder="Tourism, business meeting…" {...register("purpose")} />
          <Input type="date" label="Travel date" required min={todayInput(1)} error={errors.travelDate?.message} {...register("travelDate")} />
          <Input type="date" label="Return date" min={todayInput(2)} error={errors.returnDate?.message} {...register("returnDate")} />
        </section>

        <section className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <h2 className="text-lg font-bold sm:col-span-2">Applicant (as in passport)</h2>
          <Input label="Given name(s)" required error={a?.firstName?.message} {...register("applicant.firstName")} />
          <Input label="Surname" required error={a?.lastName?.message} {...register("applicant.lastName")} />
          <Input type="email" label="Email" required error={a?.email?.message} {...register("applicant.email")} />
          <Input type="tel" label="Mobile" required error={a?.phone?.message} {...register("applicant.phone")} />
          <Input type="date" label="Date of birth" required error={a?.dateOfBirth?.message} {...register("applicant.dateOfBirth")} />
          <Input label="Nationality" {...register("applicant.nationality")} />
          <Input label="Passport number" required error={a?.passportNumber?.message} {...register("applicant.passportNumber")} />
          <Input type="date" label="Passport expiry" required min={todayInput(180)} error={a?.passportExpiry?.message} {...register("applicant.passportExpiry")} />
          <Input label="Occupation" {...register("applicant.occupation")} />
          <Textarea label="Present address" rows={2} {...register("applicant.address")} />
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="docs-h">
          <h2 id="docs-h" className="text-lg font-bold">Documents</h2>
          <p className="mt-1 text-sm text-ink-500">PDF, JPG, PNG or WEBP, up to 5 MB each. Files are stored privately and only visible to you and our visa team.</p>
          <ul className="mt-4 space-y-3">
            {docLabels.map((label, i) => {
              const f = files[label];
              const id = `doc-${i}`;
              return (
                <li key={label} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3">
                  <span className="min-w-0 text-sm font-semibold">{label}{i === 0 && <span className="text-coral-500"> *</span>}</span>
                  {f ? (
                    <span className="flex min-w-0 items-center gap-2 text-sm text-ink-600">
                      <Paperclip className="size-4 shrink-0" /><span className="max-w-48 truncate">{f.name}</span>
                      <button type="button" onClick={() => pick(label, undefined)} aria-label={`Remove ${label}`} className="rounded p-1 hover:bg-ink-100"><X className="size-4" /></button>
                    </span>
                  ) : (
                    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">
                      <FileUp className="size-4" /> Upload
                      <input id={id} type="file" accept={ACCEPT.join(",")} className="sr-only" onChange={(e) => pick(label, e.target.files?.[0])} />
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
          {fileError && <p className="mt-3 text-[13px] text-coral-600" role="alert">{fileError}</p>}
        </section>
        {submitError && <Alert tone="error" title="Application not submitted">{submitError}</Alert>}
      </div>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="card p-5">
          <p className="font-bold">{country.country} · {type?.name}</p>
          {type && (
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-500">Embassy fee</dt><dd>{formatPrice(type.fee)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Service fee</dt><dd>{formatPrice(type.serviceFee)}</dd></div>
              <div className="flex justify-between border-t border-ink-100 pt-2 font-bold"><dt>Total</dt><dd>{formatPrice(type.fee + type.serviceFee)}</dd></div>
              <p className="pt-1 text-xs text-ink-500">Processing: {type.processingDays} working days</p>
            </dl>
          )}
          <Button type="submit" variant="accent" className="mt-4 w-full" loading={isSubmitting}>Submit application</Button>
        </div>
      </aside>
    </form>
  );
}
