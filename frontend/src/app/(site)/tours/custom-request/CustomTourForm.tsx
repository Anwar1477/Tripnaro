"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button, LinkButton } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { Input, Textarea } from "@/components/common/FormControls";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/api";
import { todayInput } from "@/lib/utils";
import { catalogService } from "@/services";

const schema = z.object({
  name: z.string().trim().min(2, "Your name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{8,16}$/, "Enter a valid phone number"),
  destination: z.string().trim().min(2, "Where would you like to go?"),
  travelDate: z.string().optional(),
  durationDays: z.string().optional(),
  travelers: z.string().optional(),
  budget: z.string().optional(),
  message: z.string().max(1500).optional(),
});
type Values = z.infer<typeof schema>;

export function CustomTourForm() {
  const sp = useSearchParams();
  const { user } = useAuth();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { destination: sp.get("destination") ?? "", travelers: "2", message: sp.get("tour") ? `Based on the package: ${sp.get("tour")}` : "" },
  });

  useEffect(() => {
    if (user) {
      setValue("name", user.name);
      setValue("email", user.email);
      if (user.phone) setValue("phone", user.phone);
    }
  }, [user, setValue]);

  if (done)
    return (
      <div className="card mt-6 p-8 text-center">
        <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
        <h2 className="mt-3 text-xl font-bold">Request received!</h2>
        <p className="mt-1 text-ink-600">A trip designer will contact you within 24 hours.</p>
        <LinkButton href="/tours" className="mt-5">Browse ready-made tours</LinkButton>
      </div>
    );

  return (
    <form
      noValidate
      className="card mt-6 grid gap-4 p-5 sm:grid-cols-2 sm:p-6"
      onSubmit={handleSubmit(async (v) => {
        setError(null);
        try {
          const num = (s?: string) => (s ? Number(s) : undefined);
          await catalogService.tourRequest({ ...v, travelDate: v.travelDate || undefined, durationDays: num(v.durationDays), travelers: num(v.travelers), budget: num(v.budget) });
          setDone(true);
        } catch (err) {
          setError(errorMessage(err));
        }
      })}
    >
      <Input label="Full name" required error={errors.name?.message} autoComplete="name" {...register("name")} />
      <Input label="Email" type="email" required error={errors.email?.message} autoComplete="email" {...register("email")} />
      <Input label="Mobile" type="tel" required error={errors.phone?.message} autoComplete="tel" {...register("phone")} />
      <Input label="Destination" required error={errors.destination?.message} placeholder="e.g. Sajek, Bhutan, Bali" {...register("destination")} />
      <Input label="Preferred start date" type="date" min={todayInput(1)} {...register("travelDate")} />
      <Input label="Trip length (days)" type="number" min={1} max={60} {...register("durationDays")} />
      <Input label="Travellers" type="number" min={1} max={100} {...register("travelers")} />
      <Input label="Budget per person (BDT)" type="number" min={0} step={500} {...register("budget")} />
      <Textarea label="Tell us more" wrapperClassName="sm:col-span-2" rows={4} placeholder="Interests, hotel preferences, special occasions…" {...register("message")} />
      {error && <Alert tone="error" className="sm:col-span-2">{error}</Alert>}
      <div className="sm:col-span-2">
        <Button type="submit" variant="accent" size="lg" loading={isSubmitting}>Send my request</Button>
      </div>
    </form>
  );
}
