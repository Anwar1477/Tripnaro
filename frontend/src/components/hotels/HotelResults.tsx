"use client";

import { Building2 } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useQueryState } from "@/hooks/useQueryState";
import { formatPrice, titleCase } from "@/lib/utils";
import { catalogService } from "@/services";
import { Checkbox } from "../common/FormControls";
import { CardSkeleton, EmptyState, ErrorState } from "../common/Feedback";
import { FilterGroup, FilterLayout, SortSelect } from "../common/FilterLayout";
import { Stars } from "../common/Misc";
import { Pagination } from "../common/Pagination";
import { HotelCard } from "./HotelCard";

const PROPERTY_TYPES = ["hotel", "resort", "apartment", "guest-house", "villa", "boutique"];
const PRICE_BANDS = [
  { label: "Under ৳4,000", min: "", max: "4000" },
  { label: "৳4,000 – ৳8,000", min: "4000", max: "8000" },
  { label: "৳8,000 – ৳15,000", min: "8000", max: "15000" },
  { label: "৳15,000+", min: "15000", max: "" },
];
const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Guest rating" },
  { value: "stars", label: "Star class" },
];

export function HotelResults() {
  const { params, set, getList, toggleInList } = useQueryState();
  const query = Object.fromEntries(params.entries());
  const page = Number(params.get("page") ?? 1);
  const { data, loading, error, reload } = useAsync(() => catalogService.hotels({ ...query, page, limit: 12 }), [params.toString()]);

  const stars = getList("stars");
  const types = getList("propertyType");
  const amenities = getList("amenities");
  const facetAmenities = (data?.meta?.amenities as string[] | undefined) ?? [];
  const activeCount = stars.length + types.length + amenities.length + (params.get("minPrice") || params.get("maxPrice") ? 1 : 0) + (params.get("minRating") ? 1 : 0);
  // Stay context (dates/guests) is carried to the hotel page so availability can be shown.
  const stayQuery = new URLSearchParams(["checkIn", "checkOut", "rooms", "adults", "children"].flatMap((k) => (params.get(k) ? [[k, params.get(k)!]] : []))).toString();

  const filters = (
    <>
      <FilterGroup title="Price per night">
        {PRICE_BANDS.map((b) => {
          const active = (params.get("minPrice") ?? "") === b.min && (params.get("maxPrice") ?? "") === b.max;
          return <Checkbox key={b.label} label={b.label} checked={active} onChange={() => set(active ? { minPrice: undefined, maxPrice: undefined } : { minPrice: b.min, maxPrice: b.max })} />;
        })}
      </FilterGroup>
      <FilterGroup title="Star rating">
        {[5, 4, 3, 2].map((s) => (
          <Checkbox key={s} label={<Stars count={s} />} checked={stars.includes(String(s))} onChange={() => toggleInList("stars", String(s))} />
        ))}
      </FilterGroup>
      <FilterGroup title="Guest rating">
        {[4.5, 4, 3.5].map((r) => (
          <Checkbox key={r} label={`${r}+ ${r >= 4.5 ? "Excellent" : r >= 4 ? "Very good" : "Good"}`} checked={params.get("minRating") === String(r)} onChange={() => set({ minRating: params.get("minRating") === String(r) ? undefined : r })} />
        ))}
      </FilterGroup>
      <FilterGroup title="Property type">
        {PROPERTY_TYPES.map((t) => (
          <Checkbox key={t} label={titleCase(t)} checked={types.includes(t)} onChange={() => toggleInList("propertyType", t)} />
        ))}
      </FilterGroup>
      {facetAmenities.length > 0 && (
        <FilterGroup title="Amenities">
          {facetAmenities.slice(0, 12).map((a) => (
            <Checkbox key={a} label={a} checked={amenities.includes(a)} onChange={() => toggleInList("amenities", a)} />
          ))}
        </FilterGroup>
      )}
    </>
  );

  const priceRange = data?.meta?.priceRange as { min: number; max: number } | undefined;

  return (
    <FilterLayout filters={filters} activeCount={activeCount} onReset={() => set({ stars: undefined, propertyType: undefined, amenities: undefined, minPrice: undefined, maxPrice: undefined, minRating: undefined })}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600" aria-live="polite">
          {loading ? "Searching stays…" : data ? (
            <>
              <strong className="text-ink-900">{data.meta.total}</strong> propert{data.meta.total === 1 ? "y" : "ies"} found
              {priceRange?.max ? ` · ${formatPrice(priceRange.min)} – ${formatPrice(priceRange.max)}` : ""}
            </>
          ) : null}
        </p>
        <SortSelect value={params.get("sort") ?? "recommended"} onChange={(sort) => set({ sort })} options={SORTS} />
      </div>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton count={6} />
        </div>
      ) : !data?.items.length ? (
        <EmptyState icon={Building2} title="No stays match your filters" description="Try a different destination, widen the price range or clear some filters." />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.items.map((h) => (
              <HotelCard key={h._id} hotel={h} query={stayQuery} />
            ))}
          </div>
          <Pagination page={page} totalPages={data.meta.totalPages} onChange={(p) => { set({ page: p }, { resetPage: false }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}
    </FilterLayout>
  );
}
