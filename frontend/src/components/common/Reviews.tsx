"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageSquareText, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/api";
import { cn, formatDate, ratingLabel } from "@/lib/utils";
import { catalogService } from "@/services";
import { toast } from "@/store/toast";
import type { Review } from "@/types";
import { Button } from "./Button";
import { Input, Textarea } from "./FormControls";

const schema = z.object({
  rating: z.number().int().min(1, "Choose a rating").max(5),
  title: z.string().max(120).optional(),
  comment: z.string().trim().min(10, "Please write at least 10 characters").max(2000),
});
type FormValues = z.infer<typeof schema>;

export function ReviewsSection({
  targetType,
  targetId,
  rating,
  reviewCount,
  reviews,
  breakdown,
}: {
  targetType: "hotel" | "tour";
  targetId: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  breakdown?: Record<string, number>;
}) {
  const total = breakdown ? Object.values(breakdown).reduce((a, b) => a + b, 0) : 0;
  return (
    <section aria-labelledby="reviews-heading" className="card p-5 sm:p-6">
      <h2 id="reviews-heading" className="text-xl font-bold">
        Guest reviews
      </h2>
      <div className="mt-4 grid gap-6 md:grid-cols-[14rem_1fr]">
        <div>
          <p className="font-display text-5xl font-semibold text-brand-700">{rating.toFixed(1)}</p>
          <p className="font-semibold">{ratingLabel(rating)}</p>
          <p className="text-sm text-ink-500">{reviewCount.toLocaleString()} verified reviews</p>
          {breakdown && total > 0 && (
            <div className="mt-4 space-y-1.5">
              {[5, 4, 3, 2, 1].map((s) => (
                <div key={s} className="flex items-center gap-2 text-xs text-ink-600">
                  <span className="w-3">{s}</span>
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <span className="block h-full rounded-full bg-brand-500" style={{ width: `${((breakdown[s] ?? 0) / total) * 100}%` }} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          {reviews.length === 0 && <p className="text-sm text-ink-500">No written reviews yet. Be the first to share your experience.</p>}
          {reviews.map((r) => (
            <article key={r._id} className="border-b border-ink-100 pb-4 last:border-0">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">{r.user?.name?.[0] ?? "G"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{r.user?.name ?? "Guest"}</p>
                  <p className="text-xs text-ink-500">
                    {formatDate(r.createdAt)}
                    {r.tripType ? ` · ${r.tripType}` : ""}
                  </p>
                </div>
                <span className="ml-auto rounded-md bg-brand-600 px-1.5 py-0.5 text-xs font-bold text-white">{r.rating}.0</span>
              </div>
              {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{r.comment}</p>
            </article>
          ))}
          <WriteReview targetType={targetType} targetId={targetId} />
        </div>
      </div>
    </section>
  );
}

function WriteReview({ targetType, targetId }: { targetType: "hotel" | "tour"; targetId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { rating: 0, comment: "", title: "" } });
  const rating = watch("rating");

  if (done) return <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">Thanks! Your review has been submitted and will appear after moderation.</p>;
  if (!open)
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <MessageSquareText className="size-4" /> Write a review
      </Button>
    );
  if (!user)
    return (
      <p className="text-sm text-ink-600">
        Please{" "}
        <Link href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`} className="font-semibold text-brand-700 underline">
          sign in
        </Link>{" "}
        to write a review.
      </p>
    );

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (values) => {
        try {
          await catalogService.createReview({ ...values, targetType, targetId });
          setDone(true);
          toast.success("Review submitted for moderation");
        } catch (err) {
          toast.error(errorMessage(err));
        }
      })}
      className="space-y-3 rounded-xl border border-ink-100 p-4"
    >
      <div>
        <p className="label">Your rating</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star`} onClick={() => setValue("rating", n, { shouldValidate: true })}>
              <Star className={cn("size-7 transition", n <= rating ? "fill-amber-400 text-amber-400" : "text-ink-300")} />
            </button>
          ))}
        </div>
        {errors.rating && <p className="mt-1 text-[13px] text-coral-600">{errors.rating.message}</p>}
      </div>
      <Input label="Title (optional)" {...register("title")} />
      <Textarea label="Your review" required error={errors.comment?.message} {...register("comment")} />
      <div className="flex gap-2">
        <Button type="submit" loading={isSubmitting}>
          Submit review
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
