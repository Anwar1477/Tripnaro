"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AccountHeading } from "@/components/account/AccountShell";
import { Button } from "@/components/common/Button";
import { Input, Select, Textarea } from "@/components/common/FormControls";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/api";
import { accountService } from "@/services";
import { toast } from "@/store/toast";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().regex(/^(\+?[0-9\s-]{8,16})?$/, "Enter a valid phone number").optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().max(60).optional(),
  address: z.string().max(250).optional(),
});
type Values = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "", phone: user?.phone ?? "", dateOfBirth: user?.dateOfBirth?.slice(0, 10) ?? "", gender: user?.gender ?? "", nationality: user?.nationality ?? "", address: user?.address ?? "" },
  });

  return (
    <>
      <AccountHeading title="Profile" description="Used to pre-fill your bookings." />
      <form
        noValidate
        className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6"
        onSubmit={handleSubmit(async (v) => {
          try {
            const body = Object.fromEntries(Object.entries(v).filter(([, x]) => x !== ""));
            const { data } = await accountService.updateProfile(body);
            setUser(data.user);
            reset(v);
            toast.success("Profile updated");
          } catch (err) {
            toast.error(errorMessage(err));
          }
        })}
      >
        <Input label="Full name" required error={errors.name?.message} {...register("name")} />
        <Input label="Email" value={user?.email ?? ""} disabled readOnly hint="Contact support to change your email." />
        <Input label="Mobile" type="tel" error={errors.phone?.message} {...register("phone")} />
        <Input label="Date of birth" type="date" {...register("dateOfBirth")} />
        <Select label="Gender" placeholder="Prefer not to say" options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]} {...register("gender")} />
        <Input label="Nationality" {...register("nationality")} />
        <Textarea label="Address" wrapperClassName="sm:col-span-2" rows={2} {...register("address")} />
        <div className="sm:col-span-2"><Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button></div>
      </form>
    </>
  );
}
