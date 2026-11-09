"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** Reads and writes filter state in the URL so result pages are shareable and bookmarkable. */
export function useQueryState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const set = useCallback(
    (patch: Record<string, string | number | string[] | undefined | null>, opts: { resetPage?: boolean } = { resetPage: true }) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) next.delete(k);
        else next.set(k, Array.isArray(v) ? v.join(",") : String(v));
      }
      if (opts.resetPage !== false && !("page" in patch)) next.delete("page");
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [params, router, pathname],
  );

  const getList = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
  const toggleInList = (key: string, value: string) => {
    const list = getList(key);
    set({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
  };

  return { params, set, getList, toggleInList };
}
