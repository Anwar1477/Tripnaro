"use client";

import { Compass } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useQueryState } from "@/hooks/useQueryState";
import { catalogService } from "@/services";
import { Checkbox } from "../common/FormControls";
import { CardSkeleton, EmptyState, ErrorState } from "../common/Feedback";
import { FilterGroup, FilterLayout, SortSelect } from "../common/FilterLayout";
import { Pagination } from "../common/Pagination";
import { LinkButton } from "../common/Button";
import { TourCard } from "./TourCard";
import { TOUR_CATEGORIES } from "./TourSearchForm";

const PRICE_BANDS = [
  { label: "Under ৳10,000", min: "", max: "10000" },
  { label: "৳10,000 – ৳30,000", min: "10000", max: "30000" },
  { label: "৳30,000 – ৳80,000", min: "30000", max: "80000" },
  { label: "৳80,000+", min: "80000", max: "" },
];
const DURATIONS = [
  { label: "Day trip", min: "1", max: "1" },
  { label: "2 – 3 days", min: "2", max: "3" },
  { label: "4 – 6 days", min: "4", max: "6" },
  { label: "7+ days", min: "7", max: "" },
];
const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "duration", label: "Shortest first" },
  { value: "rating", label: "Top rated" },
];

export function TourResults() {
  const { params, set, getList, toggleInList } = useQueryState();
  const query = Object.fromEntries(params.entries());
  const page = Number(params.get("page") ?? 1);
  const { data, loading, error, reload } = useAsync(() => catalogService.tours({ ...query, page, limit: 12 }), [params.toString()]);
  const categories = getList("category");
  const scope = params.get("scope");
  const activeCount = categories.length + (scope ? 1 : 0) + (params.get("minPrice") || params.get("maxPrice") ? 1 : 0) + (params.get("minDays") || params.get("maxDays") ? 1 : 0) + (params.get("customizable") ? 1 : 0);

  const filters = (
    <>
      <FilterGroup title="Trip type">
        {[{ v: "domestic", l: "Within Bangladesh" }, { v: "international", l: "International" }].map((s) => (
          <Checkbox key={s.v} label={s.l} checked={scope === s.v} onChange={() => set({ scope: scope === s.v ? undefined : s.v })} />
        ))}
        <Checkbox label="Customisable itinerary" checked={params.get("customizable") === "true"} onChange={() => set({ customizable: params.get("customizable") ? undefined : "true" })} />
      </FilterGroup>
      <FilterGroup title="Category">
        {TOUR_CATEGORIES.map((c) => (
          <Checkbox key={c.value} label={c.label} checked={categories.includes(c.value)} onChange={() => toggleInList("category", c.value)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Duration">
        {DURATIONS.map((d) => {
          const active = (params.get("minDays") ?? "") === d.min && (params.get("maxDays") ?? "") === d.max;
          return <Checkbox key={d.label} label={d.label} checked={active} onChange={() => set(active ? { minDays: undefined, maxDays: undefined } : { minDays: d.min, maxDays: d.max })} />;
        })}
      </FilterGroup>
      <FilterGroup title="Price per person">
        {PRICE_BANDS.map((b) => {
          const active = (params.get("minPrice") ?? "") === b.min && (params.get("maxPrice") ?? "") === b.max;
          return <Checkbox key={b.label} label={b.label} checked={active} onChange={() => set(active ? { minPrice: undefined, maxPrice: undefined } : { minPrice: b.min, maxPrice: b.max })} />;
        })}
      </FilterGroup>
    </>
  );

  return (
    <FilterLayout filters={filters} activeCount={activeCount} onReset={() => set({ category: undefined, scope: undefined, minPrice: undefined, maxPrice: undefined, minDays: undefined, maxDays: undefined, customizable: undefined })}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600" aria-live="polite">
          {loading ? "Finding tours…" : data ? <><strong className="text-ink-900">{data.meta.total}</strong> tour package{data.meta.total === 1 ? "" : "s"}</> : null}
        </p>
        <SortSelect value={params.get("sort") ?? "recommended"} onChange={(sort) => set({ sort })} options={SORTS} />
      </div>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><CardSkeleton count={6} /></div>
      ) : !data?.items.length ? (
        <EmptyState icon={Compass} title="No tours match your search" description="Try another month or category, or tell us your plan and we'll build a custom trip." action={<LinkButton href="/tours/custom-request">Request a custom tour</LinkButton>} />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.items.map((t) => <TourCard key={t._id} tour={t} />)}
          </div>
          <Pagination page={page} totalPages={data.meta.totalPages} onChange={(p) => { set({ page: p }, { resetPage: false }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}
    </FilterLayout>
  );
}
