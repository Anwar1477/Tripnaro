"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { AccountHeading } from "@/components/account/AccountShell";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/Feedback";
import { Input, Select } from "@/components/common/FormControls";
import { Modal } from "@/components/common/Modal";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/utils";
import { accountService } from "@/services";
import { toast } from "@/store/toast";
import type { SavedTraveler } from "@/types";

const schema = z.object({
  title: z.string().optional(),
  firstName: z.string().trim().min(1, "Required"),
  lastName: z.string().trim().min(1, "Required"),
  type: z.enum(["adult", "child", "infant"]),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
});
type Values = z.infer<typeof schema>;
const empty: Values = { title: "", firstName: "", lastName: "", type: "adult", gender: "", dateOfBirth: "", nationality: "Bangladeshi", passportNumber: "", passportExpiry: "" };

export default function TravelersPage() {
  const { data, loading, error, reload, setData } = useAsync(() => accountService.travelers(), []);
  const [editing, setEditing] = useState<SavedTraveler | "new" | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });

  function open(t: SavedTraveler | "new") {
    setEditing(t);
    reset(t === "new" ? empty : { ...empty, ...t, dateOfBirth: t.dateOfBirth?.slice(0, 10) ?? "", passportExpiry: t.passportExpiry?.slice(0, 10) ?? "" } as Values);
  }

  async function onSubmit(v: Values) {
    const body = Object.fromEntries(Object.entries(v).filter(([, x]) => x !== "")) as Partial<SavedTraveler>;
    try {
      const res = editing === "new" ? await accountService.addTraveler(body) : await accountService.updateTraveler((editing as SavedTraveler)._id, body);
      setData(res.data);
      toast.success("Traveller saved");
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function remove(id: string) {
    try {
      const res = await accountService.deleteTraveler(id);
      setData(res.data);
      toast.success("Traveller removed");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <AccountHeading title="Saved travellers" description="Fill booking forms in one tap." action={<Button size="sm" onClick={() => open("new")}><Plus className="size-4" />Add traveller</Button>} />
      {error ? <ErrorState message={error} onRetry={reload} /> : loading ? <Skeleton className="h-32" /> : !data?.length ? (
        <EmptyState icon={Users} title="No saved travellers" description="Save family and friends to speed up checkout." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((t) => (
            <div key={t._id} className="card flex items-start justify-between gap-3 p-4">
              <div className="min-w-0 text-sm">
                <p className="font-bold">{[t.title, t.firstName, t.lastName].filter(Boolean).join(" ")}</p>
                <p className="text-ink-600">{titleCase(t.type)}{t.dateOfBirth ? ` · Born ${formatDate(t.dateOfBirth)}` : ""}</p>
                {t.passportNumber && <p className="text-ink-500">Passport {t.passportNumber}{t.passportExpiry ? ` · exp. ${formatDate(t.passportExpiry)}` : ""}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => open(t)} aria-label={`Edit ${t.firstName}`} className="grid size-9 place-items-center rounded-lg text-ink-600 hover:bg-ink-100"><Pencil className="size-4" /></button>
                <button type="button" onClick={() => remove(t._id)} aria-label={`Remove ${t.firstName}`} className="grid size-9 place-items-center rounded-lg text-coral-600 hover:bg-coral-50"><Trash2 className="size-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Add traveller" : "Edit traveller"}>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
          <Select label="Title" placeholder="—" options={["Mr", "Mrs", "Ms", "Mstr", "Miss"].map((v) => ({ value: v, label: v }))} {...register("title")} />
          <Select label="Type" options={[{ value: "adult", label: "Adult" }, { value: "child", label: "Child" }, { value: "infant", label: "Infant" }]} {...register("type")} />
          <Input label="First name" required error={errors.firstName?.message} {...register("firstName")} />
          <Input label="Last name" required error={errors.lastName?.message} {...register("lastName")} />
          <Select label="Gender" placeholder="—" options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]} {...register("gender")} />
          <Input type="date" label="Date of birth" {...register("dateOfBirth")} />
          <Input label="Nationality" {...register("nationality")} />
          <Input label="Passport number" {...register("passportNumber")} />
          <Input type="date" label="Passport expiry" {...register("passportExpiry")} />
          <div className="flex items-end justify-end gap-2 sm:col-span-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
