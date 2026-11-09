"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Globe2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { visaService } from "@/services";
import type { VisaCountry } from "@/types";
import { Button } from "../common/Button";
import { SelectFrame, selectClass } from "../common/FormControls";
import { SearchBox, searchInputClass } from "../common/Popover";

export function VisaSearchForm() {
  const router = useRouter();
  const [countries, setCountries] = useState<VisaCountry[]>([]);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    visaService
      .countries()
      .then(setCountries)
      .catch(() => undefined);
  }, []);

  return (
    <form
      aria-label="Visa search"
      onSubmit={(e) => {
        e.preventDefault();
        if (!slug) return setError("Select the country you are travelling to");
        router.push(`/visa/${slug}`);
      }}
      className="grid gap-3 md:grid-cols-[1fr_auto]"
    >
      <SearchBox
        label="Travelling to"
        icon={<Globe2 className="size-3.5" />}
        className={cn(error && "border-coral-400")}
      >
        <SelectFrame iconClassName="right-0">
          <select
            aria-label="Destination country"
            className={cn(searchInputClass, selectClass, "select-search pr-6")}
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setError(null);
            }}
          >
            <option value="">Select a country</option>
            {countries.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.flag} {c.country}
              </option>
            ))}
          </select>
        </SelectFrame>
        {error && <p className="text-coral-600 text-xs">{error}</p>}
      </SearchBox>
      <Button type="submit" variant="accent" size="lg" className="h-full min-h-14">
        <Search className="size-5" /> Check requirements
      </Button>
    </form>
  );
}
